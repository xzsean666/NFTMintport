import {
  hashTypedData,
  zeroAddress,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hex,
} from "viem";
import { SEAPORT_V16_ADDRESS, NO_CONDUIT_KEY, SeaportV16ABI } from "../abi/SeaportV16";
import {
  ItemType,
  OrderType,
  type OrderComponents,
  type OrderParameters,
  type Order,
  type CreateListingParams,
} from "../types/seaport";

export const SEAPORT_EIP712_TYPES = {
  OrderComponents: [
    { name: "offerer", type: "address" },
    { name: "zone", type: "address" },
    { name: "offer", type: "OfferItem[]" },
    { name: "consideration", type: "ConsiderationItem[]" },
    { name: "orderType", type: "uint8" },
    { name: "startTime", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "zoneHash", type: "bytes32" },
    { name: "salt", type: "uint256" },
    { name: "conduitKey", type: "bytes32" },
    { name: "counter", type: "uint256" },
  ],
  OfferItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
  ],
  ConsiderationItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifierOrCriteria", type: "uint256" },
    { name: "startAmount", type: "uint256" },
    { name: "endAmount", type: "uint256" },
    { name: "recipient", type: "address" },
  ],
} as const;

export class OrdersModule {
  public readonly seaportAddress: Address;

  constructor(
    private readonly publicClient: PublicClient,
    seaportAddress?: Address
  ) {
    this.seaportAddress = seaportAddress ?? SEAPORT_V16_ADDRESS;
  }

  /**
   * Retrieves offerer's active counter on Seaport.
   */
  async getCounter(offerer: Address): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: this.seaportAddress,
        abi: SeaportV16ABI,
        functionName: "getCounter",
        args: [offerer],
      });
    } catch {
      return 0n;
    }
  }

  /**
   * Builds standardized Seaport OrderComponents for an NFT listing.
   */
  async createListing(params: CreateListingParams): Promise<OrderComponents> {
    const isCurrencyErc20 = Boolean(params.currency && params.currency !== zeroAddress);
    const considerationItemType = isCurrencyErc20 ? ItemType.ERC20 : ItemType.NATIVE;
    const considerationToken = isCurrencyErc20 ? params.currency! : zeroAddress;

    const offerItemType = params.is1155 ? ItemType.ERC1155 : ItemType.ERC721;
    const nftAmount = params.amount ?? 1n;

    const startTime = params.startTime ?? BigInt(Math.floor(Date.now() / 1000) - 60); // 60s in the past to prevent clock skew
    const duration = BigInt(params.durationSeconds ?? 86400 * 7);
    const endTime = startTime + duration;

    const counter = params.counter ?? (await this.getCounter(params.offerer));
    const salt = params.salt ?? BigInt(Math.floor(Math.random() * 1_000_000_000_000));

    return {
      offerer: params.offerer,
      zone: params.zone ?? zeroAddress,
      offer: [
        {
          itemType: offerItemType,
          token: params.nftAddress,
          identifierOrCriteria: params.tokenId,
          startAmount: nftAmount,
          endAmount: nftAmount,
        },
      ],
      consideration: [
        {
          itemType: considerationItemType,
          token: considerationToken,
          identifierOrCriteria: 0n,
          startAmount: params.price,
          endAmount: params.price,
          recipient: params.offerer,
        },
      ],
      orderType: OrderType.FULL_OPEN,
      startTime,
      endTime,
      zoneHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      salt,
      conduitKey: params.conduitKey ?? NO_CONDUIT_KEY,
      counter,
    };
  }

  /**
   * Converts OrderComponents to OrderParameters.
   */
  toOrderParameters(components: OrderComponents): OrderParameters {
    return {
      offerer: components.offerer,
      zone: components.zone,
      offer: components.offer,
      consideration: components.consideration,
      orderType: components.orderType,
      startTime: components.startTime,
      endTime: components.endTime,
      zoneHash: components.zoneHash,
      salt: components.salt,
      conduitKey: components.conduitKey,
      totalOriginalConsiderationItems: BigInt(components.consideration.length),
    };
  }

  /**
   * Computes deterministic EIP-712 order hash for Seaport v1.6.
   */
  async getOrderHash(components: OrderComponents, chainId?: number, seaportAddress?: Address): Promise<Hex> {
    const currentChainId = chainId ?? (await this.publicClient.getChainId());
    return hashTypedData({
      domain: {
        name: "Seaport",
        version: "1.6",
        chainId: currentChainId,
        verifyingContract: seaportAddress ?? this.seaportAddress,
      },
      types: SEAPORT_EIP712_TYPES,
      primaryType: "OrderComponents",
      message: components,
    });
  }

  /**
   * Signs Seaport OrderComponents using EIP-712 typed signing.
   */
  async signOrder(
    components: OrderComponents,
    walletClient: WalletClient,
    seaportAddress?: Address
  ): Promise<Hex> {
    if (!walletClient.account) {
      throw new Error("WalletClient must have an active account to sign orders.");
    }

    const chainId = await this.publicClient.getChainId();
    return await walletClient.signTypedData({
      account: walletClient.account,
      domain: {
        name: "Seaport",
        version: "1.6",
        chainId,
        verifyingContract: seaportAddress ?? this.seaportAddress,
      },
      types: SEAPORT_EIP712_TYPES,
      primaryType: "OrderComponents",
      message: components,
    });
  }

  /**
   * Helper to package components and signature into a standard Seaport Order struct.
   */
  buildOrder(components: OrderComponents, signature: Hex): Order {
    return {
      parameters: this.toOrderParameters(components),
      signature,
    };
  }
}
