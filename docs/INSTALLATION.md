# Installation Manual

## 1. Prerequisites
- Node.js `20+`
- npm `10+`
- Docker Desktop or Docker Engine
- MetaMask browser extension
- Git

## 2. Clone and Prepare
```bash
git clone <your-repo-url>
cd tracechain-pharma
```

Copy environment files:
```bash
copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
copy packages\\contracts\\.env.example packages\\contracts\\.env
```

On Linux or macOS use `cp` instead of `copy`.

## 3. Start Supporting Services
TraceChain uses PostgreSQL and optional IPFS via Docker.

```bash
docker compose up -d postgres ipfs
```

Services:
- PostgreSQL: `localhost:5432`
- IPFS API: `localhost:5001`
- IPFS Gateway: `localhost:8080`

## 4. Install Dependencies
```bash
npm install
```

## 5. Configure the Database
Make sure `apps/api/.env` contains a valid PostgreSQL connection string:

```env
DATABASE_URL=postgresql://tracechain:tracechain@localhost:5432/tracechain
```

Push the schema and seed demo data:
```bash
npm run db:push
npm run db:seed
```

## 6. Start a Local Blockchain
Open a terminal and run:
```bash
npm run contracts:node
```

This starts a local Hardhat JSON-RPC network at `http://127.0.0.1:8545`.

## 7. Deploy the Smart Contract
In a second terminal:
```bash
npm run contracts:deploy:local
```

The script prints JSON containing:
- `network`
- `chainId`
- `contractAddress`
- demo role addresses

Copy the printed contract address into:
- `apps/api/.env` as `CONTRACT_ADDRESS`
- `apps/web/.env` as `VITE_CONTRACT_ADDRESS`

Set RPC values if needed:
```env
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
VITE_LOCAL_RPC_URL=http://127.0.0.1:8545
```

## 8. Configure MetaMask
Add the local Hardhat network:
- Network name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one or more default Hardhat test accounts using the private keys shown by `hardhat node`.

Recommended local demo accounts:
- signer 1: manufacturer
- signer 2: logistics
- signer 3: distributor
- signer 4: pharmacy
- signer 5: regulator

## 9. Start the Backend
```bash
npm run dev:api
```

Backend endpoints:
- API: `http://localhost:4000`
- Swagger/OpenAPI docs: `http://localhost:4000/docs`

## 10. Start the Frontend
In another terminal:
```bash
npm run dev:web
```

Frontend URL:
- `http://localhost:5173`

## 11. Recommended Demo Flow
1. Connect MetaMask in the frontend.
2. Authenticate the API by signing the nonce message.
3. Complete your organisation profile.
4. Create a new batch as a manufacturer.
5. Submit the blockchain transaction in MetaMask.
6. Open the batch detail page.
7. Request a transfer to another organisation.
8. Switch MetaMask account and accept the transfer.
9. Verify the batch from the public verification page.

## 12. Run Tests
```bash
npm run test
```

Targeted runs:
```bash
npm run contracts:test
npm run test --workspace @tracechain/api
npm run test --workspace @tracechain/web
```

## 13. Lint and Format
```bash
npm run lint
npm run format
```

## 14. Testnet Deployment (Sepolia)
Fill `packages/contracts/.env`:
```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
MANUFACTURER_ADDRESS=0x...
LOGISTICS_ADDRESS=0x...
DISTRIBUTOR_ADDRESS=0x...
PHARMACY_ADDRESS=0x...
REGULATOR_ADDRESS=0x...
```

Deploy:
```bash
npm run contracts:deploy:sepolia
```

Update:
- `apps/api/.env`
- `apps/web/.env`

Use:
```env
CHAIN_ID=11155111
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

Then restart API and frontend.

## 15. Troubleshooting

### MetaMask shows unsupported network
- Switch to Hardhat Local or Sepolia.
- Confirm `chainId` matches the configured contract.

### API starts but DB queries fail
- Confirm PostgreSQL container is running.
- Check `DATABASE_URL`.
- Re-run `npm run db:push`.

### Document uploads fail
- Confirm IPFS container is running.
- Check `IPFS_API_URL=http://127.0.0.1:5001`.

### Contract calls revert
- Make sure the connected wallet has the correct role on-chain.
- Use the role-assigned demo accounts from the deploy script.

### Frontend cannot link a batch to the contract
- Confirm `VITE_CONTRACT_ADDRESS` matches the deployed contract.
- Confirm the receipt contains the `BatchRegistered` event.

### Chain sync does not update projected data
- Confirm `RPC_URL`, `CHAIN_ID`, and `CONTRACT_ADDRESS` are set in `apps/api/.env`.
- Call `POST /api/chain/sync` as a regulator or admin wallet session.
