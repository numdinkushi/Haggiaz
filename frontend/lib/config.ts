/**
 * Contract addresses and chain config. Source from addresses.json.
 * Set NEXT_PUBLIC_USE_TESTNET=true to use Celo Alfajores (free faucet CELO).
 */

import addresses from "../../addresses.json";

const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === "true";
const network = useTestnet ? addresses.celoTestnet : addresses.celoMainnet;
const tokens = useTestnet ? addresses.tokens.celoTestnet : addresses.tokens.celoMainnet;

export const CONFIG = {
  chain: useTestnet ? ("celoTestnet" as const) : ("celoMainnet" as const),
  haggiaz: network.haggiaz as `0x${string}`,
  treasury: network.treasury as `0x${string}`,
  usdc: tokens.usdc as `0x${string}`,
} as const;

export const CHAIN_ID = useTestnet ? 44787 : 42220; // Alfajores : Celo mainnet
export const IS_TESTNET = useTestnet;
