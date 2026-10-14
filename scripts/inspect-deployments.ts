import hre from "hardhat";
import "@nomicfoundation/hardhat-toolbox-viem";
import {
  listAllManifests,
  listDeploymentRuns,
  readRpcConfig,
  DeploymentManifest,
} from "./utils/manifest";

function parseInspectArgs(argv = process.argv) {
  let chainId: number | undefined;
  let showHistory = false;
  let checkLive = true;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--chainId" && argv[i + 1]) {
      chainId = Number(argv[i + 1]);
    }
    if (argv[i] === "--history") {
      showHistory = true;
    }
    if (argv[i] === "--no-live") {
      checkLive = false;
    }
  }

  return { chainId, showHistory, checkLive };
}

export async function inspectDeployments(): Promise<void> {
  const { chainId, showHistory, checkLive } = parseInspectArgs();
  const manifests = listAllManifests();
  const rpcConfig = readRpcConfig();

  console.log(`\n============================================================`);
  console.log(`🔍 NFTMintport Deployment Inspector & Management Helper`);
  console.log(`============================================================\n`);

  if (manifests.length === 0) {
    console.log("No deployments found in deployments/ directory.");
    return;
  }

  const filteredManifests = chainId
    ? manifests.filter((m) => m.chainId === chainId)
    : manifests;

  console.log(`Found ${filteredManifests.length} active deployment manifest(s):\n`);

  let publicClient: any = null;
  if (checkLive) {
    try {
      publicClient = await hre.viem.getPublicClient();
    } catch {
      // In case no node is connected
    }
  }

  for (const m of filteredManifests) {
    const rpcInfo = rpcConfig[String(m.chainId)];
    console.log(`------------------------------------------------------------`);
    console.log(`📌 Network: ${m.networkName} (Chain ID: ${m.chainId})`);
    console.log(`   Environment: ${m.environment.toUpperCase()} | Test Mode: ${m.isTest ? "YES" : "NO"}`);
    console.log(`   Deployer:    ${m.deployer}`);
    console.log(`   Deployed At: ${m.deployedAt}`);
    if (rpcInfo?.explorerUrl) {
      console.log(`   Explorer:    ${rpcInfo.explorerUrl}`);
    }

    console.log(`\n   Deployed Contracts:`);
    for (const [name, rec] of Object.entries(m.contracts)) {
      if (!rec) continue;
      if (name === "Seaport") {
        const s = rec as any;
        let liveStatus = "";
        if (publicClient && (await publicClient.getChainId()) === m.chainId) {
          try {
            const code = await publicClient.getBytecode({ address: s.address as `0x${string}` });
            liveStatus = code && code !== "0x" ? " [🟢 LIVE ON-CHAIN]" : " [🔴 NO CODE]";
          } catch {
            liveStatus = " [⚠️ CHECK ERROR]";
          }
        }
        console.log(`   - [Seaport v${s.version}]${liveStatus}`);
        console.log(`     Address: ${s.address} (${s.mode})`);
        console.log(`     Conduit: ${s.conduitController}`);
      } else {
        const c = rec as any;
        let liveStatus = "";
        if (publicClient && (await publicClient.getChainId()) === m.chainId) {
          try {
            const code = await publicClient.getBytecode({ address: c.address as `0x${string}` });
            liveStatus = code && code !== "0x" ? " [🟢 LIVE ON-CHAIN]" : " [🔴 NO CODE]";
          } catch {
            liveStatus = " [⚠️ CHECK ERROR]";
          }
        }
        console.log(`   - [${name}]${liveStatus}`);
        console.log(`     Address:  ${c.address}`);
        console.log(`     TestOnly: ${c.testOnly ?? false}`);
        if (c.args && c.args.length > 0) {
          console.log(`     Args:     ${JSON.stringify(c.args)}`);
        }
      }
    }
    console.log("");
  }

  // History inspection
  const runs = listDeploymentRuns(chainId);
  console.log(`============================================================`);
  console.log(`📜 Recent Deployment History Logs (${runs.length} total run(s)):`);
  console.log(`============================================================`);

  const displayRuns = showHistory ? runs : runs.slice(0, 5);
  if (displayRuns.length === 0) {
    console.log("No history run records found in deployments/history/.");
  } else {
    for (const run of displayRuns) {
      const contractNames = Object.keys(run.contracts).join(", ") || "(none)";
      console.log(`• Run ID:    ${run.runId}`);
      console.log(`  Timestamp: ${run.timestamp} | Chain: ${run.chainId} (${run.networkName})`);
      console.log(`  Deployer:  ${run.deployer}`);
      console.log(`  Contracts: ${contractNames}`);
      if (run.seaport) {
        console.log(`  Seaport:   ${run.seaport.address} (${run.seaport.mode})`);
      }
      console.log("");
    }
    if (!showHistory && runs.length > 5) {
      console.log(`ℹ️ Showing 5 most recent runs. Pass '--history' to list all ${runs.length} runs.`);
    }
  }
}

async function main() {
  await inspectDeployments();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Inspector error:", error);
    process.exitCode = 1;
  });
}
