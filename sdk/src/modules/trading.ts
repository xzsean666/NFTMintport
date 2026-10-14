import {
  maxUint256,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hex,
  type TransactionReceipt,
} from "viem";
import { SEAPORT_V16_ADDRESS, NO_CONDUIT_KEY, SeaportV16ABI } from "../abi/SeaportV16";
import { NFTMintportERC721ABI, TestMintTokenABI } from "../abi";
import { ItemType, type Order, type OrderComponents } from "../types/seaport";
import type { TransactionExecutionResult } from "../types";

export interface ApprovalCheckResult {
  needed: boolean;
  hash?: Hex;
  receipt?: TransactionReceipt;
}

export class TradingModule {
  public readonly seaportAddress: Address;

  constructor(
    private readonly publicClient: PublicClient,
    private readonly walletClient?: WalletClient,
    seaportAddress?: Address
  ) {
    this.seaportAddress = seaportAddress ?? SEAPORT_V16_ADDRESS;
  }

  private requireWalletClient(): WalletClient {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error("WalletClient with an active account is required for write operations.");
    }
    return this.walletClient;
  }

  /**
   * Checks if operator is approved for all NFTs and submits approval if not.
   */
  async checkAndApproveNFT(
    nftAddress: Address,
    operator: Address = this.seaportAddress
  ): Promise<ApprovalCheckResult> {
    const wallet = this.requireWalletClient();
    const owner = wallet.account!.address;

    const isApproved = await this.publicClient.readContract({
      address: nftAddress,
      abi: NFTMintportERC721ABI,
      functionName: "isApprovedForAll",
      args: [owner, operator],
    });

    if (isApproved) {
      return { needed: false };
    }

    const { request } = await this.publicClient.simulateContract({
      address: nftAddress,
      abi: NFTMintportERC721ABI,
      functionName: "setApprovalForAll",
      args: [operator, true],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { needed: true, hash, receipt };
  }

  /**
   * Checks if spender has sufficient ERC-20 allowance and submits approval if not.
   */
  async checkAndApproveToken(
    tokenAddress: Address,
    amount: bigint,
    spender: Address = this.seaportAddress
  ): Promise<ApprovalCheckResult> {
    const wallet = this.requireWalletClient();
    const owner = wallet.account!.address;

    const allowance = await this.publicClient.readContract({
      address: tokenAddress,
      abi: TestMintTokenABI,
      functionName: "allowance",
      args: [owner, spender],
    });

    if (allowance >= amount) {
      return { needed: false };
    }

    const { request } = await this.publicClient.simulateContract({
      address: tokenAddress,
      abi: TestMintTokenABI,
      functionName: "approve",
      args: [spender, maxUint256],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { needed: true, hash, receipt };
  }

  /**
   * Calculates required native ETH value to fulfill order.
   */
  calculateRequiredNativeValue(order: Order): bigint {
    return order.parameters.consideration
      .filter((item) => item.itemType === ItemType.NATIVE)
      .reduce((sum, item) => sum + item.startAmount, 0n);
  }

  /**
   * Simulates fulfilling an order on Seaport v1.6.
   */
  async simulateFulfill(order: Order, fulfillerConduitKey: Hex = NO_CONDUIT_KEY) {
    const wallet = this.requireWalletClient();
    const value = this.calculateRequiredNativeValue(order);

    return await this.publicClient.simulateContract({
      address: this.seaportAddress,
      abi: SeaportV16ABI,
      functionName: "fulfillOrder",
      args: [order, fulfillerConduitKey],
      account: wallet.account!,
      value,
    });
  }

  /**
   * Executes order fulfillment with simulation-first safety.
   */
  async fulfillOrder(
    order: Order,
    fulfillerConduitKey: Hex = NO_CONDUIT_KEY
  ): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    // 1. Simulate
    const { request } = await this.simulateFulfill(order, fulfillerConduitKey);

    // 2. Execute
    const hash = await wallet.writeContract(request);

    // 3. Receipt
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }

  /**
   * Cancels open orders on-chain via Seaport v1.6.
   */
  async cancelOrder(components: OrderComponents[]): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    const { request } = await this.publicClient.simulateContract({
      address: this.seaportAddress,
      abi: SeaportV16ABI,
      functionName: "cancel",
      args: [components],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }

  /**
   * Increments the offerer's active counter on Seaport, cancelling all active open orders in one transaction.
   */
  async incrementCounter(): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    const { request } = await this.publicClient.simulateContract({
      address: this.seaportAddress,
      abi: SeaportV16ABI,
      functionName: "incrementCounter",
      args: [],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }
}
