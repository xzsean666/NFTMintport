# TASK-003: Deployment Pipeline & Manifest System

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-002
- **Owner:** Session Lead
- **Scope:** Deployment scripts, network sanity checks, mainnet safety guardrails, and manifest persistence in `deployments/`.

---

## Objective
Create a deterministic, safe deployment pipeline using TypeScript and `viem` to deploy contracts to local Hardhat nodes and testnets while generating structured manifest files.

### Key Requirements:
1. `scripts/check-network.ts`:
   - Connects to current network, checks Chain ID, confirms deployer account and native balance.
   - Outputs network classification (Local / Testnet / Mainnet).
2. `scripts/utils/manifest.ts`:
   - Utility for reading, writing, and updating deployment records in `deployments/<network>-<chainId>.json`.
   - Adheres to schema defined in `docs/DEPLOYMENT.md`.
3. `scripts/deploy-all.ts`:
   - Deploys `NFTMintportERC721` and `TestMintToken`.
   - Checks network: If target is mainnet and `TestMintToken` is included, refuses deployment unless `ALLOW_TEST_TOKEN_ON_MAINNET=true` is explicitly provided.
   - Saves deployment addresses, transaction hashes, and constructor parameters to manifest.

---

## Allowed Files
### Create:
- `scripts/check-network.ts`
- `scripts/deploy-all.ts`
- `scripts/utils/manifest.ts`

### Modify:
- `package.json` (add convenience script commands like `deploy:local`)

---

## Acceptance Criteria
1. Running `npx hardhat run scripts/check-network.ts` displays correct chain ID, deployer address, and balance.
2. Running `npx hardhat run scripts/deploy-all.ts` on Hardhat network successfully deploys contracts and generates `deployments/hardhat-31337.json`.
3. Mainnet guard prevents deployment of `TestMintToken` without explicit environment override.
4. No secrets or private keys are exposed in manifest files.

---

## Verification Commands & Output
- `npx hardhat run scripts/check-network.ts`: Verified LOCAL network (Chain ID: 31337, Deployer: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266, Balance: 10000 ETH). Exit code 0.
- `npx hardhat run scripts/deploy-all.ts`: Contracts deployed and manifest recorded to `deployments/hardhat-31337.json`. Exit code 0.
- `pnpm run build`: Exit code 0.
- `pnpm run test`: 28 passing unit tests. Exit code 0.
- `pnpm run lint`: Exit code 0.

