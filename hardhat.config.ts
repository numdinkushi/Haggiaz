import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      forking: process.env.FORK_ALFAJORES
        ? { url: "https://alfajores-forno.celo-testnet.org", enabled: true }
        : undefined,
    },
    celoTestnet: {
      url: process.env.CELO_TESTNET_RPC_URL ?? "https://alfajores-forno.celo-testnet.org",
      chainId: 44787,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    celoMainnet: {
      url: process.env.CELO_MAINNET_RPC_URL ?? "https://forno.celo.org",
      chainId: 42220,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
  },
};

export default config;
