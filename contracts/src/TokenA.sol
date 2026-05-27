// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ════════════════════════════════════════════════════════════
// TokenA — Token ERC20 de prueba para el contrato Escrow
// ════════════════════════════════════════════════════════════
// Propósito: Este token se usa para simular intercambios
// en el DApp de Escrow. Representa un activo digital
// que los usuarios pueden intercambiar de forma segura.
// ════════════════════════════════════════════════════════════

/// @title TokenA
/// @notice Simple ERC20 token for testing Escrow contract
/// @notice Token ERC20 simple para pruebas del contrato Escrow
contract TokenA is ERC20, Ownable {
    // ════════════════════════════════════════════════════════
    // Constructor: Se ejecuta UNA SOLA VEZ al desplegar
    // ════════════════════════════════════════════════════════
    // Acuña 1,000,000 tokens (con 18 decimales) para el owner
    // El owner es quien despliega el contrato (msg.sender)
    // ════════════════════════════════════════════════════════

    /// @notice TokenA constructor - mints initial supply to owner
    /// @notice Acuña el suministro inicial de tokens para el owner
    /// @dev 1 million tokens with 18 decimals
    constructor() ERC20("Token A", "TKA") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** 18);
    }

    // ════════════════════════════════════════════════════════
    // mint(address to, uint256 amount)
    // ════════════════════════════════════════════════════════
    // Solo el owner puede acuñar nuevos tokens.
    // Útil para el script deploy.sh que necesita distribuir
    // tokens a múltiples cuentas de prueba en Anvil.
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
    // Reduce el suministro total del token.
    // ════════════════════════════════════════════════════════

    /// @notice Allows owner to burn tokens
    /// @notice Permite al owner quemar (destruir) sus tokens
    /// @param amount Cantidad de tokens a destruir
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }
}
