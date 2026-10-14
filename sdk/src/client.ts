import type { PublicClient, WalletClient, Address } from "viem";
import { NFTModule } from "./modules/nft";
import { TestTokenModule } from "./modules/token";
import { OrdersModule } from "./modules/orders";
import { TradingModule } from "./modules/trading";

export interface NFTMintportClientConfig {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  seaportAddress?: Address;
}

export class NFTMintportClient {
  public readonly publicClient: PublicClient;
  public readonly walletClient?: WalletClient;

  public readonly nft: NFTModule;
  public readonly token: TestTokenModule;
  public readonly orders: OrdersModule;
  public readonly trading: TradingModule;

  constructor(config: NFTMintportClientConfig) {
    this.publicClient = config.publicClient;
    this.walletClient = config.walletClient;

    this.nft = new NFTModule(this.publicClient, this.walletClient);
    this.token = new TestTokenModule(this.publicClient, this.walletClient);
    this.orders = new OrdersModule(this.publicClient, config.seaportAddress);
    this.trading = new TradingModule(this.publicClient, this.walletClient, config.seaportAddress);
  }
}
