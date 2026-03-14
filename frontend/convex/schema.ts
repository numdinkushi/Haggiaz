import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex schema for Haggiaz.
 * Syncs on-chain data and stores off-chain metadata (profiles, activity, etc.).
 */
export default defineSchema({
  // Groups synced from chain
  groups: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_creator", ["creator"])
    .index("by_createdAt", ["createdAt"]),

  // User profiles (wallet address → off-chain profile data)
  users: defineTable({
    address: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    ensName: v.optional(v.string()),
    bio: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_address", ["address"]),

  // Membership: user ↔ group (synced from chain or join events)
  memberships: defineTable({
    groupId: v.string(),
    memberAddress: v.string(),
    joinedAt: v.number(),
    hasReceived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_member", ["memberAddress"])
    .index("by_groupId_member", ["groupId", "memberAddress"]),

  // Transactions: contributions, disbursements, joins, creates (from chain events)
  transactions: defineTable({
    groupId: v.string(),
    type: v.union(
      v.literal("create"),
      v.literal("join"),
      v.literal("round_start"),
      v.literal("contribution"),
      v.literal("disbursement")
    ),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
    amount: v.optional(v.string()),
    roundIndex: v.optional(v.number()),
    txHash: v.optional(v.string()),
    blockNumber: v.optional(v.number()),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_from", ["from"])
    .index("by_to", ["to"])
    .index("by_timestamp", ["timestamp"])
    .index("by_groupId_timestamp", ["groupId", "timestamp"]),

  // Activity feed (for UI; can aggregate from transactions)
  activity: defineTable({
    groupId: v.string(),
    type: v.string(),
    actor: v.optional(v.string()),
    data: v.any(),
    timestamp: v.number(),
  })
    .index("by_groupId", ["groupId"])
    .index("by_timestamp", ["timestamp"]),

  // Chat: one conversation per group (group chat)
  conversations: defineTable({
    groupId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_groupId", ["groupId"]),

  // Chat messages (user + agent)
  messages: defineTable({
    conversationId: v.id("conversations"),
    sender: v.string(), // wallet address or "agent"
    role: v.union(
      v.literal("user"),
      v.literal("agent"),
      v.literal("system")
    ),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_timestamp", ["conversationId", "timestamp"]),

  // Agent context: summary/state per conversation (for context window, continuity)
  agentState: defineTable({
    conversationId: v.id("conversations"),
    lastSummary: v.optional(v.string()),
    lastIntent: v.optional(v.string()),
    messageCount: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"]),
});
