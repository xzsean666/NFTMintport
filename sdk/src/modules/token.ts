import type { PublicClient, WalletClient, Address, Hash, TransactionReceipt } from "viem";
import { TestMintTokenABI, TestMintTokenBytecode } from "../abi";
import type { MintTokenParams, TransactionExecutionResult } from "../types";

export interface TokenDeploymentResult {
  address: Address;
  hash: Hash;
  receipt: TransactionReceipt;
}

export interface ApproveParams {
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
}

export class TestTokenModule {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly walletClient?: WalletClient
  ) {}

  private requireWalletClient(): WalletClient {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error("WalletClient with an active account is required for write operations.");
    }
    return this.walletClient;
  }

  /**
   * Deploys a new TestMintToken contract.
   */
  async deploy(): Promise<TokenDeploymentResult> {
    const wallet = this.requireWalletClient();
    const hash = await wallet.deployContract({
      abi: TestMintTokenABI,
      bytecode: TestMintTokenBytecode,
      args: [],
      account: wallet.account!,
      chain: wallet.chain ?? null,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) {
      throw new Error("Deployment transaction finished without contract address.");
    }

    return {
      address: receipt.contractAddress,
      hash,
      receipt,
    };
  }

  /**
   * Mints test tokens with simulation-first write execution.
   */
  async mint(params: MintTokenParams): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    const { request } = await this.publicClient.simulateContract({
      address: params.tokenAddress,
      abi: TestMintTokenABI,
      functionName: "mint",
      args: [params.to, params.amount],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }

  /**
   * Reads ERC-20 token balance.
   */
  async getBalance(tokenAddress: Address, account: Address): Promise<bigint> {
    return await this.publicClient.readContract({
      address: tokenAddress,
      abi: TestMintTokenABI,
      functionName: "balanceOf",
      args: [account],
    });
  }

  /**
   * Reads ERC-20 allowance.
   */
  async getAllowance(tokenAddress: Address, owner: Address, spender: Address): Promise<bigint> {
    return await this.publicClient.readContract({
      address: tokenAddress,
      abi: TestMintTokenABI,
      functionName: "allowance",
      args: [owner, spender],
    });
  }

  /**
   * Approves a spender for an ERC-20 allowance with simulation-first execution.
   */
  async approve(params: ApproveParams): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    const { request } = await this.publicClient.simulateContract({
      address: params.tokenAddress,
      abi: TestMintTokenABI,
      functionName: "approve",
      args: [params.spender, params.amount],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }
}
