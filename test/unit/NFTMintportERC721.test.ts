import { expect } from "chai";
import hre from "hardhat";
import { getAddress, zeroAddress } from "viem";

describe("NFTMintportERC721 Unit Tests", () => {
  async function deployFixture() {
    const [owner, alice, bob, operator] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    const nft = await hre.viem.deployContract("NFTMintportERC721", [
      "Test Collection",
      "TEST",
      owner.account.address,
    ]);
    return { nft, owner, alice, bob, operator, publicClient };
  }

  describe("Initialization", () => {
    it("should set correct name, symbol, and owner", async () => {
      const { nft, owner } = await deployFixture();
      expect(await nft.read.name()).to.equal("Test Collection");
      expect(await nft.read.symbol()).to.equal("TEST");
      expect(getAddress((await nft.read.owner()) as string)).to.equal(getAddress(owner.account.address));
    });
  });

  describe("Minting", () => {
    it("should allow owner to mint token and set token URI", async () => {
      const { nft, alice, publicClient } = await deployFixture();
      const uri = "ipfs://QmTestMetadata1";

      const hash = await nft.write.mint([alice.account.address, uri]);
      await publicClient.waitForTransactionReceipt({ hash });

      expect(getAddress((await nft.read.ownerOf([1n])) as string)).to.equal(getAddress(alice.account.address));
      expect(await nft.read.tokenURI([1n])).to.equal(uri);

      const events = await nft.getEvents.NFTMinted();
      expect(events.length).to.equal(1);
      const args = events[0].args as { to: string; tokenId: bigint; uri: string };
      expect(getAddress(args.to)).to.equal(getAddress(alice.account.address));
      expect(args.tokenId).to.equal(1n);
      expect(args.uri).to.equal(uri);
    });

    it("should auto-increment token IDs", async () => {
      const { nft, alice } = await deployFixture();
      await nft.write.mint([alice.account.address, "ipfs://Qm1"]);
      await nft.write.mint([alice.account.address, "ipfs://Qm2"]);

      expect(getAddress((await nft.read.ownerOf([1n])) as string)).to.equal(getAddress(alice.account.address));
      expect(getAddress((await nft.read.ownerOf([2n])) as string)).to.equal(getAddress(alice.account.address));
    });

    it("should revert if non-owner tries to mint", async () => {
      const { nft, alice } = await deployFixture();
      const aliceNft = await hre.viem.getContractAt(
        "NFTMintportERC721",
        nft.address,
        { client: { wallet: alice } }
      );

      await expect(
        aliceNft.write.mint([alice.account.address, "ipfs://QmDenied"])
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should revert if recipient is zero address", async () => {
      const { nft } = await deployFixture();
      await expect(
        nft.write.mint([zeroAddress, "ipfs://QmTest"])
      ).to.be.rejectedWith("ZeroAddressRecipient");
    });

    it("should revert if URI is empty", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mint([alice.account.address, ""])
      ).to.be.rejectedWith("EmptyTokenURI");
    });
  });

  describe("Burning", () => {
    it("should allow token owner to burn", async () => {
      const { nft, alice } = await deployFixture();
      await nft.write.mint([alice.account.address, "ipfs://QmToBurn"]);

      const aliceNft = await hre.viem.getContractAt(
        "NFTMintportERC721",
        nft.address,
        { client: { wallet: alice } }
      );

      await aliceNft.write.burn([1n]);

      await expect(nft.read.ownerOf([1n])).to.be.rejectedWith("ERC721NonexistentToken");
    });

    it("should allow approved operator to burn", async () => {
      const { nft, alice, operator } = await deployFixture();
      await nft.write.mint([alice.account.address, "ipfs://QmToBurn"]);

      const aliceNft = await hre.viem.getContractAt(
        "NFTMintportERC721",
        nft.address,
        { client: { wallet: alice } }
      );
      await aliceNft.write.setApprovalForAll([operator.account.address, true]);

      const operatorNft = await hre.viem.getContractAt(
        "NFTMintportERC721",
        nft.address,
        { client: { wallet: operator } }
      );
      await operatorNft.write.burn([1n]);

      await expect(nft.read.ownerOf([1n])).to.be.rejectedWith("ERC721NonexistentToken");
    });

    it("should revert if unauthorized user attempts to burn", async () => {
      const { nft, alice, bob } = await deployFixture();
      await nft.write.mint([alice.account.address, "ipfs://QmToBurn"]);

      const bobNft = await hre.viem.getContractAt(
        "NFTMintportERC721",
        nft.address,
        { client: { wallet: bob } }
      );

      await expect(bobNft.write.burn([1n])).to.be.rejectedWith("UnauthorizedCaller");
    });

    it("should revert if burning a nonexistent token", async () => {
      const { nft } = await deployFixture();
      await expect(nft.write.burn([999n])).to.be.rejectedWith("ERC721NonexistentToken");
    });
  });
});
