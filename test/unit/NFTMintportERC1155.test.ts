import { expect } from "chai";
import hre from "hardhat";
import { getAddress, zeroAddress } from "viem";

describe("NFTMintportERC1155 Unit Tests", () => {
  async function deployFixture() {
    const [owner, alice, bob] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    const initialUri = "https://api.nftmintport.io/metadata/{id}.json";
    const nft = await hre.viem.deployContract("NFTMintportERC1155", [
      initialUri,
      owner.account.address,
    ]);
    return { nft, owner, alice, bob, initialUri, publicClient };
  }

  describe("Initialization", () => {
    it("should set initial URI and owner", async () => {
      const { nft, owner, initialUri } = await deployFixture();
      expect(await nft.read.uri([1n])).to.equal(initialUri);
      expect(getAddress((await nft.read.owner()) as string)).to.equal(getAddress(owner.account.address));
    });
  });

  describe("Single Minting", () => {
    it("should allow owner to mint tokens with supply tracking", async () => {
      const { nft, alice } = await deployFixture();
      const tokenId = 1n;
      const amount = 100n;

      await nft.write.mint([alice.account.address, tokenId, amount, "0x"]);

      expect(await nft.read.balanceOf([alice.account.address, tokenId])).to.equal(amount);
      expect(await nft.read.totalSupply([tokenId])).to.equal(amount);
      expect(await nft.read.exists([tokenId])).to.be.true;
    });

    it("should revert if non-owner attempts to mint", async () => {
      const { nft, alice } = await deployFixture();
      const aliceNft = await hre.viem.getContractAt(
        "NFTMintportERC1155",
        nft.address,
        { client: { wallet: alice } }
      );

      await expect(
        aliceNft.write.mint([alice.account.address, 1n, 10n, "0x"])
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should revert if recipient is zero address", async () => {
      const { nft } = await deployFixture();
      await expect(
        nft.write.mint([zeroAddress, 1n, 10n, "0x"])
      ).to.be.rejectedWith("ZeroAddressRecipient");
    });

    it("should revert if amount is zero", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mint([alice.account.address, 1n, 0n, "0x"])
      ).to.be.rejectedWith("InvalidAmount");
    });
  });

  describe("Batch Minting", () => {
    it("should allow owner to batch mint tokens", async () => {
      const { nft, alice } = await deployFixture();
      const ids = [1n, 2n, 3n];
      const amounts = [10n, 20n, 30n];

      await nft.write.mintBatch([alice.account.address, ids, amounts, "0x"]);

      expect(await nft.read.balanceOf([alice.account.address, 1n])).to.equal(10n);
      expect(await nft.read.balanceOf([alice.account.address, 2n])).to.equal(20n);
      expect(await nft.read.balanceOf([alice.account.address, 3n])).to.equal(30n);
      expect(await nft.read.totalSupply([1n])).to.equal(10n);
      expect(await nft.read.totalSupply([2n])).to.equal(20n);
      expect(await nft.read.totalSupply([3n])).to.equal(30n);
    });

    it("should revert if batch parameters have mismatched lengths or are empty", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mintBatch([alice.account.address, [1n, 2n], [10n], "0x"])
      ).to.be.rejectedWith("InvalidAmount");

      await expect(
        nft.write.mintBatch([alice.account.address, [], [], "0x"])
      ).to.be.rejectedWith("InvalidAmount");
    });

    it("should revert if any batch amount is zero", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mintBatch([alice.account.address, [1n, 2n], [10n, 0n], "0x"])
      ).to.be.rejectedWith("InvalidAmount");
    });
  });

  describe("URI Management", () => {
    it("should allow owner to update URI", async () => {
      const { nft } = await deployFixture();
      const newUri = "https://custom.meta/{id}.json";
      await nft.write.setURI([newUri]);
      expect(await nft.read.uri([1n])).to.equal(newUri);
    });

    it("should revert if non-owner tries to update URI", async () => {
      const { nft, alice } = await deployFixture();
      const aliceNft = await hre.viem.getContractAt(
        "NFTMintportERC1155",
        nft.address,
        { client: { wallet: alice } }
      );
      await expect(
        aliceNft.write.setURI(["https://hack.meta/{id}.json"])
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", () => {
    it("should allow holder to burn tokens and update supply", async () => {
      const { nft, alice } = await deployFixture();
      await nft.write.mint([alice.account.address, 1n, 50n, "0x"]);

      const aliceNft = await hre.viem.getContractAt(
        "NFTMintportERC1155",
        nft.address,
        { client: { wallet: alice } }
      );

      await aliceNft.write.burn([alice.account.address, 1n, 20n]);

      expect(await nft.read.balanceOf([alice.account.address, 1n])).to.equal(30n);
      expect(await nft.read.totalSupply([1n])).to.equal(30n);
    });

    it("should allow holder to burnBatch tokens and update supply", async () => {
      const { nft, alice } = await deployFixture();
      await nft.write.mintBatch([alice.account.address, [1n, 2n], [100n, 200n], "0x"]);

      const aliceNft = await hre.viem.getContractAt(
        "NFTMintportERC1155",
        nft.address,
        { client: { wallet: alice } }
      );

      await aliceNft.write.burnBatch([alice.account.address, [1n, 2n], [40n, 50n]]);

      expect(await nft.read.balanceOf([alice.account.address, 1n])).to.equal(60n);
      expect(await nft.read.balanceOf([alice.account.address, 2n])).to.equal(150n);
      expect(await nft.read.totalSupply([1n])).to.equal(60n);
      expect(await nft.read.totalSupply([2n])).to.equal(150n);
    });

    it("should revert if unauthorized account tries to burn another's tokens", async () => {
      const { nft, alice, bob } = await deployFixture();
      await nft.write.mint([alice.account.address, 1n, 50n, "0x"]);

      const bobNft = await hre.viem.getContractAt(
        "NFTMintportERC1155",
        nft.address,
        { client: { wallet: bob } }
      );

      await expect(
        bobNft.write.burn([alice.account.address, 1n, 10n])
      ).to.be.rejectedWith("ERC1155MissingApprovalForAll");
    });
  });
});
