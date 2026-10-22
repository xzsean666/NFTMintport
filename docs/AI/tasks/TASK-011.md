# TASK-011: Enhanced Selective Contract Verification Tooling

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010
- **Owner:** Session Lead
- **Scope:** Provide a flexible and selective contract verification CLI and library (`scripts/verify.ts`), enabling verification by individual contract address, verification from deployment configs/manifests, and selective inclusion/exclusion controls (`--only`, `--exclude`, and `"verify": false` / `"skipVerify": true` config flags) to keep proprietary contracts unverified/unexposed.

---

## Objective
1. **Direct Single Contract Verification**:
   - Support verifying any single contract by address (`--address 0x...` or positional `0x...`).
   - Allow specifying contract name via `--contract <Name>` or auto-detecting matching contract names from build-info artifacts.
   - Support optional constructor arguments via `--args <json or comma-list>`.
2. **Config-Driven & Manifest-Driven Verification**:
   - Support `--config <path>` to verify deployed contracts defined in a deployment configuration file (`deploy.config.json`, `deploy.minato.config.json`, etc.).
   - Support `--manifest <path>` (or shorthand network name like `soneium-minato`) to verify contracts from deployment manifests.
3. **Selective Exclusion & Privacy Controls ("有的合约我不要开源这种")**:
   - Add CLI filter `--only <name1,name2,...>` to verify only explicitly targeted contracts.
   - Add CLI filter `--exclude <name1,name2,...>` (alias `--skip`) to skip contracts that should not be verified or open-sourced.
   - Add config/manifest property support: if a contract definition has `"verify": false` or `"skipVerify": true`, the verification tool will automatically skip it with a clear notice.
4. **Dry-Run Inspection**:
   - Support `--dry-run` to preview which contracts would be verified and which would be skipped.
5. **Backwards Compatibility & Package Scripts**:
   - Implement `scripts/verify.ts` and maintain `scripts/verify-manifest.ts` as a backwards-compatible delegate.
   - Configure `"verify"` script in `package.json` for ergonomic invocation.
6. **Test Coverage & Verification**:
   - Write comprehensive unit tests in `test/unit/verify-cli.test.ts` validating all CLI parsing branches, filtering logic, and config exclusion flags.
   - Verify 100% test pass rate and 0 lint errors across workspace.

---

## Allowed Files
### Create:
- `docs/AI/tasks/TASK-011.md`
- `scripts/verify.ts`
- `test/unit/verify-cli.test.ts`

### Modify:
- `scripts/verify-manifest.ts`
- `package.json`
- `docs/MINATO_EXPLORER_GUIDE.md`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/SESSION_STATE.md`
