import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { RainbowProvider } from "@/providers/rainbow-provider";
import { Header } from "@/components/layout/header";
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
          <RainbowProvider>
            <Header />
            {children}
          </RainbowProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
