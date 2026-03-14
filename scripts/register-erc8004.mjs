#!/usr/bin/env node
/**
 * Register Haggiaz AI agent on ERC-8004 (Celo).
 * Required for hackathon verification on https://agentscan.info
 *
 * Run: node scripts/register-erc8004.mjs
 * Requires: ~0.01 CELO for gas, private key in REGISTER_PRIVATE_KEY env
 *
 * @see https://howto8004.com
 * @see https://eips.ethereum.org/EIPS/eip-8004
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

// ✏️ EDIT THESE or set via env
const PRIVATE_KEY =
  process.env.REGISTER_PRIVATE_KEY || "0xYOUR_PRIVATE_KEY";
const AGENT_NAME = process.env.AGENT_NAME || "Haggiaz Agent";
const AGENT_DESC =
  process.env.AGENT_DESC ||
  "AI assistant for Haggiaz group savings on Celo. Helps members understand contributions, rounds, disbursements, and group chat.";
const RPC_URL =
  process.env.CELO_RPC_URL || "https://forno.celo.org";

// Optional — add your endpoints for discoverability
const FRONTEND_URL = process.env.FRONTEND_URL || "https://haggiaz.vercel.app";
const IMAGE_URL =
  process.env.IMAGE_URL || `${FRONTEND_URL}/assets/logo/logo.png`;
const SERVICES = [
  { name: "web", endpoint: FRONTEND_URL },
  // { name: "A2A", endpoint: `${FRONTEND_URL}/.well-known/agent-card.json`, version: "0.3.0" },
  // { name: "MCP", endpoint: "https://mcp.haggiaz.com/", version: "2025-06-18" },
];

// ERC-8004 Identity Registry (same address on all chains via CREATE2)
const REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

const abi = parseAbi([
  "function register(string agentURI) returns (uint256 agentId)",
]);

const reg = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: AGENT_NAME,
  description: AGENT_DESC,
  image: IMAGE_URL,
  active: true,
  x402Support: false,
};
if (SERVICES.length) reg.services = SERVICES;

const uri =
  "data:application/json;base64," +
  Buffer.from(JSON.stringify(reg)).toString("base64");

async function main() {
  if (PRIVATE_KEY === "0xYOUR_PRIVATE_KEY") {
    console.error("❌ Set REGISTER_PRIVATE_KEY env or edit PRIVATE_KEY in script");
    process.exit(1);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(RPC_URL),
  });

  console.log(`\n🤖 Registering "${AGENT_NAME}" on Celo from ${account.address}...`);
  const bal = await publicClient.getBalance({ address: account.address });
  console.log(`   Balance: ${(Number(bal) / 1e18).toFixed(4)} CELO`);

  if (bal < BigInt(1e16)) {
    console.error("⚠️ Low balance — need ~0.01 CELO for gas");
    process.exit(1);
  }

  const hash = await walletClient.writeContract({
    address: REGISTRY,
    abi,
    functionName: "register",
    args: [uri],
  });

  console.log(`   TX: https://celoscan.io/tx/${hash}`);
  console.log(`   ⏳ Confirming...`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const transferTopic =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
  const log = receipt.logs.find(
    (l) =>
      l.topics[0] === transferTopic &&
      l.address.toLowerCase() === REGISTRY.toLowerCase()
  );
  const id = log?.topics[3] ? BigInt(log.topics[3]).toString() : "?";

  console.log(`\n✅ Registered! Agent #${id}`);
  console.log(`   NFT: https://celoscan.io/nft/${REGISTRY}/${id}`);
  console.log(`   Agentscan: https://agentscan.info/agents (select Celo)\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
