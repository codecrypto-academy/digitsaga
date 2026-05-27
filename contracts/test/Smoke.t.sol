// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/Escrow.sol";
import "../src/TokenA.sol";
import "../src/TokenB.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

/// @title SmokeTest
/// @notice Quick smoke test to verify end-to-end contract deployment and basic operations
/// @dev Used as a fast sanity check after deployment
contract SmokeTest is Test {
    Escrow escrow;
    TokenA tokenA;
    TokenB tokenB;

    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);

    uint256 constant MINT_AMOUNT = 1000e18;
    uint256 constant AMOUNT_A = 100e18;
    uint256 constant AMOUNT_B = 50e18;

    /// @notice Deploy contracts and mint tokens
    function setUp() public {
        vm.startPrank(owner);
        escrow = new Escrow();
        tokenA = new TokenA();
        tokenB = new TokenB();

        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));

        tokenA.mint(user1, MINT_AMOUNT);
        tokenB.mint(user1, MINT_AMOUNT);
        tokenA.mint(user2, MINT_AMOUNT);
        tokenB.mint(user2, MINT_AMOUNT);
        vm.stopPrank();
    }

    /// @notice Smoke test: Full workflow (Create → Complete → Verify)
    function test_smoke_FullWorkflow() public {
        // Create operation
        vm.startPrank(user1);
        tokenA.approve(address(escrow), AMOUNT_A);
        uint256 opId = escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        vm.stopPrank();

        assertEq(opId, 0);
        assertEq(tokenA.balanceOf(address(escrow)), AMOUNT_A);

        // Complete operation
        vm.startPrank(user2);
        tokenB.approve(address(escrow), AMOUNT_B);
        escrow.completeOperation(opId);
        vm.stopPrank();

        // Verify final state
        assertEq(tokenA.balanceOf(user2), MINT_AMOUNT + AMOUNT_A);
        assertEq(tokenB.balanceOf(user1), MINT_AMOUNT + AMOUNT_B);
        assertEq(tokenA.balanceOf(address(escrow)), 0);
    }

    /// @notice Smoke test: Create → Cancel → Verify
    function test_smoke_CreateThenCancel() public {
        uint256 balanceBefore = tokenA.balanceOf(user1);

        vm.startPrank(user1);
        tokenA.approve(address(escrow), AMOUNT_A);
        uint256 opId = escrow.createOperation(address(tokenA), address(tokenB), AMOUNT_A, AMOUNT_B);
        vm.stopPrank();

        vm.prank(user1);
        escrow.cancelOperation(opId);

        // After cancel, user1 should have original balance back
        assertEq(tokenA.balanceOf(user1), balanceBefore);
        assertEq(tokenA.balanceOf(address(escrow)), 0);
    }

    /// @notice Smoke test: Contract state is initialised correctly
    function test_smoke_InitialState() public view {
        assertEq(escrow.operationCount(), 0);
        assertEq(escrow.getAllowedTokens().length, 2);
        assertEq(escrow.getContractBalance(address(tokenA)), 0);
        assertEq(escrow.owner(), owner);
    }
}
