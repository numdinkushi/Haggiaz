"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useGroupConfig, useGroupStatus, useGroupExists, useJoinGroup } from "@/hooks/use-haggiaz";
import { GroupStatus } from "@/lib/enums";
import { formatAmount, formatAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { ANIMATION } from "@/lib/constants";

function useGroupId(): `0x${string}` | undefined {
  const params = useParams();
  const id = params.groupId as string;
  if (!id || !id.startsWith("0x") || id.length !== 66) return undefined;
  return id as `0x${string}`;
}

export default function JoinPage() {
  const groupId = useGroupId();
  const { address, isConnected } = useAccount();
  const { data: exists } = useGroupExists(groupId);
  const { data: config, isLoading: configLoading } = useGroupConfig(groupId);
  const { data: status } = useGroupStatus(groupId);
  const { join, isPending } = useJoinGroup();

  if (!groupId) {
    return (
      <div className="min-h-svh px-6 pt-28 pb-16">
        <p className="text-center text-muted-foreground">Invalid group ID.</p>
      </div>
    );
  }

  if (configLoading || !config) {
    return (
      <div className="min-h-svh px-6 pt-28 pb-16">
        <p className="text-center text-muted-foreground">
          {exists === false ? "Group not found." : "Loading…"}
        </p>
      </div>
    );
  }

  const { name, creator, contributionAmount, maxMembers } = config;
  const isOpen = status !== undefined && Number(status) === GroupStatus.Open;

  return (
    <div className="min-h-svh px-6 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION.DURATION_NORMAL }}
        className="mx-auto max-w-md"
      >
        <Card>
          <CardHeader>
            <CardTitle>Join {name || "group"}</CardTitle>
            <CardDescription>
              {formatAmount(contributionAmount)} USDm per round · {Number(maxMembers)} members max
            </CardDescription>
            <Badge variant="secondary" className="mt-2 w-fit">
              {isOpen ? "Open" : "Not accepting members"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Creator</p>
              <p className="font-mono text-sm">{formatAddress(creator)}</p>
            </div>

            {!isConnected ? (
              <p className="text-center text-muted-foreground">Connect your wallet to join.</p>
            ) : !isOpen ? (
              <p className="text-center text-muted-foreground">This group is no longer accepting new members.</p>
            ) : (
              <Button onClick={() => join(groupId)} disabled={isPending} className="w-full">
                {isPending ? "Joining…" : "Join group"}
              </Button>
            )}

            <Link href={ROUTES.GROUPS}>
              <Button variant="ghost" className="w-full">
                Back to groups
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
