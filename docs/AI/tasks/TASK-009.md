# TASK-009: Comprehensive Codebase Audit, Security Invariant Hardening & Pipeline Resilience Fixes

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008
- **Owner:** Session Lead
- **Scope:** Complete repository audit across smart contracts, TypeScript SDK, deployment scripts, and test suites. Remediate all security vulnerabilities, CEI violations, accounting flaws, SDK typings/exports, and incremental deployment state preservation.

---

## Objective
1. **Smart Contracts Hardening & Security Audit Remediation**:
   - `MockSeaportV16.sol`:
     - Fix authorization on `cancel`: prevent griefing by requiring `msg.sender == orders[i].offerer`, reverting with `UnauthorizedCaller` if unauthorized.
     - Fix premature order fulfillment: validate `block.timestamp >= order.parameters.startTime`, reverting `OrderNotYetActive` if order has not yet started.
     - Fix Checks-Effects-Interactions (CEI) violation: update order status (`isValidated = true; totalFilled = 1; totalSize = 1;`) BEFORE performing external asset transfers.
     - Fix native ETH consideration accounting: sum all native consideration items up front, verify `msg.value >= totalNativeValue`, and refund any excess `msg.value - totalNativeValue` back to `msg.sender`.
     - Implement standard Seaport `incrementCounter() external returns (uint256 newCounter)` and emit `CounterIncremented(uint256, address)`.
   - `NFTMintportERC721.sol` & `TestMintNFT.sol`:
     - Enforce CEI: call `_setTokenURI(tokenId, ...)` BEFORE calling `_safeMint(to, tokenId)` to prevent reentrant contract receivers from reading uninitialized tokenURIs.
   - `NFTMintportERC1155.sol`:
     - Inherit `ERC1155Burnable` to grant token holders standard `burn` and `burnBatch` capabilities.
2. **Local Test Fixture Synchronization**:
   - Sync `test/fixtures/seaport.ts` to reflect all security and accounting improvements of `MockSeaportV16`.
3. **TypeScript SDK Hardening & API Parity**:
   - `sdk/src/abi/SeaportV16.ts`: add `incrementCounter`, `CounterIncremented`, `OrderNotYetActive`, and `UnauthorizedCaller` definitions.
   - `sdk/src/abi/index.ts`: export `./SeaportV16`.
   - `sdk/src/modules/trading.ts`:
     - Add `incrementCounter()` method to `TradingModule`.
     - Improve type safety: type `ApprovalCheckResult.receipt` as `TransactionReceipt`.
   - `sdk/src/types/seaport.ts`: add `startTime?: bigint` to `CreateListingParams`.
   - `sdk/src/modules/orders.ts`: allow optional `params.startTime` when creating listings.
   - `sdk/package.json`: declare `"exports"` and `"files": ["dist"]`.
4. **Deployment & Inspection Pipeline Resilience**:
   - `scripts/deploy-from-config.ts`: preserve and merge previously deployed contracts from existing manifest so partial/incremental deployments do not overwrite existing contract records.
   - `scripts/deploy-all.ts`: add `TestMintNFT` to local deployment script for parity.
   - `scripts/inspect-deployments.ts`: add on-chain bytecode check for `Seaport` address.
5. **Testing Verification**:
   - Add comprehensive tests covering:
     - Cancel griefing prevention (`UnauthorizedCaller`).
     - Premature fulfillment prevention (`OrderNotYetActive`).
     - Excess ETH refund on overpayment.
     - Offerer `incrementCounter()` bulk order cancellation.
     - ERC-1155 token burning via `burn` and `burnBatch`.
   - Verify that 100% of tests pass and 0 lint errors remain.

---

## Allowed Files
### Create:
- `docs/AI/tasks/TASK-009.md`

### Modify:
- `contracts/seaport/MockSeaportV16.sol`
- `contracts/nft/NFTMintportERC721.sol`
- `contracts/nft/TestMintNFT.sol`
- `contracts/nft/NFTMintportERC1155.sol`
- `test/fixtures/seaport.ts`
- `sdk/src/abi/SeaportV16.ts`
- `sdk/src/abi/NFTMintportERC1155.ts`
- `sdk/src/abi/index.ts`
- `sdk/src/modules/trading.ts`
- `sdk/src/modules/orders.ts`
- `sdk/src/types/seaport.ts`
- `sdk/package.json`
- `scripts/deploy-from-config.ts`
- `scripts/deploy-all.ts`
- `scripts/inspect-deployments.ts`
- `test/e2e/seaport-trading.test.ts`
- `test/unit/NFTMintportERC1155.test.ts`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/DECISIONS.md`
- `docs/AI/SESSION_STATE.md`

---

## Acceptance Criteria
1. Unauthorized accounts cannot cancel orders in `MockSeaportV16` (reverts `UnauthorizedCaller`).
2. Orders cannot be fulfilled before `startTime` (reverts `OrderNotYetActive`).
3. Excess native ETH paid during order fulfillment is accurately refunded to `msg.sender`.
4. `incrementCounter()` increments offerer counter and invalidates pending orders.
5. All external calls in `MockSeaportV16` and NFT contracts strictly satisfy CEI.
6. `NFTMintportERC1155` supports `burn` and `burnBatch`.
7. Incremental deployment preserves previously deployed contracts in manifests.
8. All unit, integration, and E2E tests pass with 100% success and 0 lint errors.

---

## Verification Commands & Output
- `pnpm run build`: Exit code 0 (Compiled 5 Solidity files, compiled SDK TypeScript).
- `pnpm run test`: 88 passing tests across 9 test suites (100% pass rate).
- `pnpm run lint`: Exit code 0 (TypeScript strict check passed across root and SDK).
- `pnpm run deploy:local`: Exit code 0 (Deployed TestMintToken, NFTMintportERC721, NFTMintportERC1155, TestMintNFT).
- `pnpm run deploy:seaport`: Exit code 0 (Deployed/verified MockSeaportV16 on custom/local chain).
- `pnpm run inspect:deployments`: Exit code 0 (Correctly reports bytecode status for all contracts including Seaport).
