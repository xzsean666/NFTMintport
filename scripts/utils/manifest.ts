import * as fs from "fs";
import * as path from "path";

export type NetworkClassification = "local" | "testnet" | "mainnet";

export interface ContractDeploymentRecord {
  address: string;
  deploymentTx?: string;
  blockNumber?: number;
  args?: unknown[];
  testOnly?: boolean;
}

export interface SeaportRecord {
  mode: "existing" | "deployed";
  version: string;
  address: string;
  conduitController: string;
}

export interface DeploymentManifest {
  schemaVersion: string;
  project: string;
  environment: NetworkClassification;
  chainId: number;
  networkName: string;
  deployedAt: string;
  deployer: string;
  isTest?: boolean;
  contracts: {
    NFTMintportERC721?: ContractDeploymentRecord;
    NFTMintportERC1155?: ContractDeploymentRecord;
    TestMintToken?: ContractDeploymentRecord;
    TestMintNFT?: ContractDeploymentRecord;
    Seaport?: SeaportRecord;
    [contractName: string]: ContractDeploymentRecord | SeaportRecord | undefined;
  };
}

export interface DeploymentRunRecord {
  runId: string;
  timestamp: string;
  chainId: number;
  networkName: string;
  environment: NetworkClassification;
  isTest: boolean;
  deployer: string;
  configSnapshot: Record<string, unknown>;
  contracts: Record<string, ContractDeploymentRecord>;
  seaport?: SeaportRecord;
}

export interface RpcNetworkInfo {
  name: string;
  rpcUrl: string;
  isTestnet: boolean;
  currency?: string;
  explorerUrl?: string;
}

export const KNOWN_MAINNET_CHAIN_IDS = new Set([
  1, // Ethereum Mainnet
  10, // Optimism Mainnet
  56, // BNB Smart Chain
  137, // Polygon Mainnet
  8453, // Base Mainnet
  42161, // Arbitrum One
  43114, // Avalanche C-Chain
]);

export const KNOWN_LOCAL_CHAIN_IDS = new Set([
  1337,
  31337, // Hardhat / Anvil
]);

export function classifyNetwork(chainId: number): NetworkClassification {
  if (KNOWN_LOCAL_CHAIN_IDS.has(chainId)) {
    return "local";
  }
  if (KNOWN_MAINNET_CHAIN_IDS.has(chainId)) {
    return "mainnet";
  }
  return "testnet";
}

export function getRpcConfigPath(): string {
  return path.resolve(__dirname, "../../rpc.config.json");
}

export function readRpcConfig(): Record<string, RpcNetworkInfo> {
  const filePath = getRpcConfigPath();
  if (!fs.existsSync(filePath)) {
    throw new Error(`RPC configuration file not found at ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function getRpcForChain(chainId: number): RpcNetworkInfo {
  const config = readRpcConfig();
  const info = config[String(chainId)];
  if (!info) {
    throw new Error(
      `\n❌ [RPC CONFIG ERROR]: Chain ID ${chainId} is not configured in rpc.config.json!\n` +
      `Please add an entry to ${getRpcConfigPath()}:\n\n` +
      `  "${chainId}": {\n` +
      `    "name": "<Network Name>",\n` +
      `    "rpcUrl": "https://<your-rpc-endpoint>",\n` +
      `    "isTestnet": true,\n` +
      `    "currency": "ETH"\n` +
      `  }\n`
    );
  }
  return info;
}

export function getDeploymentsDir(): string {
  return path.resolve(__dirname, "../../deployments");
}

export function getHistoryDir(): string {
  const dir = path.join(getDeploymentsDir(), "history");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getManifestPath(networkName: string, chainId: number): string {
  const dir = getDeploymentsDir();
  return path.join(dir, `${networkName}-${chainId}.json`);
}

export function readManifest(networkName: string, chainId: number): DeploymentManifest | null {
  const filePath = getManifestPath(networkName, chainId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as DeploymentManifest;
  } catch (err) {
    console.warn(`Failed to parse manifest at ${filePath}:`, err);
    return null;
  }
}

export function saveManifest(manifest: DeploymentManifest): string {
  const dir = getDeploymentsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = getManifestPath(manifest.networkName, manifest.chainId);
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2), "utf8");
  return filePath;
}

export function saveDeploymentRun(run: DeploymentRunRecord): string {
  const historyDir = getHistoryDir();
  const safeTimestamp = run.timestamp.replace(/[:.]/g, "-");
  const fileName = `deployment-${run.chainId}-${safeTimestamp}.json`;
  const filePath = path.join(historyDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(run, null, 2), "utf8");
  return filePath;
}

export function listDeploymentRuns(filterChainId?: number): DeploymentRunRecord[] {
  const historyDir = getHistoryDir();
  const files = fs.readdirSync(historyDir).filter((f) => f.endsWith(".json"));
  const records: DeploymentRunRecord[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(historyDir, file), "utf8");
      const record = JSON.parse(raw) as DeploymentRunRecord;
      if (filterChainId === undefined || record.chainId === filterChainId) {
        records.push(record);
      }
    } catch {
      // Ignore unparseable files
    }
  }

  // Sort descending by timestamp
  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function listAllManifests(): DeploymentManifest[] {
  const dir = getDeploymentsDir();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== ".gitkeep");
  const manifests: DeploymentManifest[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      manifests.push(JSON.parse(raw) as DeploymentManifest);
    } catch {
      // Ignore
    }
  }

  return manifests;
}
