/**
 * Haggiaz contract ABI. Minimal set for frontend.
 */

import type { Abi } from "viem";

export const HAGGAZ_ABI = [
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "token", type: "address" },
      { name: "contributionAmount", type: "uint256" },
      { name: "maxMembers", type: "uint256" },
      { name: "roundDurationSeconds", type: "uint256" },
    ],
    name: "createGroup",
    outputs: [{ name: "groupId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "join",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "startGroup",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "contribute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "disburse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "getConfig",
    outputs: [
      {
        components: [
          { name: "name", type: "string" },
          { name: "creator", type: "address" },
          { name: "token", type: "address" },
          { name: "contributionAmount", type: "uint256" },
          { name: "maxMembers", type: "uint256" },
          { name: "roundDurationSeconds", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "getStatus",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "getMembers",
    outputs: [{ type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "getCurrentRound",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "bytes32" },
      { name: "roundIndex", type: "uint256" },
    ],
    name: "getRecipientForRound",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "bytes32" },
      { name: "member", type: "address" },
      { name: "roundIndex", type: "uint256" },
    ],
    name: "hasContributed",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "groupExists",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "bytes32" }],
    name: "inviteOnly",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    type: "event",
    name: "GroupCreated",
    inputs: [
      { name: "groupId", type: "bytes32", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "contributionAmount", type: "uint256", indexed: false },
      { name: "maxMembers", type: "uint256", indexed: false },
    ],
  },
] as const satisfies Abi;
