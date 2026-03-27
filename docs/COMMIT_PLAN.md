# Phase 4: Code Quality and Version Control

## Repository Organisation
- `apps/web`: React frontend
- `apps/api`: Express backend
- `packages/contracts`: Solidity contracts and Hardhat tooling
- `packages/shared`: shared schemas, constants, and ABI
- `docs`: architecture, report, installation guide, checklist

This structure is suitable for GitHub because it keeps responsibilities explicit while preserving shared types and scripts in one submission.

## Branch Workflow
- `main`: stable submission-ready branch
- `feature/contracts`: smart contract implementation and tests
- `feature/api`: backend API and database work
- `feature/web`: frontend implementation
- `feature/docs`: report, README, installation manual, and checklist

Recommended merge flow:
1. open small pull requests into `main`
2. require lint/tests before merge
3. squash merge for a clean history

## Recommended Commit Strategy
Use focused commits that reflect implementation milestones rather than giant “final project” commits.

### Sample Milestone Commits
1. `chore: initialise workspace monorepo and shared tooling`
2. `feat(contracts): add PharmaTrace role-based batch provenance contract`
3. `test(contracts): cover batch registration, transfer, and recall flows`
4. `feat(api): add wallet-signature authentication and organisation profiles`
5. `feat(api): implement batch draft, transfer, telemetry, and IPFS modules`
6. `feat(api): add blockchain event indexer and dashboard stats endpoints`
7. `feat(web): add responsive dashboard shell and wallet integration`
8. `feat(web): implement batch registration and verification flows`
9. `feat(web): add detailed batch timeline and custody actions`
10. `docs: add architecture, installation guide, report, and marking checklist`
11. `chore: configure husky, lint-staged, prettier, and repository hygiene`

## Commit Message Guidance
Prefer conventional-style messages:
- `feat:`
- `fix:`
- `docs:`
- `test:`
- `refactor:`
- `chore:`

Good examples:
- `feat(api): add IPFS-backed document upload endpoint`
- `fix(web): extract emitted batch id from registration receipt`
- `docs(report): expand distributed systems evaluation section`

## Code Quality Tooling Included
- ESLint
- Prettier
- Husky
- lint-staged
- Solhint
- Vitest
- Supertest
- Hardhat tests

## GitHub Submission Hygiene
- keep `.env` files out of version control
- keep README and docs current with actual code
- avoid mixing generated build output with source commits
- tag the final version, for example `v1.0-submission`
