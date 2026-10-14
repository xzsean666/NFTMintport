# TASK-005: Seaport v1.6 Adapter & Order/Trading Module

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-004
- **Owner:** Session Lead
- **Scope:** Seaport v1.6 ABI, types, order builder, EIP-712 signer, approval helpers, and fulfillment synthesizers in `sdk/`.

---

## Objective
Implement the Seaport v1.6 protocol adapter in the SDK, providing high-level typed workflows for creating, signing, approving, and fulfilling NFT orders denominated in ERC-20 (such as `TestMintToken`) or native ETH.

### Key Requirements:
1. `sdk/src/types/seaport.ts`:
   - Exact Seaport v1.6 type definitions: `ItemType`, `OrderType`, `BasicOrderType`, `OfferItem`, `ConsiderationItem`, `OrderComponents`, `OrderParameters`, `Order`.
2. `sdk/src/abi/SeaportV16.ts`:
   - Full ABI for Seaport v1.6 (`fulfillOrder`, `cancel`, `getOrderStatus`, etc.).
3. `sdk/src/modules/orders.ts`:
   - `createListing({ nft, tokenId, price, currency, duration, ... })`: Builds standard Seaport OrderComponents.
   - `signOrder(components, walletClient)`: Computes EIP-712 hash with Seaport v1.6 domain separator and obtains ECDSA signature (`v, r, s`).
   - `getOrderHash(components)`: Derives deterministic order hash.
4. `sdk/src/modules/trading.ts`:
   - `checkAndApproveNFT(nft, operator)`: Checks `isApprovedForAll` or `getApproved`, simulates and calls `setApprovalForAll` if needed.
   - `checkAndApproveToken(token, spender, amount)`: Checks `allowance`, simulates and calls `approve` if needed.
   - `simulateFulfill(order, fulfiller)`: Calls `publicClient.simulateContract` for `fulfillOrder`.
   - `fulfillOrder(order)`: Executes fulfillment transaction.
   - `cancelOrder(components)`: Cancels open order on-chain.

---

## Allowed Files
### Create:
- `sdk/src/types/seaport.ts`
- `sdk/src/abi/SeaportV16.ts`
- `sdk/src/modules/orders.ts`
- `sdk/src/modules/trading.ts`
- `test/unit/sdk-orders.test.ts`

### Modify:
- `sdk/src/client.ts` (expose `orders` and `trading` modules)
- `sdk/src/index.ts` (export Seaport types and modules)

---

## Acceptance Criteria
1. Seaport v1.6 types match protocol specification.
2. Order builder produces valid EIP-712 typed data matching Seaport v1.6 domain (`Seaport`, `1.6`, chainId, verifyingContract).
3. `signOrder` produces valid 65-byte EIP-712 signatures using viem `signTypedData`.
4. Approval helpers correctly inspect on-chain allowance and execute transactions only when required.
5. Unit tests verify order creation, hash generation, and parameter validation.

---

## Verification Commands & Output
- `pnpm --filter @nftmintport/sdk build`: Exit code 0
- `npx hardhat test test/unit/sdk-orders.test.ts`: 6 passing tests. Exit code 0
- `pnpm run test`: 40 passing tests across 5 suites. Exit code 0
- `pnpm run lint`: Exit code 0

