// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Escrow
/// @notice Secure peer-to-peer token swap contract with escrow functionality
/// @dev Uses ReentrancyGuard to prevent reentrancy attacks
///
/// ══════════════════════════════════════════════════════════════════════════
/// EXPLICACIÓN DEL CONTRATO (Español):
/// ──────────────────────────────────────────────────────────────────────────
/// Escrow es un contrato inteligente que actúa como intermediario de confianza
/// para intercambios de tokens ERC20 entre pares (peer-to-peer).
///
/// 📦 ¿Cómo funciona?
///   1. El OWNER (dueño) autoriza qué tokens pueden intercambiarse (addToken)
///   2. El USUARIO 1 crea una operación depositando TokenA y pidiendo TokenB
///   3. El USUARIO 2 completa la operación: envía TokenB y recibe TokenA
///   4. El USUARIO 1 puede cancelar y recuperar sus tokens si nadie completa
///
/// 🔒 Seguridad:
///   - ReentrancyGuard: protege contra ataques de reentrancia
///   - SafeERC20: operaciones seguras con tokens ERC20
///   - Ownable: solo el owner puede agregar tokens permitidos
///   - Checks-Effects-Interactions: patrón para evitar reentrancia
/// ══════════════════════════════════════════════════════════════════════════
contract Escrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    // SafeERC20 envuelve las funciones de ERC20 (transfer, transferFrom, approve)
    // para agregar verificaciones de retorno. Algunos tokens no revertean
    // al fallar, solo devuelven false. SafeERC20 asegura que la transacción
    // se reversa SIEMPRE que la transferencia falle.

    // =====================================================================
    // ENUMS & STRUCTS — Estructuras de datos del contrato
    // =====================================================================

    // ─────────────────────────────────────────────────────────────────────
    // ENUM: OperationStatus
    // ─────────────────────────────────────────────────────────────────────
    // Un enum (enumeración) define un conjunto de valores posibles.
    // Aquí representa los 3 estados por los que pasa una operación:
    //
    //   PENDING   → La operación fue creada, esperando ser completada
    //   COMPLETED → Un usuario completó el swap exitosamente
    //   CANCELLED → El creador canceló y recuperó sus tokens
    //
    // Ventaja: más legible y seguro que usar números (0, 1, 2)
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Enum representing possible operation states
    enum OperationStatus {
        PENDING,    // 0 — Operación activa, esperando contraparte
        COMPLETED,  // 1 — Swap completado exitosamente
        CANCELLED   // 2 — Operación cancelada por el creador
    }

    // ─────────────────────────────────────────────────────────────────────
    // STRUCT: Operation
    // ─────────────────────────────────────────────────────────────────────
    // Un struct agrupa múltiples variables relacionadas en una sola entidad.
    // Cada operación de swap almacena:
    //
    //   id       → Identificador único de la operación
    //   creator  → Quién creó la operación (depositó TokenA)
    //   tokenA   → Dirección del token que el creator ofrece
    //   tokenB   → Dirección del token que el creator solicita
    //   amountA  → Cantidad de TokenA depositada
    //   amountB  → Cantidad de TokenB solicitada
    //   status   → Estado actual (PENDING | COMPLETED | CANCELLED)
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Operation struct representing a token swap operation
    /// @notice Agrupa toda la información de una operación de swap
    struct Operation {
        uint256 id;             // ID único de la operación
        address creator;        // Dirección del creador (depositó TokenA)
        address tokenA;         // Token que el creator ofrece
        address tokenB;         // Token que el creator solicita
        uint256 amountA;        // Cantidad de TokenA depositada
        uint256 amountB;        // Cantidad de TokenB solicitada
        OperationStatus status; // Estado: PENDING, COMPLETED o CANCELLED
    }

    // =====================================================================
    // STATE VARIABLES — Almacenamiento persistente del contrato
    // =====================================================================
    //
    // Estas variables se guardan en la blockchain y su estado persiste
    // entre transacciones. Son el "corazón de datos" del contrato.
    //
    // allowedTokens  → Lista de direcciones de tokens autorizados por el owner
    // operations     → Mapeo de ID → Operation (acceso O(1) por ID)
    // operationCount → Contador auto-incremental para asignar IDs únicos
    // =====================================================================

    /// @notice Array of allowed ERC20 tokens
    /// @notice Lista de direcciones de tokens ERC20 permitidos para swap
    address[] public allowedTokens;

    /// @notice Mapping of operation ID to Operation struct
    /// @notice Mapeo: ID de operación → datos completos de la operación
    /// @dev mapping permite acceso O(1) por clave (operationId)
    mapping(uint256 => Operation) public operations;

    /// @notice Total number of operations created
    /// @notice Contador total de operaciones creadas (se usa como ID)
    uint256 public operationCount;

    // =====================================================================
    // EVENTS — Registro de actividad en la blockchain
    // =====================================================================
    //
    // Los eventos permiten al frontend (y a cualquier observador) escuchar
    // cambios en el contrato sin tener que consultar constantemente.
    //
    // Eventos disponibles:
    //   TokenAdded           → Cuando el owner autoriza un nuevo token
    //   OperationCreated     → Cuando alguien crea una operación de swap
    //   OperationCompleted   → Cuando alguien completa un swap
    //   OperationCancelled   → Cuando el creador cancela una operación
    //
    // La palabra clave "indexed" permite filtrar eventos por ese parámetro.
    // =====================================================================

    /// @notice Emitted when owner adds a new allowed token
    /// @notice Se emite cuando el owner autoriza un nuevo token
    /// @param token Dirección del token agregado
    event TokenAdded(address indexed token);

    /// @notice Emitted when operation is created
    /// @notice Se emite cuando se crea una nueva operación de swap
    /// @param opId ID de la operación creada
    /// @param creator Dirección del creador
    /// @param tokenA Token que el creator deposita
    /// @param tokenB Token que el creator solicita
    event OperationCreated(
        uint256 indexed opId,
        address indexed creator,
        address indexed tokenA,
        address tokenB
    );

    /// @notice Emitted when operation is completed
    /// @notice Se emite cuando un usuario completa el swap
    /// @param opId ID de la operación completada
    /// @param completer Dirección del usuario que completó
    event OperationCompleted(uint256 indexed opId, address indexed completer);

    /// @notice Emitted when operation is cancelled
    /// @notice Se emite cuando el creador cancela la operación
    /// @param opId ID de la operación cancelada
    event OperationCancelled(uint256 indexed opId);

    // =====================================================================
    // CONSTRUCTOR — Inicialización del contrato
    // =====================================================================
    //
    // Se ejecuta UNA SOLA VEZ al desplegar el contrato.
    // Ownable(msg.sender) establece al desplagador como el owner (dueño).
    // El owner es la única cuenta que puede autorizar nuevos tokens.
    //
    // Nota: No se necesita inicializar allowedTokens porque por defecto
    // está vacío (los arrays en Solidity comienzan vacíos).
    // =====================================================================

    constructor() Ownable(msg.sender) {}

    // =====================================================================
    // ADMIN FUNCTIONS — Solo el owner puede ejecutar estas funciones
    // =====================================================================
    //
    // addToken(address token):
    //   ✅ Solo el owner (modificador onlyOwner de OpenZeppelin)
    //   ✅ Valida que no sea dirección 0x0
    //   ✅ Valida que no esté duplicado
    //   ❌ Revert con "Invalid token address" si es dirección 0x0
    //   ❌ Revert con "Token already allowed" si ya está registrado
    // =====================================================================

    /// @notice Allows owner to add a new token to the allowed list
    /// @notice El owner autoriza un nuevo token para ser intercambiado
    /// @param token Dirección del token ERC20 a autorizar
    /// @dev Rechaza dirección cero y tokens ya registrados
    function addToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");    // ❌ Dirección inválida
        require(!isTokenAllowed(token), "Token already allowed"); // ❌ Token duplicado

        allowedTokens.push(token);   // Agrega el token a la lista blanca
        emit TokenAdded(token);      // Notifica al frontend
    }

    // =====================================================================
    // OPERATION FUNCTIONS — Funciones principales del swap
    // =====================================================================
    //
    // Estas 3 funciones forman el ciclo de vida completo de una operación:
    //
    //   1. createOperation  → Usuario 1 deposita TokenA y solicita TokenB
    //   2. completeOperation → Usuario 2 envía TokenB y recibe TokenA
    //   3. cancelOperation   → Usuario 1 recupera sus tokens (si nadie completó)
    //
    // ⚠️ Patrón Checks-Effects-Interactions:
    //    Primero se validan los datos (Checks),
    //    luego se actualiza el estado (Effects),
    //    y finalmente se hacen las transferencias (Interactions).
    //    Esto previene ataques de reentrancia.
    // =====================================================================

    // ─────────────────────────────────────────────────────────────────────
    // FUNCIÓN: createOperation
    // ─────────────────────────────────────────────────────────────────────
    // Crea una nueva operación de swap:
    //   1. Valida que ambos tokens estén permitidos
    //   2. Valida que las cantidades sean > 0 y los tokens diferentes
    //   3. Transfiere TokenA del creador al contrato (safeTransferFrom)
    //   4. Guarda la operación con estado PENDING
    //   5. Emite evento OperationCreated
    //
    // ¿Quién puede llamarla? CUALQUIERA con tokens aprobados
    // ¿Requiere approve previo? SÍ — el usuario debe aprobar al contrato
    //
    // Ejemplo: Alice deposita 100 TokenA, pide 50 TokenB
    // =====================================================================

    /// @notice Creates a new token swap operation
    /// @notice Crea una nueva operación de intercambio de tokens
    /// @param tokenA Dirección del token que el creador deposita
    /// @param tokenB Dirección del token que el creador solicita
    /// @param amountA Cantidad de TokenA a depositar
    /// @param amountB Cantidad de TokenB solicitada
    /// @return operationId ID único de la operación creada
    /// @dev Usa nonReentrant para prevenir reentrancia
    function createOperation(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (uint256) {
        // ─── CHECKS: Validaciones ─────────────────────────────────────
        require(isTokenAllowed(tokenA) && isTokenAllowed(tokenB), "Token not allowed");
        // ❌ Si alguno de los tokens no está autorizado por el owner
        require(amountA > 0 && amountB > 0, "Amounts must be > 0");
        // ❌ Las cantidades deben ser positivas
        require(tokenA != tokenB, "Tokens must be different");
        // ❌ No se puede intercambiar el mismo token

        // ─── INTERACTIONS: Transferencia de tokens ────────────────────
        // Transfiere TokenA del usuario al contrato (necesita approve previo)
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);

        // ─── EFFECTS: Actualización de estado ─────────────────────────
        // Asigna un ID auto-incremental y guarda la operación
        uint256 opId = operationCount++;
        operations[opId] = Operation({
            id: opId,
            creator: msg.sender,
            tokenA: tokenA,
            tokenB: tokenB,
            amountA: amountA,
            amountB: amountB,
            status: OperationStatus.PENDING    // Comienza como PENDING
        });

        emit OperationCreated(opId, msg.sender, tokenA, tokenB);
        return opId;
    }

    // ─────────────────────────────────────────────────────────────────────
    // FUNCIÓN: completeOperation
    // ─────────────────────────────────────────────────────────────────────
    // Completa un swap existente:
    //   1. Verifica que la operación esté PENDING
    //   2. Verifica que quien completa NO sea el creador
    //   3. Marca como COMPLETED (Effects — antes de las transferencias)
    //   4. Transfiere TokenB del completador al creador
    //   5. Transfiere TokenA del contrato al completador
    //
    // ¿Quién puede llamarla? CUALQUIERA excepto el creador
    // ¿Qué necesita? Aprobar TokenB al contrato (approve)
    //
    // Ejemplo: Bob envía 50 TokenB a Alice → recibe 100 TokenA
    //
    // 🔒 Seguridad: safeTransferFrom para recibir TokenB del completador
    //               safeTransfer para enviar TokenA desde el contrato
    // ⚠️ Checks-Effects-Interactions: status se actualiza ANTES de transferir
    // =====================================================================

    /// @notice Completes a token swap operation
    /// @notice Completa un swap: usuario 2 envía TokenB y recibe TokenA
    /// @param operationId ID de la operación a completar
    /// @dev El completador debe ser DIFERENTE al creador de la operación
    /// @dev Quien completa transfiere TokenB al creador y recibe TokenA
    function completeOperation(uint256 operationId) external nonReentrant {
        Operation storage op = operations[operationId];

        // ─── CHECKS: Validaciones ─────────────────────────────────────
        require(op.status == OperationStatus.PENDING, "Operation not pending");
        // ❌ La operación debe estar activa (no completada ni cancelada)
        require(msg.sender != op.creator, "Cannot complete own operation");
        // ❌ No puedes completar tu propia operación (necesitas otra cuenta)

        // ─── EFFECTS: Actualizar estado ANTES de transferir ────────────
        // Esto es clave: si la transferencia falla, el estado ya cambió
        // Pero como la transacción completa se reversa, no hay problema.
        // El orden correcto (Checks-Effects-Interactions) evita reentrancia.
        op.status = OperationStatus.COMPLETED;

        // ─── INTERACTIONS: Transferencias ─────────────────────────────
        // El completador envía TokenB al creador
        IERC20(op.tokenB).safeTransferFrom(msg.sender, op.creator, op.amountB);
        // El contrato envía TokenA al completador
        IERC20(op.tokenA).safeTransfer(msg.sender, op.amountA);

        emit OperationCompleted(operationId, msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────
    // FUNCIÓN: cancelOperation
    // ─────────────────────────────────────────────────────────────────────
    // Cancela una operación PENDING y devuelve los tokens al creador:
    //   1. Verifica que la operación esté PENDING
    //   2. Verifica que el SOLO el creador pueda cancelar
    //   3. Marca como CANCELLED (Effects — antes de transferir)
    //   4. Devuelve TokenA al creador
    //
    // ¿Quién puede llamarla? SOLO el creador de la operación
    // ¿Cuándo usarla? Si nadie completa el swap y el creador quiere recuperar
    //
    // Ejemplo: Alice creó una operación pero nadie la completa →
    //          Alice cancela y recupera sus 100 TokenA
    //
    // 🔒 Importante: solo el creador puede cancelar (no el completador)
    // ⚠️ Una vez cancelada, NO se puede reactivar
    // =====================================================================

    /// @notice Cancels a pending operation and returns tokenA to creator
    /// @notice Cancela una operación pendiente y devuelve TokenA al creador
    /// @param operationId ID de la operación a cancelar
    /// @dev Solo el creador de la operación puede cancelarla
    function cancelOperation(uint256 operationId) external nonReentrant {
        Operation storage op = operations[operationId];

        // ─── CHECKS: Validaciones ─────────────────────────────────────
        require(op.status == OperationStatus.PENDING, "Operation not pending");
        // ❌ Solo se pueden cancelar operaciones activas
        require(msg.sender == op.creator, "Only creator can cancel");
        // ❌ Solo el creador puede cancelar (seguridad)

        // ─── EFFECTS: Actualizar estado ANTES de transferir ────────────
        op.status = OperationStatus.CANCELLED;

        // ─── INTERACTIONS: Devolver tokens al creador ─────────────────
        IERC20(op.tokenA).safeTransfer(op.creator, op.amountA);
        // Devuelve el TokenA que el creador depositó originalmente

        emit OperationCancelled(operationId);
    }

    // =====================================================================
    // QUERY FUNCTIONS — Consultas de sólo lectura (view)
    // =====================================================================
    //
    // Estas funciones NO modifican el estado del contrato (view).
    // No cuestan gas cuando se llaman desde el frontend (llamadas eth_call).
    // Permiten al frontend obtener información sin firmar transacciones.
    //
    // Funciones disponibles:
    //   isTokenAllowed       → ¿Un token está autorizado?
    //   getAllowedTokens     → Lista completa de tokens autorizados
    //   getOperation         → Detalles de una operación por ID
    //   getAllOperations     → Todas las operaciones (para el panel de debug)
    //   getOperationsByCreator → Operaciones de un usuario específico
    //   getContractBalance   → Balance del contrato de un token
    // =====================================================================

    // ─────────────────────────────────────────────────────────────────────
    // isTokenAllowed(address)
    // ─────────────────────────────────────────────────────────────────────
    // Recorre el array allowedTokens buscando una dirección.
    // Retorna TRUE si el token está en la lista blanca.
    //
    // ⚠️ Es un loop O(n) — para producción usar mapping + array
    //    (OK para este proyecto educativo con pocos tokens)
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Checks if a token is in the allowed list
    /// @notice Verifica si un token está autorizado por el owner
    /// @param token Dirección del token a consultar
    /// @return True si está permitido, False si no
    function isTokenAllowed(address token) public view returns (bool) {
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            if (allowedTokens[i] == token) {
                return true;
            }
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────
    // getAllowedTokens()
    // ─────────────────────────────────────────────────────────────────────
    // Retorna el array completo de direcciones de tokens autorizados.
    // Útil para el frontend: muestra en un selector qué tokens usar.
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Returns all allowed tokens
    /// @notice Retorna la lista completa de tokens autorizados
    /// @return Array de direcciones de tokens permitidos
    function getAllowedTokens() public view returns (address[] memory) {
        return allowedTokens;
    }

    // ─────────────────────────────────────────────────────────────────────
    // getOperation(uint256)
    // ─────────────────────────────────────────────────────────────────────
    // Retorna los detalles de una operación específica por su ID.
    // El frontend usa esto para mostrar la información de cada swap.
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Returns details of a specific operation
    /// @notice Retorna los detalles de una operación específica
    /// @param operationId ID de la operación a consultar
    /// @return Struct Operation con todos los datos del swap
    function getOperation(uint256 operationId) public view returns (Operation memory) {
        return operations[operationId];
    }

    // ─────────────────────────────────────────────────────────────────────
    // getAllOperations()
    // ─────────────────────────────────────────────────────────────────────
    // Retorna TODAS las operaciones (PENDING, COMPLETED, CANCELLED).
    // Crea un array en memoria del tamaño exacto (operationCount).
    //
    // ⚠️ Para producción, añadir paginación si hay muchas operaciones.
    //    Aquí es educativo y el volumen es bajo.
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Returns all operations
    /// @notice Retorna todas las operaciones creadas (para panel de debug)
    /// @return Array de todas las operaciones
    function getAllOperations() public view returns (Operation[] memory) {
        Operation[] memory allOps = new Operation[](operationCount);
        for (uint256 i = 0; i < operationCount; i++) {
            allOps[i] = operations[i];
        }
        return allOps;
    }

    // ─────────────────────────────────────────────────────────────────────
    // getOperationsByCreator(address)
    // ─────────────────────────────────────────────────────────────────────
    // Filtra todas las operaciones y retorna solo las de un creador.
    // Requiere 2 pasadas: una para contar, otra para llenar el array.
    // (En Solidity, los arrays dinámicos en memoria deben dimensionarse
    //  antes de usarse, de ahí la doble iteración)
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Returns operation IDs created by a specific address
    /// @notice Retorna los IDs de operaciones creadas por una dirección
    /// @param creator Dirección del creador a consultar
    /// @return Array de IDs de operaciones de ese creador
    function getOperationsByCreator(address creator) public view returns (uint256[] memory) {
        // Primera pasada: contar cuántas operaciones tiene este creador
        uint256 count = 0;
        for (uint256 i = 0; i < operationCount; i++) {
            if (operations[i].creator == creator) {
                count++;
            }
        }

        // Segunda pasada: llenar el array con los IDs
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

    // ─────────────────────────────────────────────────────────────────────
    // getContractBalance(address)
    // ─────────────────────────────────────────────────────────────────────
    // Retorna cuántos tokens de un tipo tiene el contrato en su balance.
    // Útil para el panel de debug y verificar que las transferencias
    // funcionaron correctamente durante el testing E2E.
    // ─────────────────────────────────────────────────────────────────────

    /// @notice Returns current balance of a token in the contract
    /// @notice Retorna el balance actual de un token en el contrato
    /// @param token Dirección del token a consultar
    /// @return Balance del token en poder del contrato
    function getContractBalance(address token) public view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
