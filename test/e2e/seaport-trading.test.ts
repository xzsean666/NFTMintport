import { expect } from "chai";
import hre from "hardhat";
import { parseEther, getAddress, zeroAddress } from "viem";
import { NFTMintportClient, SEAPORT_V16_ADDRESS } from "../../sdk/src";
import { deployLocalSeaportFixture } from "../fixtures/seaport";

describe("E2E Seaport Trading Workflows", () => {
  async function setupE2EFixture() {
    // 1. Setup local Seaport fixture at canonical address
    await deployLocalSeaportFixture();

    // 2. Setup wallet clients
    const [deployer, seller, buyer, brokeBuyer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    // 3. Setup SDK clients
    const sellerClient = new NFTMintportClient({
      publicClient,
      walletClient: seller,
    });

    const buyerClient = new NFTMintportClient({
      publicClient,
      walletClient: buyer,
    });

    const brokeBuyerClient = new NFTMintportClient({
      publicClient,
      walletClient: brokeBuyer,
    });

    // 4. Deploy NFT collection & Test token
    const nftDeploy = await sellerClient.nft.deployERC721({
      name: "E2E Trading Collection",
      symbol: "E2E",
      initialOwner: seller.account.address,
    });

    const tokenDeploy = await sellerClient.token.deploy();

    return {
      sellerClient,
      buyerClient,
      brokeBuyerClient,
      seller,
      buyer,
      brokeBuyer,
      publicClient,
      nftAddress: nftDeploy.address,
      tokenAddress: tokenDeploy.address,
    };
  }

  describe("Scenario 1: Test Token Settlement (TestMintToken)", () => {
    it("should mint NFT, mint test token, list on Seaport, fulfill, and assert balances & ownership", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        buyer,
        nftAddress,
        tokenAddress,
      } = await setupE2EFixture();

      // 1. Mint NFT #1 to Seller
      const mintNftResult = await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://e2e-nft-1",
      });
      expect(mintNftResult.receipt.status).to.equal("success");
      expect(getAddress(await sellerClient.nft.getOwnerOf(nftAddress, 1n))).to.equal(
        getAddress(seller.account.address)
      );

      // 2. Mint 500 NMTT to Buyer via permissionless mint
      const mintAmount = parseEther("500");
      const mintTokenResult = await buyerClient.token.mint({
        tokenAddress,
        to: buyer.account.address,
        amount: mintAmount,
      });
      expect(mintTokenResult.receipt.status).to.equal("success");
      expect(await buyerClient.token.getBalance(tokenAddress, buyer.account.address)).to.equal(mintAmount);

      // 3. Seller creates and signs a Seaport listing for 50 NMTT
      const listingPrice = parseEther("50");
      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price: listingPrice,
        currency: tokenAddress,
        durationSeconds: 86400,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      // 4. Seller approves Seaport for NFT #1
      const sellerApproval = await sellerClient.trading.checkAndApproveNFT(nftAddress);
      expect(sellerApproval.needed).to.be.true;

      // 5. Buyer approves Seaport for 50 NMTT
      const buyerApproval = await buyerClient.trading.checkAndApproveToken(tokenAddress, listingPrice);
      expect(buyerApproval.needed).to.be.true;

      // 6. Buyer fulfills order
      const fulfillResult = await buyerClient.trading.fulfillOrder(order);
      expect(fulfillResult.receipt.status).to.equal("success");

      // 7. Verification:
      // - Seller received 50 NMTT
      expect(await sellerClient.token.getBalance(tokenAddress, seller.account.address)).to.equal(listingPrice);

      // - Buyer paid 50 NMTT, remaining balance is 450 NMTT
      expect(await buyerClient.token.getBalance(tokenAddress, buyer.account.address)).to.equal(parseEther("450"));

      // - Buyer now owns NFT #1
      expect(getAddress(await sellerClient.nft.getOwnerOf(nftAddress, 1n))).to.equal(
        getAddress(buyer.account.address)
      );
    });
  });

  describe("Scenario 2: Native ETH Settlement", () => {
    it("should list NFT for 0.5 ETH, fulfill with native value, and verify seller ETH increase and buyer ownership", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        buyer,
        nftAddress,
        publicClient,
      } = await setupE2EFixture();

      // 1. Mint NFT #2 to Seller
      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://e2e-nft-2",
      });

      // 2. Seller approves Seaport for NFT collection
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      // 3. Seller creates and signs listing for 0.5 ETH
      const ethPrice = parseEther("0.5");
      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n, // token ID 1 in this isolated fixture
        price: ethPrice,
        currency: zeroAddress,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      // 4. Record pre-trade seller balance
      const sellerPreEth = await publicClient.getBalance({ address: seller.account.address });

      // 5. Buyer fulfills order (SDK automatically supplies native value from consideration)
      const fulfillResult = await buyerClient.trading.fulfillOrder(order);
      expect(fulfillResult.receipt.status).to.equal("success");

      // 6. Assert Seller ETH increased by exactly 0.5 ETH
      const sellerPostEth = await publicClient.getBalance({ address: seller.account.address });
      expect(sellerPostEth - sellerPreEth).to.equal(ethPrice);

      // 7. Assert Buyer is now owner of NFT
      expect(getAddress(await sellerClient.nft.getOwnerOf(nftAddress, 1n))).to.equal(
        getAddress(buyer.account.address)
      );
    });
  });

  describe("Scenario 3: Failure Paths & Invariant Defense", () => {
    it("should revert if order has expired", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        nftAddress,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://expired-nft",
      });
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price: parseEther("1"),
      });

      // Set endTime to the past
      components.endTime = components.startTime - 100n;

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      await expect(buyerClient.trading.fulfillOrder(order)).to.be.rejectedWith(
        /OrderExpired|0xc56873ba/
      );
    });

    it("should revert if buyer has insufficient ERC-20 token balance", async () => {
      const {
        sellerClient,
        brokeBuyerClient,
        seller,
        brokeBuyer,
        nftAddress,
        tokenAddress,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://broke-nft",
      });
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      const price = parseEther("100");
      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price,
        currency: tokenAddress,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      // Broke buyer approves but has 0 balance
      await brokeBuyerClient.trading.checkAndApproveToken(tokenAddress, price);

      await expect(brokeBuyerClient.trading.fulfillOrder(order)).to.be.rejected;
    });

    it("should revert if seller has not approved Seaport for the NFT", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        buyer,
        nftAddress,
        tokenAddress,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://unapproved-nft",
      });
      // Deliberately DO NOT approve NFT for Seaport

      const price = parseEther("10");
      await buyerClient.token.mint({
        tokenAddress,
        to: buyer.account.address,
        amount: price,
      });
      await buyerClient.trading.checkAndApproveToken(tokenAddress, price);

      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price,
        currency: tokenAddress,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      await expect(buyerClient.trading.fulfillOrder(order)).to.be.rejected;
    });

    it("should revert if order has been cancelled by offerer", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        buyer,
        nftAddress,
        tokenAddress,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://cancelled-nft",
      });
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      const price = parseEther("10");
      await buyerClient.token.mint({
        tokenAddress,
        to: buyer.account.address,
        amount: price,
      });
      await buyerClient.trading.checkAndApproveToken(tokenAddress, price);

      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price,
        currency: tokenAddress,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      // Seller cancels the order on-chain
      const cancelResult = await sellerClient.trading.cancelOrder([components]);
      expect(cancelResult.receipt.status).to.equal("success");

      // Subsequent fulfillment attempt should revert
      await expect(buyerClient.trading.fulfillOrder(order)).to.be.rejectedWith(
        /OrderIsCancelled|0xe3cc7933/
      );
    });

    it("should revert if non-offerer attempts to cancel someone else's order", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        nftAddress,
        tokenAddress,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://grief-target",
      });
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price: parseEther("10"),
        currency: tokenAddress,
      });

      // Malicious buyer attempts to cancel seller's order
      await expect(buyerClient.trading.cancelOrder([components])).to.be.rejectedWith(
        /UnauthorizedCaller|0x5c427cd9/
      );
    });

    it("should revert if order has not yet reached startTime", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        nftAddress,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://future-nft",
      });
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      // Future start time (+1 hour)
      const futureStartTime = BigInt(Math.floor(Date.now() / 1000) + 3600);
      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price: parseEther("0.1"),
        startTime: futureStartTime,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      await expect(buyerClient.trading.fulfillOrder(order)).to.be.rejectedWith(
        /OrderNotYetActive|0xd514afa4/
      );
    });

    it("should refund excess native ETH when buyer sends more than listing price", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        buyer,
        nftAddress,
        publicClient,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://refund-nft",
      });
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      const price = parseEther("0.5");
      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price,
        currency: zeroAddress,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      const buyerPreEth = await publicClient.getBalance({ address: buyer.account.address });

      // Direct fulfillment call sending 2 ETH instead of 0.5 ETH
      const { request } = await publicClient.simulateContract({
        address: buyerClient.trading.seaportAddress,
        abi: [
          {
            type: "function",
            name: "fulfillOrder",
            inputs: [
              {
                name: "order",
                type: "tuple",
                components: [
                  {
                    name: "parameters",
                    type: "tuple",
                    components: [
                      { name: "offerer", type: "address" },
                      { name: "zone", type: "address" },
                      {
                        name: "offer",
                        type: "tuple[]",
                        components: [
                          { name: "itemType", type: "uint8" },
                          { name: "token", type: "address" },
                          { name: "identifierOrCriteria", type: "uint256" },
                          { name: "startAmount", type: "uint256" },
                          { name: "endAmount", type: "uint256" },
                        ],
                      },
                      {
                        name: "consideration",
                        type: "tuple[]",
                        components: [
                          { name: "itemType", type: "uint8" },
                          { name: "token", type: "address" },
                          { name: "identifierOrCriteria", type: "uint256" },
                          { name: "startAmount", type: "uint256" },
                          { name: "endAmount", type: "uint256" },
                          { name: "recipient", type: "address" },
                        ],
                      },
                      { name: "orderType", type: "uint8" },
                      { name: "startTime", type: "uint256" },
                      { name: "endTime", type: "uint256" },
                      { name: "zoneHash", type: "bytes32" },
                      { name: "salt", type: "uint256" },
                      { name: "conduitKey", type: "bytes32" },
                      { name: "totalOriginalConsiderationItems", type: "uint256" },
                    ],
                  },
                  { name: "signature", type: "bytes" },
                ],
              },
              { name: "fulfillerConduitKey", type: "bytes32" },
            ],
            outputs: [{ name: "fulfilled", type: "bool" }],
            stateMutability: "payable",
          },
        ],
        functionName: "fulfillOrder",
        args: [order, "0x0000000000000000000000000000000000000000000000000000000000000000"],
        account: buyer.account,
        value: parseEther("2.0"), // Overpaying by 1.5 ETH
      });

      const hash = await buyer.writeContract(request as any);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
      const buyerPostEth = await publicClient.getBalance({ address: buyer.account.address });

      // Total buyer expenditure should be price (0.5 ETH) + gas, NOT 2.0 ETH
      const totalSpent = buyerPreEth - buyerPostEth;
      expect(totalSpent - gasUsed).to.equal(price);

      // Verify buyer received NFT
      expect(getAddress(await sellerClient.nft.getOwnerOf(nftAddress, 1n))).to.equal(
        getAddress(buyer.account.address)
      );
    });

    it("should invalidate open orders when offerer increments counter", async () => {
      const {
        sellerClient,
        buyerClient,
        seller,
        buyer,
        nftAddress,
        tokenAddress,
      } = await setupE2EFixture();

      await sellerClient.nft.mintERC721({
        nftAddress,
        to: seller.account.address,
        uri: "ipfs://counter-nft",
      });
      await sellerClient.trading.checkAndApproveNFT(nftAddress);

      const price = parseEther("25");
      await buyerClient.token.mint({
        tokenAddress,
        to: buyer.account.address,
        amount: price,
      });
      await buyerClient.trading.checkAndApproveToken(tokenAddress, price);

      // Seller creates listing with counter = 0
      const components = await sellerClient.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price,
        currency: tokenAddress,
      });

      const signature = await sellerClient.orders.signOrder(components, seller);
      const order = sellerClient.orders.buildOrder(components, signature);

      // Verify initial counter
      expect(await sellerClient.orders.getCounter(seller.account.address)).to.equal(0n);

      // Seller increments counter to bulk invalidate all open listings
      const incResult = await sellerClient.trading.incrementCounter();
      expect(incResult.receipt.status).to.equal("success");
      expect(await sellerClient.orders.getCounter(seller.account.address)).to.equal(1n);

      // Buyer attempting to fulfill the old order will revert with InvalidSignature
      await expect(buyerClient.trading.fulfillOrder(order)).to.be.rejectedWith(
        /InvalidSignature|0x8baa579f/
      );
    });
  });
});
