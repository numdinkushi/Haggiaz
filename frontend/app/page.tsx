"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ANIMATION } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]" />

      <main className="relative flex min-h-svh flex-col items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: ANIMATION.DURATION_SLOW, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Savings groups,
            <br />
            <span className="text-muted-foreground">on chain.</span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: ANIMATION.DURATION_NORMAL }}
            className="mt-6 text-lg text-muted-foreground"
          >
            Haggiaz brings ROSCA and Chama traditions to Celo. Create a group,
            contribute each round, and receive the pot when it’s your turn.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: ANIMATION.DURATION_NORMAL }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href={ROUTES.CREATE_GROUP}>
              <Button size="lg" className="min-w-[180px]">
                Create a group
              </Button>
            </Link>
            <Link href={ROUTES.GROUPS}>
              <Button variant="outline" size="lg" className="min-w-[180px]">
                Browse groups
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: ANIMATION.DURATION_SLOW }}
          className="mt-24 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {[
            {
              title: "Create",
              desc: "Start a group with USDm on Celo. Set contribution and round duration.",
            },
            {
              title: "Contribute",
              desc: "Each member adds to the pot every round. Join order = receive order.",
            },
            {
              title: "Receive",
              desc: "When it’s your turn, claim the full pot. Simple and transparent.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 1 + i * 0.1,
                duration: ANIMATION.DURATION_NORMAL,
              }}
              className="rounded-xl border border-border/50 bg-card/50 p-6 text-left"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
