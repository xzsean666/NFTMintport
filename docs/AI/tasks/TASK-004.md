# TASK-004: TypeScript SDK Core & Contract Modules

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-002, TASK-003
- **Owner:** Session Lead
- **Scope:** TypeScript SDK foundation in `sdk/`, contract ABIs export, client initialization with `viem`, and NFT/Token business modules.

---

## Objective
Develop the core TypeScript SDK (`sdk/`) wrapping `viem` to provide clean, type-safe, business-level APIs for interacting with NFT collections and the test token, with simulation-first write calls.

### Key Requirements:
1. `sdk/src/client.ts`:
   - `NFTMintportClient` class accepting `publicClient` and optional `walletClient`.
   - Exposes sub-modules: `client.nft`, `client.token`.
2. `sdk/src/abi/`:
   - Typed contract ABIs generated from Hardhat artifacts:
     - `NFTMintportERC721ABI`
     - `NFTMintportERC1155ABI`
     - `TestMintTokenABI`
3. `sdk/src/modules/nft.ts`:
   - Methods: `deployERC721`, `mintERC721`, `getOwnerOf`, `getTokenURI`, `deployERC1155`, `mintERC1155`.
   - Simulates transaction before writing when `walletClient` is attached.
4. `sdk/src/modules/token.ts`:
   - Methods: `deploy`, `mint`, `getBalance`, `getAllowance`.
5. SDK Unit Tests:
   - `test/unit/sdk-modules.test.ts` testing SDK method calls with Hardhat viem clients.

---

## Allowed Files
### Create:
- `sdk/src/index.ts`
- `sdk/src/client.ts`
- `sdk/src/abi/index.ts`
- `sdk/src/abi/NFTMintportERC721.ts`
- `sdk/src/abi/NFTMintportERC1155.ts`
- `sdk/src/abi/TestMintToken.ts`
- `sdk/src/modules/nft.ts`
- `sdk/src/modules/token.ts`
- `sdk/src/types/index.ts`
- `test/unit/sdk-modules.test.ts`

### Modify:
- `sdk/package.json`
- `sdk/tsconfig.json`

---

## Acceptance Criteria
1. SDK compiles cleanly with TypeScript strict mode enabled (`tsc --noEmit` in `sdk/`).
2. `NFTMintportClient` can be instantiated with `viem` clients.
3. High-level methods (`client.nft.mintERC721`, `client.token.mint`) properly simulate then write transactions.
4. All SDK unit tests pass in Hardhat.

---

## Verification Commands & Output
- `pnpm --filter @nftmintport/sdk build`: Exit code 0
- `npx hardhat test test/unit/sdk-modules.test.ts`: 6 passing tests. Exit code 0
- `pnpm run test`: 34 passing tests. Exit code 0
- `pnpm run lint`: Exit code 0

