// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IHaggiazGroup
 * @notice Group-level interface for a single ROSCA/Chama. Single responsibility: group state and round logic.
 */
interface IHaggiazGroup {
    struct GroupConfig {
        address creator;
        address token;
        uint256 contributionAmount;
        uint256 maxMembers;
        uint256 roundDurationSeconds;
    }

    struct MemberInfo {
        address wallet;
        uint256 joinedAt;
        bool hasReceived;
    }

    struct RoundInfo {
        uint256 roundIndex;
        uint256 startTime;
        uint256 potAmount;
        address recipient;
        bool disbursed;
    }

    enum GroupStatus {
        Open,
        Active,
        Completed,
        Cancelled
    }

    function groupId() external view returns (bytes32);
    function config() external view returns (GroupConfig memory);
    function status() external view returns (GroupStatus);
    function currentRound() external view returns (uint256);
    function memberCount() external view returns (uint256);
    function getMemberAt(uint256 index) external view returns (MemberInfo memory);
    function getRound(uint256 roundIndex) external view returns (RoundInfo memory);
    function hasContributed(bytes32 groupId_, address member, uint256 roundIndex) external view returns (bool);
}
