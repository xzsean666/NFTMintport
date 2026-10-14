import hre from "hardhat";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as fs from "fs";
import * as path from "path";
import { formatEther, getAddress } from "viem";
import {
  classifyNetwork,
  readManifest,
  saveManifest,
  saveDeploymentRun,
  getRpcForChain,
  DeploymentManifest,
  DeploymentRunRecord,
  ContractDeploymentRecord,
  SeaportRecord,
} from "./utils/manifest";
import defaultDeployConfig, { DeployConfig } from "../deploy.config";

export interface DeployResult {
  manifest: DeploymentManifest;
  manifestPath: string;
  runRecord: DeploymentRunRecord;
  runPath: string;
}

export interface UniversalDeployConfig {
  chainId?: number;
  isTest?: boolean;
  deploySeaport?: boolean;
  forceDeploySeaport?: boolean;
  contracts: {
    [contractName: string]: {
      enabled: boolean;
      args?: unknown[];
      testOnly?: boolean;
    } | undefined;
  };
  seaport?: {
    mode?: "existing" | "deployed";
    version?: string;
    address?: `0x${string}`;
    conduitController?: `0x${string}`;
  };
  networkOverrides?: Record<string, Partial<UniversalDeployConfig>>;
}

/**
 * Parses --config <file> from command line arguments.
 */
export function parseCliConfigPath(argv = process.argv): string | null {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--config" || argv[i] === "-c") {
      return argv[i + 1] || null;
    }
    if (argv[i].startsWith("--config=")) {
      return argv[i].split("=")[1];
    }
  }
  return null;
}

/**
 * Loads and parses deployment configuration from a JSON or TS file.
 */
export function loadDeploymentConfig(specifiedPath?: string | null): UniversalDeployConfig {
  const cliPath = specifiedPath ?? parseCliConfigPath() ?? process.env.DEPLOY_CONFIG;

  if (cliPath) {
    const resolvedPath = path.resolve(process.cwd(), cliPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Deployment config file not found: ${resolvedPath}`);
    }
    console.log(`📄 Loading deployment configuration from: ${resolvedPath}`);
    if (resolvedPath.endsWith(".json")) {
      const raw = fs.readFileSync(resolvedPath, "utf8");
      return JSON.parse(raw) as UniversalDeployConfig;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(resolvedPath);
    return (mod.default || mod.deployConfig || mod) as UniversalDeployConfig;
  }

  // Fallback 1: deploy.config.json if present
  const defaultJsonPath = path.resolve(process.cwd(), "deploy.config.json");
  if (fs.existsSync(defaultJsonPath)) {
    console.log(`📄 Loading default JSON deployment configuration from: ${defaultJsonPath}`);
    const raw = fs.readFileSync(defaultJsonPath, "utf8");
    return JSON.parse(raw) as UniversalDeployConfig;
  }

  // Fallback 2: deploy.config.ts
  return defaultDeployConfig as UniversalDeployConfig;
}

/**
 * Resolves constructor arguments for a contract, injecting defaults like deployer address when applicable.
 */
export function resolveContractArgs(
  contractName: string,
  configuredArgs: unknown[] | undefined,
  deployerAddress: `0x${string}`
): unknown[] {
  const args = configuredArgs ? [...configuredArgs] : [];

  switch (contractName) {
    case "NFTMintportERC721": {
      // Expected args: [name, symbol, initialOwner]
      if (args.length === 2) {
        args.push(deployerAddress);
      }
      break;
    }
    case "NFTMintportERC1155": {
      // Expected args: [uri, initialOwner]
      if (args.length === 1) {
        args.push(deployerAddress);
      }
      break;
    }
    case "TestMintNFT": {
      // Expected args: [name, symbol, defaultURI]
      if (args.length === 0) {
        args.push(
          "NFTMintport Test NFT",
          "NMTNFT",
          "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/default.json"
        );
      }
      break;
    }
    case "MoriusaTestNFT": {
      // Expected args: [name, symbol, defaultURI]
      if (args.length === 0) {
        args.push(
          "Moriusa Main NFT Collection",
          "MORIUSA_NFT",
          "ipfs://bafybeic7vcmk2xxdv234bylg2n2q6o52kgh6tqu5i4w2p3yfxq6a2m4k6e/moriusa.json"
        );
      }
      break;
    }
    case "TestMintToken":
    case "TestUSDC": {
      // Expected args: []
      break;
    }
  }

  return args;
}

/**
 * Merges base deploy configuration with network-specific overrides.
 */
export function resolveConfigForNetwork(
  baseConfig: UniversalDeployConfig,
  networkName: string,
  classification: string
): UniversalDeployConfig {
  const resolved: UniversalDeployConfig = {
    ...baseConfig,
    contracts: { ...baseConfig.contracts },
    seaport: baseConfig.seaport ? { ...baseConfig.seaport } : undefined,
  };

  const overrides =
    baseConfig.networkOverrides?.[networkName] ??
    baseConfig.networkOverrides?.[classification];

  if (overrides) {
    if (overrides.contracts) {
      for (const [key, val] of Object.entries(overrides.contracts)) {
        if (val) {
          resolved.contracts[key] = {
            ...resolved.contracts[key],
            ...val,
          };
        }
      }
    }
    if (overrides.seaport) {
      resolved.seaport = { ...resolved.seaport, ...overrides.seaport } as any;
    }
    if (overrides.isTest !== undefined) {
      resolved.isTest = overrides.isTest;
    }
    if (overrides.deploySeaport !== undefined) {
      resolved.deploySeaport = overrides.deploySeaport;
    }
    if (overrides.forceDeploySeaport !== undefined) {
      resolved.forceDeploySeaport = overrides.forceDeploySeaport;
    }
  }

  return resolved;
}

/**
 * Core config-driven deployment execution function.
 */
export async function deployFromConfig(
  customConfig?: UniversalDeployConfig,
  explicitConfigPath?: string | null
): Promise<DeployResult> {
  const rawConfig = customConfig ?? loadDeploymentConfig(explicitConfigPath);

  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  const connectedChainId = await publicClient.getChainId();
  const targetChainId = rawConfig.chainId ?? connectedChainId;

  // 1. Validate RPC registry for targetChainId
  const rpcInfo = getRpcForChain(targetChainId);

  const networkName = rpcInfo.name || hre.network.name;
  const classification = classifyNetwork(targetChainId);
  const isTest = rawConfig.isTest ?? rpcInfo.isTestnet ?? (classification !== "mainnet");

  console.log(`\n============================================================`);
  console.log(`NFTMintport Config-Driven Deployment`);
  console.log(`Target Network: ${networkName} (Chain ID: ${targetChainId}, ${classification.toUpperCase()})`);
  console.log(`Mode: ${isTest ? "🧪 TEST / STAGING" : "🛡️ PRODUCTION"}`);
  console.log(`Deployer: ${deployer.account.address}`);

  const balance = await publicClient.getBalance({ address: deployer.account.address });
  console.log(`Deployer balance: ${formatEther(balance)} ETH`);
  console.log(`============================================================\n`);

  const activeConfig = resolveConfigForNetwork(rawConfig, hre.network.name, classification);

  // 2. Strict production / test mode safety enforcement
  if (!isTest || classification === "mainnet") {
    if (activeConfig.contracts.TestMintToken?.enabled && process.env.ALLOW_TEST_TOKEN_ON_MAINNET !== "true") {
      throw new Error(
        `CRITICAL SAFETY REVERT: Deploying TestMintToken in production mode (isTest: false / mainnet) is blocked. ` +
        `Set isTest: true or disable TestMintToken in your config.`
      );
    }
    if (activeConfig.contracts.TestMintNFT?.enabled && process.env.ALLOW_TEST_NFT_ON_MAINNET !== "true") {
      throw new Error(
        `CRITICAL SAFETY REVERT: Deploying TestMintNFT in production mode (isTest: false / mainnet) is blocked. ` +
        `Set isTest: true or disable TestMintNFT in your config.`
      );
    }
  }

  const deployedContractsMap: Record<string, ContractDeploymentRecord> = {};
  const runTimestamp = new Date().toISOString();
  const runId = `run-${targetChainId}-${Date.now()}`;

  // 3. Deploy enabled contracts
  for (const [contractName, contractCfg] of Object.entries(activeConfig.contracts)) {
    if (!contractCfg || !contractCfg.enabled) {
      console.log(`⏭️  Skipping [${contractName}] (disabled in config)`);
      continue;
    }

    const resolvedArgs = resolveContractArgs(contractName, contractCfg.args, deployer.account.address);
    console.log(`🚀 Deploying [${contractName}] with args:`, resolvedArgs);

    const deployed = await hre.viem.deployContract(contractName as any, resolvedArgs as any);
    console.log(`✅ [${contractName}] deployed to: ${deployed.address}`);

    const record: ContractDeploymentRecord = {
      address: getAddress(deployed.address),
      testOnly: contractCfg.testOnly ?? (contractName.startsWith("Test") || isTest),
    };
    if (resolvedArgs.length > 0) {
      record.args = resolvedArgs;
    }

    deployedContractsMap[contractName] = record;
  }

  // 4. Seaport handling
  let seaportRecord: SeaportRecord | undefined;
  const canonicalSeaportAddress: `0x${string}` = "0x0000000000000068F116a894984e2DB1123eB395";
  const canonicalConduitController: `0x${string}` = "0x00000000F9490004C103FB2A09CE222342427011";

  const shouldForceDeploy = Boolean(
    activeConfig.forceDeploySeaport || activeConfig.seaport?.mode === "deployed"
  );

  const existingSeaportCode = await publicClient.getBytecode({
    address: canonicalSeaportAddress,
  });

  if (!shouldForceDeploy && existingSeaportCode && existingSeaportCode !== "0x") {
    console.log(`ℹ️ Canonical Seaport v1.6 detected on-chain at: ${canonicalSeaportAddress}`);
    seaportRecord = {
      mode: "existing",
      version: "1.6",
      address: canonicalSeaportAddress,
      conduitController: canonicalConduitController,
    };
  } else if (activeConfig.deploySeaport || isTest || shouldForceDeploy) {
    console.log(`🚢 ${shouldForceDeploy ? "Dedicated MockSeaportV16 requested via config" : "Canonical Seaport v1.6 not detected on this chain"}.`);
    console.log(`🚀 Deploying MockSeaportV16 for this network...`);
    const seaportDeployed = await hre.viem.deployContract("MockSeaportV16", []);
    console.log(`✅ MockSeaportV16 deployed to: ${seaportDeployed.address}`);
    seaportRecord = {
      mode: "deployed",
      version: "1.6",
      address: getAddress(seaportDeployed.address),
      conduitController: canonicalConduitController,
    };
  }

  // 5. Construct Active Manifest
  const manifest: DeploymentManifest = {
    schemaVersion: "1.0.0",
    project: "NFTMintport",
    environment: classification,
    chainId: targetChainId,
    networkName: hre.network.name,
    deployedAt: runTimestamp,
    deployer: deployer.account.address,
    isTest,
    contracts: {
      ...deployedContractsMap,
      ...(seaportRecord ? { Seaport: seaportRecord } : {}),
    },
  };

  // 6. Construct Per-Run History Record
  const runRecord: DeploymentRunRecord = {
    runId,
    timestamp: runTimestamp,
    chainId: targetChainId,
    networkName: hre.network.name,
    environment: classification,
    isTest,
    deployer: deployer.account.address,
    configSnapshot: rawConfig as unknown as Record<string, unknown>,
    contracts: deployedContractsMap,
    seaport: seaportRecord,
  };

  const manifestPath = saveManifest(manifest);
  const runPath = saveDeploymentRun(runRecord);

  console.log(`\n============================================================`);
  console.log(`🎉 Deployment successfully executed!`);
  console.log(`📦 Manifest updated: ${manifestPath}`);
  console.log(`📜 Run history log:   ${runPath}`);
  console.log(`============================================================\n`);

  return { manifest, manifestPath, runRecord, runPath };
}

async function main() {
  await deployFromConfig();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Configuration deployment failed:", error);
    process.exitCode = 1;
  });
}
