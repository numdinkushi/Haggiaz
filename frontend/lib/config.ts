/**
 * Contract addresses and chain config. Source from addresses.json.
 */

import addresses from "../../addresses.json";

export const CONFIG = {
  chain: "celoMainnet" as const,
  haggiaz: addresses.celoMainnet.haggiaz as `0x${string}`,
  treasury: addresses.celoMainnet.treasury as `0x${string}`,
  usdm: addresses.tokens.celoMainnet.usdm as `0x${string}`,
} as const;

export const CHAIN_ID = 42220; // Celo mainnet
