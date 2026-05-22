// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Mock ERC20 token for testing purposes
/// @dev Includes mint/burn functions for test scenarios
contract MockERC20 is ERC20 {
    uint8 private _decimalsValue;

    /// @notice MockERC20 constructor
    /// @param name Token name
    /// @param symbol Token symbol
    /// @param decimalsValue Number of decimals
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue
    ) ERC20(name, symbol) {
        _decimalsValue = decimalsValue;
    }

    /// @notice Returns token decimals
    /// @return Number of decimals
    function decimals() public view override returns (uint8) {
        return _decimalsValue;
    }

    /// @notice Mints tokens to an address
    /// @param to Address to mint to
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    /// @notice Burns tokens from caller's balance
    /// @param amount Amount to burn
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /// @notice Burns tokens from a specific address (for testing)
    /// @param from Address to burn from
    /// @param amount Amount to burn
    function burnFrom(address from, uint256 amount) public {
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
        _approve(from, msg.sender, currentAllowance - amount);
        _burn(from, amount);
    }
}
