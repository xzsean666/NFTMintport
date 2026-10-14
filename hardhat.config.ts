import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as fs from "fs";
import * as path from "path";

const networks: Record<string, any> = {
  hardhat: {
    chainId: 31337,
  },
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 31337,
  },
};

const rpcConfigPath = path.resolve(__dirname, "./rpc.config.json");
if (fs.existsSync(rpcConfigPath)) {
  try {
    const rpcConfig = JSON.parse(fs.readFileSync(rpcConfigPath, "utf8"));
    const accounts = process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : undefined;
    for (const [chainIdStr, info] of Object.entries(rpcConfig)) {
      const entry = info as { name?: string; rpcUrl?: string };
      if (entry.rpcUrl) {
        networks[`chain-${chainIdStr}`] = {
          url: entry.rpcUrl,
          chainId: Number(chainIdStr),
          accounts,
        };
        if (entry.name) {
          const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          networks[slug] = {
            url: entry.rpcUrl,
            chainId: Number(chainIdStr),
            accounts,
          };
        }
      }
    }
  } catch {
    // Ignore parse error on boot
  }
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
