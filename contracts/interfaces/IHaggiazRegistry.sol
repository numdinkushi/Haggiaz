// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IHaggiazRegistry
 * @notice Registry/factory interface. Single responsibility: group creation and discovery.
 */
interface IHaggiazRegistry {
    function createGroup(
        string calldata name,
        address token,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 roundDurationSeconds
    ) external returns (bytes32 groupId);

    function getGroup(bytes32 groupId) external view returns (address groupAddress);
    function groupExists(bytes32 groupId) external view returns (bool);
}
