// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Escrow
/// @notice Secure peer-to-peer token swap contract with escrow functionality
/// @dev Uses ReentrancyGuard to prevent reentrancy attacks
contract Escrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // =====================================================================
    // ENUMS & STRUCTS
    // =====================================================================

    /// @notice Operation status enumeration
    enum OperationStatus {
        PENDING,
        COMPLETED,
        CANCELLED
    }

    /// @notice Operation struct representing a token swap operation
    struct Operation {
        uint256 id;
        address creator;
        address tokenA;
        address tokenB;
        uint256 amountA;
        uint256 amountB;
        OperationStatus status;
    }

    // =====================================================================
    // STATE VARIABLES
    // =====================================================================

    /// @notice Array of allowed ERC20 tokens
    address[] public allowedTokens;

    /// @notice Mapping of operation ID to Operation struct
    mapping(uint256 => Operation) public operations;

    /// @notice Total number of operations created
    uint256 public operationCount;

    // =====================================================================
    // EVENTS
    // =====================================================================

    /// @notice Emitted when owner adds a new allowed token
    /// @param token Address of the token added
    event TokenAdded(address indexed token);

    /// @notice Emitted when operation is created
    /// @param opId Operation ID
    /// @param creator Address of operation creator
    /// @param tokenA Address of token creator provides
    /// @param tokenB Address of token creator requests
    event OperationCreated(
        uint256 indexed opId,
        address indexed creator,
        address indexed tokenA,
        address tokenB
    );

    /// @notice Emitted when operation is completed
    /// @param opId Operation ID
    /// @param completer Address of user who completed the operation
    event OperationCompleted(uint256 indexed opId, address indexed completer);

    /// @notice Emitted when operation is cancelled
    /// @param opId Operation ID
    event OperationCancelled(uint256 indexed opId);

    // =====================================================================
    // CONSTRUCTOR
    // =====================================================================

    constructor() Ownable(msg.sender) {}

    // =====================================================================
    // ADMIN FUNCTIONS
    // =====================================================================

    /// @notice Allows owner to add a new token to the allowed list
    /// @param token Address of the ERC20 token to allow
    /// @dev Prevents zero address and duplicate entries
    function addToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!isTokenAllowed(token), "Token already allowed");

        allowedTokens.push(token);
        emit TokenAdded(token);
    }

    // =====================================================================
    // OPERATION FUNCTIONS
    // =====================================================================

    /// @notice Creates a new token swap operation
    /// @param tokenA Address of token creator provides
    /// @param tokenB Address of token creator requests
    /// @param amountA Amount of tokenA to deposit
    /// @param amountB Amount of tokenB requested
    /// @return operationId ID of the created operation
    /// @dev Transfers tokenA from caller to contract
    function createOperation(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256) {
        // Validate inputs
        require(isTokenAllowed(tokenA) && isTokenAllowed(tokenB), "Token not allowed");
        require(amountA > 0 && amountB > 0, "Amounts must be > 0");
        require(tokenA != tokenB, "Tokens must be different");

        // Transfer tokenA from caller to contract (checks-effects-interactions pattern)
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);

        // Create operation with PENDING status
        uint256 opId = operationCount++;
        operations[opId] = Operation({
            id: opId,
            creator: msg.sender,
            tokenA: tokenA,
            tokenB: tokenB,
            amountA: amountA,
            amountB: amountB,
            status: OperationStatus.PENDING
        });

        emit OperationCreated(opId, msg.sender, tokenA, tokenB);
        return opId;
    }

    /// @notice Completes a token swap operation
    /// @param operationId ID of the operation to complete
    /// @dev Caller must be different from operation creator
    /// @dev Caller transfers tokenB to creator and receives tokenA from contract
    function completeOperation(uint256 operationId) external nonReentrant {
        Operation storage op = operations[operationId];

        // Validate operation state
        require(op.status == OperationStatus.PENDING, "Operation not pending");
        require(msg.sender != op.creator, "Cannot complete own operation");

        // Mark as completed before external calls (checks-effects-interactions pattern)
        op.status = OperationStatus.COMPLETED;

        // Transfer tokenB from caller to creator
        IERC20(op.tokenB).safeTransferFrom(msg.sender, op.creator, op.amountB);

        // Transfer tokenA from contract to caller
        IERC20(op.tokenA).safeTransfer(msg.sender, op.amountA);

        emit OperationCompleted(operationId, msg.sender);
    }

    /// @notice Cancels a pending operation and returns tokenA to creator
    /// @param operationId ID of the operation to cancel
    /// @dev Only the operation creator can cancel
    function cancelOperation(uint256 operationId) external nonReentrant {
        Operation storage op = operations[operationId];

        // Validate operation state
        require(op.status == OperationStatus.PENDING, "Operation not pending");
        require(msg.sender == op.creator, "Only creator can cancel");

        // Mark as cancelled before external call
        op.status = OperationStatus.CANCELLED;

        // Return tokenA to creator
        IERC20(op.tokenA).safeTransfer(op.creator, op.amountA);

        emit OperationCancelled(operationId);
    }

    // =====================================================================
    // QUERY FUNCTIONS
    // =====================================================================

    /// @notice Checks if a token is in the allowed list
    /// @param token Address of token to check
    /// @return True if token is allowed, false otherwise
    function isTokenAllowed(address token) public view returns (bool) {
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            if (allowedTokens[i] == token) {
                return true;
            }
        }
        return false;
    }

    /// @notice Returns all allowed tokens
    /// @return Array of allowed token addresses
    function getAllowedTokens() public view returns (address[] memory) {
        return allowedTokens;
    }

    /// @notice Returns details of a specific operation
    /// @param operationId ID of the operation
    /// @return Operation struct with all details
    function getOperation(uint256 operationId) public view returns (Operation memory) {
        return operations[operationId];
    }

    /// @notice Returns all operations
    /// @return Array of all operations
    function getAllOperations() public view returns (Operation[] memory) {
        Operation[] memory allOps = new Operation[](operationCount);
        for (uint256 i = 0; i < operationCount; i++) {
            allOps[i] = operations[i];
        }
        return allOps;
    }

    /// @notice Returns operation IDs created by a specific address
    /// @param creator Address to query operations for
    /// @return Array of operation IDs created by the address
    function getOperationsByCreator(address creator) public view returns (uint256[] memory) {
        // Count operations by this creator
        uint256 count = 0;
        for (uint256 i = 0; i < operationCount; i++) {
            if (operations[i].creator == creator) {
                count++;
            }
        }

        // Populate array
        uint256[] memory creatorOps = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < operationCount; i++) {
            if (operations[i].creator == creator) {
                creatorOps[index] = i;
                index++;
            }
        }
        return creatorOps;
    }

    /// @notice Returns current balance of a token in the contract
    /// @param token Address of token to check balance for
    /// @return Balance of token in contract
    function getContractBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
