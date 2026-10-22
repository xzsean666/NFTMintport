import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { getRpcForChain, DeploymentManifest } from "./utils/manifest";

export interface VerificationReport {
  contractName: string;
  address: string;
  isVerified: boolean;
  skipped?: boolean;
  skipReason?: string;
  verifiedAt?: string;
  compilerVersion?: string;
  url: string;
}

export interface VerifyCliOptions {
  address?: string;
  contract?: string;
  args?: unknown[];
  manifest?: string;
  config?: string;
  chainId?: number;
  network?: string;
  only?: string[];
  exclude?: string[];
  dryRun?: boolean;
}

/**
 * Checks verification status using Blockscout v2 API.
 */
export function checkBlockscoutVerification(
  explorerBaseUrl: string,
  address: string
): { isVerified: boolean; verifiedAt?: string; compilerVersion?: string; name?: string } {
  try {
    const cmd = `curl -s "${explorerBaseUrl}/api/v2/smart-contracts/${address}"`;
    const stdout = execSync(cmd, { encoding: "utf8" });
    const json = JSON.parse(stdout);
    return {
      isVerified: Boolean(json.is_verified),
      verifiedAt: json.verified_at,
      compilerVersion: json.compiler_version,
      name: json.name,
    };
  } catch {
    return { isVerified: false };
  }
}

/**
 * Finds the build-info file in artifacts/build-info containing the target contract.
 */
export function findBuildInfoForContract(
  contractName: string
): { buildInfoPath: string; input: any; solcVersion: string } | null {
  const buildInfoDir = path.resolve(__dirname, "../artifacts/build-info");
  if (!fs.existsSync(buildInfoDir)) {
    return null;
  }

  const files = fs.readdirSync(buildInfoDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(buildInfoDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const sources = Object.keys(data.input?.sources || {});
      const matches = sources.some(
        (s) =>
          s.endsWith(`/${contractName}.sol`) ||
          s === `${contractName}.sol` ||
          s.toLowerCase().endsWith(`/${contractName.toLowerCase()}.sol`)
      );
      if (matches) {
        return {
          buildInfoPath: filePath,
          input: data.input,
          solcVersion: data.solcLongVersion || data.solcVersion,
        };
      }
    } catch {
      // Continue to next file
    }
  }

  return null;
}

/**
 * Submits standard-input JSON to Blockscout v2 smart-contract verification endpoint.
 */
export function verifyViaBlockscoutStandardInput(
  explorerBaseUrl: string,
  address: string,
  contractName: string,
  input: any,
  solcVersion: string
): boolean {
  const tempInputPath = `/tmp/blockscout-input-${address.toLowerCase()}.json`;
  fs.writeFileSync(tempInputPath, JSON.stringify(input, null, 2), "utf8");

  try {
    const compilerVer = solcVersion.startsWith("v") ? solcVersion : `v${solcVersion}`;
    const curlCmd = `curl -s -X POST "${explorerBaseUrl}/api/v2/smart-contracts/${address}/verification/via/standard-input" \
      -H "Accept: application/json" \
      -F "compiler_version=${compilerVer}" \
      -F "contract_name=${contractName}" \
      -F "license_type=mit" \
      -F "files[0]=@${tempInputPath};type=application/json;filename=standard_input.json"`;

    const res = execSync(curlCmd, { encoding: "utf8" });
    const json = JSON.parse(res);
    console.log(`   Verification submission response: ${json.message || JSON.stringify(json)}`);
    return true;
  } catch (err: any) {
    console.warn(`   Submission error:`, err.message);
    return false;
  } finally {
    if (fs.existsSync(tempInputPath)) {
      try {
        fs.unlinkSync(tempInputPath);
      } catch {}
    }
  }
}

/**
 * Parses command-line arguments into structured VerifyCliOptions.
 */
export function parseVerifyCliArgs(argv = process.argv.slice(2)): VerifyCliOptions {
  const opts: VerifyCliOptions = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--address" || arg === "-a") {
      opts.address = argv[++i];
    } else if (arg.startsWith("--address=")) {
      opts.address = arg.split("=")[1];
    } else if (arg === "--contract" || arg === "-c") {
      opts.contract = argv[++i];
    } else if (arg.startsWith("--contract=")) {
      opts.contract = arg.split("=")[1];
    } else if (arg === "--manifest" || arg === "-m") {
      opts.manifest = argv[++i];
    } else if (arg.startsWith("--manifest=")) {
      opts.manifest = arg.split("=")[1];
    } else if (arg === "--config") {
      opts.config = argv[++i];
    } else if (arg.startsWith("--config=")) {
      opts.config = arg.split("=")[1];
    } else if (arg === "--chain-id" || arg === "--chainId") {
      opts.chainId = Number(argv[++i]);
    } else if (arg.startsWith("--chain-id=")) {
      opts.chainId = Number(arg.split("=")[1]);
    } else if (arg === "--network") {
      opts.network = argv[++i];
    } else if (arg.startsWith("--network=")) {
      opts.network = arg.split("=")[1];
    } else if (arg === "--only") {
      const val = argv[++i];
      opts.only = val.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith("--only=")) {
      opts.only = arg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--exclude" || arg === "--skip") {
      const val = argv[++i];
      opts.exclude = val.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith("--exclude=") || arg.startsWith("--skip=")) {
      opts.exclude = arg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg.startsWith("0x") && arg.length === 42 && !opts.address) {
      opts.address = arg;
    } else if (!arg.startsWith("-") && !opts.manifest && !opts.address) {
      opts.manifest = arg;
    }
  }

  return opts;
}

/**
 * Checks if a contract should be included based on CLI filter and config flags.
 */
export function shouldVerifyContract(
  contractName: string,
  contractEntry: any,
  options: VerifyCliOptions
): { allowed: boolean; reason?: string } {
  // 1. Config / Manifest explicit opt-out
  if (contractEntry) {
    if (contractEntry.verify === false) {
      return { allowed: false, reason: 'marked "verify": false in configuration' };
    }
    if (contractEntry.skipVerify === true) {
      return { allowed: false, reason: 'marked "skipVerify": true in configuration' };
    }
  }

  // 2. CLI Exclude filter
  if (options.exclude && options.exclude.length > 0) {
    const isExcluded = options.exclude.some(
      (e) => e.toLowerCase() === contractName.toLowerCase()
    );
    if (isExcluded) {
      return { allowed: false, reason: `excluded via --exclude filter (${contractName})` };
    }
  }

  // 3. CLI Only filter
  if (options.only && options.only.length > 0) {
    const isIncluded = options.only.some(
      (o) => o.toLowerCase() === contractName.toLowerCase()
    );
    if (!isIncluded) {
      return { allowed: false, reason: `not included in --only filter (${options.only.join(",")})` };
    }
  }

  return { allowed: true };
}

/**
 * Main flexible verification engine.
 */
export async function executeVerification(options: VerifyCliOptions): Promise<VerificationReport[]> {
  const chainId = options.chainId || 1946;
  const rpcInfo = getRpcForChain(chainId);
  const explorerBaseUrl = rpcInfo.explorerUrl || "https://soneium-minato.blockscout.com";

  console.log(`\n============================================================`);
  console.log(`🔍 NFTMintport Selective Contract Verifier`);
  console.log(`Target Network: ${rpcInfo.name} (Chain ID: ${chainId})`);
  console.log(`Explorer:       ${explorerBaseUrl}`);
  if (options.dryRun) {
    console.log(`Mode:           ⚠️  DRY RUN (no network verification requests will be sent)`);
  }
  if (options.only?.length) {
    console.log(`Filter [ONLY]:  ${options.only.join(", ")}`);
  }
  if (options.exclude?.length) {
    console.log(`Filter [SKIP]:  ${options.exclude.join(", ")}`);
  }
  console.log(`============================================================\n`);

  const reports: VerificationReport[] = [];

  // -------------------------------------------------------------
  // Mode A: Direct Single Address Verification
  // -------------------------------------------------------------
  if (options.address) {
    const address = options.address;
    const contractName = options.contract || "Contract";
    const browserUrl = `${explorerBaseUrl}/address/${address}#code`;

    console.log(`🎯 Verifying single target: [${contractName}] at ${address}`);

    const filterCheck = shouldVerifyContract(contractName, null, options);
    if (!filterCheck.allowed) {
      console.log(`   ⏭️  SKIPPED: ${filterCheck.reason}\n`);
      reports.push({
        contractName,
        address,
        isVerified: false,
        skipped: true,
        skipReason: filterCheck.reason,
        url: browserUrl,
      });
      return reports;
    }

    const liveStatus = checkBlockscoutVerification(explorerBaseUrl, address);
    if (liveStatus.isVerified) {
      console.log(`   ✅ ALREADY VERIFIED on Blockscout!`);
      console.log(`   Contract Name:    ${liveStatus.name || contractName}`);
      console.log(`   Compiler Version: ${liveStatus.compilerVersion}`);
      console.log(`   Verified At:      ${liveStatus.verifiedAt}`);
      console.log(`   Code Link:        ${browserUrl}\n`);

      reports.push({
        contractName: liveStatus.name || contractName,
        address,
        isVerified: true,
        verifiedAt: liveStatus.verifiedAt,
        compilerVersion: liveStatus.compilerVersion,
        url: browserUrl,
      });
      return reports;
    }

    if (options.dryRun) {
      console.log(`   [DRY RUN] Would submit standard input verification for ${contractName} at ${address}\n`);
      reports.push({
        contractName,
        address,
        isVerified: false,
        url: browserUrl,
      });
      return reports;
    }

    const buildInfo = findBuildInfoForContract(contractName);
    if (!buildInfo) {
      console.error(`   ❌ Failed to locate compiled build-info for [${contractName}]`);
      reports.push({
        contractName,
        address,
        isVerified: false,
        url: browserUrl,
      });
      return reports;
    }

    const submitted = verifyViaBlockscoutStandardInput(
      explorerBaseUrl,
      address,
      contractName,
      buildInfo.input,
      buildInfo.solcVersion
    );

    let finalVerified = false;
    let verifiedAt: string | undefined;
    let compilerVer: string | undefined;

    if (submitted) {
      console.log(`   ⏳ Waiting for Blockscout to process verification...`);
      for (let attempt = 1; attempt <= 6; attempt++) {
        execSync("sleep 3");
        const status = checkBlockscoutVerification(explorerBaseUrl, address);
        if (status.isVerified) {
          finalVerified = true;
          verifiedAt = status.verifiedAt;
          compilerVer = status.compilerVersion;
          break;
        }
      }
    }

    if (finalVerified) {
      console.log(`   🎉 Successfully verified [${contractName}]!`);
    } else {
      console.log(`   ⚠️  Verification submitted or pending. Check link: ${browserUrl}`);
    }
    console.log(`   Code Link: ${browserUrl}\n`);

    reports.push({
      contractName,
      address,
      isVerified: finalVerified,
      verifiedAt,
      compilerVersion: compilerVer,
      url: browserUrl,
    });

    return reports;
  }

  // -------------------------------------------------------------
  // Mode B: Config-Driven or Manifest-Driven Verification
  // -------------------------------------------------------------
  let manifestPath = options.manifest;

  // If a deploy config is provided, resolve corresponding manifest
  if (options.config) {
    const configPath = path.resolve(process.cwd(), options.config);
    if (!fs.existsSync(configPath)) {
      throw new Error(`Deployment config file not found: ${configPath}`);
    }
    console.log(`📄 Loading configuration from: ${configPath}`);
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const targetChainId = cfg.chainId || chainId;
    manifestPath = path.resolve(__dirname, `../deployments/soneium-minato-${targetChainId}.json`);
    if (!fs.existsSync(manifestPath)) {
      // Fallback: look for any manifest with that chainId
      const depDir = path.resolve(__dirname, "../deployments");
      const matched = fs.readdirSync(depDir).find((f) => f.endsWith(`-${targetChainId}.json`));
      if (matched) {
        manifestPath = path.join(depDir, matched);
      }
    }
  }

  // Default manifest fallback
  if (!manifestPath) {
    manifestPath = path.resolve(__dirname, `../deployments/soneium-minato-${chainId}.json`);
  } else if (!manifestPath.endsWith(".json")) {
    manifestPath = path.resolve(__dirname, `../deployments/${manifestPath}.json`);
  } else {
    manifestPath = path.resolve(process.cwd(), manifestPath);
  }

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Deployment manifest file not found: ${manifestPath}`);
  }

  console.log(`📦 Loaded Manifest: ${manifestPath}\n`);
  const manifest: DeploymentManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Check optional config snapshot for overrides or verify flags
  let configContractsMap: Record<string, any> = {};
  if (options.config) {
    try {
      const cfg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), options.config), "utf8"));
      configContractsMap = cfg.contracts || {};
    } catch {}
  }

  for (const [key, contractEntry] of Object.entries(manifest.contracts)) {
    if (!contractEntry || !contractEntry.address) {
      continue;
    }

    const address = contractEntry.address;
    let actualContractName = key;

    if (key === "Seaport") {
      const seaportEntry = contractEntry as any;
      if (seaportEntry.mode === "deployed") {
        actualContractName = "MockSeaportV16";
      } else {
        console.log(`⏭️  Skipping canonical external Seaport at ${address}`);
        continue;
      }
    }

    const browserUrl = `${explorerBaseUrl}/address/${address}#code`;

    // Check exclusion filters & verify flags
    const combinedConfigEntry = {
      ...(typeof contractEntry === "object" ? contractEntry : {}),
      ...(configContractsMap[key] || {}),
    };

    const filterResult = shouldVerifyContract(key, combinedConfigEntry, options);
    if (!filterResult.allowed) {
      console.log(`🔒 [SKIP / NON-OPEN-SOURCE] [${key}] at ${address}`);
      console.log(`   Reason: ${filterResult.reason}\n`);
      reports.push({
        contractName: key,
        address,
        isVerified: false,
        skipped: true,
        skipReason: filterResult.reason,
        url: browserUrl,
      });
      continue;
    }

    console.log(`📋 Checking [${key}] (${actualContractName}) at ${address}...`);

    let status = checkBlockscoutVerification(explorerBaseUrl, address);
    if (status.isVerified) {
      console.log(`   ✅ ALREADY VERIFIED!`);
      console.log(`   Contract Name:    ${status.name || actualContractName}`);
      console.log(`   Compiler Version: ${status.compilerVersion}`);
      console.log(`   Verified At:      ${status.verifiedAt}`);
      console.log(`   Code Link:        ${browserUrl}\n`);

      reports.push({
        contractName: key,
        address,
        isVerified: true,
        verifiedAt: status.verifiedAt,
        compilerVersion: status.compilerVersion,
        url: browserUrl,
      });
      continue;
    }

    if (options.dryRun) {
      console.log(`   [DRY RUN] Would submit standard-input verification for ${actualContractName}`);
      console.log(`   Code Link: ${browserUrl}\n`);
      reports.push({
        contractName: key,
        address,
        isVerified: false,
        url: browserUrl,
      });
      continue;
    }

    console.log(`   ⚠️  Not verified. Preparing standard input for submission...`);
    const buildInfo = findBuildInfoForContract(actualContractName);
    if (!buildInfo) {
      console.error(`   ❌ Failed to locate compiled build-info for ${actualContractName}`);
      reports.push({
        contractName: key,
        address,
        isVerified: false,
        url: browserUrl,
      });
      continue;
    }

    const submitted = verifyViaBlockscoutStandardInput(
      explorerBaseUrl,
      address,
      actualContractName,
      buildInfo.input,
      buildInfo.solcVersion
    );

    if (submitted) {
      console.log(`   ⏳ Waiting for Blockscout to process verification...`);
      for (let attempt = 1; attempt <= 6; attempt++) {
        execSync("sleep 3");
        status = checkBlockscoutVerification(explorerBaseUrl, address);
        if (status.isVerified) {
          break;
        }
      }
    }

    if (status.isVerified) {
      console.log(`   🎉 Successfully verified [${actualContractName}]!`);
      console.log(`   Code Link: ${browserUrl}\n`);
    } else {
      console.log(`   ⚠️  Verification pending or failed. Check link: ${browserUrl}\n`);
    }

    reports.push({
      contractName: key,
      address,
      isVerified: status.isVerified,
      verifiedAt: status.verifiedAt,
      compilerVersion: status.compilerVersion,
      url: browserUrl,
    });
  }

  console.log(`============================================================`);
  console.log(`Verification Summary:`);
  console.log(`============================================================`);
  for (const r of reports) {
    const statusText = r.skipped
      ? `🔒 SKIPPED (${r.skipReason})`
      : r.isVerified
      ? "🟢 VERIFIED"
      : "🔴 UNVERIFIED";
    console.log(`- ${r.contractName.padEnd(16)}: ${statusText} | ${r.url}`);
  }
  console.log(`============================================================\n`);

  return reports;
}

if (require.main === module) {
  const cliOpts = parseVerifyCliArgs();
  executeVerification(cliOpts).catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
}
