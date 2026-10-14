// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMintportERC1155
 * @notice Standard ERC-1155 multi-token collection with supply tracking, burning, custom errors, and owner controls.
 */
contract NFTMintportERC1155 is ERC1155Supply, ERC1155Burnable, Ownable {
    error ZeroAddressRecipient();
    error InvalidAmount();

    constructor(string memory uri_, address initialOwner) ERC1155(uri_) Ownable(initialOwner) {}

    /**
     * @notice Mints tokens of a specific ID.
     * @param to The recipient address.
     * @param id The token ID to mint.
     * @param amount The amount of tokens to mint.
     * @param data Additional arbitrary data passed to recipient.
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        if (to == address(0)) {
            revert ZeroAddressRecipient();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }

        _mint(to, id, amount, data);
    }

    /**
     * @notice Mints multiple token IDs in a single batch.
     * @param to The recipient address.
     * @param ids The token IDs to mint.
     * @param amounts The amounts for each token ID.
     * @param data Additional arbitrary data passed to recipient.
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyOwner {
        if (to == address(0)) {
            revert ZeroAddressRecipient();
        }
        if (ids.length == 0 || ids.length != amounts.length) {
            revert InvalidAmount();
        }
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) {
                revert InvalidAmount();
            }
        }

        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @notice Updates the base metadata URI.
     * @param newUri The new URI string.
     */
    function setURI(string memory newUri) external onlyOwner {
        _setURI(newUri);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }
}
