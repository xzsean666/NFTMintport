# TASK-008: Dynamic JSON Deployment CLI, RPC Management & Deployment Inspector

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-003, TASK-007
- **Owner:** Session Lead
- **Scope:** Enhance deployment infrastructure with `--config <file.json>` CLI support, centralized `rpc.config.json` management with missing-chain prompts, on-demand Seaport deployment for custom chains, per-run deployment history tracking, and an inspection helper script.

---

## Objective
1. **Dynamic CLI Deployment with `--config <file.json>`**:
   - Allow users to pass arbitrary JSON config files via `--config <path>`.
   - The JSON config specifies `chainId`, `isTest` (boolean mode), `deploySeaport` (boolean), and contract configurations.
2. **Centralized RPC Registry (`rpc.config.json`)**:
   - Provide a structured JSON file mapping chain IDs to network names, RPC URLs, and explorer metadata.
   - If a chain ID in the deployment config is not found in `rpc.config.json`, throw an explicit, actionable error explaining how and where to add the entry.
3. **On-Demand Seaport Deployment (`MockSeaportV16.sol` & `scripts/deploy-seaport.ts`)**:
   - Compile `MockSeaportV16.sol` as a standard contract artifact.
   - In deployments where Seaport is requested and bytecode is absent at the canonical address, deploy `MockSeaportV16` and register its address in the manifest.
   - Provide standalone `scripts/deploy-seaport.ts` script for independent deployment.
4. **Per-Deployment Run History**:
   - In addition to updating the active `deployments/<network>-<chainId>.json`, generate an immutable run log under `deployments/history/deployment-<chainId>-<timestamp>.json` capturing the full config snapshot, transaction hashes, block numbers, and deployed addresses.
5. **Deployment Management & Inspection Helper (`scripts/inspect-deployments.ts`)**:
   - Provide a CLI inspection script (`pnpm run inspect:deployments`) to list deployments, inspect live contract status, verify on-chain bytecode, and report Seaport address status.

---

## Allowed Files
### Create:
- `contracts/seaport/MockSeaportV16.sol`
- `rpc.config.json`
- `deploy.config.json`
- `scripts/deploy-seaport.ts`
- `scripts/inspect-deployments.ts`
- `test/unit/deploy-cli.test.ts`

### Modify:
- `scripts/deploy-from-config.ts`
- `scripts/utils/manifest.ts`
- `package.json`
- `hardhat.config.ts`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/DECISIONS.md`
- `docs/AI/SESSION_STATE.md`

---

## Acceptance Criteria
1. Running deployment with `--config <custom.json>` loads and applies the custom configuration.
2. If `chainId` is missing in `rpc.config.json`, the script halts with a clear error instructing the user to add it.
3. `isTest: false` prevents test contracts from deploying on production networks without explicit overrides.
4. Every deployment execution creates an immutable record in `deployments/history/`.
5. Seaport is deployed automatically if requested and not present on the target chain.
6. `scripts/inspect-deployments.ts` lists all deployments and validates on-chain bytecode.
7. All existing and new tests pass with 100% success and 0 lint errors.

---

## Verification Commands & Output
- `npx hardhat test test/unit/deploy-cli.test.ts`: 10 passing tests (100%).
- `pnpm run test`: 81 passing tests across 9 suites (100%).
- `pnpm run build`: Exit code 0.
- `pnpm run lint`: Exit code 0.
- `pnpm run deploy --config deploy.config.json`: Deploys successfully and writes run log to `deployments/history/`.
- `pnpm run inspect:deployments`: Displays live contract status and run history logs.

