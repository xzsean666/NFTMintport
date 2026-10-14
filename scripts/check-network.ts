import hre from "hardhat";
import { formatEther } from "viem";
import { classifyNetwork } from "./utils/manifest";

async function main() {
  const publicClient = await hre.viem.getPublicClient();
  const [deployer] = await hre.viem.getWalletClients();

  const chainId = await publicClient.getChainId();
  const networkName = hre.network.name;
  const classification = classifyNetwork(chainId);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });

  console.log("================ Network Sanity Check ================");
  console.log(`Network Name:        ${networkName}`);
  console.log(`Chain ID:            ${chainId}`);
  console.log(`Classification:      ${classification.toUpperCase()}`);
  console.log(`Deployer Address:    ${deployer.account.address}`);
  console.log(`Native Balance:      ${formatEther(balance)} ETH`);
  console.log("======================================================");

  if (classification === "mainnet") {
    console.warn("⚠️  WARNING: You are connected to a MAINNET network. Double check your settings!");
  }
}

main().catch((error) => {
  console.error("Network check failed:", error);
  process.exitCode = 1;
});
