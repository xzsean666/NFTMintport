import { expect } from "chai";
import hre from "hardhat";
import { parseEther, zeroAddress, getAddress } from "viem";
import { NFTMintportClient, ItemType, OrderType } from "../../sdk/src";

describe("SDK Orders & Seaport Module Unit Tests", () => {
  async function setupFixture() {
    const [seller, buyer, operator] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const client = new NFTMintportClient({
      publicClient,
      walletClient: seller,
    });

    const buyerClient = new NFTMintportClient({
      publicClient,
      walletClient: buyer,
    });

    // Deploy NFT and Token for approval testing
    const nft = await client.nft.deployERC721({
      name: "Orders Test Collection",
      symbol: "OTC",
      initialOwner: seller.account.address,
    });

    const token = await client.token.deploy();

    return {
      client,
      buyerClient,
      seller,
      buyer,
      operator,
      publicClient,
      nftAddress: nft.address,
      tokenAddress: token.address,
    };
  }

  describe("Order Building", () => {
    it("should build valid OrderComponents for ERC-20 listing", async () => {
      const { client, seller, nftAddress, tokenAddress } = await setupFixture();

      const price = parseEther("50");
      const components = await client.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price,
        currency: tokenAddress,
        durationSeconds: 3600,
      });

      expect(getAddress(components.offerer)).to.equal(getAddress(seller.account.address));
      expect(components.orderType).to.equal(OrderType.FULL_OPEN);

      // Offer item
      expect(components.offer.length).to.equal(1);
      expect(components.offer[0].itemType).to.equal(ItemType.ERC721);
      expect(getAddress(components.offer[0].token)).to.equal(getAddress(nftAddress));
      expect(components.offer[0].identifierOrCriteria).to.equal(1n);
      expect(components.offer[0].startAmount).to.equal(1n);

      // Consideration item
      expect(components.consideration.length).to.equal(1);
      expect(components.consideration[0].itemType).to.equal(ItemType.ERC20);
      expect(getAddress(components.consideration[0].token)).to.equal(getAddress(tokenAddress));
      expect(components.consideration[0].startAmount).to.equal(price);
      expect(getAddress(components.consideration[0].recipient)).to.equal(getAddress(seller.account.address));
    });

    it("should build valid OrderComponents for Native ETH listing", async () => {
      const { client, seller, nftAddress } = await setupFixture();

      const price = parseEther("0.75");
      const components = await client.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 2n,
        price,
      });

      expect(components.consideration[0].itemType).to.equal(ItemType.NATIVE);
      expect(components.consideration[0].token).to.equal(zeroAddress);
      expect(components.consideration[0].startAmount).to.equal(price);
    });
  });

  describe("EIP-712 Hashing & Signing", () => {
    it("should compute deterministic order hash", async () => {
      const { client, seller, nftAddress, tokenAddress } = await setupFixture();

      const components = await client.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price: parseEther("100"),
        currency: tokenAddress,
        salt: 123456789n,
      });

      const hash1 = await client.orders.getOrderHash(components);
      const hash2 = await client.orders.getOrderHash(components);

      expect(hash1).to.match(/^0x[a-fA-F0-9]{64}$/);
      expect(hash1).to.equal(hash2);
    });

    it("should generate valid 65-byte EIP-712 signature and bundle into Order", async () => {
      const { client, seller, nftAddress, tokenAddress } = await setupFixture();

      const components = await client.orders.createListing({
        offerer: seller.account.address,
        nftAddress,
        tokenId: 1n,
        price: parseEther("100"),
        currency: tokenAddress,
      });

      const signature = await client.orders.signOrder(components, seller);
      // 65 bytes = 130 hex characters + 0x prefix = 132 chars
      expect(signature).to.match(/^0x[a-fA-F0-9]{130}$/);

      const order = client.orders.buildOrder(components, signature);
      expect(order.parameters.offerer).to.equal(components.offerer);
      expect(order.parameters.totalOriginalConsiderationItems).to.equal(1n);
      expect(order.signature).to.equal(signature);
    });
  });

  describe("Approval Helpers", () => {
    it("should check and execute NFT approval only when needed", async () => {
      const { client, operator, nftAddress } = await setupFixture();

      // First check: not approved, should execute approval
      const firstCheck = await client.trading.checkAndApproveNFT(nftAddress, operator.account.address);
      expect(firstCheck.needed).to.be.true;
      expect(firstCheck.hash).to.match(/^0x[a-fA-F0-9]{64}$/);

      // Second check: now approved, should return needed: false
      const secondCheck = await client.trading.checkAndApproveNFT(nftAddress, operator.account.address);
      expect(secondCheck.needed).to.be.false;
      expect(secondCheck.hash).to.be.undefined;
    });

    it("should check and execute ERC-20 token approval only when needed", async () => {
      const { client, operator, tokenAddress } = await setupFixture();
      const amount = parseEther("500");

      // First check: allowance is 0, should approve
      const firstCheck = await client.trading.checkAndApproveToken(tokenAddress, amount, operator.account.address);
      expect(firstCheck.needed).to.be.true;
      expect(firstCheck.hash).to.match(/^0x[a-fA-F0-9]{64}$/);

      // Second check: allowance is now maxUint256, should return needed: false
      const secondCheck = await client.trading.checkAndApproveToken(tokenAddress, amount, operator.account.address);
      expect(secondCheck.needed).to.be.false;
      expect(secondCheck.hash).to.be.undefined;
    });
  });
});
