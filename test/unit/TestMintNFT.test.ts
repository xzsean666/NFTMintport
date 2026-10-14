import { expect } from "chai";
import hre from "hardhat";
import { getAddress, zeroAddress } from "viem";

describe("TestMintNFT Unit Tests", () => {
  const DEFAULT_URI = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/default.json";

  async function deployFixture() {
    const [deployer, alice, bob, charlie, operator] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    const nft = await hre.viem.deployContract("TestMintNFT", [
      "NFTMintport Test NFT",
      "NMTNFT",
      DEFAULT_URI,
    ]);
    return { nft, deployer, alice, bob, charlie, operator, publicClient };
  }

  describe("Metadata & Initial State", () => {
    it("should initialize name, symbol, defaultURI, and totalMinted", async () => {
      const { nft } = await deployFixture();
      expect(await nft.read.name()).to.equal("NFTMintport Test NFT");
      expect(await nft.read.symbol()).to.equal("NMTNFT");
      expect(await nft.read.defaultURI()).to.equal(DEFAULT_URI);
      expect(await nft.read.totalMinted()).to.equal(0n);
    });

    it("should define MAX_MINT_PER_CALL as 50", async () => {
      const { nft } = await deployFixture();
      expect(await nft.read.MAX_MINT_PER_CALL()).to.equal(50n);
    });
  });

  describe("Permissionless Minting", () => {
    it("should allow any caller to mint with custom URI", async () => {
      const { nft, alice, bob, publicClient } = await deployFixture();
      const customUri = "ipfs://QmCustomMetadataAlice";

      const aliceNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: alice },
      });

      const hash = await aliceNft.write.mint([bob.account.address, customUri]);
      await publicClient.waitForTransactionReceipt({ hash });

      expect(getAddress((await nft.read.ownerOf([1n])) as string)).to.equal(
        getAddress(bob.account.address)
      );
      expect(await nft.read.tokenURI([1n])).to.equal(customUri);
      expect(await nft.read.totalMinted()).to.equal(1n);

      const events = await nft.getEvents.TestNFTMinted();
      expect(events.length).to.equal(1);
      const args = events[0].args as { to: string; tokenId: bigint; uri: string };
      expect(getAddress(args.to)).to.equal(getAddress(bob.account.address));
      expect(args.tokenId).to.equal(1n);
      expect(args.uri).to.equal(customUri);
    });

    it("should allow any caller to mint using default URI", async () => {
      const { nft, charlie } = await deployFixture();

      const charlieNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: charlie },
      });

      await charlieNft.write.mint([charlie.account.address]);

      expect(getAddress((await nft.read.ownerOf([1n])) as string)).to.equal(
        getAddress(charlie.account.address)
      );
      expect(await nft.read.tokenURI([1n])).to.equal(DEFAULT_URI);
      expect(await nft.read.totalMinted()).to.equal(1n);
    });

    it("should auto-increment token IDs across multiple callers", async () => {
      const { nft, alice, bob } = await deployFixture();

      const aliceNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: alice },
      });
      const bobNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: bob },
      });

      await aliceNft.write.mint([alice.account.address]);
      await bobNft.write.mint([bob.account.address]);

      expect(getAddress((await nft.read.ownerOf([1n])) as string)).to.equal(
        getAddress(alice.account.address)
      );
      expect(getAddress((await nft.read.ownerOf([2n])) as string)).to.equal(
        getAddress(bob.account.address)
      );
      expect(await nft.read.totalMinted()).to.equal(2n);
    });
  });

  describe("Permissionless Batch Minting", () => {
    it("should batch mint by count using default URI", async () => {
      const { nft, alice } = await deployFixture();

      const aliceNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: alice },
      });

      await aliceNft.write.mintBatch([alice.account.address, 5n]);

      expect(await nft.read.totalMinted()).to.equal(5n);
      expect(await nft.read.balanceOf([alice.account.address])).to.equal(5n);

      for (let i = 1n; i <= 5n; i++) {
        expect(getAddress((await nft.read.ownerOf([i])) as string)).to.equal(
          getAddress(alice.account.address)
        );
        expect(await nft.read.tokenURI([i])).to.equal(DEFAULT_URI);
      }

      const batchEvents = await nft.getEvents.TestNFTBatchMinted();
      expect(batchEvents.length).to.equal(1);
      const args = batchEvents[0].args as { to: string; startTokenId: bigint; count: bigint };
      expect(getAddress(args.to)).to.equal(getAddress(alice.account.address));
      expect(args.startTokenId).to.equal(1n);
      expect(args.count).to.equal(5n);
    });

    it("should batch mint by specific URIs array", async () => {
      const { nft, bob } = await deployFixture();
      const uris = ["ipfs://uri1", "ipfs://uri2", "ipfs://uri3"];

      const bobNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: bob },
      });

      await bobNft.write.mintBatch([bob.account.address, uris]);

      expect(await nft.read.totalMinted()).to.equal(3n);
      for (let i = 0; i < uris.length; i++) {
        const tokenId = BigInt(i + 1);
        expect(getAddress((await nft.read.ownerOf([tokenId])) as string)).to.equal(
          getAddress(bob.account.address)
        );
        expect(await nft.read.tokenURI([tokenId])).to.equal(uris[i]);
      }
    });
  });

  describe("Guardrails & Revert Invariants", () => {
    it("should revert if mint recipient is zero address", async () => {
      const { nft } = await deployFixture();
      await expect(
        nft.write.mint([zeroAddress, "ipfs://some-uri"])
      ).to.be.rejectedWith("ZeroAddressRecipient");

      await expect(
        nft.write.mint([zeroAddress])
      ).to.be.rejectedWith("ZeroAddressRecipient");
    });

    it("should revert if mint URI is empty string", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mint([alice.account.address, ""])
      ).to.be.rejectedWith("EmptyTokenURI");
    });

    it("should revert if batch count is 0", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mintBatch([alice.account.address, 0n])
      ).to.be.rejectedWith("InvalidMintAmount");
    });

    it("should revert if batch count exceeds MAX_MINT_PER_CALL", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mintBatch([alice.account.address, 51n])
      ).to.be.rejectedWith("ExceedsMaxMintPerCall");
    });

    it("should revert if batch URIs array is empty", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mintBatch([alice.account.address, []])
      ).to.be.rejectedWith("InvalidMintAmount");
    });

    it("should revert if any URI in batch array is empty", async () => {
      const { nft, alice } = await deployFixture();
      await expect(
        nft.write.mintBatch([alice.account.address, ["ipfs://valid", ""]])
      ).to.be.rejectedWith("EmptyTokenURI");
    });
  });

  describe("Burning & Operator Permissions", () => {
    it("should allow token owner to burn token", async () => {
      const { nft, alice } = await deployFixture();
      await nft.write.mint([alice.account.address]);

      const aliceNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: alice },
      });

      await aliceNft.write.burn([1n]);
      await expect(nft.read.ownerOf([1n])).to.be.rejectedWith("ERC721NonexistentToken");
      expect(await nft.read.balanceOf([alice.account.address])).to.equal(0n);
    });

    it("should allow approved operator to burn token", async () => {
      const { nft, alice, operator } = await deployFixture();
      await nft.write.mint([alice.account.address]);

      const aliceNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: alice },
      });
      await aliceNft.write.setApprovalForAll([operator.account.address, true]);

      const opNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: operator },
      });
      await opNft.write.burn([1n]);

      await expect(nft.read.ownerOf([1n])).to.be.rejectedWith("ERC721NonexistentToken");
    });

    it("should revert if unauthorized caller attempts to burn token", async () => {
      const { nft, alice, bob } = await deployFixture();
      await nft.write.mint([alice.account.address]);

      const bobNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: bob },
      });

      await expect(bobNft.write.burn([1n])).to.be.rejectedWith("UnauthorizedCaller");
    });

    it("should revert when burning nonexistent token", async () => {
      const { nft, alice } = await deployFixture();
      const aliceNft = await hre.viem.getContractAt("TestMintNFT", nft.address, {
        client: { wallet: alice },
      });

      await expect(aliceNft.write.burn([999n])).to.be.rejectedWith("ERC721NonexistentToken");
    });
  });
});
