// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMintportERC721
 * @notice Standard ERC-721 implementation with URI storage, custom errors, and mint controls.
 */
contract NFTMintportERC721 is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    error ZeroAddressRecipient();
    error EmptyTokenURI();
    error UnauthorizedCaller();

    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {}

    /**
     * @notice Mints a new NFT with an explicit token URI.
     * @param to The recipient address.
     * @param uri The token metadata URI.
     * @return tokenId The minted token ID.
     */
    function mint(address to, string memory uri) external onlyOwner returns (uint256) {
        if (to == address(0)) {
            revert ZeroAddressRecipient();
        }
        if (bytes(uri).length == 0) {
            revert EmptyTokenURI();
        }

        uint256 tokenId = _nextTokenId++;
        _setTokenURI(tokenId, uri);
        _safeMint(to, tokenId);

        emit NFTMinted(to, tokenId, uri);
        return tokenId;
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
}
