import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

async function deployFixture() {
  const [admin, manufacturer, logistics, distributor, pharmacy, regulator, outsider] =
    await ethers.getSigners();

  const contractFactory = await ethers.getContractFactory('PharmaTrace');
  const contract = await contractFactory.deploy(admin.address);
  await contract.waitForDeployment();

  await contract.grantSupplyChainRole(manufacturer.address, await contract.MANUFACTURER_ROLE());
  await contract.grantSupplyChainRole(logistics.address, await contract.LOGISTICS_ROLE());
  await contract.grantSupplyChainRole(distributor.address, await contract.DISTRIBUTOR_ROLE());
  await contract.grantSupplyChainRole(pharmacy.address, await contract.PHARMACY_ROLE());
  await contract.grantSupplyChainRole(regulator.address, await contract.REGULATOR_ROLE());

  return {
    contract,
    admin,
    manufacturer,
    logistics,
    distributor,
    pharmacy,
    regulator,
    outsider
  };
}

describe('PharmaTrace', function () {
  it('registers a batch with immutable content hashes', async function () {
    const { contract, manufacturer } = await loadFixture(deployFixture);
    const expiry = (await time.latest()) + 30 * 24 * 60 * 60;

    await expect(
      contract
        .connect(manufacturer)
        .createBatch(
          'BATCH-ALPHA-001',
          'mRNA Vaccine',
          expiry,
          ethers.keccak256(ethers.toUtf8Bytes('metadata')),
          ethers.keccak256(ethers.toUtf8Bytes('documents'))
        )
    )
      .to.emit(contract, 'BatchRegistered')
      .withArgs(
        1n,
        'BATCH-ALPHA-001',
        'mRNA Vaccine',
        manufacturer.address,
        ethers.keccak256(ethers.toUtf8Bytes('metadata')),
        ethers.keccak256(ethers.toUtf8Bytes('documents')),
        BigInt(expiry)
      );

    const batch = await contract.getBatch(1);
    expect(batch.batchCode).to.equal('BATCH-ALPHA-001');
    expect(batch.currentCustodian).to.equal(manufacturer.address);
    expect(batch.state).to.equal(0);
  });

  it('supports custody transfer requests and recipient acceptance', async function () {
    const { contract, manufacturer, logistics } = await loadFixture(deployFixture);
    const expiry = (await time.latest()) + 14 * 24 * 60 * 60;

    await contract
      .connect(manufacturer)
      .createBatch(
        'BATCH-BETA-002',
        'Insulin Pens',
        expiry,
        ethers.keccak256(ethers.toUtf8Bytes('metadata')),
        ethers.keccak256(ethers.toUtf8Bytes('documents'))
      );

    const shipmentHash = ethers.keccak256(ethers.toUtf8Bytes('shipment-001'));

    await expect(contract.connect(manufacturer).requestTransfer(1, logistics.address, shipmentHash))
      .to.emit(contract, 'TransferRequested')
      .withArgs(1n, manufacturer.address, logistics.address, shipmentHash);

    const pendingTransfer = await contract.pendingTransfers(1);
    expect(pendingTransfer.exists).to.equal(true);
    expect(pendingTransfer.to).to.equal(logistics.address);

    await expect(contract.connect(logistics).acceptTransfer(1))
      .to.emit(contract, 'TransferAccepted')
      .withArgs(1n, manufacturer.address, logistics.address);

    const batch = await contract.getBatch(1);
    expect(batch.currentCustodian).to.equal(logistics.address);
    expect(batch.state).to.equal(2);
  });

  it('allows regulators to recall batches and blocks unauthorised recalls', async function () {
    const { contract, manufacturer, regulator, outsider } = await loadFixture(deployFixture);
    const expiry = (await time.latest()) + 21 * 24 * 60 * 60;

    await contract
      .connect(manufacturer)
      .createBatch(
        'BATCH-GAMMA-003',
        'Temperature Sensitive Antibiotic',
        expiry,
        ethers.keccak256(ethers.toUtf8Bytes('metadata')),
        ethers.keccak256(ethers.toUtf8Bytes('documents'))
      );

    await expect(
      contract
        .connect(outsider)
        .recallBatch(1, ethers.keccak256(ethers.toUtf8Bytes('unexpected')))
    ).to.be.revertedWith('Only manufacturer or regulator can recall');

    await expect(
      contract
        .connect(regulator)
        .recallBatch(1, ethers.keccak256(ethers.toUtf8Bytes('temperature excursion')))
    ).to.emit(contract, 'BatchRecalled');

    const batch = await contract.getBatch(1);
    expect(batch.state).to.equal(3);
  });
});
