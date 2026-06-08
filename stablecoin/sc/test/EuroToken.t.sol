// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {EuroToken} from "../src/EuroToken.sol";

contract EuroTokenTest is Test {
    EuroToken public token;
    address public owner;
    address public user;

    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");
        token = new EuroToken(owner);
    }

    function test_InitialState() public {
        assertEq(token.name(), "EuroToken");
        assertEq(token.symbol(), "EURT");
        assertEq(token.decimals(), 6);
        assertEq(token.totalSupply(), 0);
        assertEq(token.owner(), owner);
    }

    function test_Mint() public {
        vm.prank(owner);
        token.mint(user, 1000e6);

        assertEq(token.balanceOf(user), 1000e6);
        assertEq(token.totalSupply(), 1000e6);
    }

    function test_RevertWhen_NonOwnerMints() public {
        vm.prank(user);
        vm.expectRevert();
        token.mint(user, 100e6);
    }

    function test_Burn() public {
        vm.prank(owner);
        token.mint(user, 1000e6);

        vm.prank(user);
        token.burn(400e6);

        assertEq(token.balanceOf(user), 600e6);
        assertEq(token.totalSupply(), 600e6);
    }

    function test_BurnFrom() public {
        vm.prank(owner);
        token.mint(user, 1000e6);

        vm.prank(user);
        token.approve(owner, 500e6);

        vm.prank(owner);
        token.burnFrom(user, 300e6);

        assertEq(token.balanceOf(user), 700e6);
        assertEq(token.totalSupply(), 700e6);
    }

    function test_Transfer() public {
        vm.prank(owner);
        token.mint(owner, 1000e6);

        vm.prank(owner);
        token.transfer(user, 300e6);

        assertEq(token.balanceOf(owner), 700e6);
        assertEq(token.balanceOf(user), 300e6);
    }

    function test_RevertWhen_BurnFromInsufficientAllowance() public {
        vm.prank(owner);
        token.mint(user, 1000e6);

        vm.prank(owner);
        vm.expectRevert();
        token.burnFrom(user, 100e6);
    }
}
