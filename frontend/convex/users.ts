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
 * Get multiple user profiles by wallet addresses (e.g. for creator + members list).
 */
export const getMany = query({
  args: { addresses: v.array(v.string()) },
  handler: async (ctx, args) => {
    const normalized = [...new Set(args.addresses.map((a) => a.toLowerCase()))];
    const users = await Promise.all(
      normalized.map((addr) =>
        ctx.db
          .query("users")
          .withIndex("by_address", (q) => q.eq("address", addr))
          .first()
      )
    );
    return users.filter((u): u is NonNullable<typeof u> => u != null);
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
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
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

    if (existing) {
      // Patch only provided fields so SyncUserOnConnect({ address }) doesn't wipe profile data
      const patch: Record<string, unknown> = { address: addr, updatedAt: now };
      if (args.displayName !== undefined) patch.displayName = args.displayName;
      if (args.firstName !== undefined) patch.firstName = args.firstName;
      if (args.lastName !== undefined) patch.lastName = args.lastName;
      if (args.avatarUrl !== undefined) patch.avatarUrl = args.avatarUrl;
      if (args.ensName !== undefined) patch.ensName = args.ensName;
      if (args.bio !== undefined) patch.bio = args.bio;
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      address: addr,
      displayName: args.displayName,
      firstName: args.firstName,
      lastName: args.lastName,
      avatarUrl: args.avatarUrl,
      ensName: args.ensName,
      bio: args.bio,
      createdAt: now,
      updatedAt: now,
    });
  },
});
