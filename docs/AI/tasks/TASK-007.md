# TASK-007: Permissionless Test NFT Collection & Config-Driven Deployment Pipeline

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-002, TASK-003, TASK-004
- **Owner:** Session Lead
- **Scope:** Create `TestMintNFT.sol` with permissionless minting for testing/staging environments, alongside a declarative, type-safe configuration file (`deploy.config.ts`) and deployment script (`scripts/deploy-from-config.ts`). Integrate test NFT into SDK and provide comprehensive unit & integration tests.

---

## Objective
1. **Permissionless Test NFT (`TestMintNFT.sol`)**:
   - Provide a companion test ERC-721 contract (analogous to `TestMintToken.sol`) that allows any address to mint NFTs without owner restrictions.
   - Support both single mints (with or without custom URI) and batch mints up to `MAX_MINT_PER_CALL = 50`.
   - Enforce invariant defense: zero-address checks, empty URI checks, batch count limits, and burn permissions.
2. **Config-Driven Deployment Pipeline (`deploy.config.ts` & `scripts/deploy-from-config.ts`)**:
   - Declarative configuration file specifying which contracts to deploy (`TestMintToken`, `TestMintNFT`, `NFTMintportERC721`, `NFTMintportERC1155`), their constructor arguments, test-only flags, and network overrides.
   - Automated runner reading `deploy.config.ts`, validating parameters (e.g. filling default deployer address if omitted), executing deployment transactions, and updating `deployments/<network>-<chainId>.json`.
3. **SDK Integration**:
   - Export ABI and bytecode in SDK.
   - Add `deployTestNFT`, `mintTestNFT`, and `mintBatchTestNFT` to `NFTModule`.
4. **Verification**:
   - Unit tests covering `TestMintNFT` happy paths and revert cases.
   - Tests validating config-driven deployment and SDK integration.

---

## Allowed Files
### Create:
- `contracts/nft/TestMintNFT.sol`
- `deploy.config.ts`
- `scripts/deploy-from-config.ts`
- `sdk/src/abi/TestMintNFT.ts`
- `test/unit/TestMintNFT.test.ts`
- `test/unit/deploy-config.test.ts`

### Modify:
- `package.json`
- `scripts/utils/manifest.ts`
- `sdk/src/abi/index.ts`
- `sdk/src/types/index.ts`
- `sdk/src/modules/nft.ts`
- `test/unit/sdk-modules.test.ts`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/DECISIONS.md`
- `docs/AI/SESSION_STATE.md`

---

## Acceptance Criteria
1. `TestMintNFT` can be deployed and minted permissionlessly by any account without `onlyOwner` restrictions.
2. `MAX_MINT_PER_CALL` enforces a strict upper bound (50) on batch minting per transaction.
3. `deploy.config.ts` allows toggling contracts on/off and specifying custom constructor arguments per network.
4. `scripts/deploy-from-config.ts` deploys enabled contracts according to config and writes valid manifest.
5. SDK provides typed helper methods with simulation-first execution.
6. All tests (`test:unit`, `test:e2e`) pass with 100% success and 0 lint errors.

---

## Verification Commands & Output
- `npx hardhat test test/unit/TestMintNFT.test.ts`: 17 passing tests (100%).
- `npx hardhat test test/unit/deploy-config.test.ts`: 7 passing tests (100%).
- `pnpm run test`: 71 passing tests across 8 suites (100%).
- `pnpm run build`: Exit code 0.
- `pnpm run lint`: Exit code 0.
- `pnpm run deploy:config`: Exit code 0, deployed TestMintNFT, TestMintToken, NFTMintportERC721, NFTMintportERC1155 and recorded to `deployments/hardhat-31337.json`.

