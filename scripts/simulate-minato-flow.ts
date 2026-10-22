import * as fs from "fs";
import * as path from "path";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseAbi,
  formatEther,
  formatUnits,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

// 1. 读取 /ssd0/git/NFTMintport/.env 文件获取 Private Key
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = vals.join("=").trim();
      }
    }
  }
}

const MORIUSA_ADDRESS = "0xc252a473DC466de3799149A2616ccc625832F40C" as `0x${string}`;
const USDC_ADDRESS = "0x2C2e569e3Df89c55Ba46Ce52248Ae180379d0B31" as `0x${string}`;
const SEAPORT_ADDRESS = "0xbae7B318A137b68eB78c1f22e5B59FcDf4d50E19" as `0x${string}`;

const RPC_URL = "https://rpc.minato.soneium.org";
const BACKEND_BASE_URL = "https://ems-dev-10011.002788.xyz";

const soneiumMinato = defineChain({
  id: 1946,
  name: "Soneium Minato",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
});

const NFT_ABI = parseAbi([
  "function mint(address to) external returns (uint256)",
  "function mintBatch(address to, uint256 count) external returns (uint256[])",
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

const USDC_ABI = parseAbi([
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address owner) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]);

const SEAPORT_ABI = [
  {
    inputs: [
      {
        components: [
          {
            components: [
              { internalType: "address", name: "offerer", type: "address" },
              { internalType: "address", name: "zone", type: "address" },
              {
                components: [
                  { internalType: "uint8", name: "itemType", type: "uint8" },
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "identifierOrCriteria", type: "uint256" },
                  { internalType: "uint256", name: "startAmount", type: "uint256" },
                  { internalType: "uint256", name: "endAmount", type: "uint256" },
                ],
                internalType: "struct MockSeaportV16.OfferItem[]",
                name: "offer",
                type: "tuple[]",
              },
              {
                components: [
                  { internalType: "uint8", name: "itemType", type: "uint8" },
                  { internalType: "address", name: "token", type: "address" },
                  { internalType: "uint256", name: "identifierOrCriteria", type: "uint256" },
                  { internalType: "uint256", name: "startAmount", type: "uint256" },
                  { internalType: "uint256", name: "endAmount", type: "uint256" },
                  { internalType: "address payable", name: "recipient", type: "address" },
                ],
                internalType: "struct MockSeaportV16.ConsiderationItem[]",
                name: "consideration",
                type: "tuple[]",
              },
              { internalType: "uint8", name: "orderType", type: "uint8" },
              { internalType: "uint256", name: "startTime", type: "uint256" },
              { internalType: "uint256", name: "endTime", type: "uint256" },
              { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
              { internalType: "uint256", name: "salt", type: "uint256" },
              { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
              { internalType: "uint256", name: "totalOriginalConsiderationItems", type: "uint256" },
            ],
            internalType: "struct MockSeaportV16.OrderParameters",
            name: "parameters",
            type: "tuple",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct MockSeaportV16.Order",
        name: "order",
        type: "tuple",
      },
      { internalType: "bytes32", name: "fulfillerConduitKey", type: "bytes32" },
    ],
    name: "fulfillOrder",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "offerer", type: "address" },
          { internalType: "address", name: "zone", type: "address" },
          {
            components: [
              { internalType: "uint8", name: "itemType", type: "uint8" },
              { internalType: "address", name: "token", type: "address" },
              { internalType: "uint256", name: "identifierOrCriteria", type: "uint256" },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
            ],
            internalType: "struct MockSeaportV16.OfferItem[]",
            name: "offer",
            type: "tuple[]",
          },
          {
            components: [
              { internalType: "uint8", name: "itemType", type: "uint8" },
              { internalType: "address", name: "token", type: "address" },
              { internalType: "uint256", name: "identifierOrCriteria", type: "uint256" },
              { internalType: "uint256", name: "startAmount", type: "uint256" },
              { internalType: "uint256", name: "endAmount", type: "uint256" },
              { internalType: "address payable", name: "recipient", type: "address" },
            ],
            internalType: "struct MockSeaportV16.ConsiderationItem[]",
            name: "consideration",
            type: "tuple[]",
          },
          { internalType: "uint8", name: "orderType", type: "uint8" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "endTime", type: "uint256" },
          { internalType: "bytes32", name: "zoneHash", type: "bytes32" },
          { internalType: "uint256", name: "salt", type: "uint256" },
          { internalType: "bytes32", name: "conduitKey", type: "bytes32" },
          { internalType: "uint256", name: "counter", type: "uint256" },
        ],
        internalType: "struct MockSeaportV16.OrderComponents",
        name: "order",
        type: "tuple",
      },
    ],
    name: "getOrderHash",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "offerer", type: "address" }],
    name: "getCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("===============================================================");
  console.log("🚀 Soneium Minato 测试网 NFT 铸造与交易全流程端到端测试");
  console.log("===============================================================");

  const deployerKey = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
  if (!deployerKey) {
    throw new Error("Missing DEPLOYER_PRIVATE_KEY in .env");
  }

  const deployerAccount = privateKeyToAccount(deployerKey);
  console.log(`📌 当前操作账户 (Deployer): ${deployerAccount.address}`);

  const publicClient = createPublicClient({
    chain: soneiumMinato,
    transport: http(RPC_URL),
  });

  const deployerWallet = createWalletClient({
    account: deployerAccount,
    chain: soneiumMinato,
    transport: http(RPC_URL),
  });

  const balance = await publicClient.getBalance({ address: deployerAccount.address });
  console.log(`💰 Deployer ETH 余额: ${formatEther(balance)} ETH`);

  // =========================================================================
  // 步骤 1: 铸造 Moriusa NFT 给自己
  // =========================================================================
  console.log("\n---------------------------------------------------------------");
  console.log("👉 步骤 1: 铸造 Moriusa NFT 给自己 (Deployer)");
  console.log("---------------------------------------------------------------");

  const initialNftBal = await publicClient.readContract({
    address: MORIUSA_ADDRESS,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: [deployerAccount.address],
  });
  console.log(`当前持有 Moriusa NFT 数量: ${initialNftBal.toString()}`);

  console.log(`正在调用 MoriusaTestNFT.mint(${deployerAccount.address})...`);
  const mintNftTx = await deployerWallet.writeContract({
    address: MORIUSA_ADDRESS,
    abi: NFT_ABI,
    functionName: "mint",
    args: [deployerAccount.address],
  });
  console.log(`铸造交易已提交: ${mintNftTx}`);
  const mintReceipt = await publicClient.waitForTransactionReceipt({ hash: mintNftTx });
  console.log(`✅ 铸造完成，区块高度: ${mintReceipt.blockNumber}, 状态: ${mintReceipt.status}`);

  const afterNftBal = await publicClient.readContract({
    address: MORIUSA_ADDRESS,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: [deployerAccount.address],
  });
  console.log(`铸造后持有 Moriusa NFT 数量: ${afterNftBal.toString()} (+1)`);

  // =========================================================================
  // 步骤 2: 铸造 TestUSDC 给自己 (为交易做准备)
  // =========================================================================
  console.log("\n---------------------------------------------------------------");
  console.log("👉 步骤 2: 铸造 1000 TestUSDC 给自己 (Deployer)");
  console.log("---------------------------------------------------------------");

  const initialUsdcBal = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [deployerAccount.address],
  });
  console.log(`当前 USDC 余额: ${formatUnits(initialUsdcBal, 6)} USDC`);

  console.log("正在调用 TestUSDC.mint(1000 USDC)...");
  const mintUsdcTx = await deployerWallet.writeContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "mint",
    args: [deployerAccount.address, 1000_000_000n],
  });
  console.log(`USDC 铸造交易: ${mintUsdcTx}`);
  await publicClient.waitForTransactionReceipt({ hash: mintUsdcTx });

  const afterUsdcBal = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [deployerAccount.address],
  });
  console.log(`✅ USDC 铸造完成，新余额: ${formatUnits(afterUsdcBal, 6)} USDC`);

  // =========================================================================
  // 步骤 3: 模拟 Seaport NFT 交易 (获得 NFT_TRADE 积分)
  // 角色分工:
  // - 卖家 (Seller): 随机临时钱包，拥有 1 枚 NFT，挂单出售 100 USDC
  // - 买家 (Buyer): Deployer，出资 100 USDC 购买 NFT
  // =========================================================================
  console.log("\n---------------------------------------------------------------");
  console.log("👉 步骤 3: 模拟 Seaport NFT 交易 (获得 NFT_TRADE 交易积分)");
  console.log("---------------------------------------------------------------");

  const tempSellerKey = generatePrivateKey();
  const sellerAccount = privateKeyToAccount(tempSellerKey);
  const sellerWallet = createWalletClient({
    account: sellerAccount,
    chain: soneiumMinato,
    transport: http(RPC_URL),
  });

  console.log(`生成测试卖家钱包: ${sellerAccount.address}`);
  console.log("从 Deployer 向卖家转入 0.003 ETH 作为 Gas 费...");
  const fundTx = await deployerWallet.sendTransaction({
    to: sellerAccount.address,
    value: 3000000000000000n, // 0.003 ETH
  });
  await publicClient.waitForTransactionReceipt({ hash: fundTx });
  console.log(`✅ 卖家 Gas 转入成功: ${fundTx}`);

  console.log("卖家铸造待出售的 Moriusa NFT...");
  const sellerMintTx = await sellerWallet.writeContract({
    address: MORIUSA_ADDRESS,
    abi: NFT_ABI,
    functionName: "mint",
    args: [sellerAccount.address],
  });
  const sellerMintReceipt = await publicClient.waitForTransactionReceipt({ hash: sellerMintTx });

  // 解析卖家铸造的 tokenId
  let soldTokenId = 1n;
  for (const log of sellerMintReceipt.logs) {
    if (
      log.topics[0]?.toLowerCase() ===
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" &&
      log.topics[3]
    ) {
      soldTokenId = BigInt(log.topics[3]);
      break;
    }
  }
  console.log(`✅ 卖家获得 Moriusa NFT TokenId: ${soldTokenId}`);

  console.log("卖家授权 Seaport 合约管理 NFT (setApprovalForAll)...");
  const approveNftTx = await sellerWallet.writeContract({
    address: MORIUSA_ADDRESS,
    abi: NFT_ABI,
    functionName: "setApprovalForAll",
    args: [SEAPORT_ADDRESS, true],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveNftTx });
  console.log(`✅ 卖家 NFT 授权完成`);

  // 构建 Seaport 挂单参数 (100 USDC)
  const tradePriceUsdc = 100_000_000n; // 100 USDC (6 decimals)
  const now = BigInt(Math.floor(Date.now() / 1000)) - 10n;
  const deadline = now + 86400n;

  const counter = await publicClient.readContract({
    address: SEAPORT_ADDRESS,
    abi: SEAPORT_ABI,
    functionName: "getCounter",
    args: [sellerAccount.address],
  });

  const orderParameters = {
    offerer: sellerAccount.address,
    zone: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    offer: [
      {
        itemType: 2, // ERC721
        token: MORIUSA_ADDRESS,
        identifierOrCriteria: soldTokenId,
        startAmount: 1n,
        endAmount: 1n,
      },
    ],
    consideration: [
      {
        itemType: 1, // ERC20 (USDC)
        token: USDC_ADDRESS,
        identifierOrCriteria: 0n,
        startAmount: tradePriceUsdc,
        endAmount: tradePriceUsdc,
        recipient: sellerAccount.address,
      },
    ],
    orderType: 0, // FULL_OPEN
    startTime: now,
    endTime: deadline,
    zoneHash: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    salt: 123456789n,
    conduitKey: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    totalOriginalConsiderationItems: 1n,
  };

  const orderComponents = {
    ...orderParameters,
    counter,
  };

  const orderHash = await publicClient.readContract({
    address: SEAPORT_ADDRESS,
    abi: SEAPORT_ABI,
    functionName: "getOrderHash",
    args: [orderComponents],
  });
  console.log(`Seaport 订单哈希 (OrderHash): ${orderHash}`);

  // 卖家签名订单
  const signature = await sellerAccount.sign({ hash: orderHash });
  console.log(`✅ 卖家完成 EIP-712 链下签名`);

  // 买家 (Deployer) 授权 USDC 给 Seaport
  console.log("买家 (Deployer) 授权 100 USDC 给 Seaport...");
  const approveUsdcTx = await deployerWallet.writeContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "approve",
    args: [SEAPORT_ADDRESS, tradePriceUsdc],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveUsdcTx });
  console.log(`✅ 买家 USDC 授权完成`);

  // 买家执行交易 (fulfillOrder)
  console.log("买家 (Deployer) 调用 Seaport.fulfillOrder 执行撮合交易...");
  const fulfillTx = await deployerWallet.writeContract({
    address: SEAPORT_ADDRESS,
    abi: SEAPORT_ABI,
    functionName: "fulfillOrder",
    args: [
      {
        parameters: orderParameters,
        signature,
      },
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ],
  });
  console.log(`撮合交易已提交: ${fulfillTx}`);
  const fulfillReceipt = await publicClient.waitForTransactionReceipt({ hash: fulfillTx });
  console.log(`✅ 交易撮合上链成功！区块高度: ${fulfillReceipt.blockNumber}, 交易哈希: ${fulfillTx}`);

  // 校验最终归属与余额
  const newOwner = await publicClient.readContract({
    address: MORIUSA_ADDRESS,
    abi: NFT_ABI,
    functionName: "ownerOf",
    args: [soldTokenId],
  });
  console.log(`\n🎉 交易验证: NFT #${soldTokenId} 当前所有者为: ${newOwner}`);
  console.log(`是否已成功转移至 Deployer: ${newOwner.toLowerCase() === deployerAccount.address.toLowerCase()}`);

  const finalNftBal = await publicClient.readContract({
    address: MORIUSA_ADDRESS,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: [deployerAccount.address],
  });
  console.log(`Deployer 最终持有 Moriusa NFT 数量: ${finalNftBal.toString()}`);

  // =========================================================================
  // 步骤 4: 等待 Indexer 索引并触发结算，查询 API 验证积分
  // =========================================================================
  console.log("\n---------------------------------------------------------------");
  console.log("👉 步骤 4: 等待 Indexer 采集事件并调用后端结算 API");
  console.log("---------------------------------------------------------------");
  console.log("等待 12 秒让 Indexer 追平最新区块与合约日志...");
  await sleep(12000);

  const todayStr = new Date().toISOString().slice(0, 10);
  console.log(`触发当天 (${todayStr}) 积分结算: POST ${BACKEND_BASE_URL}/v1/settlement/trigger?date=${todayStr}&force=true`);

  try {
    const triggerRes = await fetch(`${BACKEND_BASE_URL}/v1/settlement/trigger?date=${todayStr}&force=true`, {
      method: "POST",
    });
    const triggerJson = await triggerRes.json();
    console.log("结算结果:", JSON.stringify(triggerJson, null, 2));
  } catch (err: any) {
    console.warn("触发结算请求失败或非关键错误:", err.message);
  }

  console.log("\n---------------------------------------------------------------");
  console.log("👉 步骤 5: 查询 Deployer 积分总览与流水 API");
  console.log("---------------------------------------------------------------");

  try {
    const profileUrl = `${BACKEND_BASE_URL}/v1/users/${deployerAccount.address}`;
    console.log(`请求用户积分总览: ${profileUrl}`);
    const res = await fetch(profileUrl);
    const profile = await res.json();
    console.log("用户积分总览 (Summary & Assets):");
    console.log(JSON.stringify(profile, null, 2));

    const historyUrl = `${BACKEND_BASE_URL}/v1/users/${deployerAccount.address}/history`;
    console.log(`\n请求用户积分流水 (History): ${historyUrl}`);
    const histRes = await fetch(historyUrl);
    const history = await histRes.json();
    console.log("积分流水明细 (History):");
    console.log(JSON.stringify(history, null, 2));
  } catch (err: any) {
    console.error("查询 API 失败:", err.message);
  }

  console.log("\n===============================================================");
  console.log("🎉 全部流程测试完毕！");
  console.log("===============================================================");
}

main().catch((err) => {
  console.error("执行出错:", err);
  process.exit(1);
});
