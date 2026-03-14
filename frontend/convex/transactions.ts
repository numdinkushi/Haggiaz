import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const transactionType = v.union(
  v.literal("create"),
  v.literal("join"),
  v.literal("round_start"),
  v.literal("contribution"),
  v.literal("disbursement")
);

/**
 * List transactions for a group (contributions, disbursements, joins, etc.)
 */
export const listByGroup = query({
  args: {
    groupId: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(transactionType),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let q = ctx.db
      .query("transactions")
      .withIndex("by_groupId_timestamp", (q) =>
        q.eq("groupId", args.groupId)
      )
      .order("desc");
    const all = await q.take(limit * 2); // fetch extra in case we filter
    const filtered = args.type
      ? all.filter((t) => t.type === args.type)
      : all;
    return filtered.slice(0, limit);
  },
});

/**
 * List transactions for a user (as sender or recipient)
 */
export const listByUser = query({
  args: {
    address: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const addr = args.address.toLowerCase();
    const asFrom = await ctx.db
      .query("transactions")
      .withIndex("by_from", (q) => q.eq("from", addr))
      .order("desc")
      .take(limit);
    const asTo = await ctx.db
      .query("transactions")
      .withIndex("by_to", (q) => q.eq("to", addr))
      .order("desc")
      .take(limit);
    const merged = [...asFrom, ...asTo].sort(
      (a, b) => b.timestamp - a.timestamp
    );
    return merged.slice(0, limit);
  },
});

/**
 * Add a transaction (call when syncing from chain events)
 */
export const add = mutation({
  args: {
    groupId: v.string(),
    type: transactionType,
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    amount: v.optional(v.string()),
    roundIndex: v.optional(v.number()),
    txHash: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("transactions", {
      groupId: args.groupId,
      type: args.type,
      from: args.from?.toLowerCase(),
      to: args.to?.toLowerCase(),
      amount: args.amount,
      roundIndex: args.roundIndex,
      txHash: args.txHash,
      blockNumber: args.blockNumber,
      timestamp: args.timestamp,
      createdAt: now,
    });
  },
});
