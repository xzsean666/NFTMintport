import type { Address, Hex } from "viem";

export enum ItemType {
  NATIVE = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
  ERC721_WITH_CRITERIA = 4,
  ERC1155_WITH_CRITERIA = 5,
}

export enum OrderType {
  FULL_OPEN = 0,
  PARTIAL_OPEN = 1,
  FULL_RESTRICTED = 2,
  PARTIAL_RESTRICTED = 3,
  CONTRACT = 4,
}

export enum BasicOrderType {
  ETH_TO_ERC721_FULL_OPEN = 0,
  ETH_TO_ERC721_PARTIAL_OPEN = 1,
  ETH_TO_ERC721_FULL_RESTRICTED = 2,
  ETH_TO_ERC721_PARTIAL_RESTRICTED = 3,
  ETH_TO_ERC1155_FULL_OPEN = 4,
  ETH_TO_ERC1155_PARTIAL_OPEN = 5,
  ETH_TO_ERC1155_FULL_RESTRICTED = 6,
  ETH_TO_ERC1155_PARTIAL_RESTRICTED = 7,
  ERC20_TO_ERC721_FULL_OPEN = 8,
  ERC20_TO_ERC721_PARTIAL_OPEN = 9,
  ERC20_TO_ERC721_FULL_RESTRICTED = 10,
  ERC20_TO_ERC721_PARTIAL_RESTRICTED = 11,
  ERC20_TO_ERC1155_FULL_OPEN = 12,
  ERC20_TO_ERC1155_PARTIAL_OPEN = 13,
  ERC20_TO_ERC1155_FULL_RESTRICTED = 14,
  ERC20_TO_ERC1155_PARTIAL_RESTRICTED = 15,
}

export interface OfferItem {
  itemType: number;
  token: Address;
  identifierOrCriteria: bigint;
  startAmount: bigint;
  endAmount: bigint;
}

export interface ConsiderationItem {
  itemType: number;
  token: Address;
  identifierOrCriteria: bigint;
  startAmount: bigint;
  endAmount: bigint;
  recipient: Address;
}

export interface OrderComponents {
  offerer: Address;
  zone: Address;
  offer: OfferItem[];
  consideration: ConsiderationItem[];
  orderType: number;
  startTime: bigint;
  endTime: bigint;
  zoneHash: Hex;
  salt: bigint;
  conduitKey: Hex;
  counter: bigint;
}

export interface OrderParameters {
  offerer: Address;
  zone: Address;
  offer: OfferItem[];
  consideration: ConsiderationItem[];
  orderType: number;
  startTime: bigint;
  endTime: bigint;
  zoneHash: Hex;
  salt: bigint;
  conduitKey: Hex;
  totalOriginalConsiderationItems: bigint;
}

export interface Order {
  parameters: OrderParameters;
  signature: Hex;
}

export interface AdvancedOrder {
  parameters: OrderParameters;
  numerator: bigint;
  denominator: bigint;
  signature: Hex;
  extraData: Hex;
}

export interface CreateListingParams {
  offerer: Address;
  nftAddress: Address;
  tokenId: bigint;
  price: bigint;
  currency?: Address;
  is1155?: boolean;
  amount?: bigint;
  startTime?: bigint;
  durationSeconds?: number;
  zone?: Address;
  conduitKey?: Hex;
  counter?: bigint;
  salt?: bigint;
}
