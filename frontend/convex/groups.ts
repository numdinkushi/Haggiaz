import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all groups (for now returns empty - sync from chain via mutation/backend)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("groups").collect();
  },
});

/**
 * Get a single group by groupId
 */
export const get = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .first();
  },
});

/**
 * Upsert a group (call from backend when syncing from chain)
 */
export const upsert = mutation({
  args: {
    groupId: v.string(),
    name: v.string(),
    creator: v.string(),
    token: v.string(),
    contributionAmount: v.string(),
    maxMembers: v.number(),
    roundDurationSeconds: v.number(),
    status: v.union(
      v.literal("open"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    memberCount: v.number(),
    currentRound: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("groups", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Increment member count (call after someone joins so the list shows correct count)
 */
export const incrementMemberCount = mutation({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      memberCount: existing.memberCount + 1,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

/**
 * Set member count from chain (call when viewing a group so list stays accurate)
 */
export const setMemberCount = mutation({
  args: { groupId: v.string(), memberCount: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      memberCount: args.memberCount,
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});
