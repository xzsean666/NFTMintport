// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IERC1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

/**
 * @title MockSeaportV16
 * @notice Lightweight, standards-compliant Seaport v1.6 mock for local and custom EVM testnets.
 * @dev Emits Seaport-compatible events and verifies EIP-712 hashes and settlements.
 */
contract MockSeaportV16 {
    enum ItemType { NATIVE, ERC20, ERC721, ERC1155, ERC721_WITH_CRITERIA, ERC1155_WITH_CRITERIA }
    enum OrderType { FULL_OPEN, PARTIAL_OPEN, FULL_RESTRICTED, PARTIAL_RESTRICTED, CONTRACT }

    struct OfferItem {
        ItemType itemType;
        address token;
        uint256 identifierOrCriteria;
        uint256 startAmount;
        uint256 endAmount;
    }

    struct ConsiderationItem {
        ItemType itemType;
        address token;
        uint256 identifierOrCriteria;
        uint256 startAmount;
        uint256 endAmount;
        address payable recipient;
    }

    struct OrderComponents {
        address offerer;
        address zone;
        OfferItem[] offer;
        ConsiderationItem[] consideration;
        OrderType orderType;
        uint256 startTime;
        uint256 endTime;
        bytes32 zoneHash;
        uint256 salt;
        bytes32 conduitKey;
        uint256 counter;
    }

    struct OrderParameters {
        address offerer;
        address zone;
        OfferItem[] offer;
        ConsiderationItem[] consideration;
        OrderType orderType;
        uint256 startTime;
        uint256 endTime;
        bytes32 zoneHash;
        uint256 salt;
        bytes32 conduitKey;
        uint256 totalOriginalConsiderationItems;
    }

    struct Order {
        OrderParameters parameters;
        bytes signature;
    }

    struct OrderStatus {
        bool isValidated;
        bool isCancelled;
        uint256 totalFilled;
        uint256 totalSize;
    }

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant OFFER_ITEM_TYPEHASH = keccak256("OfferItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)");
    bytes32 private constant CONSIDERATION_ITEM_TYPEHASH = keccak256("ConsiderationItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)");
    bytes32 private constant ORDER_COMPONENTS_TYPEHASH = keccak256("OrderComponents(address offerer,address zone,OfferItem[] offer,ConsiderationItem[] consideration,uint8 orderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 conduitKey,uint256 counter)ConsiderationItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)OfferItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)");

    mapping(address => uint256) public counters;
    mapping(bytes32 => OrderStatus) public orderStatus;

    error OrderNotYetActive();
    error OrderExpired();
    error OrderIsCancelled();
    error OrderAlreadyFilled();
    error InsufficientValue();
    error TransferFailed();
    error UnauthorizedCaller();
    error InvalidSignature();

    event OrderFulfilled(
        bytes32 orderHash,
        address indexed offerer,
        address indexed zone,
        address recipient,
        OfferItem[] offer,
        ConsiderationItem[] consideration
    );

    event OrderCancelled(
        bytes32 orderHash,
        address indexed offerer,
        address indexed zone
    );

    event CounterIncremented(
        uint256 newCounter,
        address indexed offerer
    );

    function name() external pure returns (string memory) {
        return "Seaport";
    }

    function getCounter(address offerer) external view returns (uint256) {
        return counters[offerer];
    }

    function incrementCounter() external returns (uint256 newCounter) {
        newCounter = ++counters[msg.sender];
        emit CounterIncremented(newCounter, msg.sender);
    }

    function getOrderStatus(bytes32 orderHash) external view returns (
        bool isValidated,
        bool isCancelled,
        uint256 totalFilled,
        uint256 totalSize
    ) {
        OrderStatus memory status = orderStatus[orderHash];
        return (status.isValidated, status.isCancelled, status.totalFilled, status.totalSize);
    }

    function _hashOffer(OfferItem[] memory offer) internal pure returns (bytes32) {
        bytes32[] memory itemHashes = new bytes32[](offer.length);
        for (uint256 i = 0; i < offer.length; i++) {
            itemHashes[i] = keccak256(abi.encode(
                OFFER_ITEM_TYPEHASH,
                offer[i].itemType,
                offer[i].token,
                offer[i].identifierOrCriteria,
                offer[i].startAmount,
                offer[i].endAmount
            ));
        }
        return keccak256(abi.encodePacked(itemHashes));
    }

    function _hashConsideration(ConsiderationItem[] memory consideration) internal pure returns (bytes32) {
        bytes32[] memory itemHashes = new bytes32[](consideration.length);
        for (uint256 i = 0; i < consideration.length; i++) {
            itemHashes[i] = keccak256(abi.encode(
                CONSIDERATION_ITEM_TYPEHASH,
                consideration[i].itemType,
                consideration[i].token,
                consideration[i].identifierOrCriteria,
                consideration[i].startAmount,
                consideration[i].endAmount,
                consideration[i].recipient
            ));
        }
        return keccak256(abi.encodePacked(itemHashes));
    }

    function getOrderHash(OrderComponents memory order) public view returns (bytes32) {
        bytes32 domainSeparator = keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
            keccak256("Seaport"),
            keccak256("1.6"),
            block.chainid,
            address(this)
        ));

        bytes32 structHash = keccak256(abi.encode(
            ORDER_COMPONENTS_TYPEHASH,
            order.offerer,
            order.zone,
            _hashOffer(order.offer),
            _hashConsideration(order.consideration),
            order.orderType,
            order.startTime,
            order.endTime,
            order.zoneHash,
            order.salt,
            order.conduitKey,
            order.counter
        ));

        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }

    function _deriveOrderHash(OrderParameters memory params) internal view returns (bytes32) {
        OrderComponents memory comp = OrderComponents({
            offerer: params.offerer,
            zone: params.zone,
            offer: params.offer,
            consideration: params.consideration,
            orderType: params.orderType,
            startTime: params.startTime,
            endTime: params.endTime,
            zoneHash: params.zoneHash,
            salt: params.salt,
            conduitKey: params.conduitKey,
            counter: counters[params.offerer]
        });
        return getOrderHash(comp);
    }

    function fulfillOrder(Order calldata order, bytes32) external payable returns (bool) {
        if (block.timestamp < order.parameters.startTime) {
            revert OrderNotYetActive();
        }
        if (block.timestamp > order.parameters.endTime) {
            revert OrderExpired();
        }

        bytes32 orderHash = _deriveOrderHash(order.parameters);
        OrderStatus storage status = orderStatus[orderHash];

        if (status.isCancelled) {
            revert OrderIsCancelled();
        }
        if (status.totalFilled > 0 && status.totalFilled == status.totalSize) {
            revert OrderAlreadyFilled();
        }

        // Verify offerer signature if caller is not the offerer
        if (msg.sender != order.parameters.offerer) {
            bytes memory sig = order.signature;
            if (sig.length != 65) {
                revert InvalidSignature();
            }
            bytes32 r;
            bytes32 s;
            uint8 v;
            assembly {
                r := mload(add(sig, 0x20))
                s := mload(add(sig, 0x40))
                v := byte(0, mload(add(sig, 0x60)))
            }
            if (v < 27) {
                v += 27;
            }
            address recovered = ecrecover(orderHash, v, r, s);
            if (recovered == address(0) || recovered != order.parameters.offerer) {
                revert InvalidSignature();
            }
        }

        // Checks-Effects: Update state BEFORE external interactions (CEI)
        status.isValidated = true;
        status.totalFilled = 1;
        status.totalSize = 1;

        // Verify total native ETH required across consideration items
        uint256 totalNativeValue = 0;
        for (uint256 i = 0; i < order.parameters.consideration.length; i++) {
            if (order.parameters.consideration[i].itemType == ItemType.NATIVE) {
                totalNativeValue += order.parameters.consideration[i].startAmount;
            }
        }
        if (msg.value < totalNativeValue) {
            revert InsufficientValue();
        }

        // Interactions: Settle consideration
        for (uint256 i = 0; i < order.parameters.consideration.length; i++) {
            ConsiderationItem calldata item = order.parameters.consideration[i];
            if (item.itemType == ItemType.NATIVE) {
                (bool sent, ) = item.recipient.call{value: item.startAmount}("");
                if (!sent) revert TransferFailed();
            } else if (item.itemType == ItemType.ERC20) {
                bool ok = IERC20(item.token).transferFrom(msg.sender, item.recipient, item.startAmount);
                if (!ok) revert TransferFailed();
            }
        }

        // Interactions: Transfer offer items
        for (uint256 i = 0; i < order.parameters.offer.length; i++) {
            OfferItem calldata item = order.parameters.offer[i];
            if (item.itemType == ItemType.ERC721) {
                IERC721(item.token).transferFrom(order.parameters.offerer, msg.sender, item.identifierOrCriteria);
            } else if (item.itemType == ItemType.ERC1155) {
                IERC1155(item.token).safeTransferFrom(order.parameters.offerer, msg.sender, item.identifierOrCriteria, item.startAmount, "");
            }
        }

        // Interactions: Refund excess native value to caller
        if (msg.value > totalNativeValue) {
            (bool refunded, ) = msg.sender.call{value: msg.value - totalNativeValue}("");
            if (!refunded) revert TransferFailed();
        }

        emit OrderFulfilled(
            orderHash,
            order.parameters.offerer,
            order.parameters.zone,
            msg.sender,
            order.parameters.offer,
            order.parameters.consideration
        );

        return true;
    }

    function cancel(OrderComponents[] calldata orders) external returns (bool) {
        for (uint256 i = 0; i < orders.length; i++) {
            if (orders[i].offerer != msg.sender) {
                revert UnauthorizedCaller();
            }
            bytes32 orderHash = getOrderHash(orders[i]);
            orderStatus[orderHash].isCancelled = true;
            emit OrderCancelled(orderHash, orders[i].offerer, orders[i].zone);
        }
        return true;
    }
}
