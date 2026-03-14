import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { RainbowProvider } from "@/providers/rainbow-provider";
import { ConvexClientProvider } from "@/app/ConvexClientProvider";
import { Header } from "@/components/layout/header";
import { LocalhostWalletHint } from "@/components/layout/localhost-wallet-hint";
import { SyncUserOnConnect } from "@/components/sync-user-on-connect";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased dark", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          <ConvexClientProvider>
            <RainbowProvider>
              <SyncUserOnConnect />
              <Header />
              <LocalhostWalletHint />
              {children}
              <Toaster position="top-center" richColors closeButton />
            </RainbowProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
