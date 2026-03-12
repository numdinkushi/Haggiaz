/**
 * Token addresses from env (no hardcoding). Fallbacks from Celo docs if unset.
 */
const defaults = {
  usdmAlfajores: "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b" as const,
  usdmMainnet: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const,
};

export const TOKEN_ADDRESSES = {
  celoTestnet: {
    usdm: (process.env.USDM_ALFAJORES || defaults.usdmAlfajores) as `0x${string}`,
  },
  celoMainnet: {
    usdm: (process.env.USDM_MAINNET || defaults.usdmMainnet) as `0x${string}`,
  },
} as const;
