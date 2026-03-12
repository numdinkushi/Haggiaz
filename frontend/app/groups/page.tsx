"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ANIMATION } from "@/lib/constants";

export default function GroupsPage() {
  return (
    <div className="min-h-svh px-6 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION.DURATION_NORMAL }}
        className="mx-auto max-w-4xl"
      >
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Groups</h1>
            <p className="mt-1 text-muted-foreground">Your savings groups on Celo</p>
          </div>
          <Link href={ROUTES.CREATE_GROUP}>
            <Button>Create group</Button>
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: ANIMATION.DURATION_NORMAL }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24"
        >
          <p className="text-muted-foreground">Connect your wallet to see your groups.</p>
          <p className="mt-1 text-sm text-muted-foreground/80">
            Groups you create or join will appear here.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
