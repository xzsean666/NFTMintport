// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title TestMintNFT
 * @notice Permissionless test ERC-721 token collection for NFTMintport testing and simulation.
 * @dev Anyone can mint NFTs. Includes per-call caps, custom errors, and test metadata defaults.
 */
contract TestMintNFT is ERC721URIStorage {
    uint256 public constant MAX_MINT_PER_CALL = 50;

    uint256 private _nextTokenId = 1;
    string public defaultURI;

    error ZeroAddressRecipient();
    error EmptyTokenURI();
    error InvalidMintAmount();
    error ExceedsMaxMintPerCall(uint256 requested, uint256 maxAllowed);
    error UnauthorizedCaller();

    event TestNFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TestNFTBatchMinted(address indexed to, uint256 startTokenId, uint256 count);

    constructor(
        string memory name_,
        string memory symbol_,
        string memory defaultURI_
    ) ERC721(name_, symbol_) {
        defaultURI = defaultURI_;
    }

    /**
     * @notice Permissionless mint function using the collection's default token URI.
     * @param to The recipient address.
     * @return tokenId The minted token ID.
     */
    function mint(address to) external returns (uint256) {
        return mint(to, defaultURI);
    }

    /**
     * @notice Permissionless mint function with a custom token URI.
     * @param to The recipient address.
     * @param uri The metadata URI.
     * @return tokenId The minted token ID.
     */
    function mint(address to, string memory uri) public returns (uint256) {
        if (to == address(0)) {
            revert ZeroAddressRecipient();
        }
        if (bytes(uri).length == 0) {
            revert EmptyTokenURI();
        }

        uint256 tokenId = _nextTokenId++;
        _setTokenURI(tokenId, uri);
        _safeMint(to, tokenId);

        emit TestNFTMinted(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @notice Permissionless batch mint using default token URI.
     * @param to The recipient address.
     * @param count Number of tokens to mint.
     * @return tokenIds The minted token IDs.
     */
    function mintBatch(address to, uint256 count) external returns (uint256[] memory) {
        if (to == address(0)) {
            revert ZeroAddressRecipient();
        }
        if (count == 0) {
            revert InvalidMintAmount();
        }
        if (count > MAX_MINT_PER_CALL) {
            revert ExceedsMaxMintPerCall(count, MAX_MINT_PER_CALL);
        }
        if (bytes(defaultURI).length == 0) {
            revert EmptyTokenURI();
        }

        uint256[] memory tokenIds = new uint256[](count);
        uint256 startTokenId = _nextTokenId;

        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _setTokenURI(tokenId, defaultURI);
            _safeMint(to, tokenId);
            emit TestNFTMinted(to, tokenId, defaultURI);
        }

        emit TestNFTBatchMinted(to, startTokenId, count);
        return tokenIds;
    }

    /**
     * @notice Permissionless batch mint with an array of specific token URIs.
     * @param to The recipient address.
     * @param uris Array of metadata URIs.
     * @return tokenIds The minted token IDs.
     */
    function mintBatch(address to, string[] memory uris) external returns (uint256[] memory) {
        if (to == address(0)) {
            revert ZeroAddressRecipient();
        }
        uint256 count = uris.length;
        if (count == 0) {
            revert InvalidMintAmount();
        }
        if (count > MAX_MINT_PER_CALL) {
            revert ExceedsMaxMintPerCall(count, MAX_MINT_PER_CALL);
        }

        uint256[] memory tokenIds = new uint256[](count);
        uint256 startTokenId = _nextTokenId;

        for (uint256 i = 0; i < count; i++) {
            string memory uri = uris[i];
            if (bytes(uri).length == 0) {
                revert EmptyTokenURI();
            }
            uint256 tokenId = _nextTokenId++;
            tokenIds[i] = tokenId;
            _setTokenURI(tokenId, uri);
            _safeMint(to, tokenId);
            emit TestNFTMinted(to, tokenId, uri);
        }

        emit TestNFTBatchMinted(to, startTokenId, count);
        return tokenIds;
    }

    /**
     * @notice Burns an existing token. Restricted to owner or approved operator.
     * @param tokenId The token ID to burn.
     */
    function burn(uint256 tokenId) external {
        address tokenOwner = _ownerOf(tokenId);
        if (tokenOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }

        if (
            _msgSender() != tokenOwner &&
            !isApprovedForAll(tokenOwner, _msgSender()) &&
            getApproved(tokenId) != _msgSender()
        ) {
            revert UnauthorizedCaller();
        }

        _update(address(0), tokenId, _msgSender());
    }

    /**
     * @notice Returns total number of minted tokens in this collection.
     */
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
