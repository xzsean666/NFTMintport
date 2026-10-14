# Universal Hardhat + SDK Blockchain Engineering Agent Protocol: Repository Operating Guide

This repository (`NFTMintport`) strictly adheres to the **Universal Hardhat + SDK Blockchain Engineering Agent Protocol**. Every AI agent and developer interacting with this codebase must read and enforce the following rules.

---

## 1. Fixed Technology Stack
- **Smart Contracts:** Solidity (0.8.24+) + Hardhat
- **TypeScript:** Strict type checking across tests, scripts, and SDK
- **Standard Libraries:** OpenZeppelin Contracts v5.x
- **SDK:** TypeScript + `viem` exclusively
- **Package Manager:** `pnpm` exclusively
- **Contract Testing:** Hardhat Test (`@nomicfoundation/hardhat-toolbox-viem` or viem fixtures)
- **Forbidden:**
  - ❌ Foundry / Forge
  - ❌ ethers.js / web3.js
  - ❌ Any non-Hardhat Solidity frameworks

---

## 2. Monorepo Layout
```text
contracts/      # Solidity contracts only
test/           # Contract, integration, and E2E tests
scripts/        # Deployment, simulation, and verification scripts
deployments/    # JSON manifests per chain ID
sdk/            # TypeScript SDK (viem-based)
docs/           # Documentation & AI protocol state
```

---

## 3. Strict Operating Workflow
1. **Source of Truth:**
   - Always read `AGENTS.md`, `CONTRIBUTING.md`, `docs/AI/GOAL.md`, `docs/AI/ARCHITECTURE.md`, `docs/AI/DECISIONS.md`, `docs/AI/TASK_INDEX.md`, and `docs/AI/SESSION_STATE.md` before making changes.
2. **One Task Per Session:**
   - Work strictly on the designated active task in `docs/AI/tasks/TASK-xxx.md`.
   - Never expand the scope or create unauthorized side features.
3. **Pre-Flight Plan:**
   - Before writing or modifying any code, output the formal `PRE-FLIGHT PLAN`.
4. **Implementation & Verification:**
   - Run real verification commands (`pnpm build`, `pnpm test`, `pnpm lint`).
   - Never claim tests pass without terminal execution output.
5. **Session Handover:**
   - Update `docs/AI/SESSION_STATE.md` and emit `SESSION HANDOVER` block at the end of every session.

---

## 4. Smart Contract & SDK Invariants
- **Asset Safety:** Checks-Effects-Interactions (CEI).
- **ERC-20:** Always use `SafeERC20`. No bare `transfer` or `transferFrom`.
- **SDK:** Contract ABI is the single source of truth. Always prioritize `simulate` -> `write`.
- **Deployment Safety:** No broadcasts to live testnet/mainnet without explicit user authorization.
