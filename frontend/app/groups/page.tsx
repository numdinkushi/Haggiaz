"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ANIMATION } from "@/lib/constants";

export default function GroupsPage() {
  const convexGroups = useQuery(api.groups.list);

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
          {convexGroups && convexGroups.length > 0 ? (
            <div className="flex flex-col gap-2 w-full max-w-md px-4">
              <p className="text-muted-foreground font-medium">
                {convexGroups.length} group(s)
              </p>
              {convexGroups.map((g) => (
                <Link
                  key={g._id}
                  href={ROUTES.GROUP(g.groupId)}
                  className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">{g.name}</span> · {g.memberCount}/
                  {g.maxMembers} members
                  {g.status && (
                    <span className="ml-2 text-muted-foreground">· {g.status}</span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">Connect your wallet to see your groups.</p>
              <p className="mt-1 text-sm text-muted-foreground/80">
                Create a group to get started — it will appear here and on chain.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
