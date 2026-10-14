# Contributing to NFTMintport

Thank you for contributing to NFTMintport! This project follows structured engineering standards to ensure high reliability, safety, and verifiable contract behavior.

---

## Prerequisites
- **Node.js:** >= 20.0.0 (tested on Node v24)
- **pnpm:** >= 9.0.0
- **Git**

---

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/xzsean666/NFTMintport.git
   cd NFTMintport
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Compile contracts:
   ```bash
   pnpm run build
   ```

4. Run tests:
   ```bash
   pnpm run test
   ```

---

## Development Principles

- **No Foundry / ethers.js:** All contracts are built with Hardhat and tested using TypeScript + `viem`.
- **Pre-Flight Plans:** Major architectural or contract modifications must follow the plan template specified in `AGENTS.md`.
- **Custom Errors:** Use Solidity custom errors instead of string reverts.
- **Safety First:** Test ERC-20 (`TestMintToken`) must never be deployed to production mainnets.
