import type { PublicClient, WalletClient, Address, Hash, TransactionReceipt } from "viem";
import {
  NFTMintportERC721ABI,
  NFTMintportERC721Bytecode,
  NFTMintportERC1155ABI,
  NFTMintportERC1155Bytecode,
  TestMintNFTABI,
  TestMintNFTBytecode,
} from "../abi";
import type {
  DeployERC721Params,
  MintERC721Params,
  DeployERC1155Params,
  MintERC1155Params,
  MintBatchERC1155Params,
  DeployTestNFTParams,
  MintTestNFTParams,
  MintBatchTestNFTParams,
  TransactionExecutionResult,
} from "../types";

export interface DeploymentResult {
  address: Address;
  hash: Hash;
  receipt: TransactionReceipt;
}

export class NFTModule {
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
   * Deploys a new NFTMintportERC721 contract.
   */
  async deployERC721(params: DeployERC721Params): Promise<DeploymentResult> {
    const wallet = this.requireWalletClient();
    const hash = await wallet.deployContract({
      abi: NFTMintportERC721ABI,
      bytecode: NFTMintportERC721Bytecode,
      args: [params.name, params.symbol, params.initialOwner],
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
   * Mints an ERC-721 token with simulation-first write execution.
   */
  async mintERC721(params: MintERC721Params): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    // 1. Simulate transaction
    const { request } = await this.publicClient.simulateContract({
      address: params.nftAddress,
      abi: NFTMintportERC721ABI,
      functionName: "mint",
      args: [params.to, params.uri],
      account: wallet.account!,
    });

    // 2. Execute transaction
    const hash = await wallet.writeContract(request);

    // 3. Await receipt
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }

  /**
   * Reads the owner of a given ERC-721 token ID.
   */
  async getOwnerOf(nftAddress: Address, tokenId: bigint): Promise<Address> {
    return (await this.publicClient.readContract({
      address: nftAddress,
      abi: NFTMintportERC721ABI,
      functionName: "ownerOf",
      args: [tokenId],
    })) as Address;
  }

  /**
   * Reads tokenURI for a given ERC-721 token ID.
   */
  async getTokenURI(nftAddress: Address, tokenId: bigint): Promise<string> {
    return await this.publicClient.readContract({
      address: nftAddress,
      abi: NFTMintportERC721ABI,
      functionName: "tokenURI",
      args: [tokenId],
    });
  }

  /**
   * Deploys a new NFTMintportERC1155 contract.
   */
  async deployERC1155(params: DeployERC1155Params): Promise<DeploymentResult> {
    const wallet = this.requireWalletClient();
    const hash = await wallet.deployContract({
      abi: NFTMintportERC1155ABI,
      bytecode: NFTMintportERC1155Bytecode,
      args: [params.uri, params.initialOwner],
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
   * Mints ERC-1155 tokens with simulation-first write execution.
   */
  async mintERC1155(params: MintERC1155Params): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();
    const data = params.data ?? "0x";

    const { request } = await this.publicClient.simulateContract({
      address: params.nftAddress,
      abi: NFTMintportERC1155ABI,
      functionName: "mint",
      args: [params.to, params.id, params.amount, data],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }

  /**
   * Batch mints ERC-1155 tokens with simulation-first write execution.
   */
  async mintBatchERC1155(params: MintBatchERC1155Params): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();
    const data = params.data ?? "0x";

    const { request } = await this.publicClient.simulateContract({
      address: params.nftAddress,
      abi: NFTMintportERC1155ABI,
      functionName: "mintBatch",
      args: [params.to, params.ids, params.amounts, data],
      account: wallet.account!,
    });

    const hash = await wallet.writeContract(request);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }

  /**
   * Reads ERC-1155 balance for a given account and token ID.
   */
  async getBalanceOfERC1155(nftAddress: Address, account: Address, id: bigint): Promise<bigint> {
    return await this.publicClient.readContract({
      address: nftAddress,
      abi: NFTMintportERC1155ABI,
      functionName: "balanceOf",
      args: [account, id],
    });
  }

  /**
   * Reads ERC-1155 URI.
   */
  async getURIERC1155(nftAddress: Address, id: bigint = 1n): Promise<string> {
    return await this.publicClient.readContract({
      address: nftAddress,
      abi: NFTMintportERC1155ABI,
      functionName: "uri",
      args: [id],
    });
  }

  /**
   * Deploys a new TestMintNFT permissionless test collection.
   */
  async deployTestNFT(params: DeployTestNFTParams): Promise<DeploymentResult> {
    const wallet = this.requireWalletClient();
    const hash = await wallet.deployContract({
      abi: TestMintNFTABI,
      bytecode: TestMintNFTBytecode,
      args: [params.name, params.symbol, params.defaultURI],
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
   * Permissionless mint on TestMintNFT with simulation-first execution.
   */
  async mintTestNFT(params: MintTestNFTParams): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    let request;
    if (params.uri !== undefined) {
      const sim = await this.publicClient.simulateContract({
        address: params.nftAddress,
        abi: TestMintNFTABI,
        functionName: "mint",
        args: [params.to, params.uri],
        account: wallet.account!,
      });
      request = sim.request;
    } else {
      const sim = await this.publicClient.simulateContract({
        address: params.nftAddress,
        abi: TestMintNFTABI,
        functionName: "mint",
        args: [params.to],
        account: wallet.account!,
      });
      request = sim.request;
    }

    const hash = await wallet.writeContract(request as any);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }

  /**
   * Permissionless batch mint on TestMintNFT with simulation-first execution.
   */
  async mintBatchTestNFT(params: MintBatchTestNFTParams): Promise<TransactionExecutionResult> {
    const wallet = this.requireWalletClient();

    let request;
    if (params.uris) {
      const sim = await this.publicClient.simulateContract({
        address: params.nftAddress,
        abi: TestMintNFTABI,
        functionName: "mintBatch",
        args: [params.to, params.uris],
        account: wallet.account!,
      });
      request = sim.request;
    } else if (params.count !== undefined) {
      const sim = await this.publicClient.simulateContract({
        address: params.nftAddress,
        abi: TestMintNFTABI,
        functionName: "mintBatch",
        args: [params.to, params.count],
        account: wallet.account!,
      });
      request = sim.request;
    } else {
      throw new Error("Either count or uris array must be provided for mintBatchTestNFT.");
    }

    const hash = await wallet.writeContract(request as any);
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, receipt };
  }
}

