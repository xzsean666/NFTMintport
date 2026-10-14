// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestUSDC
 * @notice Permissionless test USD Coin (USDC) with 6 decimals for Minato testnet simulation.
 * @dev Features test minting capabilities with safety limits per call.
 */
contract TestUSDC is ERC20 {
    uint8 private constant _DECIMALS = 6;
    uint256 public constant MAX_MINT_PER_CALL = 1_000_000 * 10**6; // 1,000,000 USDC

    error ZeroAddressRecipient();
    error InvalidMintAmount();
    error ExceedsMaxMintPerCall(uint256 requested, uint256 maxAllowed);

    event TestTokenMinted(address indexed to, uint256 amount);

    constructor() ERC20("USD Coin (Test)", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @notice Permissionless mint function for test environments.
     * @param to The recipient address.
     * @param amount The token amount to mint in smallest units (6 decimals).
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
