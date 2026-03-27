// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract PharmaTrace is AccessControl, Pausable {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    enum BatchState {
        Registered,
        InTransit,
        Delivered,
        Recalled,
        Dispensed
    }

    struct Batch {
        uint256 id;
        string batchCode;
        string productName;
        address manufacturer;
        address currentCustodian;
        uint64 manufacturedAt;
        uint64 expiresAt;
        bytes32 metadataHash;
        bytes32 documentHash;
        BatchState state;
        bool exists;
    }

    struct PendingTransfer {
        address from;
        address to;
        uint64 requestedAt;
        bytes32 shipmentHash;
        bool exists;
    }

    uint256 private nextBatchId = 1;

    mapping(uint256 => Batch) private batches;
    mapping(bytes32 => bool) private batchCodeUsed;
    mapping(uint256 => PendingTransfer) public pendingTransfers;

    event BatchRegistered(
        uint256 indexed batchId,
        string batchCode,
        string productName,
        address indexed manufacturer,
        bytes32 metadataHash,
        bytes32 documentHash,
        uint64 expiresAt
    );
    event TransferRequested(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        bytes32 shipmentHash
    );
    event TransferAccepted(uint256 indexed batchId, address indexed from, address indexed to);
    event CheckpointRecorded(
        uint256 indexed batchId,
        address indexed actor,
        BatchState newState,
        bytes32 checkpointHash
    );
    event BatchRecalled(uint256 indexed batchId, address indexed actor, bytes32 recallHash);

    error UnsupportedRole();

    constructor(address admin) {
        require(admin != address(0), "Admin address required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    modifier onlyExistingBatch(uint256 batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        _;
    }

    modifier onlyCurrentCustodian(uint256 batchId) {
        require(batches[batchId].currentCustodian == msg.sender, "Only current custodian can act");
        _;
    }

    function grantSupplyChainRole(address account, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Account is required");
        _ensureRoleSupported(role);
        _grantRole(role, account);
    }

    function revokeSupplyChainRole(address account, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Account is required");
        _ensureRoleSupported(role);
        _revokeRole(role, account);
    }

    function createBatch(
        string calldata batchCode,
        string calldata productName,
        uint64 expiresAt,
        bytes32 metadataHash,
        bytes32 documentHash
    ) external whenNotPaused onlyRole(MANUFACTURER_ROLE) returns (uint256 batchId) {
        require(bytes(batchCode).length > 0, "Batch code is required");
        require(bytes(productName).length > 0, "Product name is required");
        require(expiresAt > block.timestamp, "Expiry must be in the future");

        bytes32 codeDigest = keccak256(bytes(batchCode));
        require(!batchCodeUsed[codeDigest], "Batch code already used");
        batchCodeUsed[codeDigest] = true;

        batchId = nextBatchId;
        nextBatchId += 1;

        batches[batchId] = Batch({
            id: batchId,
            batchCode: batchCode,
            productName: productName,
            manufacturer: msg.sender,
            currentCustodian: msg.sender,
            manufacturedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            metadataHash: metadataHash,
            documentHash: documentHash,
            state: BatchState.Registered,
            exists: true
        });

        emit BatchRegistered(
            batchId,
            batchCode,
            productName,
            msg.sender,
            metadataHash,
            documentHash,
            expiresAt
        );
    }

    function requestTransfer(
        uint256 batchId,
        address to,
        bytes32 shipmentHash
    ) external whenNotPaused onlyExistingBatch(batchId) onlyCurrentCustodian(batchId) {
        Batch storage batch = batches[batchId];

        require(batch.state != BatchState.Recalled, "Recalled batches cannot be moved");
        require(batch.state != BatchState.Dispensed, "Dispensed batches cannot be moved");
        require(to != address(0), "Recipient is required");
        require(to != msg.sender, "Recipient must differ from sender");
        require(_isSupplyChainParticipant(to), "Recipient is not an approved participant");
        require(!pendingTransfers[batchId].exists, "Pending transfer already exists");

        pendingTransfers[batchId] = PendingTransfer({
            from: msg.sender,
            to: to,
            requestedAt: uint64(block.timestamp),
            shipmentHash: shipmentHash,
            exists: true
        });

        batch.state = BatchState.InTransit;

        emit TransferRequested(batchId, msg.sender, to, shipmentHash);
    }

    function acceptTransfer(uint256 batchId) external whenNotPaused onlyExistingBatch(batchId) {
        PendingTransfer memory pending = pendingTransfers[batchId];
        require(pending.exists, "No pending transfer exists");
        require(pending.to == msg.sender, "Only recipient can accept");

        Batch storage batch = batches[batchId];
        batch.currentCustodian = msg.sender;
        batch.state = BatchState.Delivered;

        delete pendingTransfers[batchId];

        emit TransferAccepted(batchId, pending.from, msg.sender);
    }

    function recordCheckpoint(
        uint256 batchId,
        bytes32 checkpointHash,
        BatchState nextState
    ) external whenNotPaused onlyExistingBatch(batchId) {
        Batch storage batch = batches[batchId];

        require(batch.state != BatchState.Recalled, "Cannot update recalled batch");
        require(batch.state != BatchState.Dispensed, "Dispensed batches are final");
        require(
            msg.sender == batch.currentCustodian || hasRole(LOGISTICS_ROLE, msg.sender),
            "Sender is not permitted to add checkpoints"
        );
        require(nextState != BatchState.Recalled, "Use recallBatch for recalls");
        require(nextState != BatchState.Registered, "Checkpoint cannot revert to registered");

        if (nextState == BatchState.Dispensed) {
            require(
                batch.currentCustodian == msg.sender && hasRole(PHARMACY_ROLE, msg.sender),
                "Only the pharmacy custodian can dispense"
            );
        }

        batch.state = nextState;

        emit CheckpointRecorded(batchId, msg.sender, nextState, checkpointHash);
    }

    function recallBatch(
        uint256 batchId,
        bytes32 recallHash
    ) external whenNotPaused onlyExistingBatch(batchId) {
        Batch storage batch = batches[batchId];

        require(batch.state != BatchState.Recalled, "Batch already recalled");
        require(
            msg.sender == batch.manufacturer || hasRole(REGULATOR_ROLE, msg.sender),
            "Only manufacturer or regulator can recall"
        );

        batch.state = BatchState.Recalled;
        delete pendingTransfers[batchId];

        emit BatchRecalled(batchId, msg.sender, recallHash);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function getBatch(uint256 batchId) external view onlyExistingBatch(batchId) returns (Batch memory) {
        return batches[batchId];
    }

    function totalBatches() external view returns (uint256) {
        return nextBatchId - 1;
    }

    function _ensureRoleSupported(bytes32 role) private pure {
        if (
            role != MANUFACTURER_ROLE &&
            role != LOGISTICS_ROLE &&
            role != DISTRIBUTOR_ROLE &&
            role != PHARMACY_ROLE &&
            role != REGULATOR_ROLE
        ) {
            revert UnsupportedRole();
        }
    }

    function _isSupplyChainParticipant(address account) private view returns (bool) {
        return
            hasRole(MANUFACTURER_ROLE, account) ||
            hasRole(LOGISTICS_ROLE, account) ||
            hasRole(DISTRIBUTOR_ROLE, account) ||
            hasRole(PHARMACY_ROLE, account);
    }
}
