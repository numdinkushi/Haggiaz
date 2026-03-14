#!/usr/bin/env node
/**
 * Deprecate an older ERC-8004 agent by setting its registration to active: false.
 * Use this to "retire" duplicate agents (e.g. keep #1841, deprecate #1840).
 *
 * Run: node scripts/deprecate-erc8004-agent.mjs
 * Requires: REGISTER_PRIVATE_KEY (must own the agent NFT), ~0.001 CELO for gas
 *
 * @see https://eips.ethereum.org/EIPS/eip-8004 (registration file "active" field)
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

const PRIVATE_KEY = process.env.REGISTER_PRIVATE_KEY || "0xYOUR_PRIVATE_KEY";
const RPC_URL = process.env.CELO_RPC_URL || "https://forno.celo.org";
const RPC_TIMEOUT_MS = 60_000; // Celo public RPC can be slow

// Agent to deprecate (set active: false). Keep #1841, deprecate #1840.
const AGENT_ID_TO_DEPRECATE = parseInt(process.env.DEPRECATE_AGENT_ID || "1840", 10);

const REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

const abi = parseAbi([
  "function setAgentURI(uint256 agentId, string calldata newURI) external",
  "function ownerOf(uint256 agentId) external view returns (address)",
]);

const deprecatedReg = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "Haggiaz Agent (deprecated)",
  description: "This agent registration is deprecated. Use the active Haggiaz Agent listing instead.",
  image: "https://haggiaz.vercel.app/assets/logo/logo.png",
  active: false,
  x402Support: false,
};

const uri =
  "data:application/json;base64," +
  Buffer.from(JSON.stringify(deprecatedReg)).toString("base64");

async function main() {
  if (PRIVATE_KEY === "0xYOUR_PRIVATE_KEY") {
    console.error("❌ Set REGISTER_PRIVATE_KEY env (must be the owner of the agent NFT)");
    process.exit(1);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(RPC_URL, { timeout: RPC_TIMEOUT_MS }),
  });
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(RPC_URL, { timeout: RPC_TIMEOUT_MS }),
  });

  console.log(`\n🛑 Deprecating agent #${AGENT_ID_TO_DEPRECATE} on Celo...`);
  const owner = await publicClient.readContract({
    address: REGISTRY,
    abi,
    functionName: "ownerOf",
    args: [BigInt(AGENT_ID_TO_DEPRECATE)],
  });

  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    console.error(`❌ You are not the owner of agent #${AGENT_ID_TO_DEPRECATE}. Owner: ${owner}`);
    process.exit(1);
  }

  const hash = await walletClient.writeContract({
    address: REGISTRY,
    abi,
    functionName: "setAgentURI",
    args: [BigInt(AGENT_ID_TO_DEPRECATE), uri],
  });

  console.log(`   TX: https://celoscan.io/tx/${hash}`);
  console.log(`   ⏳ Confirming...`);

  await publicClient.waitForTransactionReceipt({ hash });

  console.log(`\n✅ Agent #${AGENT_ID_TO_DEPRECATE} deprecated (active: false).`);
  console.log(`   Agentscan may still list it; it will show as inactive/deprecated.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
