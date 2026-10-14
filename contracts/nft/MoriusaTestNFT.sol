// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TestMintNFT} from "./TestMintNFT.sol";

/**
 * @title MoriusaTestNFT
 * @notice Permissionless test Moriusa NFT collection for Soneium Minato testnet testing and simulation.
 * @dev Anyone can mint NFTs for Soneium Season 1 points testing (Buy / Hold / Trade).
 */
contract MoriusaTestNFT is TestMintNFT {
    constructor(
        string memory name_,
        string memory symbol_,
        string memory defaultURI_
    )
        TestMintNFT(
            bytes(name_).length > 0 ? name_ : "Moriusa Main NFT Collection",
            bytes(symbol_).length > 0 ? symbol_ : "MORIUSA_NFT",
            bytes(defaultURI_).length > 0
                ? defaultURI_
                : "ipfs://bafybeic7vcmk2xxdv234bylg2n2q6o52kgh6tqu5i4w2p3yfxq6a2m4k6e/moriusa.json"
        )
    {}
}
