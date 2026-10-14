// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestMintToken
 * @notice Permissionless test ERC-20 token for NFTMintport testing and simulation workflows.
 * @dev Strict non-mainnet safeguards and per-call mint caps.
 */
contract TestMintToken is ERC20 {
    uint256 public constant MAX_MINT_PER_CALL = 1_000_000 ether;

    error ZeroAddressRecipient();
    error InvalidMintAmount();
    error ExceedsMaxMintPerCall(uint256 requested, uint256 maxAllowed);

    event TestTokenMinted(address indexed to, uint256 amount);

    constructor() ERC20("NFTMintport Test Token", "NMTT") {}

    /**
     * @notice Permissionless mint function for test environments.
     * @param to The recipient address.
     * @param amount The token amount to mint in wei.
     */
    function mint(address to, uint256 amount) external {
        if (to == address(0)) {
            revert ZeroAddressRecipient();
        }
        if (amount == 0) {
            revert InvalidMintAmount();
        }
        if (amount > MAX_MINT_PER_CALL) {
            revert ExceedsMaxMintPerCall(amount, MAX_MINT_PER_CALL);
        }

        _mint(to, amount);
        emit TestTokenMinted(to, amount);
    }
}
