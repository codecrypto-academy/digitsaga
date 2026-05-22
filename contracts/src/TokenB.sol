// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TokenB
/// @notice Simple ERC20 token for testing Escrow contract
contract TokenB is ERC20, Ownable {
    /// @notice TokenB constructor - mints initial supply to owner
    /// @dev 1 million tokens with 18 decimals
    constructor() ERC20("Token B", "TKB") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    /// @notice Allows owner to mint additional tokens
    /// @param to Address to mint tokens to
    /// @param amount Amount of tokens to mint
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @notice Allows owner to burn tokens
    /// @param amount Amount of tokens to burn
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }
}
