# Haggiaz Deployment Guide

## Credentials required for mainnet

Before deploying to Celo mainnet, you need:

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | **Yes** | Private key of the deployer wallet (with leading `0x`). Must have enough CELO for gas. |
| `CELO_MAINNET_RPC_URL` | No | RPC URL (default: `https://forno.celo.org`) |
| `USDM_MAINNET` | No | USDm token address (default from Celo docs) |

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your private key to `.env`:
   ```
   PRIVATE_KEY=0x_your_64_char_hex_private_key
   ```

3. Ensure your wallet has CELO for gas (mainnet deployment).

## Deploy to mainnet

```bash
npm run deploy:mainnet
```

Deployed addresses are written to `addresses.json`.

## Deploy to testnet (Alfajores)

```bash
npm run deploy:testnet
```

Get testnet CELO from https://faucet.celo.org

## Optional: custom RPC or tokens

```env
CELO_MAINNET_RPC_URL=https://your-rpc-provider.com
USDM_MAINNET=0x...  # override default USDm
USDM_ALFAJORES=0x...  # for testnet
```
