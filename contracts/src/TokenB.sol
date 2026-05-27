// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ════════════════════════════════════════════════════════════
// TokenB — Token ERC20 de prueba para el contrato Escrow
// ════════════════════════════════════════════════════════════
// Propósito: Segundo token de prueba para el DApp de Escrow.
// Junto con TokenA, permite simular intercambios entre
// dos activos digitales diferentes (TokenA <-> TokenB).
// ════════════════════════════════════════════════════════════

/// @title TokenB
/// @notice Simple ERC20 token for testing Escrow contract
/// @notice Token ERC20 simple para pruebas del contrato Escrow
contract TokenB is ERC20, Ownable {
    // ════════════════════════════════════════════════════════
    // Constructor: Se ejecuta UNA SOLA VEZ al desplegar
    // ════════════════════════════════════════════════════════
    // Acuña 1,000,000 tokens (con 18 decimales) para el owner
    // El contrato Escrow necesita al menos 2 tokens para
    // poder realizar operaciones de swap (intercambio).
    // ════════════════════════════════════════════════════════

    /// @notice TokenB constructor - mints initial supply to owner
    /// @notice Acuña el suministro inicial de tokens para el owner
    /// @dev 1 million tokens with 18 decimals
    constructor() ERC20("Token B", "TKB") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    // ════════════════════════════════════════════════════════
    // mint(address to, uint256 amount)
    // ════════════════════════════════════════════════════════
    // Solo el owner puede acuñar nuevos tokens.
    // El deploy.sh distribuye tokens a 3 cuentas de Anvil
    // para simular múltiples usuarios en la red local.
    // ════════════════════════════════════════════════════════

    /// @notice Allows owner to mint additional tokens
    /// @notice Permite al owner crear (acuñar) más tokens
    /// @param to Dirección que recibirá los tokens nuevos
    /// @param amount Cantidad de tokens a crear (en wei, 18 decimales)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // ════════════════════════════════════════════════════════
    // burn(uint256 amount)
    // ════════════════════════════════════════════════════════
    // Solo el owner puede quemar (destruir) sus propios tokens.
    // Reduce el suministro total del token en circulación.
    // ════════════════════════════════════════════════════════

    /// @notice Allows owner to burn tokens
    /// @notice Permite al owner quemar (destruir) sus tokens
    /// @param amount Cantidad de tokens a destruir
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }
}
