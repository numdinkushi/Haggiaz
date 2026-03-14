# ERC-8004 Agent Verification (Hackathon)

Haggiaz must register its AI agent on [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) to be verified on [Agentscan](https://agentscan.info).

## What is ERC-8004?

An onchain identity registry for AI agents. You receive an NFT that:
- Proves your agent’s identity
- Lists your services (web, MCP, A2A, etc.)
- Makes the agent discoverable by others

## Requirements

- **Network:** Celo mainnet
- **Gas:** ~0.01 CELO (cheap on Celo)
- **Wallet:** Private key with CELO for gas

## Register

### 1. Set your private key

```bash
export REGISTER_PRIVATE_KEY=0xYourPrivateKeyHere
```

Or edit `scripts/register-erc8004.mjs` and set `PRIVATE_KEY`.

### 2. Optional: Customize name/description

```bash
export AGENT_NAME="Haggiaz Agent"
export AGENT_DESC="AI assistant for Haggiaz group savings on Celo..."
export FRONTEND_URL="https://your-frontend.vercel.app"
```

### 3. Run the script

From the `haggiaz` directory (where `package.json` lives):

```bash
# If REGISTER_PRIVATE_KEY is set:
npm run register:8004
```

### 4. Confirm on Agentscan

1. Go to [agentscan.info](https://agentscan.info)
2. Open **Networks** and select **Celo**
3. Search for your agent or use the NFT link from the script output

## Resources

- [howto8004.com](https://howto8004.com) – Registration guide
- [ERC-8004 spec](https://eips.ethereum.org/EIPS/eip-8004)
- [Celo ERC-8004 blog](https://blog.celo.org/erc-8004-is-live-on-celo-accelerating-agentic-activity-with-real-world-utility-e30c2a176782)
- [8004scan.io](https://8004scan.io) – Celo 8004 agents explorer
