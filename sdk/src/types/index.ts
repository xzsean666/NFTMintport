import type { Address, Hash, TransactionReceipt } from "viem";

export type { Address, Hash, TransactionReceipt };

export interface DeployERC721Params {
  name: string;
  symbol: string;
  initialOwner: Address;
}

export interface MintERC721Params {
  nftAddress: Address;
  to: Address;
  uri: string;
}

export interface DeployERC1155Params {
  uri: string;
  initialOwner: Address;
}

export interface MintERC1155Params {
  nftAddress: Address;
  to: Address;
  id: bigint;
  amount: bigint;
  data?: `0x${string}`;
}

export interface MintBatchERC1155Params {
  nftAddress: Address;
  to: Address;
  ids: bigint[];
  amounts: bigint[];
  data?: `0x${string}`;
}

export interface MintTokenParams {
  tokenAddress: Address;
  to: Address;
  amount: bigint;
}

export interface DeployTestNFTParams {
  name: string;
  symbol: string;
  defaultURI: string;
}

export interface MintTestNFTParams {
  nftAddress: Address;
  to: Address;
  uri?: string;
}

export interface MintBatchTestNFTParams {
  nftAddress: Address;
  to: Address;
  count?: bigint;
  uris?: string[];
}

export interface TransactionExecutionResult {
  hash: Hash;
  receipt: TransactionReceipt;
}

