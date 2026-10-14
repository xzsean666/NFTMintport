import { expect } from "chai";
import hre from "hardhat";
import { parseEther, getAddress } from "viem";
import { NFTMintportClient } from "../../sdk/src";

describe("SDK Core & Contract Modules Unit Tests", () => {
  async function setupFixture() {
    const [deployer, user, spender] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const client = new NFTMintportClient({
      publicClient,
      walletClient: deployer,
    });

    return { client, deployer, user, spender, publicClient };
  }

  describe("Client Instantiation", () => {
    it("should instantiate client with publicClient and walletClient", async () => {
      const { client, deployer, publicClient } = await setupFixture();
      expect(client.publicClient).to.equal(publicClient);
      expect(client.walletClient).to.equal(deployer);
      expect(client.nft).to.be.ok;
      expect(client.token).to.be.ok;
    });

    it("should work with read-only client without walletClient", async () => {
      const { publicClient } = await setupFixture();
      const readClient = new NFTMintportClient({ publicClient });
      expect(readClient.walletClient).to.be.undefined;
      expect(readClient.nft).to.be.ok;
      expect(readClient.token).to.be.ok;
    });
  });

  describe("NFTModule Operations", () => {
    it("should deploy ERC-721, mint token, and read owner and tokenURI", async () => {
      const { client, user, deployer } = await setupFixture();

      // Deploy ERC-721
      const deployResult = await client.nft.deployERC721({
        name: "SDK Collection",
        symbol: "SDK721",
        initialOwner: deployer.account.address,
      });

      expect(deployResult.address).to.match(/^0x[a-fA-F0-9]{40}$/);

      // Mint token
      const uri = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const mintResult = await client.nft.mintERC721({
        nftAddress: deployResult.address,
        to: user.account.address,
        uri,
      });

      expect(mintResult.receipt.status).to.equal("success");

      // Verify owner
      const owner = await client.nft.getOwnerOf(deployResult.address, 1n);
      expect(getAddress(owner)).to.equal(getAddress(user.account.address));

      // Verify token URI
      const tokenUri = await client.nft.getTokenURI(deployResult.address, 1n);
      expect(tokenUri).to.equal(uri);
    });

    it("should deploy ERC-1155, mint tokens, and query balances", async () => {
      const { client, user, deployer } = await setupFixture();

      const initialUri = "https://api.nftmintport.io/erc1155/{id}.json";
      const deployResult = await client.nft.deployERC1155({
        uri: initialUri,
        initialOwner: deployer.account.address,
      });

      expect(deployResult.address).to.match(/^0x[a-fA-F0-9]{40}$/);

      // Mint single
      const mintResult = await client.nft.mintERC1155({
        nftAddress: deployResult.address,
        to: user.account.address,
        id: 42n,
        amount: 250n,
      });

      expect(mintResult.receipt.status).to.equal("success");

      const balance = await client.nft.getBalanceOfERC1155(
        deployResult.address,
        user.account.address,
        42n
      );
      expect(balance).to.equal(250n);

      // Query URI
      const uri = await client.nft.getURIERC1155(deployResult.address, 42n);
      expect(uri).to.equal(initialUri);
    });

    it("should deploy TestMintNFT, perform permissionless single and batch mints via SDK", async () => {
      const { client, user } = await setupFixture();
      const defaultUri = "ipfs://default-test-metadata";

      // 1. Deploy TestMintNFT
      const deployResult = await client.nft.deployTestNFT({
        name: "SDK Test NFT",
        symbol: "SDKTNFT",
        defaultURI: defaultUri,
      });

      expect(deployResult.address).to.match(/^0x[a-fA-F0-9]{40}$/);

      // 2. Permissionless mint with default URI
      const mint1 = await client.nft.mintTestNFT({
        nftAddress: deployResult.address,
        to: user.account.address,
      });
      expect(mint1.receipt.status).to.equal("success");
      expect(await client.nft.getOwnerOf(deployResult.address, 1n)).to.equal(
        getAddress(user.account.address)
      );
      expect(await client.nft.getTokenURI(deployResult.address, 1n)).to.equal(defaultUri);

      // 3. Permissionless mint with custom URI
      const customUri = "ipfs://custom-metadata-2";
      const mint2 = await client.nft.mintTestNFT({
        nftAddress: deployResult.address,
        to: user.account.address,
        uri: customUri,
      });
      expect(mint2.receipt.status).to.equal("success");
      expect(await client.nft.getTokenURI(deployResult.address, 2n)).to.equal(customUri);

      // 4. Batch mint
      const batchMint = await client.nft.mintBatchTestNFT({
        nftAddress: deployResult.address,
        to: user.account.address,
        count: 3n,
      });
      expect(batchMint.receipt.status).to.equal("success");
      expect(await client.nft.getOwnerOf(deployResult.address, 5n)).to.equal(
        getAddress(user.account.address)
      );
    });
  });


  describe("TokenModule Operations", () => {
    it("should deploy TestMintToken, mint tokens, and read balance", async () => {
      const { client, user } = await setupFixture();

      const deployResult = await client.token.deploy();
      expect(deployResult.address).to.match(/^0x[a-fA-F0-9]{40}$/);

      const mintAmount = parseEther("1000");
      const mintResult = await client.token.mint({
        tokenAddress: deployResult.address,
        to: user.account.address,
        amount: mintAmount,
      });

      expect(mintResult.receipt.status).to.equal("success");

      const balance = await client.token.getBalance(deployResult.address, user.account.address);
      expect(balance).to.equal(mintAmount);
    });

    it("should approve spender and query allowance", async () => {
      const { client, spender, deployer } = await setupFixture();

      const deployResult = await client.token.deploy();
      const approveAmount = parseEther("500");

      const approveResult = await client.token.approve({
        tokenAddress: deployResult.address,
        spender: spender.account.address,
        amount: approveAmount,
      });

      expect(approveResult.receipt.status).to.equal("success");

      const allowance = await client.token.getAllowance(
        deployResult.address,
        deployer.account.address,
        spender.account.address
      );
      expect(allowance).to.equal(approveAmount);
    });
  });
});
