import type { Address } from "viem";

export interface ContractDeploymentConfig<TArgs extends readonly unknown[] = readonly unknown[]> {
  /**
   * Whether to deploy this contract in the target run.
   */
  enabled: boolean;
  /**
   * Optional constructor arguments.
   * If omitted or partially omitted for owner parameters, the deployer address is automatically used.
   */
  args?: TArgs;
  /**
   * Marks this contract as test/mock infrastructure for non-mainnet environments.
   */
  testOnly?: boolean;
}

export interface SeaportConfig {
  mode: "existing" | "deployed";
  version: string;
  address: Address;
  conduitController: Address;
}

export interface DeployConfig {
  chainId?: number;
  isTest?: boolean;
  deploySeaport?: boolean;
  forceDeploySeaport?: boolean;
  contracts: {
    TestMintNFT?: ContractDeploymentConfig<[name: string, symbol: string, defaultURI: string]>;
    MoriusaTestNFT?: ContractDeploymentConfig<[name: string, symbol: string, defaultURI: string]>;
    TestMintToken?: ContractDeploymentConfig<[]>;
    TestUSDC?: ContractDeploymentConfig<[]>;
    NFTMintportERC721?: ContractDeploymentConfig<[name: string, symbol: string, initialOwner?: Address]>;
    NFTMintportERC1155?: ContractDeploymentConfig<[uri: string, initialOwner?: Address]>;
    [contractName: string]: ContractDeploymentConfig<any> | undefined;
  };
  seaport?: SeaportConfig;
  networkOverrides?: Record<string, Partial<DeployConfig>>;
}

/**
 * Default declarative deployment configuration for NFTMintport.
 * Customize contract toggles, arguments, and network overrides here.
 */
export const deployConfig: DeployConfig = {
  contracts: {
    // 1. Permissionless Test NFT (Anyone can mint)
    TestMintNFT: {
      enabled: true,
      args: [
        "NFTMintport Test NFT",
        "NMTNFT",
        "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/default.json",
      ],
      testOnly: true,
    },
    // 2. Permissionless Test ERC-20 Token
    TestMintToken: {
      enabled: true,
      args: [],
      testOnly: true,
    },
    // 3. Standards-compliant ERC-721 Collection
    NFTMintportERC721: {
      enabled: true,
      args: ["NFTMintport Collection", "NMP"],
    },
    // 4. Standards-compliant ERC-1155 Multi-Token Collection
    NFTMintportERC1155: {
      enabled: true,
      args: ["https://api.nftmintport.io/metadata/{id}.json"],
    },
  },
  seaport: {
    mode: "existing",
    version: "1.6",
    address: "0x0000000000000068F116a894984e2DB1123eB395",
    conduitController: "0x00000000F9490004C103FB2A09CE222342427011",
  },
  networkOverrides: {
    mainnet: {
      contracts: {
        TestMintNFT: {
          enabled: false,
          args: [
            "NFTMintport Test NFT",
            "NMTNFT",
            "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/default.json",
          ],
          testOnly: true,
        },
        TestMintToken: {
          enabled: false,
          args: [],
          testOnly: true,
        },
      },
    },
  },
};

export default deployConfig;
