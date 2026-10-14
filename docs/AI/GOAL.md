# NFTMintport — Project Goal & MVP Specification

## 1. Project Overview

**NFTMintport** is an open-source EVM toolkit designed for launching NFT collections and enabling trading powered by the Seaport protocol. It provides smart contracts, a TypeScript SDK built with `viem`, deployment tooling with manifest recording, and repeatable testing workflows for local nodes and testnets.

---

## 2. Problem Statement & Scope

Developers launching NFT projects or marketplaces often face repetitive and error-prone boilerplate:
- Setting up standards-compliant ERC-721 and ERC-1155 contracts with metadata storage and access controls.
- Integrating Seaport order creation, signing (EIP-712), and fulfillment without importing heavyweight or deprecated libraries.
- Testing token-denominated purchases without access to faucets or mintable test tokens on local or staging networks.
- Managing deployment manifests across networks safely without accidental mainnet broadcasting.

**Non-Goals for Initial MVP:**
- Building a full hosted marketplace UI or custodial wallet.
- Building a centralized order indexer / orderbook server.
- Issuing production or speculative tokens.

---

## 3. MVP Capabilities & Success Criteria

The MVP focuses on delivering a reliable, verifiable developer foundation:

1. **Smart Contracts:**
   - `NFTMintportERC721.sol`: Standards-compliant ERC-721 with URI storage, custom errors, ownership, and mint controls.
   - `NFTMintportERC1155.sol`: Standards-compliant ERC-1155 with supply tracking, URI management, and custom errors.
   - `TestMintToken.sol`: Permissionless-mint ERC-20 with safety limits per call (`MAX_MINT_PER_CALL`), clear test-only metadata/revert errors, and strict non-mainnet safeguards.
   - Immutable contracts by default (no complex proxies unless requested).

2. **TypeScript SDK (`viem`):**
   - Pure `viem`-based client wrapper (`NFTMintportClient`).
   - Contract module: Read/write methods for NFT collections and test token.
   - Seaport module: Order builder, EIP-712 signer, approval checks, simulation, and fulfillment helpers compatible with Seaport v1.6.
   - Semantic high-level APIs (`createListing`, `fulfillOrder`, `mintNFT`, `mintTestToken`).
   - Always prioritize `simulate` -> `write`.

3. **Deployment & Tooling:**
   - Hardhat-based build and test pipeline.
   - Deployment scripts enforcing: Chain ID checks, deployer balance checks, network verification, and manifest persistence in `deployments/<network>-<chainId>.json`.
   - Explicit guardrails against unauthorized mainnet broadcasting.

4. **Testing Suite:**
   - Unit tests for all contracts covering happy paths and edge cases (zero address, overflow, invalid amounts, unauthorized access).
   - SDK integration tests validating client instantiation and call simulation.
   - End-to-End (E2E) workflow test:
     1. Deploy NFT collection + Test ERC-20.
     2. Mint NFT to Seller.
     3. Mint Test ERC-20 to Buyer.
     4. Seller signs Seaport listing asking for Test ERC-20.
     5. Buyer approves tokens and fulfills listing.
     6. Verify asset balances and event emissions.

---

## 4. Invariants & Security Boundaries

- **Asset Safety:** Checks-Effects-Interactions (CEI) pattern strictly followed.
- **ERC-20 Operations:** `SafeERC20` used for all external token transfers.
- **Contract as Source of Truth:** SDK never serves as a security boundary; contracts enforce all access control and state transitions.
- **Zero Real-World Value:** `TestMintToken` must never be deployed to production mainnets or configured with monetary claims.
