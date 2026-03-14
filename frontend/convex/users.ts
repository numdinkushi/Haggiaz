import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user profile by wallet address
 */
export const get = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_address", (q) =>
        q.eq("address", args.address.toLowerCase())
      )
      .first();
  },
});

/**
 * List users (paginated, for admin/search)
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db.query("users").take(limit);
  },
});

/**
 * Create or update user profile
 */
export const upsert = mutation({
  args: {
    address: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    ensName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const addr = args.address.toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_address", (q) => q.eq("address", addr))
      .first();

    const profile = {
      address: addr,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      ensName: args.ensName,
      bio: args.bio,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, profile);
      return existing._id;
    } else {
      return await ctx.db.insert("users", {
        ...profile,
        createdAt: now,
      });
    }
  },
});
