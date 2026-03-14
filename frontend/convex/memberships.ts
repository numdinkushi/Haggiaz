import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List members of a group
 */
export const listByGroup = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memberships")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
  },
});

/**
 * List groups a user is a member of
 */
export const listByMember = query({
  args: { memberAddress: v.string() },
  handler: async (ctx, args) => {
    const addr = args.memberAddress.toLowerCase();
    return await ctx.db
      .query("memberships")
      .withIndex("by_member", (q) => q.eq("memberAddress", addr))
      .collect();
  },
});

/**
 * Check if user is member of group
 */
export const get = query({
  args: {
    groupId: v.string(),
    memberAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const addr = args.memberAddress.toLowerCase();
    return await ctx.db
      .query("memberships")
      .withIndex("by_groupId_member", (q) =>
        q.eq("groupId", args.groupId).eq("memberAddress", addr)
      )
      .first();
  },
});

/**
 * Add or update membership (call when syncing from chain)
 */
export const upsert = mutation({
  args: {
    groupId: v.string(),
    memberAddress: v.string(),
    joinedAt: v.number(),
    hasReceived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const addr = args.memberAddress.toLowerCase();
    const existing = await ctx.db
      .query("memberships")
      .withIndex("by_groupId_member", (q) =>
        q.eq("groupId", args.groupId).eq("memberAddress", addr)
      )
      .first();

    const data = {
      groupId: args.groupId,
      memberAddress: addr,
      joinedAt: args.joinedAt,
      hasReceived: args.hasReceived,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("memberships", {
        ...data,
        createdAt: now,
      });
    }
  },
});
