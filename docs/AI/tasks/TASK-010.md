# TASK-010: Contract Verification on Soneium Minato Blockscout

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009
- **Owner:** Session Lead
- **Scope:** Verify all deployed contracts from `deployments/soneium-minato-1946.json` on Soneium Minato Blockscout explorer (`https://soneium-minato.blockscout.com`), configure Hardhat verification settings, provide automated verification script, and verify on-chain source code status.

---

## Objective
1. **Hardhat Configuration Hardening**:
   - Update `hardhat.config.ts` to include `etherscan` configuration with `customChains` entry for `soneium-minato` (Chain ID 1946).
   - Configure apiURL (`https://soneium-minato.blockscout.com/api`) and browserURL (`https://soneium-minato.blockscout.com`).
   - Configure dummy apiKey for `soneium-minato` (Blockscout does not require auth key, dummy string accepted).
   - Disable sourcify fallback to avoid unnecessary timeout latency.
2. **Explorer & RPC Registry Alignment**:
   - Align `rpc.config.json` explorer URL for chain 1946 with canonical Blockscout domain `https://soneium-minato.blockscout.com`.
3. **Verification Pipeline Scripting**:
   - Create `scripts/verify-manifest.ts` capable of inspecting any deployment manifest (`deployments/<network>-<chainId>.json`) and programmatically verifying contracts using `hre.run("verify:verify", ...)`.
   - Add `npm run verify:minato` script to `package.json`.
4. **Execution & On-Chain Verification**:
   - Verify `TestUSDC` at `0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31`.
   - Verify `MoriusaTestNFT` at `0xc252a473DC466de3799149A2616ccc625832F40C` with constructor arguments `["Moriusa Main NFT Collection", "MORIUSA_NFT", "ipfs://bafybeic7vcmk2xxdv234bylg2n2q6o52kgh6tqu5i4w2p3yfxq6a2m4k6e/moriusa.json"]`.
   - Verify `MockSeaportV16` at `0xbae7B318A137b68eB78c1f22e5B59FcDf4d50E19`.
   - Query Blockscout API `getabi` for each contract to prove 100% verified status.
5. **Codebase Hygiene & Test Verification**:
   - Fix strict TypeScript cast in `test/unit/MoriusaAndUSDCTest.test.ts`.
   - Execute `pnpm build`, `pnpm test`, and `pnpm lint` with 0 failures.

---

## Allowed Files
### Create:
- `docs/AI/tasks/TASK-010.md`
- `scripts/verify-manifest.ts`

### Modify:
- `hardhat.config.ts`
- `rpc.config.json`
- `package.json`
- `test/unit/MoriusaAndUSDCTest.test.ts`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/SESSION_STATE.md`
