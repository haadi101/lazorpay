# LazorPay: Gasless Subscriptions on Solana

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-%239945FF.svg?style=for-the-badge&logo=Solana&logoColor=white)

> **Building Netflix-style recurring billing on-chain without seed phrases.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Devnet-blue)](https://lazorpay-rflda.ondigitalocean.app/)

LazorPay is a gasless subscription starter kit built on the **LazorKit** Smart Wallet infrastructure. It demonstrates how to implement recurring payments and biometric authentication on Solana, enabling a Web2-like experience for Web3 payments.

## Features

- **Biometric Authentication**: Sign transactions with FaceID/TouchID via Passkeys.
- **Gasless Paymaster**: Users pay subscription fees in USDC; the app handles SOL network fees.
- **Token Allowances**: Recurring billing logic using standard SPL Token Approve/TransferFrom.
- **Smart Wallet Integration**: Seamlessly create and manage PDA-based wallets.

## Trade-offs & Configuration

- **Devnet Only**: This demo is configured for Solana Devnet.
- **USDC Requirement**: The subscription flow requires the user to have Devnet USDC. A "Gasless Transfer" demo is included to help fund the wallet.
- **Client-Side Keys**: For demo purposes, the Paymaster API key is exposed client-side. In production, this **MUST** be proxied through a backend (Relayer).

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Rename `.env.example` to `.env` and add your LazorKit API Key.
   ```env
   VITE_LAZORKIT_API_KEY=your_api_key_here
   ```

3. **Run the Dapp**
   ```bash
   npm run dev
   ```

## 📚 Guides & Tutorials

- **[Tutorial 1: Passkey Wallet Setup](docs/tutorial-1-passkey-wallet.md)**  
  Learn how to integrate the LazorKit SDK and create a biometric wallet.

- **[Tutorial 2: Gasless Transactions](docs/tutorial-2-gasless-transactions.md)**  
  Implement gasless transfers using the Paymaster and handle transaction lifecycles safely.

## Tech Stack

- **Frontend**: React, Lucide React
- **Blockchain**: Solana Web3.js, SPL Token
- **Wallet**: LazorKit SDK
- **Design**: "Acid Green" Cyberpunk UI

---

_Built for the LazorKit Bounty. professionally maintained._
