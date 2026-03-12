"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Image
            src="/assets/logo/logo.png"
            alt="Haggiaz"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
          <span className="text-xl font-semibold tracking-tight text-foreground">
            Haggiaz
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href={ROUTES.GROUPS}>
            <Button variant="ghost" size="sm">
              Groups
            </Button>
          </Link>
          <Link href={ROUTES.CREATE_GROUP}>
            <Button variant="outline" size="sm">
              Create
            </Button>
          </Link>
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </nav>
      </div>
    </motion.header>
  );
}
