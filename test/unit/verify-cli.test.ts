import { expect } from "chai";
import * as path from "path";
import {
  parseVerifyCliArgs,
  shouldVerifyContract,
  executeVerification,
} from "../../scripts/verify";

describe("Selective Contract Verification CLI Unit Tests", () => {
  describe("CLI Argument Parsing", () => {
    it("should parse --address and --contract options", () => {
      const argv = ["--address", "0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31", "--contract", "TestUSDC"];
      const opts = parseVerifyCliArgs(argv);
      expect(opts.address).to.equal("0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31");
      expect(opts.contract).to.equal("TestUSDC");
    });

    it("should parse --address=0x... inline syntax", () => {
      const argv = ["--address=0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31", "--contract=TestUSDC"];
      const opts = parseVerifyCliArgs(argv);
      expect(opts.address).to.equal("0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31");
      expect(opts.contract).to.equal("TestUSDC");
    });

    it("should parse positional 0x address", () => {
      const argv = ["0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31", "--contract", "TestUSDC"];
      const opts = parseVerifyCliArgs(argv);
      expect(opts.address).to.equal("0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31");
      expect(opts.contract).to.equal("TestUSDC");
    });

    it("should parse --only and --exclude filters", () => {
      const argv = ["--only", "MoriusaTestNFT,TestUSDC", "--exclude", "Seaport"];
      const opts = parseVerifyCliArgs(argv);
      expect(opts.only).to.deep.equal(["MoriusaTestNFT", "TestUSDC"]);
      expect(opts.exclude).to.deep.equal(["Seaport"]);
    });

    it("should parse --skip alias and --dry-run flag", () => {
      const argv = ["--skip", "Seaport,SecretContract", "--dry-run"];
      const opts = parseVerifyCliArgs(argv);
      expect(opts.exclude).to.deep.equal(["Seaport", "SecretContract"]);
      expect(opts.dryRun).to.be.true;
    });

    it("should parse --manifest and --config", () => {
      const argv = ["--manifest", "custom-manifest.json", "--config", "deploy.minato.config.json"];
      const opts = parseVerifyCliArgs(argv);
      expect(opts.manifest).to.equal("custom-manifest.json");
      expect(opts.config).to.equal("deploy.minato.config.json");
    });
  });

  describe("Contract Inclusion & Privacy Exclusion Logic (shouldVerifyContract)", () => {
    it("should allow contract verification by default", () => {
      const res = shouldVerifyContract("TestUSDC", {}, {});
      expect(res.allowed).to.be.true;
    });

    it("should block verification if contract has verify: false in config", () => {
      const res = shouldVerifyContract("PrivatePool", { verify: false }, {});
      expect(res.allowed).to.be.false;
      expect(res.reason).to.include('marked "verify": false');
    });

    it("should block verification if contract has skipVerify: true in config", () => {
      const res = shouldVerifyContract("SecretToken", { skipVerify: true }, {});
      expect(res.allowed).to.be.false;
      expect(res.reason).to.include('marked "skipVerify": true');
    });

    it("should block verification if contract is in --exclude list", () => {
      const res = shouldVerifyContract("Seaport", {}, { exclude: ["Seaport", "PrivateContract"] });
      expect(res.allowed).to.be.false;
      expect(res.reason).to.include("excluded via --exclude filter");
    });

    it("should allow only contracts in --only list and block others", () => {
      const allowedRes = shouldVerifyContract("TestUSDC", {}, { only: ["TestUSDC"] });
      expect(allowedRes.allowed).to.be.true;

      const blockedRes = shouldVerifyContract("MoriusaTestNFT", {}, { only: ["TestUSDC"] });
      expect(blockedRes.allowed).to.be.false;
      expect(blockedRes.reason).to.include("not included in --only filter");
    });
  });

  describe("Execution & Filtering Workflows (Dry-Run & Live Inspection)", () => {
    it("should dry-run manifest verification and respect --exclude filter", async () => {
      const manifestPath = path.resolve(__dirname, "../../deployments/soneium-minato-1946.json");
      const reports = await executeVerification({
        manifest: manifestPath,
        exclude: ["Seaport"],
        dryRun: true,
      });

      expect(reports.length).to.equal(3);
      const seaportReport = reports.find((r) => r.contractName === "Seaport");
      expect(seaportReport).to.exist;
      expect(seaportReport!.skipped).to.be.true;
      expect(seaportReport!.skipReason).to.include("excluded via --exclude filter");

      const nftReport = reports.find((r) => r.contractName === "MoriusaTestNFT");
      expect(nftReport).to.exist;
      expect(nftReport!.skipped).to.be.undefined;
    });

    it("should dry-run manifest verification and respect --only filter", async () => {
      const manifestPath = path.resolve(__dirname, "../../deployments/soneium-minato-1946.json");
      const reports = await executeVerification({
        manifest: manifestPath,
        only: ["TestUSDC"],
        dryRun: true,
      });

      expect(reports.length).to.equal(3);
      const usdcReport = reports.find((r) => r.contractName === "TestUSDC");
      expect(usdcReport!.skipped).to.be.undefined;

      const nftReport = reports.find((r) => r.contractName === "MoriusaTestNFT");
      expect(nftReport!.skipped).to.be.true;
      expect(nftReport!.skipReason).to.include("not included in --only filter");
    });

    it("should inspect single verified address without sending submission", async () => {
      const reports = await executeVerification({
        address: "0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31",
        contract: "TestUSDC",
        chainId: 1946,
      });

      expect(reports.length).to.equal(1);
      expect(reports[0].contractName).to.equal("TestUSDC");
      expect(reports[0].isVerified).to.be.true;
    });

    it("should respect --exclude on single address verification", async () => {
      const reports = await executeVerification({
        address: "0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31",
        contract: "TestUSDC",
        exclude: ["TestUSDC"],
        chainId: 1946,
      });

      expect(reports.length).to.equal(1);
      expect(reports[0].skipped).to.be.true;
      expect(reports[0].skipReason).to.include("excluded via --exclude filter");
    });
  });
});
