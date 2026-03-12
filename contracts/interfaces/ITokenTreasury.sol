// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ITokenTreasury
 * @notice Treasury interface. Single responsibility: custody of group funds (DRY for token handling).
 */
interface ITokenTreasury {
    function deposit(bytes32 groupId, address from, uint256 amount) external;
    function withdraw(bytes32 groupId, address to, uint256 amount) external;
    function getGroupBalance(bytes32 groupId) external view returns (uint256);
}
