"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { useWriteContract } from "wagmi";
import { CONFIG } from "@/lib/config";
import { ERC20_ABI } from "@/lib/abi/erc20";
import { useGroupConfig, useGroupStatus, useGroupMembers, useCurrentRound, useRecipientForRound, useHasContributed, useContribute, useDisburse, useStartGroup } from "@/hooks/use-haggiaz";
import { GroupStatus } from "@/lib/enums";
import { formatAmount, formatAddress, formatProfileDisplayName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROUTES, ANIMATION } from "@/lib/constants";
import { toast } from "sonner";

function useGroupId(): `0x${string}` | undefined {
  const params = useParams();
  const id = params.groupId as string;
  if (!id || !id.startsWith("0x") || id.length !== 66) return undefined;
  return id as `0x${string}`;
}

function MemberRow({
  address,
  profile,
  isYou,
}: {
  address: string;
  profile?: { avatarUrl?: string; firstName?: string; lastName?: string; displayName?: string };
  isYou: boolean;
}) {
  const displayName = formatProfileDisplayName(profile, address);
  const initials = displayName.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2">
      <Avatar size="sm" className="size-8 shrink-0">
        {profile?.avatarUrl ? (
          <AvatarImage src={profile.avatarUrl} alt={displayName} />
        ) : null}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className={`font-mono text-sm ${isYou ? "text-primary font-medium" : "text-muted-foreground"}`}>
        {displayName}
        {isYou && <span className="ml-2 text-xs text-primary">(you)</span>}
      </span>
    </div>
  );
}

export default function GroupDetailPage() {
  const groupId = useGroupId();
  const { address, isConnected } = useAccount();
  const { writeContract: approveToken } = useWriteContract();

  const { data: config, isLoading: configLoading } = useGroupConfig(groupId);
  const { data: status, isLoading: statusLoading } = useGroupStatus(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: currentRound } = useCurrentRound(groupId);
  const { data: recipient } = useRecipientForRound(groupId, currentRound ?? 0);
  const { data: hasContributed } = useHasContributed(groupId, address, currentRound ?? 0);

  const { contribute, isPending: contributePending, isSuccess: contributeSuccess, error: contributeError } = useContribute();
  const { disburse, isPending: disbursePending, isSuccess: disburseSuccess, error: disburseError } = useDisburse();
  const { start, isPending: startPending, isSuccess: startSuccess, error: startError } = useStartGroup();

  const upsertGroup = useMutation(api.groups.upsert);
  const upsertMembership = useMutation(api.memberships.upsert);
  const membersSyncedRef = useRef(false);

  const memberAddresses = config && members ? [config.creator, ...members] : [];
  const profiles = useQuery(
    api.users.getMany,
    memberAddresses.length > 0 ? { addresses: memberAddresses } : "skip"
  );
  const profileByAddress = new Map(
    (profiles ?? []).map((p) => [p.address.toLowerCase(), p])
  );

  // Map chain status to Convex status string to Convex status string
  const statusStr = (n: number | undefined): "open" | "active" | "completed" | "cancelled" => {
    if (n === GroupStatus.Open) return "open";
    if (n === GroupStatus.Active) return "active";
    if (n === GroupStatus.Completed) return "completed";
    if (n === GroupStatus.Cancelled) return "cancelled";
    return "open";
  };

  // Backfill Convex: upsert group from chain (so groups table has correct data)
  useEffect(() => {
    if (!groupId || !config || status === undefined || currentRound === undefined || members == null) return;
    upsertGroup({
      groupId,
      name: config.name,
      creator: config.creator,
      token: config.token,
      contributionAmount: config.contributionAmount.toString(),
      maxMembers: Number(config.maxMembers),
      roundDurationSeconds: Number(config.roundDurationSeconds ?? 0),
      status: statusStr(Number(status)),
      memberCount: members.length,
      currentRound: Number(currentRound),
    }).catch(() => {});
  }, [groupId, config, status, currentRound, members, upsertGroup]);

  // Sync each member to Convex memberships (joinedAt unknown from chain → use 0, hasReceived false)
  useEffect(() => {
    if (!groupId || !members?.length || membersSyncedRef.current) return;
    membersSyncedRef.current = true;
    members.forEach((memberAddress) => {
      upsertMembership({
        groupId,
        memberAddress,
        joinedAt: 0,
        hasReceived: false,
      }).catch(() => {});
    });
  }, [groupId, members, upsertMembership]);

  // Toasts for contract actions
  useEffect(() => {
    if (startSuccess) toast.success("Group started", { description: "The group is now active." });
  }, [startSuccess]);
  useEffect(() => {
    if (startError) toast.error("Couldn’t start group", { description: startError.message });
  }, [startError]);
  useEffect(() => {
    if (contributeSuccess) toast.success("Contribution recorded", { description: "You’re in for this round." });
  }, [contributeSuccess]);
  useEffect(() => {
    if (contributeError) toast.error("Contribution failed", { description: contributeError.message });
  }, [contributeError]);
  useEffect(() => {
    if (disburseSuccess) toast.success("Pot claimed", { description: "Funds have been sent to your wallet." });
  }, [disburseSuccess]);
  useEffect(() => {
    if (disburseError) toast.error("Claim failed", { description: disburseError.message });
  }, [disburseError]);

  const isLoading = configLoading || statusLoading;
  const isCreator = address && config && config.creator.toLowerCase() === address.toLowerCase();
  const isMember = address && members?.some((m) => m.toLowerCase() === address.toLowerCase());
  const isRecipient = address && recipient && recipient.toLowerCase() === address.toLowerCase();
  const statusNum = status !== undefined ? Number(status) : undefined;
  const canContribute = statusNum === GroupStatus.Active && !hasContributed && address;
  const canDisburse = statusNum === GroupStatus.Active && isRecipient && hasContributed;
  const canStart = statusNum === GroupStatus.Open && isCreator;
  const canJoin = statusNum === GroupStatus.Open && isConnected && !isMember && groupId;
  const showInviteLink = statusNum === GroupStatus.Open && isCreator;

  const copyInviteLink = async () => {
    if (!groupId) return;
    const url = `${window.location.origin}${ROUTES.JOIN(groupId)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied", {
        description: "Share it so others can join the group.",
      });
    } catch {
      toast.error("Couldn’t copy link", {
        description: "Try selecting and copying the link manually.",
      });
    }
  };

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
                  {formatAmount(contributionAmount)} USDC · {members?.length ?? 0}/{Number(maxMembers)} members
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
              <p className="text-sm text-muted-foreground mb-1.5">Creator</p>
              <MemberRow
                address={creator}
                profile={profileByAddress.get(creator.toLowerCase())}
                isYou={address?.toLowerCase() === creator.toLowerCase()}
              />
            </div>

            {members && members.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Members</p>
                <ul className="space-y-2">
                  {members.map((memberAddr) => (
                    <li key={memberAddr}>
                      <MemberRow
                        address={memberAddr}
                        profile={profileByAddress.get(memberAddr.toLowerCase())}
                        isYou={address?.toLowerCase() === memberAddr.toLowerCase()}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

            {canJoin && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground mb-2">You’re not in this group yet.</p>
                <Link href={ROUTES.JOIN(groupId)}>
                  <Button className="w-full sm:w-auto">Join group</Button>
                </Link>
              </div>
            )}

            {showInviteLink && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground mb-2">Share this link so others can join (group must stay Open).</p>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={copyInviteLink}>
                  Copy invite link
                </Button>
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
                    Approve USDC
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
