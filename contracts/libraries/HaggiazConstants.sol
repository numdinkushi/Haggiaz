// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HaggiazConstants
 * @notice Shared constants for Haggiaz contracts (DRY).
 */
library HaggiazConstants {
    uint256 internal constant MIN_CONTRIBUTION = 1e6; // 1 unit (6 decimals for USDC/cUSD)
    uint256 internal constant MIN_MEMBERS = 2;
    uint256 internal constant MAX_MEMBERS = 100;
    uint256 internal constant MIN_ROUND_DURATION = 1 days;
    uint256 internal constant MAX_ROUND_DURATION = 365 days;
}
