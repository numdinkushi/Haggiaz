# Haggiaz

**ROSCA / Chama savings groups on Celo.** Industry-standard, SOLID, modular smart contracts.

## Overview

Haggiaz brings informal savings groups (ROSCAs, Chamas, Susu) on-chain. Members contribute a fixed amount each round; one member receives the pot per round. Built for Celo with cUSD/USDm.

## Architecture

```
contracts/
├── interfaces/
│   ├── IHaggiazGroup.sol    # Group state & round logic
│   ├── IHaggiazRegistry.sol # Factory / discovery
│   └── ITokenTreasury.sol   # Token custody abstraction
├── libraries/
│   ├── HaggiazErrors.sol    # Custom errors (DRY)
│   └── HaggiazConstants.sol # Shared constants
├── Haggiaz.sol              # Main protocol (Registry + Group orchestration)
└── HaggiazTreasury.sol      # ERC20 custody per group
```

- **SOLID**: Single-responsibility interfaces, dependency inversion via IHaggiazRegistry/IHaggiazGroup
- **DRY**: Shared errors and constants
- **Modular**: Treasury separated; group logic isolated

## Security

- **ReentrancyGuard** — Protects `contribute` and `disburse` from reentrancy
- **Pausable** — Owner can pause/unpause in emergencies
- **Token contract check** — Rejects EOAs as token (must be contract)
- **EIP-712 invite-only** — Optional `createGroup(..., true)` for invite-only groups; members join via `joinWithSignature(groupId, nonce, deadline, v, r, s)` with creator-signed EIP-712 message

## Flow

1. **Create** — Creator sets token, contribution amount, max members, round duration
2. **Join** — Members join while status is `Open`
3. **Start** — Creator calls `startGroup` when ready
4. **Contribute** — Each round, members call `contribute` (ERC20 transfer)
5. **Disburse** — Recipient calls `disburse` when all have contributed; receives pot

Receive order = join order (member at index `r-1` receives in round `r`).

## Scripts

```bash
npm install
npm run compile
npm run deploy:testnet   # Celo Alfajores
npm run deploy:mainnet   # Celo Mainnet
```

## Environment

```env
PRIVATE_KEY=0x...
CELO_TESTNET_RPC_URL=https://alfajores-forno.celo-testnet.org
CELO_MAINNET_RPC_URL=https://forno.celo.org
```

## Celo Token Addresses

Token addresses are loaded from `.env` (see `.env.example`). Defaults from [Celo docs](https://docs.celo.org/token-addresses):

- `USDM_ALFAJORES` – Alfajores USDm (default in config)
- `USDM_MAINNET` – Mainnet USDm (default in config)

## License

MIT
