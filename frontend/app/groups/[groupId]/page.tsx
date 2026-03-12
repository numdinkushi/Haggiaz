"use client";

import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { useWriteContract } from "wagmi";
import { CONFIG } from "@/lib/config";
import { ERC20_ABI } from "@/lib/abi/erc20";
import { useGroupConfig, useGroupStatus, useCurrentRound, useRecipientForRound, useHasContributed, useContribute, useDisburse, useStartGroup } from "@/hooks/use-haggiaz";
import { GroupStatus } from "@/lib/enums";
import { formatAmount, formatAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ANIMATION } from "@/lib/constants";

function useGroupId(): `0x${string}` | undefined {
  const params = useParams();
  const id = params.groupId as string;
  if (!id || !id.startsWith("0x") || id.length !== 66) return undefined;
  return id as `0x${string}`;
}

export default function GroupDetailPage() {
  const groupId = useGroupId();
  const { address } = useAccount();
  const { writeContract: approveToken } = useWriteContract();

  const { data: config, isLoading: configLoading } = useGroupConfig(groupId);
  const { data: status, isLoading: statusLoading } = useGroupStatus(groupId);
  const { data: currentRound } = useCurrentRound(groupId);
  const { data: recipient } = useRecipientForRound(groupId, currentRound ?? 0);
  const { data: hasContributed } = useHasContributed(groupId, address, currentRound ?? 0);

  const { contribute, isPending: contributePending } = useContribute();
  const { disburse, isPending: disbursePending } = useDisburse();
  const { start, isPending: startPending } = useStartGroup();

  const isLoading = configLoading || statusLoading;
  const isCreator = address && config && config.creator.toLowerCase() === address.toLowerCase();
  const isRecipient = address && recipient && recipient.toLowerCase() === address.toLowerCase();
  const statusNum = status !== undefined ? Number(status) : undefined;
  const canContribute = statusNum === GroupStatus.Active && !hasContributed && address;
  const canDisburse = statusNum === GroupStatus.Active && isRecipient && hasContributed;
  const canStart = statusNum === GroupStatus.Open && isCreator;

  const handleApprove = () => {
    if (!config) return;
    const amount = config.contributionAmount;
    approveToken({
      address: config.token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.treasury, amount],
    });
  };

  if (!groupId) {
    return (
      <div className="min-h-svh px-6 pt-28 pb-16">
        <p className="text-center text-muted-foreground">Invalid group ID.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-svh px-6 pt-28 pb-16">
        <p className="text-center text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-svh px-6 pt-28 pb-16">
        <p className="text-center text-muted-foreground">Group not found.</p>
      </div>
    );
  }

  const { name, creator, contributionAmount, maxMembers } = config;

  return (
    <div className="min-h-svh px-6 pt-28 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: ANIMATION.DURATION_NORMAL }}
        className="mx-auto max-w-2xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{name || "Unnamed group"}</CardTitle>
                <CardDescription className="mt-1">
                  {formatAmount(contributionAmount)} USDm · {Number(maxMembers)} members
                </CardDescription>
              </div>
              <Badge variant={statusNum === GroupStatus.Active ? "default" : "secondary"}>
                {statusNum === GroupStatus.Open && "Open"}
                {statusNum === GroupStatus.Active && "Active"}
                {statusNum === GroupStatus.Completed && "Completed"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground">Creator</p>
              <p className="font-mono text-sm">{formatAddress(creator)}</p>
            </div>

            {statusNum === GroupStatus.Active && (
              <div>
                <p className="text-sm text-muted-foreground">Current round</p>
                <p className="font-semibold">{currentRound?.toString() ?? "—"}</p>
                {recipient && (
                  <p className="mt-1 text-sm">
                    Recipient: <span className="font-mono">{formatAddress(recipient)}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {canStart && (
                <Button onClick={() => start(groupId)} disabled={startPending}>
                  {startPending ? "Starting…" : "Start group"}
                </Button>
              )}
              {canContribute && (
                <>
                  <Button variant="outline" onClick={handleApprove}>
                    Approve USDm
                  </Button>
                  <Button onClick={() => contribute(groupId)} disabled={contributePending}>
                    {contributePending ? "Processing…" : "Contribute"}
                  </Button>
                </>
              )}
              {canDisburse && (
                <Button onClick={() => disburse(groupId)} disabled={disbursePending}>
                  {disbursePending ? "Processing…" : "Claim pot"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
