import { expect } from "chai";
import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import {
  parseCliConfigPath,
  loadDeploymentConfig,
  deployFromConfig,
  UniversalDeployConfig,
} from "../../scripts/deploy-from-config";
import {
  getRpcForChain,
  listDeploymentRuns,
  listAllManifests,
} from "../../scripts/utils/manifest";
import { deploySeaportStandalone } from "../../scripts/deploy-seaport";
import { inspectDeployments } from "../../scripts/inspect-deployments";

describe("Deployment CLI & RPC Management Unit Tests", () => {
  describe("CLI Argument Parsing", () => {
    it("should parse --config <path>", () => {
      const argv = ["node", "deploy.ts", "--config", "custom-deploy.json"];
      expect(parseCliConfigPath(argv)).to.equal("custom-deploy.json");
    });

    it("should parse --config=<path>", () => {
      const argv = ["node", "deploy.ts", "--config=custom-deploy.json"];
      expect(parseCliConfigPath(argv)).to.equal("custom-deploy.json");
    });

    it("should parse -c <path>", () => {
      const argv = ["node", "deploy.ts", "-c", "custom-deploy.json"];
      expect(parseCliConfigPath(argv)).to.equal("custom-deploy.json");
    });

    it("should return null if --config is omitted", () => {
      const argv = ["node", "deploy.ts"];
      expect(parseCliConfigPath(argv)).to.be.null;
    });
  });

  describe("RPC Registry Validation & Missing Chain Handling", () => {
    it("should retrieve valid RPC configuration for supported chain IDs", () => {
      const localRpc = getRpcForChain(31337);
      expect(localRpc.rpcUrl).to.include("8545");
      expect(localRpc.isTestnet).to.be.true;

      const sepoliaRpc = getRpcForChain(11155111);
      expect(sepoliaRpc.name).to.include("Sepolia");
    });

    it("should throw informative error prompting user when chainId is not in rpc.config.json", () => {
      const unknownChainId = 987654321;
      expect(() => getRpcForChain(unknownChainId)).to.throw(
        /\[RPC CONFIG ERROR\]: Chain ID 987654321 is not configured in rpc\.config\.json/
      );
    });
  });

  describe("JSON Deployment Configuration & Per-Run History Logging", () => {
    it("should execute deployment from JSON config and write history run record", async () => {
      const testJsonConfig: UniversalDeployConfig = {
        chainId: 31337,
        isTest: true,
        deploySeaport: true,
        contracts: {
          TestMintNFT: {
            enabled: true,
            args: ["JSON Test NFT", "JTNFT", "ipfs://test-json-uri"],
          },
          TestMintToken: {
            enabled: false,
          },
        },
      };

      const result = await deployFromConfig(testJsonConfig);

      // Verify active manifest
      expect(result.manifest.chainId).to.equal(31337);
      expect(result.manifest.isTest).to.be.true;
      expect(result.manifest.contracts.TestMintNFT).to.be.ok;
      expect(result.manifest.contracts.TestMintNFT!.address).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(result.manifest.contracts.TestMintToken).to.be.undefined;

      // Verify Seaport auto-deployment
      expect(result.manifest.contracts.Seaport).to.be.ok;
      expect(result.manifest.contracts.Seaport!.address).to.match(/^0x[a-fA-F0-9]{40}$/);

      // Verify per-run history log file
      expect(fs.existsSync(result.runPath)).to.be.true;
      const savedRun = JSON.parse(fs.readFileSync(result.runPath, "utf8"));
      expect(savedRun.runId).to.equal(result.runRecord.runId);
      expect(savedRun.contracts.TestMintNFT.address).to.equal(
        result.manifest.contracts.TestMintNFT!.address
      );

      // Verify listDeploymentRuns retrieves the new run
      const runs = listDeploymentRuns(31337);
      expect(runs.length).to.be.greaterThan(0);
      expect(runs[0].chainId).to.equal(31337);
    });

    it("should block test contracts when isTest is false", async () => {
      const prodConfig: UniversalDeployConfig = {
        chainId: 31337,
        isTest: false,
        contracts: {
          TestMintToken: {
            enabled: true,
          },
        },
      };

      await expect(deployFromConfig(prodConfig)).to.be.rejectedWith(
        /CRITICAL SAFETY REVERT: Deploying TestMintToken in production mode/
      );
    });
  });

  describe("Standalone Seaport & Inspection Scripts", () => {
    it("should deploy or verify Seaport via standalone script", async () => {
      const seaportRecord = await deploySeaportStandalone();
      expect(seaportRecord.address).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(["existing", "deployed"]).to.include(seaportRecord.mode);
    });

    it("should run inspection helper without error", async () => {
      await inspectDeployments();
    });
  });
});
