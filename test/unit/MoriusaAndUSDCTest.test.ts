import { expect } from "chai";
import hre from "hardhat";
import { zeroAddress } from "viem";

describe("MoriusaTestNFT and TestUSDC Unit Tests", () => {
  describe("MoriusaTestNFT", () => {
    async function deployMoriusaFixture() {
      const [deployer, alice] = await hre.viem.getWalletClients();
      const publicClient = await hre.viem.getPublicClient();
      const nft = await hre.viem.deployContract("MoriusaTestNFT", [
        "Moriusa Main NFT Collection",
        "MORIUSA_NFT",
        "ipfs://bafybeic7vcmk2xxdv234bylg2n2q6o52kgh6tqu5i4w2p3yfxq6a2m4k6e/moriusa.json",
      ]);
      return { nft, deployer, alice, publicClient };
    }

    it("should initialize with Moriusa metadata defaults", async () => {
      const { nft } = await deployMoriusaFixture();
      expect(await nft.read.name()).to.equal("Moriusa Main NFT Collection");
      expect(await nft.read.symbol()).to.equal("MORIUSA_NFT");
      expect(await nft.read.defaultURI()).to.equal(
        "ipfs://bafybeic7vcmk2xxdv234bylg2n2q6o52kgh6tqu5i4w2p3yfxq6a2m4k6e/moriusa.json"
      );
    });

    it("should allow permissionless minting of Moriusa NFT", async () => {
      const { nft, alice } = await deployMoriusaFixture();
      const aliceNft = await hre.viem.getContractAt(
        "MoriusaTestNFT",
        nft.address,
        { client: { wallet: alice } }
      );

      await aliceNft.write.mint([alice.account.address]);
      expect(await nft.read.balanceOf([alice.account.address])).to.equal(1n);
      expect(((await nft.read.ownerOf([1n])) as string).toLowerCase()).to.equal(alice.account.address.toLowerCase());
      expect(await nft.read.tokenURI([1n])).to.equal(
        "ipfs://bafybeic7vcmk2xxdv234bylg2n2q6o52kgh6tqu5i4w2p3yfxq6a2m4k6e/moriusa.json"
      );
    });

    it("should allow batch minting of Moriusa NFTs", async () => {
      const { nft, alice } = await deployMoriusaFixture();
      const aliceNft = await hre.viem.getContractAt(
        "MoriusaTestNFT",
        nft.address,
        { client: { wallet: alice } }
      );

      await aliceNft.write.mintBatch([alice.account.address, 3n]);
      expect(await nft.read.balanceOf([alice.account.address])).to.equal(3n);
    });
  });

  describe("TestUSDC", () => {
    async function deployUSDCFixture() {
      const [deployer, alice] = await hre.viem.getWalletClients();
      const publicClient = await hre.viem.getPublicClient();
      const usdc = await hre.viem.deployContract("TestUSDC");
      return { usdc, deployer, alice, publicClient };
    }

    it("should initialize with 6 decimals and USDC symbol", async () => {
      const { usdc } = await deployUSDCFixture();
      expect(await usdc.read.name()).to.equal("USD Coin (Test)");
      expect(await usdc.read.symbol()).to.equal("USDC");
      expect(await usdc.read.decimals()).to.equal(6);
    });

    it("should allow permissionless minting of test USDC", async () => {
      const { usdc, alice } = await deployUSDCFixture();
      const mintAmount = 1_000_000_000n; // 1,000 USDC (6 decimals)

      const aliceUSDC = await hre.viem.getContractAt(
        "TestUSDC",
        usdc.address,
        { client: { wallet: alice } }
      );

      await aliceUSDC.write.mint([alice.account.address, mintAmount]);
      expect(await usdc.read.balanceOf([alice.account.address])).to.equal(mintAmount);
    });

    it("should revert if mint amount exceeds MAX_MINT_PER_CALL", async () => {
      const { usdc, alice } = await deployUSDCFixture();
      const excessiveAmount = 1_000_000_000_001n; // > 1,000,000 USDC
      await expect(
        usdc.write.mint([alice.account.address, excessiveAmount])
      ).to.be.rejectedWith("ExceedsMaxMintPerCall");
    });

    it("should revert if recipient is zero address", async () => {
      const { usdc } = await deployUSDCFixture();
      await expect(
        usdc.write.mint([zeroAddress, 100_000_000n])
      ).to.be.rejectedWith("ZeroAddressRecipient");
    });
  });
});
