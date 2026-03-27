# TraceChain Pharma

TraceChain Pharma is a production-style hybrid DApp for pharmaceutical supply-chain traceability. It combines a React front end, an Express/Prisma backend, Ethereum smart contracts, wallet-signature authentication, and optional IPFS document storage to demonstrate a serious distributed-systems submission rather than a toy blockchain demo.

The project is designed for the Distributed Systems / Mobile and Distributed Systems rubric:
- `Front end`: responsive operator dashboards, MetaMask integration, transaction-driven workflows, public verification view.
- `Back end`: modular API, validation, logging, Prisma/PostgreSQL persistence, document uploads, telemetry ingestion, blockchain event indexing.
- `Blockchain`: role-based Solidity contract for batch registration, custody transfers, checkpoints, and recalls.
- `Code quality`: TypeScript across layers, ESLint, Prettier, Husky, lint-staged, tests, OpenAPI docs, installation manual, technical report.

## Project Idea
This repository implements a **pharmaceutical cold-chain traceability DApp**. It was chosen because it maximizes marks across the whole rubric:
- It has an obvious and defensible blockchain use case: immutable provenance and tamper-evident recalls.
- It naturally demonstrates distributed systems concepts: independent organisations, asynchronous updates, eventual consistency, audit replication, and trust partitioning.
- It supports substantial front-end and back-end scope without becoming unfinishable.
- It offers strong academic discussion material on privacy, consistency, latency, transparency, scalability, and on-chain/off-chain trade-offs.

## Monorepo Structure
```text
.
├─ apps/
│  ├─ api/        Express + Prisma + OpenAPI + IPFS + chain indexing
│  └─ web/        React + Vite + Tailwind + wagmi/viem frontend
├─ packages/
│  ├─ contracts/  Hardhat + Solidity + deployment + tests
│  └─ shared/     Shared schemas, constants, ABI, and domain types
├─ docs/          Architecture, report, installation guide, checklist, screenshots
├─ docker-compose.yml
└─ package.json   npm workspaces, quality tooling, root scripts
```

## Quick Start
1. Copy environment templates:
   - `apps/api/.env.example` -> `apps/api/.env`
   - `apps/web/.env.example` -> `apps/web/.env`
   - `packages/contracts/.env.example` -> `packages/contracts/.env`
2. Start supporting services:
   - `docker compose up -d postgres ipfs`
3. Install dependencies:
   - `npm install`
4. Push the database schema and seed demo data:
   - `npm run db:push`
   - `npm run db:seed`
5. Start a local blockchain:
   - `npm run contracts:node`
6. Deploy the contract to the local chain:
   - `npm run contracts:deploy:local`
7. Set `VITE_CONTRACT_ADDRESS` and `CONTRACT_ADDRESS` from the deploy output.
8. Run the API and front end:
   - `npm run dev:api`
   - `npm run dev:web`

## Key Scripts
- `npm run dev:web`
- `npm run dev:api`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run db:push`
- `npm run db:seed`
- `npm run contracts:compile`
- `npm run contracts:test`
- `npm run contracts:node`
- `npm run contracts:deploy:local`
- `npm run contracts:deploy:sepolia`

## Documentation
- [Architecture and project selection](docs/ARCHITECTURE.md)
- [Installation manual](docs/INSTALLATION.md)
- [Technical report](docs/TECHNICAL_REPORT.md)
- [Version control and commit plan](docs/COMMIT_PLAN.md)
- [Marking optimisation checklist](docs/MARKING_CHECKLIST.md)
- [Suggested screenshots](docs/SCREENSHOT_GUIDE.md)

## Submission Evidence
The repository includes:
- Smart contract source, deployment scripts, and automated tests.
- Full backend and frontend source code.
- OpenAPI documentation at `/docs` when the API is running.
- ESLint, Prettier, Husky, and lint-staged configuration.
- Installation instructions for local and testnet deployment.
- A report-ready architectural and academic write-up aligned to the module outcomes.
