# Haggiaz Agent Integration Guide

How to call Haggiaz from an AI agent or external system (e.g. Synthesis hackathon agent).

## Quick Reference

- **Network**: Celo mainnet (chainId 42220)
- **Haggiaz**: `0xAfc6C1A51A873cE884a5c5D734620F574146084a`
- **Treasury**: `0x04d0a0f907D3844AbDA16d9632C5fE900D8ca287`
- **USDm**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`

## Minimal ABI (for agent tooling)

```json
[
  "function createGroup(string,address,uint256,uint256,uint256) returns (bytes32)",
  "function createGroup(string,address,uint256,uint256,uint256,bool) returns (bytes32)",
  "function join(bytes32)",
  "function joinWithSignature(bytes32,uint256,uint256,uint8,bytes32,bytes32)",
  "function startGroup(bytes32)",
  "function contribute(bytes32)",
  "function disburse(bytes32)",
  "function getConfig(bytes32) view returns ((string,address,address,uint256,uint256,uint256))",
  "function getStatus(bytes32) view returns (uint8)",
  "function getMembers(bytes32) view returns (address[])",
  "function getCurrentRound(bytes32) view returns (uint256)",
  "function getRecipientForRound(bytes32,uint256) view returns (address)",
  "function hasContributed(bytes32,address,uint256) view returns (bool)",
  "function groupExists(bytes32) view returns (bool)",
  "function inviteOnly(bytes32) view returns (bool)",
  "event GroupCreated(bytes32 indexed groupId, address indexed creator, address token, uint256 contributionAmount, uint256 maxMembers)"
]
```

## Task Mapping for Agents

| User intent | Action | Notes |
|-------------|--------|-------|
| "Create a savings group" | `createGroup(name, token, amount, maxMembers, roundDuration)` | Name 1–64 chars; use USDm, parse amount (e.g. 10 → 10e6) |
| "Join group X" | `join(groupId)` or `joinWithSignature(...)` | Check `inviteOnly(groupId)` first |
| "Start the group" | `startGroup(groupId)` | Creator only |
| "Contribute to my group" | `contribute(groupId)` | Approve Treasury first |
| "Claim my payout" | `disburse(groupId)` | Recipient only, all must contribute |
| "Who gets paid this round?" | `getRecipientForRound(groupId, getCurrentRound(groupId))` | Read-only |
| "Who has contributed?" | Loop `hasContributed(groupId, member, round)` | Read-only |
| "Group status?" | `getStatus(groupId)`, `getConfig(groupId)`, `getMembers(groupId)` | Read-only |

## Invite-Only Flow (joinWithSignature)

1. Creator creates group with `createGroup(name, ..., true)` (last arg = inviteOnly).
2. Creator signs EIP-712:
   - Domain: name `Haggiaz`, version `1`, chainId 42220, contract address
   - Type: `JoinInvite(bytes32 groupId,address member,uint256 nonce,uint256 deadline)`
3. Member calls `joinWithSignature(groupId, nonce, deadline, v, r, s)`.
4. Nonce must be unique per invite.

Use `_hashTypedDataV4` / `signTypedData` equivalents in your stack.

## RPC

- Default: `https://forno.celo.org`
- Override via `CELO_MAINNET_RPC_URL` in env.

## Cursor Skill

The project includes `.cursor/skills/haggiaz/SKILL.md` so Cursor can handle Haggiaz tasks when you mention create group, join, contribute, disburse, etc.
