// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HaggiazErrors
 * @notice Centralized custom errors for Haggiaz (DRY, gas-efficient).
 */
library HaggiazErrors {
    // Registry (1xx)
    error InvalidInput();
    error GroupAlreadyExists();
    error NotOwner();

    // Group (2xx)
    error GroupNotFound();
    error GroupNotOpen();
    error GroupNotActive();
    error GroupAlreadyActive();
    error GroupCompleted();
    error GroupCancelled();
    error Unauthorized();
    error OnlyCreator();
    error AlreadyMember();
    error NotMember();
    error GroupFull();
    error InsufficientMembers();
    error RoundNotReady();
    error RoundAlreadyDisbursed();
    error AlreadyContributed();
    error NotRecipient();
    error AlreadyReceived();
    error TransferFailed();

    // EIP-712 / Invite (3xx)
    error InviteOnlyUseSignature();
    error SignatureExpired();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error TokenMustBeContract();
}
