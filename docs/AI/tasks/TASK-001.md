# TASK-001: Project Foundation & Monorepo Initialization

## Metadata
- **Status:** DONE
- **Dependencies:** None
- **Owner:** Session Lead
- **Scope:** Root monorepo configuration, pnpm setup, Hardhat + viem configuration, TypeScript configuration, directory structure.

---

## Objective
Establish the foundational monorepo scaffolding for NFTMintport according to the Universal Hardhat + SDK protocol:
- Use `pnpm` exclusively.
- Monorepo structure: `contracts/`, `test/`, `scripts/`, `deployments/`, `sdk/`, `docs/`.
- Hardhat setup with Solidity 0.8.24+, `@nomicfoundation/hardhat-toolbox-viem` or `@nomicfoundation/hardhat-viem`.
- TypeScript setup (`tsconfig.json`).
- OpenZeppelin Contracts v5.x dependency.
- Base build and test scripts in `package.json`.

---

## Allowed Files
### Create:
- `package.json`
- `pnpm-workspace.yaml` (if workspace packages are used, or root package config)
- `tsconfig.json`
- `hardhat.config.ts`
- `contracts/.gitkeep`
- `test/.gitkeep`
- `scripts/.gitkeep`
- `deployments/.gitkeep`
- `sdk/tsconfig.json`
- `sdk/package.json`

### Modify:
- None

---

## Acceptance Criteria
1. `pnpm install` completes without peer dependency conflicts.
2. `npx hardhat compile` succeeds on empty/base contract setup.
3. TypeScript configuration properly resolves types across root and `sdk/`.
4. Monorepo folder layout strictly contains:
   - `contracts/`
   - `test/`
   - `scripts/`
   - `deployments/`
   - `sdk/`
   - `docs/`
5. Prohibited libraries (`ethers.js`, `web3.js`, `forge/foundry`) are absent from dependencies.

---

## Verification Commands & Output
- `pnpm -v`: 11.14.0
- `pnpm install`: Clean exit code 0
- `pnpm run build`: Exit code 0 (`hardhat compile && pnpm --filter @nftmintport/sdk build`)
- `pnpm run test`: Exit code 0 (0 passing)
- `pnpm run lint`: Exit code 0 (`tsc --noEmit && pnpm --filter @nftmintport/sdk lint`)

