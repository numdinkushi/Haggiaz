"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONFIG } from "@/lib/config";
import { HAGGAZ_ABI } from "@/lib/abi/haggiaz";
import type { Address } from "viem";

export function useGroupConfig(groupId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONFIG.haggiaz,
    abi: HAGGAZ_ABI,
    functionName: "getConfig",
    args: groupId ? [groupId] : undefined,
  });
}

export function useGroupStatus(groupId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONFIG.haggiaz,
    abi: HAGGAZ_ABI,
    functionName: "getStatus",
    args: groupId ? [groupId] : undefined,
  });
}

export function useGroupMembers(groupId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONFIG.haggiaz,
    abi: HAGGAZ_ABI,
    functionName: "getMembers",
    args: groupId ? [groupId] : undefined,
  });
}

export function useCurrentRound(groupId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONFIG.haggiaz,
    abi: HAGGAZ_ABI,
    functionName: "getCurrentRound",
    args: groupId ? [groupId] : undefined,
  });
}

export function useRecipientForRound(
  groupId: `0x${string}` | undefined,
  roundIndex: bigint | number | undefined
) {
  return useReadContract({
    address: CONFIG.haggiaz,
    abi: HAGGAZ_ABI,
    functionName: "getRecipientForRound",
    args: groupId && roundIndex !== undefined ? [groupId, BigInt(roundIndex)] : undefined,
  });
}

export function useHasContributed(
  groupId: `0x${string}` | undefined,
  member: Address | undefined,
  roundIndex: bigint | number | undefined
) {
  return useReadContract({
    address: CONFIG.haggiaz,
    abi: HAGGAZ_ABI,
    functionName: "hasContributed",
    args:
      groupId && member && roundIndex !== undefined
        ? [groupId, member, BigInt(roundIndex)]
        : undefined,
  });
}

export function useGroupExists(groupId: `0x${string}` | undefined) {
  return useReadContract({
    address: CONFIG.haggiaz,
    abi: HAGGAZ_ABI,
    functionName: "groupExists",
    args: groupId ? [groupId] : undefined,
  });
}

export function useCreateGroup() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createGroup = (params: {
    name: string;
    token: Address;
    contributionAmount: bigint;
    maxMembers: number;
    roundDurationSeconds: number;
  }) => {
    writeContract({
      address: CONFIG.haggiaz,
      abi: HAGGAZ_ABI,
      functionName: "createGroup",
      args: [
        params.name,
        params.token,
        params.contributionAmount,
        BigInt(params.maxMembers),
        BigInt(params.roundDurationSeconds),
      ],
      gas: 400_000n, // cap so wallet doesn't over-estimate; createGroup typically ~250k
    });
  };

  return {
    createGroup,
    hash,
    receipt,
    error,
    isPending: isPending || isConfirming,
    isSuccess,
  };
}

export function useJoinGroup() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const join = (groupId: `0x${string}`) => {
    writeContract({
      address: CONFIG.haggiaz,
      abi: HAGGAZ_ABI,
      functionName: "join",
      args: [groupId],
    });
  };

  return { join, hash, error, isPending: isPending || isConfirming, isSuccess };
}

export function useStartGroup() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const start = (groupId: `0x${string}`) => {
    writeContract({
      address: CONFIG.haggiaz,
      abi: HAGGAZ_ABI,
      functionName: "startGroup",
      args: [groupId],
    });
  };

  return { start, hash, error, isPending: isPending || isConfirming, isSuccess };
}

export function useContribute() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contribute = (groupId: `0x${string}`) => {
    writeContract({
      address: CONFIG.haggiaz,
      abi: HAGGAZ_ABI,
      functionName: "contribute",
      args: [groupId],
    });
  };

  return { contribute, hash, error, isPending: isPending || isConfirming, isSuccess };
}

export function useDisburse() {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const disburse = (groupId: `0x${string}`) => {
    writeContract({
      address: CONFIG.haggiaz,
      abi: HAGGAZ_ABI,
      functionName: "disburse",
      args: [groupId],
    });
  };

  return { disburse, hash, error, isPending: isPending || isConfirming, isSuccess };
}
