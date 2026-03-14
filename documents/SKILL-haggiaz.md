---
name: haggiaz-integration
description: Interact with Haggiaz ROSCA/Chama protocol on Celo. Create groups, join, contribute, disburse. Use when user asks to create a savings group, join a group, contribute, disburse, or query Haggiaz state on Celo.
---

# Haggiaz Agent Integration

## Contract Addresses (Celo Mainnet)

| Contract | Address |
|----------|---------|
| Haggiaz | `0xAfc6C1A51A873cE884a5c5D734620F574146084a` |
| HaggiazTreasury | `0x04d0a0f907D3844AbDA16d9632C5fE900D8ca287` |
| USDm / cUSD (Mento Dollar) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

Load from `haggiaz/addresses.json` or `.env` if custom.

## Flow Overview

1. **Create group** → creator calls `createGroup(name, token, contributionAmount, maxMembers, roundDurationSeconds)`
2. **Join** → members call `join(groupId)` or `joinWithSignature(...)` for invite-only
3. **Start** → creator calls `startGroup(groupId)` when members are in
4. **Contribute** → each member calls `contribute(groupId)` each round (must approve token first)
5. **Disburse** → recipient calls `disburse(groupId)` when all contributed

Join order = receive order (member at index r−1 receives in round r).

## Key Functions

### createGroup
```solidity
createGroup(string name, address token, uint256 contributionAmount, uint256 maxMembers, uint256 roundDurationSeconds)
// or invite-only:
createGroup(name, token, contributionAmount, maxMembers, roundDurationSeconds, true)
```
- `name`: human-readable group name (1–64 chars)
- `token`: ERC20 (USDm, cUSD)
- `contributionAmount`: in token decimals (e.g. 10e6 = 10 USD)
- `roundDurationSeconds`: min 1 day (86400) on mainnet unless owner relaxed limits
- Returns `groupId` (bytes32) from `GroupCreated` event

### join
```solidity
join(bytes32 groupId)
```
- Public groups only. Invite-only groups require `joinWithSignature`.

### joinWithSignature (invite-only)
```solidity
joinWithSignature(bytes32 groupId, uint256 nonce, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
```
- Creator signs EIP-712 `JoinInvite(groupId, member, nonce, deadline)`.

### startGroup
```solidity
startGroup(bytes32 groupId)
```
- Creator only. Group status → Active.

### contribute
```solidity
contribute(bytes32 groupId)
```
- Member must have approved HaggiazTreasury to spend tokens.
- Once per round per member.

### disburse
```solidity
disburse(bytes32 groupId)
```
- Only the round’s recipient. All members must have contributed first.

## View Functions

| Function | Purpose |
|----------|---------|
| `getConfig(groupId)` | creator, token, contributionAmount, maxMembers, roundDurationSeconds |
| `getStatus(groupId)` | 0=Open, 1=Active, 2=Completed, 3=Cancelled |
| `getMembers(groupId)` | member addresses (join order) |
| `getCurrentRound(groupId)` | 1-based round index |
| `getRecipientForRound(groupId, roundIndex)` | who receives in that round |
| `hasContributed(groupId, member, roundIndex)` | contribution status |
| `groupExists(groupId)` | existence check |
| `inviteOnly(groupId)` | true if join requires signature |

## Constraints

- Min contribution: 1e6 (1 unit, 6 decimals)
- Min members: 2, max: 100
- Round duration: 1–365 days (mainnet default)
- Token must be a contract (no EOAs)

## Token Approval

Before `contribute`, caller must approve the **HaggiazTreasury** for the group’s token:

```javascript
// Treasury holds funds per group
const treasuryAddress = "0xbc70035d7F99D21A373eC7ebe69A1Cdb17A71bFb";
await tokenContract.approve(treasuryAddress, amount);  // or type(uint256).max
```

## Scripts / Usage

Use Hardhat scripts or ethers/viem. Example (ethers v6):

```javascript
const haggiaz = new ethers.Contract(HAGGAZ_ADDRESS, HaggiazABI, signer);
const tx = await haggiaz.createGroup("Family Chama", USDM, ethers.parseUnits("10", 6), 5, 86400);
const receipt = await tx.wait();
const event = receipt.logs.find(l => l.fragment?.name === "GroupCreated");
const groupId = event?.args?.[0];
```

For full ABI, use `haggiaz/artifacts/contracts/Haggiaz.sol/Haggiaz.json` after `npm run compile`.
