import { expect } from "chai";
import hre from "hardhat";
import { getAddress } from "viem";
import {
  resolveContractArgs,
  resolveConfigForNetwork,
  deployFromConfig,
} from "../../scripts/deploy-from-config";
import type { DeployConfig } from "../../deploy.config";

describe("Config-Driven Deployment Pipeline Unit Tests", () => {
  const dummyDeployer: `0x${string}` = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  describe("resolveContractArgs", () => {
    it("should append deployer address to NFTMintportERC721 when initialOwner omitted", () => {
      const resolved = resolveContractArgs(
        "NFTMintportERC721",
        ["MyCollection", "MC"],
        dummyDeployer
      );
      expect(resolved).to.deep.equal(["MyCollection", "MC", dummyDeployer]);
    });

    it("should preserve custom initialOwner for NFTMintportERC721 when provided", () => {
      const customOwner: `0x${string}` = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const resolved = resolveContractArgs(
        "NFTMintportERC721",
        ["MyCollection", "MC", customOwner],
        dummyDeployer
      );
      expect(resolved).to.deep.equal(["MyCollection", "MC", customOwner]);
    });

    it("should append deployer address to NFTMintportERC1155 when initialOwner omitted", () => {
      const resolved = resolveContractArgs(
        "NFTMintportERC1155",
        ["https://example.com/{id}.json"],
        dummyDeployer
      );
      expect(resolved).to.deep.equal(["https://example.com/{id}.json", dummyDeployer]);
    });

    it("should populate default args for TestMintNFT when empty args provided", () => {
      const resolved = resolveContractArgs("TestMintNFT", [], dummyDeployer);
      expect(resolved.length).to.equal(3);
      expect(resolved[0]).to.equal("NFTMintport Test NFT");
      expect(resolved[1]).to.equal("NMTNFT");
    });
  });

  describe("resolveConfigForNetwork", () => {
    it("should merge network overrides correctly", () => {
      const baseConfig: DeployConfig = {
        contracts: {
          TestMintNFT: { enabled: true },
          TestMintToken: { enabled: true },
        },
        networkOverrides: {
          mainnet: {
            contracts: {
              TestMintNFT: { enabled: false },
              TestMintToken: { enabled: false },
            },
          },
        },
      };

      const resolved = resolveConfigForNetwork(baseConfig, "mainnet", "mainnet");
      expect(resolved.contracts.TestMintNFT?.enabled).to.be.false;
      expect(resolved.contracts.TestMintToken?.enabled).to.be.false;
    });

    it("should leave base config unchanged if no network override applies", () => {
      const baseConfig: DeployConfig = {
        contracts: {
          TestMintNFT: { enabled: true },
        },
      };

      const resolved = resolveConfigForNetwork(baseConfig, "hardhat", "local");
      expect(resolved.contracts.TestMintNFT?.enabled).to.be.true;
    });
  });

  describe("deployFromConfig Execution", () => {
    it("should deploy only enabled contracts according to config", async () => {
      const customConfig: DeployConfig = {
        contracts: {
          TestMintNFT: {
            enabled: true,
            args: ["Config NFT", "CNFT", "ipfs://test-default"],
            testOnly: true,
          },
          TestMintToken: {
            enabled: false,
          },
          NFTMintportERC721: {
            enabled: false,
          },
          NFTMintportERC1155: {
            enabled: false,
          },
        },
      };

      const result = await deployFromConfig(customConfig);
      expect(result.manifest.contracts.TestMintNFT).to.be.ok;
      expect(result.manifest.contracts.TestMintToken).to.be.undefined;
      expect(result.manifest.contracts.NFTMintportERC721).to.be.undefined;
      expect(result.manifest.contracts.NFTMintportERC1155).to.be.undefined;

      const testNftAddress = result.manifest.contracts.TestMintNFT!.address;
      expect(testNftAddress).to.match(/^0x[a-fA-F0-9]{40}$/);

      // Verify the deployed contract is indeed TestMintNFT and allows permissionless minting
      const [deployer, alice] = await hre.viem.getWalletClients();
      const testNft = await hre.viem.getContractAt("TestMintNFT", testNftAddress as `0x${string}`, {
        client: { wallet: alice },
      });

      expect(await testNft.read.name()).to.equal("Config NFT");
      expect(await testNft.read.symbol()).to.equal("CNFT");

      // Permissionless mint
      await testNft.write.mint([alice.account.address]);
      expect(getAddress((await testNft.read.ownerOf([1n])) as string)).to.equal(
        getAddress(alice.account.address)
      );
      expect(await testNft.read.tokenURI([1n])).to.equal("ipfs://test-default");
    });
  });
});
