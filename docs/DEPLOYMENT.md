# NFTMintport — Deployment & Network Guide

## 1. Core Deployment Principles

1. **Verify Before Broadcast:**
   - Always verify Chain ID, Network Name, Deployer Address, and Native Balance before sending any transaction.
2. **Strict Network Isolation:**
   - `Hardhat Network`, `Local Anvil/Hardhat Node`, and `Simulation / eth_call` are the default execution modes.
   - Broadcasting to live public testnets (e.g. Sepolia, Base Sepolia) or mainnets is **strictly prohibited** without explicit user confirmation.
3. **No Hardcoded Secrets:**
   - Private keys and RPC URLs must be loaded exclusively via environment variables (`.env`). Never commit credentials.
4. **Reproducible Manifests:**
   - Every deployment must generate or update a manifest file in `deployments/<network>-<chainId>.json`.

---

## 2. Deployment Manifest Schema

Every deployment record stored in `deployments/` follows this JSON structure:

```json
{
  "schemaVersion": "1.0.0",
  "project": "NFTMintport",
  "environment": "local | testnet | mainnet",
  "chainId": 31337,
  "networkName": "hardhat",
  "deployedAt": "2026-10-14T00:00:00.000Z",
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "contracts": {
    "NFTMintportERC721": {
      "address": "0x...",
      "deploymentTx": "0x...",
      "args": ["NFTMintport Collection", "NMP", "0x..."]
    },
    "NFTMintportERC1155": {
      "address": "0x...",
      "deploymentTx": "0x...",
      "args": ["https://api.example.com/token/{id}.json", "0x..."]
    },
    "TestMintToken": {
      "address": "0x...",
      "deploymentTx": "0x...",
      "testOnly": true
    },
    "Seaport": {
      "mode": "existing | deployed",
      "version": "1.6",
      "address": "0x0000000000000068F116a894984e2DB1123eB395",
      "conduitController": "0x00000000F9490004C103FB2A09CE222342427011"
    }
  }
}
```

---

## 3. Pre-Deployment Verification Checklist

Before running any deployment script:
- [ ] Check `.env` configuration (see `.env.example`).
- [ ] Confirm active network matches intended target (`chainId`).
- [ ] Verify deployer address has sufficient balance for gas.
- [ ] If deploying `TestMintToken`, confirm network is NOT mainnet (or explicit safety override is passed).
- [ ] Run deployment simulation (`eth_call` or local dry-run) first.

---

## 4. Deployment Commands

### Local Deployment (Default)
```bash
# 1. Run local in-memory deployment / simulation
pnpm run deploy:local

# 2. Or against a standalone local node (e.g., hardhat node on port 8545)
npx hardhat run scripts/deploy-all.ts --network localhost
```

### Testnet Deployment (Requires User Confirmation)
```bash
# Verify balance and network first
npx hardhat run scripts/check-network.ts --network sepolia

# Deploy with manifest generation
npx hardhat run scripts/deploy-all.ts --network sepolia
```

### Mainnet Rules
- Deploying `TestMintToken` to mainnet is blocked by default in code.
- Contract deployment requires explicit review of gas prices, compiler verification parameters, and multi-sig or hardware wallet configurations.
