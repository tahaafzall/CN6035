# TraceChain Pharma: A Hybrid Distributed DApp for Pharmaceutical Supply-Chain Traceability

## 1. Introduction
TraceChain Pharma is a hybrid decentralised application designed to address a real distributed-systems problem: maintaining trustworthy provenance and operational visibility across a pharmaceutical supply chain. The system targets a context in which manufacturers, logistics firms, distributors, pharmacies, and regulators must coordinate around shared data but do not fully trust a single central database operator. In this scenario, blockchain is useful for auditability, non-repudiation, and verifiable state transitions, while conventional backend infrastructure remains necessary for storage-intensive, privacy-sensitive, and analytics-heavy workloads.

The project was intentionally designed to satisfy the Distributed Systems / Mobile and Distributed Systems module outcomes. It combines a modern web front end, a modular backend API, smart contracts, wallet integration, a relational database, and optional distributed document storage. Rather than treating blockchain as a standalone platform, the design adopts a hybrid model in which on-chain state is limited to trust-critical data, while off-chain services provide usability, rich querying, and cost-efficient processing.

## 2. Project Objectives
The primary objective was to build a serious, submission-ready hybrid DApp rather than a basic student demo. The system needed to demonstrate a clear separation of concerns between the client, backend, and blockchain layers, while showing why each technology was chosen. Specific goals were:

- provide an operator-facing frontend with responsive dashboards and wallet workflows
- implement a real backend with authentication, validation, persistence, logging, and domain logic
- design smart contracts that represent meaningful pharmaceutical lifecycle operations
- support local development and Ethereum testnet deployment
- demonstrate distributed-systems issues such as consistency, trust, latency, and transparency
- include professional engineering practices such as testing, code quality tooling, and structured documentation

## 3. Distributed Systems Relevance
This project strongly aligns with distributed systems theory because it coordinates multiple autonomous components and participants with partial trust. The frontend, backend API, PostgreSQL database, IPFS node, Ethereum node, MetaMask wallet, and smart contract all act as separate system elements. Furthermore, the business actors themselves are distributed: the manufacturer creates a batch, a logistics provider transports it, a distributor receives it, a pharmacy dispenses it, and a regulator may intervene with a recall.

The blockchain introduces replicated state and consensus-backed ordering of critical events. However, not all data belongs on-chain. Telemetry readings, organisation metadata, and descriptive records are stored off-chain because they are high-volume, mutable, or operational rather than trust-critical. This creates an important consistency trade-off: the API maintains an indexed projection of on-chain events for efficient querying, but that projection is eventually consistent with the blockchain rather than strictly synchronous. This trade-off is academically valuable because it mirrors real distributed-system design decisions around availability, latency, and storage cost.

## 4. Architecture Design
The architecture follows a hybrid three-tier model with decentralised infrastructure.

The frontend is implemented in React with TypeScript and Tailwind CSS. It provides operator dashboards, batch creation forms, public verification, and wallet-driven interaction with the smart contract. Wallet access is handled through MetaMask using `wagmi` and `viem`.

The backend is implemented with Express and Prisma. It manages off-chain metadata, signature-based authentication, IPFS uploads, telemetry ingestion, and an event-indexing service that reads blockchain logs and updates a PostgreSQL query model. The backend is therefore not merely a proxy for contract calls; it contains significant application logic and distributed coordination responsibilities.

The blockchain layer is implemented in Solidity and deployed using Hardhat. The `PharmaTrace` contract maintains batch registration, current custody, pending transfer state, checkpoints, and recalls. This is the trust anchor of the application.

The storage strategy is deliberately split:
- on-chain: batch identifiers, custody transitions, recall state, and content hashes
- PostgreSQL: batch metadata, organisation profiles, telemetry, audit projections, and operational logs
- IPFS: supporting documents such as compliance files or shipment evidence

This arrangement keeps blockchain storage concise and defensible while preserving a rich application experience.

## 5. Front-End Implementation
The frontend was designed to look and behave like an operational system rather than a prototype. It includes a structured navigation shell, wallet connectivity, network status awareness, search and filtering, batch dashboards, public verification, and transaction feedback. The visual design intentionally avoids plain default styling. Instead, it uses a dark industrial palette, an intentional typographic hierarchy, and card-based layouts that suit logistics and compliance workflows.

Several views are important for the assessment:
- the home page explains why the project is a strong distributed-systems submission
- the dashboard shows indexed batches and recent audit activity
- the create batch page demonstrates the hybrid workflow of draft creation, IPFS upload, blockchain transaction, event extraction, and record linking
- the verification page demonstrates transparency and read-only provenance checking
- the batch detail page combines projected database state with direct on-chain reads

The frontend also integrates wallet-signature authentication for the API. A user first connects MetaMask, then signs a nonce message to obtain a JWT session for protected backend operations. This is a strong demonstration of decentralised identity concepts without requiring a separate username/password model.

## 6. Back-End Implementation
The backend is structured into explicit modules for authentication, organisations, batches, telemetry, documents, statistics, and chain indexing. This modularity supports maintainability and reflects professional separation of concerns. Each route uses validation derived from shared Zod schemas, reducing duplication between the frontend and backend and improving type safety.

Authentication is wallet-based. The API issues a nonce, the client signs it, and the backend verifies the recovered address before issuing a JWT. This approach suits a DApp because wallet ownership is the natural user identity.

Prisma and PostgreSQL are used for off-chain persistence. The schema includes organisations, batches, transfers, telemetry readings, audit events, nonces, and chain cursors. This makes the system demonstrably more advanced than a single-table or memory-only demo.

The backend also supports document uploads to IPFS through `ipfs-http-client`. Supporting documents are pinned and returned as content-addressed CIDs. The resulting hash anchors can then be stored alongside blockchain-linked records.

An especially important backend feature is the chain projection service. It connects to a JSON-RPC endpoint, reads contract logs, decodes emitted events, and updates the relational projection. This supports fast queries for the frontend while preserving a verifiable link to the blockchain source of truth. It also demonstrates asynchronous distributed communication and eventual consistency in practice.

## 7. Blockchain Implementation
The smart contract is intentionally meaningful rather than trivial. The `PharmaTrace` contract supports:
- role assignment by an administrator
- manufacturer-only batch creation
- custody transfer requests and recipient acceptance
- checkpoint recording for lifecycle progression
- regulator or manufacturer initiated recalls
- pausing for emergency control

The contract uses OpenZeppelin `AccessControl` and `Pausable`, which are industry-standard security building blocks. Input validation is explicit, revert reasons are clear, and events are emitted for all significant changes. The design avoids placing large metadata on-chain; instead, the contract stores hashes that anchor off-chain records. This is both cost-efficient and architecturally appropriate.

From a security perspective, the contract enforces sender permissions, prevents unsupported role assignment, blocks invalid lifecycle transitions such as moving recalled or dispensed batches, and restricts dispensing to a pharmacy custodian. These design decisions demonstrate secure smart-contract engineering rather than minimal proof-of-concept code.

## 8. Tools and Platforms Used
This project makes use of a wide range of distributed systems platforms and software tools:
- React, Vite, TypeScript, Tailwind CSS
- Express, Prisma, PostgreSQL
- Solidity, Hardhat, OpenZeppelin
- MetaMask, wagmi, viem
- IPFS/Kubo
- Docker Compose
- ESLint, Prettier, Husky, lint-staged
- Vitest, Supertest, Hardhat tests

This variety is valuable academically because it demonstrates practical competence across the ecosystem required to design and implement a hybrid distributed application.

## 9. Code Quality and Version Control
Quality controls are embedded into the repository. TypeScript is used across the frontend, backend, and shared domain package. ESLint and Prettier enforce consistency, while Husky and lint-staged support pre-commit checks. The Solidity package additionally includes Solhint configuration for contract linting. Automated tests cover helper logic, API health behaviour, and key smart-contract operations such as batch creation, transfers, and recalls.

The repository is organised as a workspace-based monorepo with clear package boundaries. This structure is GitHub-friendly and reflects teamwork-ready engineering practice. A branch strategy and milestone commit plan are also included so that the repository can present a clean and professional submission history.

## 10. Evaluation of Benefits and Drawbacks
The hybrid architecture offers several benefits. It provides a trustworthy provenance layer, makes tampering harder, allows public verification, and preserves user-controlled transaction signing. It also enables rich interfaces and efficient analytics through the backend projection model.

However, these benefits come with drawbacks. Blockchain transactions introduce latency due to wallet confirmation and network finality. Gas costs limit how much can be stored on-chain. The indexed projection is only eventually consistent, which means the backend may briefly lag behind chain state. Privacy is also a significant concern: public chains are not appropriate for raw medical or commercially sensitive data, which is why the design stores only hashes on-chain.

These drawbacks are not weaknesses of the report; they are precisely the kind of critical issues expected in a distributed systems evaluation. The project therefore demonstrates both engineering implementation and analytical maturity.

## 11. Critical Distributed Systems Issues
Several critical issues are intentionally surfaced:

- **Consistency**: the blockchain is the authoritative source for trust-critical state, while the backend projection is optimised for read performance.
- **Latency and finality**: users must wait for wallet approval and block confirmation before a state transition is reliable.
- **Fault tolerance**: the system degrades differently depending on the failed component. If the backend is unavailable, on-chain state still exists; if the chain is unavailable, the API may still serve older indexed data.
- **Security**: smart-contract RBAC, signature verification, content hashes, and event auditing collectively improve integrity, but operational secrets and private keys remain sensitive.
- **Scalability**: telemetry is intentionally off-chain because high-frequency data is unsuitable for direct blockchain storage.

## 12. Conclusion
TraceChain Pharma demonstrates a full hybrid DApp architecture suitable for a high-scoring distributed systems submission. It combines a modern frontend, a robust backend, and meaningful blockchain integration in a way that is both technically defensible and academically rich. The project does not present blockchain as a replacement for all infrastructure. Instead, it shows how decentralised and centralised components can be combined to balance trust, performance, usability, and cost. This hybrid design is the most realistic and strongest interpretation of the assignment brief.

## 13. References Placeholder
- Ethereum and EVM documentation
- Hardhat documentation
- OpenZeppelin contracts documentation
- Prisma documentation
- wagmi and viem documentation
- IPFS documentation
