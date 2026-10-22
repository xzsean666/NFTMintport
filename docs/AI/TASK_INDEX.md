# NFTMintport — Task Index

| Task ID | Title | Status | Dependencies | Description |
|---|---|---|---|---|
| [**TASK-001**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-001.md) | Project Foundation & Monorepo Initialization | DONE | None | Initialize pnpm workspace, package.json, TypeScript, Hardhat configuration with viem, and base directory skeleton. |
| [**TASK-002**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-002.md) | Smart Contracts & Unit Tests | DONE | TASK-001 | Implement `TestMintToken.sol`, `NFTMintportERC721.sol`, and `NFTMintportERC1155.sol` with comprehensive Hardhat unit tests. |
| [**TASK-003**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-003.md) | Deployment Pipeline & Manifest System | DONE | TASK-002 | Scripts for deploying contracts to local/testnet environments, validating network safety, and saving manifests to `deployments/`. |
| [**TASK-004**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-004.md) | TypeScript SDK Core & Contract Modules | DONE | TASK-002, TASK-003 | Build `sdk/` package with viem: `NFTMintportClient`, contract ABIs, typed interfaces, and simulation-first write methods. |
| [**TASK-005**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-005.md) | Seaport v1.6 Adapter & Order/Trading Module | DONE | TASK-004 | Order creation, EIP-712 typed signing, token/NFT approval helpers, and order fulfillment simulation in SDK. |
| [**TASK-006**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-006.md) | End-to-End Trading Workflows & Verification | DONE | TASK-005 | Comprehensive E2E test verifying: mint NFT → mint test token → list on Seaport → fulfill order → assert balances & events. |
| [**TASK-007**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-007.md) | Permissionless Test NFT Collection & Config-Driven Deployment Pipeline | DONE | TASK-002, TASK-003, TASK-004 | Implement permissionless TestMintNFT, declarative deploy.config.ts, config-driven deployment pipeline, and SDK support. |
| [**TASK-008**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-008.md) | Dynamic JSON Deployment CLI, RPC Management & Deployment Inspector | DONE | TASK-003, TASK-007 | Implement `--config <file.json>` CLI, rpc.config.json registry, Seaport auto-deployment, inspection helper, and per-deployment history. |
| [**TASK-009**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-009.md) | Codebase Audit, Security Invariant Hardening & Pipeline Resilience Fixes | DONE | TASK-001..TASK-008 | Comprehensive audit remediation: Seaport cancel/start authorization, CEI reentrancy safety, native ETH refund, ERC-1155 burnable, SDK exports/types, and incremental deployment preservation. |
| [**TASK-010**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-010.md) | Contract Verification on Soneium Minato Blockscout | DONE | TASK-001..TASK-009 | Verify deployed contracts (MoriusaTestNFT, TestUSDC, MockSeaportV16) on Minato Blockscout, configure hardhat-verify customChains, add verification script, and confirm verified status on explorer. |
| [**TASK-011**](file:///ssd0/git/NFTMintport/docs/AI/tasks/TASK-011.md) | Enhanced Selective Contract Verification Tooling | DONE | TASK-001..TASK-010 | Implement flexible verification CLI supporting single contract address, config/manifest filtering, selective `--only`/`--exclude`, and `"verify": false` exclusion flags. |

---

## Status Legend
- `TODO`: Ready to be picked up once dependencies are met.
- `IN_PROGRESS`: Currently being worked on in active session.
- `REVIEW`: Implementation finished, under verification or review.
- `DONE`: Fully verified and accepted.
- `BLOCKED`: Blocked by external issue or dependency failure.
