import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const roleValidator = v.union(
  v.literal("user"),
  v.literal("agent"),
  v.literal("system")
);

/**
 * Get conversation for a group (one chat per group)
 */
export const getByGroup = query({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .first();
  },
});

/**
 * Get or create conversation for a group
 */
export const getOrCreate = mutation({
  args: { groupId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .first();
    if (existing) return existing._id;
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      groupId: args.groupId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * List messages in a conversation (for UI + agent context)
 */
export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    beforeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId_timestamp", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(limit);
    return messages.reverse(); // chronological for display
  },
});

/**
 * Send a message (user or agent)
 */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    sender: v.string(),
    role: roleValidator,
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      sender: args.sender,
      role: args.role,
      content: args.content,
      timestamp: now,
    });
    // Bump conversation updatedAt
    const conv = await ctx.db.get(args.conversationId);
    if (conv) {
      await ctx.db.patch(args.conversationId, { updatedAt: now });
    }
    return msgId;
  },
});

/**
 * Get agent state for a conversation (context for the agent)
 */
export const getAgentState = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agentState")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();
  },
});

/**
 * Update agent state (summary, last intent, message count)
 * Call after agent responds to persist context for next turn
 */
export const updateAgentState = mutation({
  args: {
    conversationId: v.id("conversations"),
    lastSummary: v.optional(v.string()),
    lastIntent: v.optional(v.string()),
    messageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("agentState")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSummary: args.lastSummary ?? existing.lastSummary,
        lastIntent: args.lastIntent ?? existing.lastIntent,
        messageCount: args.messageCount ?? existing.messageCount,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("agentState", {
        conversationId: args.conversationId,
        lastSummary: args.lastSummary,
        lastIntent: args.lastIntent,
        messageCount: args.messageCount ?? 0,
        updatedAt: now,
      });
    }
  },
});
