import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  valoraWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { celo, celoAlfajores } from "viem/chains";

const useTestnet = process.env.NEXT_PUBLIC_USE_TESTNET === "true";
const chain = useTestnet ? celoAlfajores : celo;

// Custom wallet list WITHOUT rainbowWallet/injectedWallet to avoid Rainbow
// extension chrome.runtime.sendMessage bug (https://github.com/rainbow-me/browser-extension/issues/1381)
// Rainbow mobile users can connect via WalletConnect
export const wagmiConfig = getDefaultConfig({
  appName: "Haggiaz",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "haggiaz-demo",
  chains: [chain],
  ssr: true,
  wallets: [
    {
      groupName: "Recommended",
      wallets: [valoraWallet, metaMaskWallet, walletConnectWallet],
    },
  ],
});
