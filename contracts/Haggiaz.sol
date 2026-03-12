// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IHaggiazGroup} from "./interfaces/IHaggiazGroup.sol";
import {IHaggiazRegistry} from "./interfaces/IHaggiazRegistry.sol";
import {HaggiazTreasury} from "./HaggiazTreasury.sol";
import {HaggiazErrors} from "./libraries/HaggiazErrors.sol";
import {HaggiazConstants} from "./libraries/HaggiazConstants.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title Haggiaz
 * @notice Core ROSCA/Chama protocol. Orchestrates groups, rounds, contributions, and disbursements.
 * @dev SOLID: depends on IHaggiazRegistry (self), IHaggiazGroup (structs), HaggiazTreasury.
 *      Security: ReentrancyGuard, Pausable, EIP-712 invite-only join.
 */
contract Haggiaz is IHaggiazRegistry, ReentrancyGuard, Pausable, EIP712 {
    bytes32 public constant JOIN_INVITE_TYPEHASH =
        keccak256("JoinInvite(bytes32 groupId,address member,uint256 nonce,uint256 deadline)");

    HaggiazTreasury public immutable treasury;

    address public owner;
    uint256 public minRoundDurationSeconds;
    uint256 public maxRoundDurationSeconds;

    bytes32 private _nextGroupSalt;
    mapping(bytes32 => Group) private _groups;
    mapping(bytes32 => bool) public inviteOnly;
    mapping(bytes32 => mapping(uint256 => bool)) private _usedJoinNonces;

    struct Group {
        IHaggiazGroup.GroupConfig config;
        IHaggiazGroup.GroupStatus status;
        address[] members;
        uint256 currentRound;
        uint256 roundStartTime;
        mapping(uint256 => mapping(address => bool)) contributed;
        mapping(uint256 => address) recipientByRound;
    }

    event GroupCreated(bytes32 indexed groupId, address indexed creator, address token, uint256 contributionAmount, uint256 maxMembers);
    event MemberJoined(bytes32 indexed groupId, address indexed member);
    event RoundStarted(bytes32 indexed groupId, uint256 roundIndex);
    event Contribution(bytes32 indexed groupId, address indexed member, uint256 roundIndex, uint256 amount);
    event Disbursement(bytes32 indexed groupId, address indexed recipient, uint256 roundIndex, uint256 amount);
    event RoundDurationLimitsUpdated(uint256 minSeconds, uint256 maxSeconds);

    modifier onlyOwner() {
        if (msg.sender != owner) revert HaggiazErrors.NotOwner();
        _;
    }

    constructor() EIP712("Haggiaz", "1") {
        owner = msg.sender;
        treasury = new HaggiazTreasury(address(this));
        minRoundDurationSeconds = HaggiazConstants.MIN_ROUND_DURATION;
        maxRoundDurationSeconds = HaggiazConstants.MAX_ROUND_DURATION;
        _nextGroupSalt = keccak256(abi.encodePacked(block.timestamp, msg.sender));
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Adjust round duration limits (e.g. for testing: set min to 600 for 10 mins)
    function setRoundDurationLimits(uint256 minSeconds, uint256 maxSeconds) external onlyOwner {
        if (minSeconds > maxSeconds) revert HaggiazErrors.InvalidInput();
        minRoundDurationSeconds = minSeconds;
        maxRoundDurationSeconds = maxSeconds;
        emit RoundDurationLimitsUpdated(minSeconds, maxSeconds);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // IHaggiazRegistry
    // ─────────────────────────────────────────────────────────────────────────────

    function createGroup(
        address token,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 roundDurationSeconds
    ) external override whenNotPaused returns (bytes32 groupId) {
        return _createGroup(token, contributionAmount, maxMembers, roundDurationSeconds, false);
    }

    function createGroup(
        address token,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 roundDurationSeconds,
        bool _inviteOnly
    ) external whenNotPaused returns (bytes32 groupId) {
        return _createGroup(token, contributionAmount, maxMembers, roundDurationSeconds, _inviteOnly);
    }

    function _createGroup(
        address token,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint256 roundDurationSeconds,
        bool _inviteOnly
    ) internal returns (bytes32 groupId) {
        if (token == address(0)) revert HaggiazErrors.InvalidInput();
        if (token.code.length == 0) revert HaggiazErrors.TokenMustBeContract();
        if (contributionAmount < HaggiazConstants.MIN_CONTRIBUTION) revert HaggiazErrors.InvalidInput();
        if (maxMembers < HaggiazConstants.MIN_MEMBERS || maxMembers > HaggiazConstants.MAX_MEMBERS) revert HaggiazErrors.InvalidInput();
        if (roundDurationSeconds < minRoundDurationSeconds || roundDurationSeconds > maxRoundDurationSeconds) revert HaggiazErrors.InvalidInput();

        groupId = keccak256(abi.encodePacked(_nextGroupSalt, msg.sender, block.timestamp));
        _nextGroupSalt = keccak256(abi.encodePacked(_nextGroupSalt));

        Group storage g = _groups[groupId];
        if (g.config.creator != address(0)) revert HaggiazErrors.GroupAlreadyExists();

        g.config = IHaggiazGroup.GroupConfig({
            creator: msg.sender,
            token: token,
            contributionAmount: contributionAmount,
            maxMembers: maxMembers,
            roundDurationSeconds: roundDurationSeconds
        });
        g.status = IHaggiazGroup.GroupStatus.Open;
        g.members.push(msg.sender);
        g.currentRound = 0;
        g.roundStartTime = 0;
        inviteOnly[groupId] = _inviteOnly;

        emit GroupCreated(groupId, msg.sender, token, contributionAmount, maxMembers);
    }

    function getGroup(bytes32 groupId) external view override returns (address) {
        return _groups[groupId].config.creator != address(0) ? address(this) : address(0);
    }

    function groupExists(bytes32 groupId) external view override returns (bool) {
        return _groups[groupId].config.creator != address(0);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Group actions
    // ─────────────────────────────────────────────────────────────────────────────

    function join(bytes32 groupId) external whenNotPaused {
        if (inviteOnly[groupId]) revert HaggiazErrors.InviteOnlyUseSignature();
        _join(groupId, msg.sender);
    }

    /// @notice Join with EIP-712 signature from group creator (invite-only groups)
    function joinWithSignature(
        bytes32 groupId,
        uint256 nonce,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external whenNotPaused {
        if (block.timestamp > deadline) revert HaggiazErrors.SignatureExpired();
        if (_usedJoinNonces[groupId][nonce]) revert HaggiazErrors.NonceAlreadyUsed();

        Group storage g = _groups[groupId];
        if (g.config.creator == address(0)) revert HaggiazErrors.GroupNotFound();
        address signer = _verifyJoinSignature(groupId, msg.sender, nonce, deadline, v, r, s);
        if (signer != g.config.creator) revert HaggiazErrors.InvalidSignature();

        _usedJoinNonces[groupId][nonce] = true;
        _join(groupId, msg.sender);
    }

    function _join(bytes32 groupId, address member) private {
        Group storage g = _groups[groupId];
        if (g.config.creator == address(0)) revert HaggiazErrors.GroupNotFound();
        if (g.status != IHaggiazGroup.GroupStatus.Open) revert HaggiazErrors.GroupNotOpen();
        if (_isMember(g, member)) revert HaggiazErrors.AlreadyMember();
        if (g.members.length >= g.config.maxMembers) revert HaggiazErrors.GroupFull();

        g.members.push(member);
        emit MemberJoined(groupId, member);
    }

    function _verifyJoinSignature(
        bytes32 groupId,
        address member,
        uint256 nonce,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private view returns (address) {
        bytes32 structHash = keccak256(abi.encode(JOIN_INVITE_TYPEHASH, groupId, member, nonce, deadline));
        bytes32 digest = _hashTypedDataV4(structHash);
        return ECDSA.recover(digest, v, r, s);
    }

    function startGroup(bytes32 groupId) external whenNotPaused {
        Group storage g = _groups[groupId];
        if (g.config.creator == address(0)) revert HaggiazErrors.GroupNotFound();
        if (g.status != IHaggiazGroup.GroupStatus.Open) revert HaggiazErrors.GroupNotOpen();
        if (msg.sender != g.config.creator) revert HaggiazErrors.OnlyCreator();
        if (g.members.length < HaggiazConstants.MIN_MEMBERS) revert HaggiazErrors.InsufficientMembers();

        g.status = IHaggiazGroup.GroupStatus.Active;
        g.currentRound = 1;
        g.roundStartTime = block.timestamp;

        emit RoundStarted(groupId, 1);
    }

    function contribute(bytes32 groupId) external whenNotPaused nonReentrant {
        Group storage g = _groups[groupId];
        if (g.config.creator == address(0)) revert HaggiazErrors.GroupNotFound();
        if (g.status != IHaggiazGroup.GroupStatus.Active) revert HaggiazErrors.GroupNotActive();
        if (!_isMember(g, msg.sender)) revert HaggiazErrors.NotMember();
        if (g.contributed[g.currentRound][msg.sender]) revert HaggiazErrors.AlreadyContributed();

        g.contributed[g.currentRound][msg.sender] = true;
        treasury.deposit(groupId, g.config.token, msg.sender, g.config.contributionAmount);

        emit Contribution(groupId, msg.sender, g.currentRound, g.config.contributionAmount);
    }

    function disburse(bytes32 groupId) external whenNotPaused nonReentrant {
        Group storage g = _groups[groupId];
        if (g.config.creator == address(0)) revert HaggiazErrors.GroupNotFound();
        if (g.status != IHaggiazGroup.GroupStatus.Active) revert HaggiazErrors.GroupNotActive();

        address recipient = _getRecipientForRound(g, g.currentRound);
        if (msg.sender != recipient) revert HaggiazErrors.NotRecipient();

        if (!_allContributed(g, g.currentRound)) revert HaggiazErrors.RoundNotReady();

        uint256 pot = g.members.length * g.config.contributionAmount;
        g.recipientByRound[g.currentRound] = recipient;
        g.contributed[g.currentRound][recipient] = true;

        treasury.withdraw(groupId, g.config.token, recipient, pot);

        emit Disbursement(groupId, recipient, g.currentRound, pot);

        bool completed = g.currentRound >= g.members.length;
        if (completed) {
            g.status = IHaggiazGroup.GroupStatus.Completed;
        } else {
            g.currentRound++;
            g.roundStartTime = block.timestamp;
            emit RoundStarted(groupId, g.currentRound);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────────

    function getConfig(bytes32 groupId) external view returns (IHaggiazGroup.GroupConfig memory) {
        return _groups[groupId].config;
    }

    function getStatus(bytes32 groupId) external view returns (IHaggiazGroup.GroupStatus) {
        return _groups[groupId].status;
    }

    function getMembers(bytes32 groupId) external view returns (address[] memory) {
        return _groups[groupId].members;
    }

    function getCurrentRound(bytes32 groupId) external view returns (uint256) {
        return _groups[groupId].currentRound;
    }

    function hasContributed(bytes32 groupId, address member, uint256 roundIndex) external view returns (bool) {
        return _groups[groupId].contributed[roundIndex][member];
    }

    function getRecipientForRound(bytes32 groupId, uint256 roundIndex) external view returns (address) {
        return _getRecipientForRound(_groups[groupId], roundIndex);
    }

    function getPotBalance(bytes32 groupId) external view returns (uint256) {
        Group storage g = _groups[groupId];
        return treasury.getBalance(groupId, g.config.token);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────────

    function _isMember(Group storage g, address account) private view returns (bool) {
        for (uint256 i = 0; i < g.members.length; i++) {
            if (g.members[i] == account) return true;
        }
        return false;
    }

    function _allContributed(Group storage g, uint256 roundIndex) private view returns (bool) {
        for (uint256 i = 0; i < g.members.length; i++) {
            if (!g.contributed[roundIndex][g.members[i]]) return false;
        }
        return true;
    }

    /// @dev Join order = receive order (member at index r-1 receives in round r)
    function _getRecipientForRound(Group storage g, uint256 roundIndex) private view returns (address) {
        if (roundIndex == 0 || roundIndex > g.members.length) return address(0);
        return g.members[roundIndex - 1];
    }
}
