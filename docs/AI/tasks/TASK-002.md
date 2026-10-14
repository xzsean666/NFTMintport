# TASK-002: Smart Contracts & Unit Tests

## Metadata
- **Status:** DONE
- **Dependencies:** TASK-001
- **Owner:** Session Lead
- **Scope:** Implementation and unit testing of `TestMintToken.sol`, `NFTMintportERC721.sol`, and `NFTMintportERC1155.sol`.

---

## Objective
Implement core smart contracts adhering to OpenZeppelin v5, Checks-Effects-Interactions (CEI), custom errors, and complete Hardhat + viem unit tests.

### Contract Requirements:
1. `contracts/token/TestMintToken.sol`:
   - Standard ERC-20 with name `"NFTMintport Test Token"`, symbol `"NMTT"`.
   - Public permissionless `mint(address to, uint256 amount)` up to `MAX_MINT_PER_CALL = 1_000_000 ether`.
   - Custom errors: `ZeroAddressRecipient()`, `InvalidMintAmount()`, `ExceedsMaxMintPerCall(uint256 requested, uint256 maxAllowed)`.
   - Emits `TestTokenMinted(address indexed to, uint256 amount)` and standard ERC-20 `Transfer`.
2. `contracts/nft/NFTMintportERC721.sol`:
   - Inherits `ERC721URIStorage` and `Ownable`.
   - `mint(address to, string memory uri)` returning `uint256 tokenId`.
   - `burn(uint256 tokenId)` by token owner or approved operator.
   - Custom errors: `ZeroAddressRecipient()`, `EmptyTokenURI()`, `UnauthorizedCaller()`.
   - Emits `NFTMinted(address indexed to, uint256 indexed tokenId, string uri)`.
3. `contracts/nft/NFTMintportERC1155.sol`:
   - Inherits `ERC1155Supply` and `Ownable`.
   - `mint(address to, uint256 id, uint256 amount, bytes memory data)`.
   - `mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)`.
   - `setURI(string memory newUri)` owner-only.
   - Custom errors: `ZeroAddressRecipient()`, `InvalidAmount()`.

---

## Allowed Files
### Create:
- `contracts/token/TestMintToken.sol`
- `contracts/nft/NFTMintportERC721.sol`
- `contracts/nft/NFTMintportERC1155.sol`
- `test/unit/TestMintToken.test.ts`
- `test/unit/NFTMintportERC721.test.ts`
- `test/unit/NFTMintportERC1155.test.ts`

### Modify:
- None

---

## Acceptance Criteria
1. All contracts compile without warnings or errors with Solidity 0.8.24+.
2. Custom errors are used throughout (no string revert errors).
3. Zero-address recipients and invalid parameters properly revert with typed custom errors.
4. `TestMintToken.mint` permits public minting up to `1_000_000 ether` per transaction and reverts when exceeded.
5. All unit tests pass in `test/unit/` using Hardhat + viem.

---

## Verification Commands & Output
- `pnpm run build`: Compiled 36 Solidity files (evm target: cancun). Exit code 0.
- `pnpm run test`: 28 passing unit tests across TestMintToken, NFTMintportERC721, and NFTMintportERC1155. Exit code 0.
- `pnpm run lint`: Exit code 0 with zero TypeScript errors.

