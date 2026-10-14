import { expect } from "chai";
import hre from "hardhat";
import { parseEther, zeroAddress, getAddress } from "viem";

describe("TestMintToken Unit Tests", () => {
  async function deployFixture() {
    const [deployer, alice, bob] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    const token = await hre.viem.deployContract("TestMintToken");
    return { token, deployer, alice, bob, publicClient };
  }

  describe("Metadata & Initial State", () => {
    it("should initialize name, symbol, and decimals", async () => {
      const { token } = await deployFixture();
      expect(await token.read.name()).to.equal("NFTMintport Test Token");
      expect(await token.read.symbol()).to.equal("NMTT");
      expect(await token.read.decimals()).to.equal(18);
      expect(await token.read.totalSupply()).to.equal(0n);
    });

    it("should define MAX_MINT_PER_CALL as 1,000,000 ether", async () => {
      const { token } = await deployFixture();
      expect(await token.read.MAX_MINT_PER_CALL()).to.equal(parseEther("1000000"));
    });
  });

  describe("Minting", () => {
    it("should allow permissionless minting within limits", async () => {
      const { token, alice } = await deployFixture();
      const mintAmount = parseEther("500");

      const aliceToken = await hre.viem.getContractAt(
        "TestMintToken",
        token.address,
        { client: { wallet: alice } }
      );

      await aliceToken.write.mint([alice.account.address, mintAmount]);

      expect(await token.read.balanceOf([alice.account.address])).to.equal(mintAmount);
      expect(await token.read.totalSupply()).to.equal(mintAmount);
    });

    it("should emit TestTokenMinted and Transfer events", async () => {
      const { token, publicClient, alice } = await deployFixture();
      const mintAmount = parseEther("10");

      const hash = await token.write.mint([alice.account.address, mintAmount]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      expect(receipt.status).to.equal("success");

      const mintEvents = await token.getEvents.TestTokenMinted();
      expect(mintEvents.length).to.equal(1);
      const args = mintEvents[0].args as { to: string; amount: bigint };
      expect(args.to.toLowerCase()).to.equal(alice.account.address.toLowerCase());
      expect(args.amount).to.equal(mintAmount);
    });

    it("should revert if recipient is zero address", async () => {
      const { token } = await deployFixture();
      await expect(
        token.write.mint([zeroAddress, parseEther("100")])
      ).to.be.rejectedWith("ZeroAddressRecipient");
    });

    it("should revert if mint amount is zero", async () => {
      const { token, alice } = await deployFixture();
      await expect(
        token.write.mint([alice.account.address, 0n])
      ).to.be.rejectedWith("InvalidMintAmount");
    });

    it("should revert if mint amount exceeds MAX_MINT_PER_CALL", async () => {
      const { token, alice } = await deployFixture();
      const excessiveAmount = parseEther("1000001");
      await expect(
        token.write.mint([alice.account.address, excessiveAmount])
      ).to.be.rejectedWith("ExceedsMaxMintPerCall");
    });

    it("should allow multiple mints accumulating beyond MAX_MINT_PER_CALL across calls", async () => {
      const { token, alice } = await deployFixture();
      const maxPerCall = parseEther("1000000");

      await token.write.mint([alice.account.address, maxPerCall]);
      await token.write.mint([alice.account.address, maxPerCall]);

      expect(await token.read.balanceOf([alice.account.address])).to.equal(parseEther("2000000"));
    });
  });
});
