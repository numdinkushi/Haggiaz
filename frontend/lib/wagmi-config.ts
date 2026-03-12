import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { celo } from "viem/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Haggiaz",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "haggiaz-demo",
  chains: [celo],
  ssr: true,
});
