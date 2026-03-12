// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {HaggiazErrors} from "./libraries/HaggiazErrors.sol";

/**
 * @title HaggiazTreasury
 * @notice Holds ERC20 tokens per group. Only Haggiaz core can move funds (DRY for token custody).
 */
contract HaggiazTreasury {
    using SafeERC20 for IERC20;

    address public immutable haggiaz;

    /// @dev groupId => token => balance
    mapping(bytes32 => mapping(address => uint256)) private _balances;

    modifier onlyHaggiaz() {
        if (msg.sender != haggiaz) revert HaggiazErrors.Unauthorized();
        _;
    }

    constructor(address _haggiaz) {
        if (_haggiaz == address(0)) revert HaggiazErrors.InvalidInput();
        haggiaz = _haggiaz;
    }

    /// @notice Pull tokens from user and credit group
    function deposit(bytes32 groupId, address token, address from, uint256 amount) external onlyHaggiaz {
        if (amount == 0) revert HaggiazErrors.InvalidInput();
        IERC20(token).safeTransferFrom(from, address(this), amount);
        _balances[groupId][token] += amount;
    }

    /// @notice Send tokens from group to recipient
    function withdraw(bytes32 groupId, address token, address to, uint256 amount) external onlyHaggiaz {
        if (amount == 0) revert HaggiazErrors.InvalidInput();
        if (_balances[groupId][token] < amount) revert HaggiazErrors.InvalidInput();
        _balances[groupId][token] -= amount;
        IERC20(token).safeTransfer(to, amount);
    }

    function getBalance(bytes32 groupId, address token) external view returns (uint256) {
        return _balances[groupId][token];
    }
}
