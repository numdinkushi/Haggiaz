/**
 * Formatting utilities.
 */

import { formatUnits } from "viem";

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAmount(amount: bigint, decimals = 6): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  if (num >= 1) return num.toFixed(2);
  if (num >= 0.01) return num.toFixed(4);
  return num.toFixed(6);
}

export function formatGroupId(groupId: string): string {
  if (!groupId || groupId.length < 18) return groupId;
  return `${groupId.slice(0, 10)}...${groupId.slice(-8)}`;
}
