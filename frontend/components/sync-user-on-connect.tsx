"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * When a wallet is connected, upsert that address into Convex users so the DB is populated.
 */
export function SyncUserOnConnect() {
  const { address, isConnected } = useAccount();
  const upsertUser = useMutation(api.users.upsert);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !address) return;
    if (lastSynced.current === address.toLowerCase()) return;
    lastSynced.current = address.toLowerCase();
    upsertUser({ address }).catch(() => {});
  }, [isConnected, address, upsertUser]);

  return null;
}
