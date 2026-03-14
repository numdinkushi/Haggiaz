/**
 * Token addresses from env (no hardcoding). Default: USDC on Celo.
 */
const defaults = {
  usdcAlfajores: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as const,
  usdcMainnet: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as const,
};

export const TOKEN_ADDRESSES = {
  celoTestnet: {
    usdc: (process.env.USDC_ALFAJORES || defaults.usdcAlfajores) as `0x${string}`,
  },
  celoMainnet: {
    usdc: (process.env.USDC_MAINNET || defaults.usdcMainnet) as `0x${string}`,
  },
} as const;
