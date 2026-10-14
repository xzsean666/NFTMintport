# TASK-006: End-to-End Trading Workflows & Verification

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-005
- **Owner:** Session Lead
- **Scope:** Complete E2E integration test suite on local Hardhat network verifying full trading lifecycles with `TestMintToken` and native ETH via Seaport v1.6.

---

## Objective
Establish automated End-to-End (E2E) integration test coverage proving the entire NFTMintport stack functions harmoniously: contracts, SDK, and Seaport v1.6 settlement.

### Test Scenarios:
1. **Scenario 1: Test Token Settlement (`TestMintToken`)**:
   - Deploy `NFTMintportERC721` and `TestMintToken`.
   - Mint NFT #1 to Seller.
   - Mint 500 NMTT to Buyer via permissionless `mint`.
   - Seller creates and signs a Seaport listing asking for 50 NMTT.
   - Seller approves Seaport for NFT #1; Buyer approves Seaport for 50 NMTT.
   - Buyer fulfills order.
   - Verify: Seller NMTT balance increases by 50; Buyer becomes owner of NFT #1; Seaport order marked fulfilled.
2. **Scenario 2: Native ETH Settlement**:
   - Seller lists NFT #2 for 0.5 ETH.
   - Buyer fulfills order passing 0.5 ETH native value.
   - Verify: Seller ETH balance increases; Buyer becomes owner of NFT #2.
3. **Scenario 3: Failure Paths & Invariant Defense**:
   - Expired order: Fulfill attempts on expired order revert.
   - Insufficient balance: Buyer attempts fulfillment without sufficient tokens; reverts cleanly.
   - Missing approval: Fulfillment without operator approval reverts.
   - Cancellation: Seller cancels order; subsequent fulfill attempt reverts.

---

## Allowed Files
### Create:
- `test/e2e/seaport-trading.test.ts`
- `test/fixtures/seaport.ts` (helper for local Seaport setup/mock or bytecode deployment)

### Modify:
- `package.json` (add `test:e2e` script if beneficial)

---

## Acceptance Criteria
1. The full E2E test runs deterministically on local Hardhat network without external network dependencies.
2. Scenario 1 (Test Token), Scenario 2 (Native ETH), and Scenario 3 (Failure paths) pass with 100% success.
3. State transitions and balance invariants are verified with explicit assertions.
4. Terminal outputs confirm test suite execution without skipped or suppressed errors.

---

## Verification Commands & Output
- `npx hardhat test test/e2e/seaport-trading.test.ts`: 6 passing E2E tests across Scenarios 1, 2, and 3. Exit code 0.
- `pnpm run test`: 46 passing tests across 6 test suites. Exit code 0.
- `pnpm run build`: Exit code 0.
- `pnpm run lint`: Exit code 0.

