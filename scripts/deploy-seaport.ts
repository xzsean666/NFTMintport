import hre from "hardhat";
import "@nomicfoundation/hardhat-toolbox-viem";
import { formatEther, getAddress } from "viem";
import {
  classifyNetwork,
  saveManifest,
  saveDeploymentRun,
  readManifest,
  getRpcForChain,
  DeploymentManifest,
  DeploymentRunRecord,
  SeaportRecord,
} from "./utils/manifest";
import { parseCliConfigPath, loadDeploymentConfig } from "./deploy-from-config";

export async function deploySeaportStandalone(configPath?: string | null): Promise<SeaportRecord> {
  const cfgPath = configPath ?? parseCliConfigPath();
  const loadedConfig = loadDeploymentConfig(cfgPath);

  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  const connectedChainId = await publicClient.getChainId();
  const targetChainId = loadedConfig.chainId ?? connectedChainId;

  // Validate RPC configuration
  const rpcInfo = getRpcForChain(targetChainId);
  const classification = classifyNetwork(targetChainId);

  console.log(`\n============================================================`);
  console.log(`NFTMintport Seaport Deployment & Check`);
  console.log(`Network: ${rpcInfo.name || hre.network.name} (Chain ID: ${targetChainId})`);
  console.log(`Deployer: ${deployer.account.address}`);
  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log(`Deployer balance: ${formatEther(balance)} ETH`);
  console.log(`============================================================\n`);

  const canonicalAddress: `0x${string}` = "0x0000000000000068F116a894984e2DB1123eB395";
  const conduitController: `0x${string}` = "0x00000000F9490004C103FB2A09CE222342427011";

  const bytecode = await publicClient.getBytecode({ address: canonicalAddress });
  let seaportRecord: SeaportRecord;
  const shouldForce = Boolean(
    loadedConfig.forceDeploySeaport || (loadedConfig.seaport as any)?.mode === "deployed"
  );

  if (!shouldForce && bytecode && bytecode !== "0x") {
    console.log(`✅ Canonical Seaport v1.6 is ALREADY deployed at: ${canonicalAddress}`);
    seaportRecord = {
      mode: "existing",
      version: "1.6",
      address: canonicalAddress,
      conduitController,
    };
  } else {
    console.log(`🚀 Deploying MockSeaportV16...`);
    const seaport = await hre.viem.deployContract("MockSeaportV16", []);
    console.log(`🎉 MockSeaportV16 successfully deployed to: ${seaport.address}`);
    seaportRecord = {
      mode: "deployed",
      version: "1.6",
      address: getAddress(seaport.address),
      conduitController,
    };
  }

  // Update existing manifest or create new
  const existingManifest = readManifest(hre.network.name, targetChainId);
  const timestamp = new Date().toISOString();

  const manifest: DeploymentManifest = existingManifest ?? {
    schemaVersion: "1.0.0",
    project: "NFTMintport",
    environment: classification,
    chainId: targetChainId,
    networkName: hre.network.name,
    deployedAt: timestamp,
    deployer: deployer.account.address,
    contracts: {},
  };

  manifest.contracts.Seaport = seaportRecord;
  const manifestPath = saveManifest(manifest);

  const runRecord: DeploymentRunRecord = {
    runId: `seaport-${targetChainId}-${Date.now()}`,
    timestamp,
    chainId: targetChainId,
    networkName: hre.network.name,
    environment: classification,
    isTest: loadedConfig.isTest ?? true,
    deployer: deployer.account.address,
    configSnapshot: { action: "deploy-seaport", targetChainId },
    contracts: {},
    seaport: seaportRecord,
  };
  const runPath = saveDeploymentRun(runRecord);

  console.log(`📦 Updated manifest: ${manifestPath}`);
  console.log(`📜 Recorded run log: ${runPath}\n`);

  return seaportRecord;
}

async function main() {
  await deploySeaportStandalone();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Seaport deployment failed:", error);
    process.exitCode = 1;
  });
}
