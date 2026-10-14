# NFTMintport — Architecture Decision Records (ADR)

## ADR-001: Monorepo Structure with pnpm
- **Status:** Accepted
- **Context:** The project requires coordination between Solidity smart contracts, Hardhat compilation/test infrastructure, and a TypeScript SDK.
- **Decision:** Adopt a single monorepo managed with `pnpm`, using standard root folders: `contracts/`, `test/`, `scripts/`, `deployments/`, `sdk/`, `docs/`.
- **Consequences:** Simplifies cross-package linking, ABI synchronization, and unified CI script execution without multiple package repositories.

---

## ADR-002: Fixed Technology Stack
- **Status:** Accepted
- **Context:** Consistency and auditability require avoiding fractured tooling or conflicting Web3 libraries.
- **Decision:**
  - Hardhat for Solidity compilation and testing.
  - TypeScript throughout.
  - OpenZeppelin Contracts v5.x for core standard implementations.
  - `viem` for SDK and blockchain interaction (ethers.js and web3.js are strictly disallowed).
  - pnpm as the exclusive package manager.
- **Consequences:** Clean type safety, lightweight bundle sizes, modern viem simulation patterns, and compliance with the engineering agent protocol.

---

## ADR-003: Immutable Contracts by Default
- **Status:** Accepted
- **Context:** Upgradeability introduces storage collision risks, governance centralization, and increased attack surfaces.
- **Decision:** Use immutable contracts for ERC-721, ERC-1155, and TestMintToken. Upgradeability via UUPS + ERC-7201 is reserved only if explicit business requirements demand dynamic logic changes.
- **Consequences:** Lower gas costs, zero proxy complexity, and transparent on-chain security guarantees.

---

## ADR-004: Seaport Protocol Version v1.6
- **Status:** Accepted
- **Context:** Seaport has multiple versions (v1.1, v1.4, v1.5, v1.6). Seaport v1.6 offers gas optimizations and unified CREATE2 deployment across all standard EVM chains.
- **Decision:** Target Seaport v1.6 (`0x0000000000000068F116a894984e2DB1123eB395`) and ConduitController (`0x00000000F9490004C103FB2A09CE222342427011`).
- **Consequences:** Guarantees interoperability with contemporary marketplace infrastructure while avoiding deprecated order types.

---

## ADR-005: Custom Errors over Revert Strings
- **Status:** Accepted
- **Context:** Solidity 0.8.4+ provides custom errors, which save deployment and execution gas while providing structured revert decoding in `viem`.
- **Decision:** Replace string errors (e.g. `require(..., "error")`) with typed custom errors (e.g. `revert ZeroAddressRecipient()`).
- **Consequences:** Cleaner ABIs, gas savings, and predictable error parsing in SDK and tests.

---

## ADR-006: viem-First SDK Architecture (Simulate -> Write)
- **Status:** Accepted
- **Context:** Transactions on EVM chains can revert unhelpfully if state prerequisites (balances, allowances, nonces) are violated.
- **Decision:** SDK operations prioritize transaction simulation before broadcast (`publicClient.simulateContract` or `eth_call`). Write operations only execute if simulation succeeds.
- **Consequences:** Prevents wasted gas, provides instant client-side error diagnosis, and ensures predictable UX.

---

## ADR-007: Test Token Mint Limits and Network Guards
- **Status:** Accepted
- **Context:** `TestMintToken` requires permissionless minting for automated testing, but must not be mistreated as a real asset or spam local chain memory in single transactions.
- **Decision:** Include a `MAX_MINT_PER_CALL = 1_000_000 ether` check per transaction. The deployment scripts and SDK check Chain ID and refuse mainnet deployment unless an explicit override flag is passed.
- **Consequences:** Provides infinite supply across multiple calls for tests, while preventing integer overflow or abusive block consumption.

---

## ADR-008: Permissionless Test NFT Collection & Config-Driven Deployment
- **Status:** Accepted
- **Context:** Integration testing, local simulations, and staging environments require test NFT assets that can be minted permissionlessly by any participant without requiring collection owner keys. Furthermore, deploying contracts via rigid hardcoded scripts creates friction when toggling contracts or adjusting collection parameters across different target environments.
- **Decision:**
  - Create `TestMintNFT.sol` providing permissionless minting (`mint(address to)`, `mint(address to, string memory uri)`, `mintBatch(...)`) with an upper bound guard `MAX_MINT_PER_CALL = 50`.
  - Introduce a declarative, TypeScript-typed configuration file `deploy.config.ts` defining contracts to deploy, constructor arguments, and environment overrides.
  - Implement `scripts/deploy-from-config.ts` to execute config-driven deployments and record results to `deployments/<network>-<chainId>.json`.
- **Consequences:** Eliminates mock/faucet bottlenecks for NFT testing, enables modular multi-environment deployments without code changes, and prevents accidental test contract deployments on mainnets through automated guardrails.

---

## ADR-009: JSON Config-Driven CLI, RPC Management, and Per-Deployment History Tracking
- **Status:** Accepted
- **Context:** Multi-chain deployments require parameterized inputs via JSON files containing chain IDs and test flags. Users need clear error messaging when RPC endpoints are missing for target chains, automatic deployment of Seaport on non-canonical test networks, an inspection helper to view contract states, and an immutable log of each deployment run.
- **Decision:**
  - Support `--config <file.json>` CLI arguments to load parameterized deployment configurations.
  - Centralize RPC URLs and network metadata in `rpc.config.json`; halt with explicit instructions if an unknown `chainId` is encountered.
  - Compile `MockSeaportV16.sol` to allow deploying Seaport on any test chain when canonical bytecode is absent.
  - Persist an immutable run record in `deployments/history/deployment-<chainId>-<timestamp>.json` for every deployment execution.
  - Implement `scripts/inspect-deployments.ts` to query on-chain bytecode, contract metadata, and Seaport addresses.
- **Consequences:** Eliminates manual hardcoding, prevents misconfigured deployments via RPC validation, provides complete deployment auditability through history logs, and simplifies testnet Seaport operations.

---

## ADR-010: Security Invariant Hardening, CEI Compliance & Incremental Manifest Preservation
- **Status:** Accepted
- **Context:** A comprehensive audit revealed security vulnerabilities and logic edge cases:
  1. `MockSeaportV16` permitted unauthorized cancellation of orders by third parties.
  2. `fulfillOrder` allowed premature execution before `startTime`, violated Checks-Effects-Interactions (CEI) by updating status after transfers, and did not properly compute total native consideration or refund excess ETH.
  3. NFT contracts called `_setTokenURI` after `_safeMint`, exposing uninitialized metadata to external receiver callbacks.
  4. `NFTMintportERC1155` lacked token burning functionality.
  5. `deploy-from-config` wiped previously deployed contracts from active manifests on selective deployments.
- **Decision:**
  - Enforce strict caller validation on `cancel()` (`UnauthorizedCaller`) and `startTime` check on `fulfillOrder()` (`OrderNotYetActive`).
  - Set order status (`isValidated = true; totalFilled = 1; totalSize = 1;`) BEFORE external asset transfers, strictly observing CEI.
  - Implement full cryptographic EIP-712 signature verification in `MockSeaportV16`, sum all native consideration items, and refund excess `msg.value`.
  - Add `incrementCounter()` to `MockSeaportV16` and SDK's `TradingModule` for bulk order cancellation.
  - Set `_setTokenURI` before `_safeMint` across all ERC-721 minting routines.
  - Inherit `ERC1155Burnable` in `NFTMintportERC1155`.
  - Preserve previously deployed contracts when updating manifests incrementally.
- **Consequences:** Eliminates griefing and reentrancy vectors, prevents user fund loss via ETH refunds, aligns MockSeaport cryptographic behavior with official Seaport v1.6, and guarantees deployment manifest safety.


