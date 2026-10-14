import hre from "hardhat";
import { formatEther } from "viem";
import {
  classifyNetwork,
  saveManifest,
  DeploymentManifest,
} from "./utils/manifest";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  const chainId = await publicClient.getChainId();
  const networkName = hre.network.name;
  const classification = classifyNetwork(chainId);

  console.log(`Starting deployment on ${networkName} (Chain ID: ${chainId}, ${classification.toUpperCase()})`);
  console.log(`Deployer: ${deployer.account.address}`);

  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log(`Deployer balance: ${formatEther(balance)} ETH`);

  // Mainnet guardrail
  if (classification === "mainnet") {
    if (process.env.ALLOW_TEST_TOKEN_ON_MAINNET !== "true") {
      throw new Error(
        "CRITICAL SAFETY REVERT: Deploying TestMintToken on mainnet is blocked by default. " +
        "Set ALLOW_TEST_TOKEN_ON_MAINNET=true if this is strictly intentional."
      );
    }
    console.warn("⚠️  Deploying on MAINNET with explicit override flag set.");
  }

  // 1. Deploy TestMintToken
  console.log("Deploying TestMintToken...");
  const testToken = await hre.viem.deployContract("TestMintToken");
  console.log(`TestMintToken deployed to: ${testToken.address}`);

  // 2. Deploy NFTMintportERC721
  const erc721Args: [string, string, `0x${string}`] = [
    "NFTMintport Collection",
    "NMP",
    deployer.account.address,
  ];
  console.log("Deploying NFTMintportERC721...");
  const erc721 = await hre.viem.deployContract("NFTMintportERC721", erc721Args);
  console.log(`NFTMintportERC721 deployed to: ${erc721.address}`);

  // 3. Deploy NFTMintportERC1155
  const erc1155Args: [string, `0x${string}`] = [
    "https://api.nftmintport.io/metadata/{id}.json",
    deployer.account.address,
  ];
  console.log("Deploying NFTMintportERC1155...");
  const erc1155 = await hre.viem.deployContract("NFTMintportERC1155", erc1155Args);
  console.log(`NFTMintportERC1155 deployed to: ${erc1155.address}`);

  // 4. Deploy TestMintNFT
  const testNftArgs: [string, string, string] = [
    "NFTMintport Test NFT",
    "NMTNFT",
    "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/default.json",
  ];
  console.log("Deploying TestMintNFT...");
  const testNft = await hre.viem.deployContract("TestMintNFT", testNftArgs);
  console.log(`TestMintNFT deployed to: ${testNft.address}`);

  // 5. Construct manifest
  const manifest: DeploymentManifest = {
    schemaVersion: "1.0.0",
    project: "NFTMintport",
    environment: classification,
    chainId,
    networkName,
    deployedAt: new Date().toISOString(),
    deployer: deployer.account.address,
    contracts: {
      TestMintToken: {
        address: testToken.address,
        testOnly: true,
      },
      TestMintNFT: {
        address: testNft.address,
        testOnly: true,
        args: [...testNftArgs],
      },
      NFTMintportERC721: {
        address: erc721.address,
        args: [...erc721Args],
      },
      NFTMintportERC1155: {
        address: erc1155.address,
        args: [...erc1155Args],
      },
      Seaport: {
        mode: "existing",
        version: "1.6",
        address: "0x0000000000000068F116a894984e2DB1123eB395",
        conduitController: "0x00000000F9490004C103FB2A09CE222342427011",
      },
    },
  };

  const savedPath = saveManifest(manifest);
  console.log(`Deployment manifest recorded to: ${savedPath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
