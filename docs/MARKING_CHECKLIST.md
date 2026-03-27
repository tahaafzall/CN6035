# Phase 7: Marking Optimisation Check

## Back-end Implementation: 20 Marks
- Modular Express API with feature-separated modules for auth, organisations, batches, telemetry, documents, stats, and chain sync.
- Wallet-signature authentication with JWT sessions, which is more advanced than username/password placeholders.
- Prisma/PostgreSQL schema covering multiple related entities rather than trivial storage.
- Strong validation through shared Zod schemas.
- Centralised error handling and request ID support.
- Logging via Pino.
- OpenAPI documentation served through Swagger UI.
- Real backend business logic: batch drafting, transfer logging, telemetry anomaly capture, IPFS uploads, and chain event projection.

## Blockchain Interaction: 20 Marks
- Non-trivial Solidity contract with role-based access control and lifecycle logic.
- Events emitted for all meaningful transitions.
- Secure admin role assignment and emergency pause support.
- Smart contract tests covering registration, transfer, and recall.
- Hardhat deployment scripts for local and Sepolia-style workflows.
- Frontend integration with MetaMask and `wagmi/viem`.
- Backend chain indexer reading event logs from the deployed contract.
- Clear on-chain/off-chain separation with content hashes anchoring external records.

## Front-end Implementation: 20 Marks
- Modern React + TypeScript UI, not a static HTML mock-up.
- Responsive navigation shell and intentional visual design.
- Wallet connect and API-authentication flow.
- Batch creation workflow spanning API, IPFS, and blockchain transaction submission.
- Dashboard with statistics, search, audit feed, and batch status table.
- Public verification view for provenance checking.
- Detailed batch page combining projected backend data and live on-chain reads.
- Loading and error states in query-driven views.

## Code Quality and Version Control: 10 Marks
- Workspace monorepo with clear package separation.
- TypeScript across frontend, backend, and shared package.
- ESLint, Prettier, Husky, lint-staged, and Solhint configuration.
- Automated tests across helper logic, API behaviour, and smart contracts.
- `.env.example` files and installation documentation.
- Recommended branch workflow and milestone commit plan.
- Clean `.gitignore`, repository structure, and submission-ready docs.

## Extra Improvements for Even Stronger Presentation
- Add screenshots or a short demo video showing the full workflow.
- Deploy the frontend and backend to public hosting and include a live demo URL.
- Add contract verification on Etherscan for the testnet deployment.
- Add role-management UI for the admin account.
- Add QR-code batch verification for a stronger mobile/distributed angle.
