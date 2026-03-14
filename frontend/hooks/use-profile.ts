"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export type ProfileUpdate = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  displayName?: string;
  bio?: string;
};

/**
 * Current user profile by wallet address + mutation to update.
 */
export function useProfile(address: string | undefined) {
  const profile = useQuery(
    api.users.get,
    address ? { address } : "skip"
  );
  const upsert = useMutation(api.users.upsert);
  return { profile, updateProfile: upsert };
}
