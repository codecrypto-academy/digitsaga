#Objetivo del Proyecto
crea una aplication descentralizada(DApp) completa para realizar intercambios seguros de token ERC20 utizando un contrato inteligente de escrow que permita crear operaciones de swap, completarlas y cancelarlas, Incluye: 

**Smart Contract**: Contrato Escrow en Solidity(Foundry) que gestiona operaciones de intercambio de token
**Frontend Web**: compact UI aplication Next.js 15 and standard css que permite interactuar con el contrato 
**Integration Web3** Conexion con MataMask usando ethers.js.

##Core Funcions:
 
1. **Agregar Tokens**: El owner puede autorizar token ERC20 se puede intercacambiar 
2. **Crear Operatione**: Usuario 1 deposita Token A y solicita Token B a cambio
3. **Completar Operaciones**:Usuario 2 proporciona Token B y Recibe Token A
4. **Cancelar Operacione**: Usuario 1 puede cancelar y recuperar sus tokens
5. **Visualizar Estado**: Panel de debug para ver balaces y oparaciones activas

## Smart Contract
Contrato escrow.sol con funcionalidades:
- Heredar de Owner y ReentrancyGuard de OpenZepplin
- addToken(address): solo owner puede agregar token permitidos
- createOperation(tokenA, tokenB, amountA, amountB): crear operacion de swap
  * Transferir tokenA del usuario al contrato
  * Guardar la operation como activa
- completeOperacion(operationId): completar swap
  * Transferir tokenB del usuario2 al usuario1
  * Transferir tokenA del contrato al usuario2
  * solo puede completarla alguien diferente al creador
- cancelOperation(operationId): cancelar operation
  * Devolver tokenA al creador
  * solo el creador puede cancelar
- getAllowedTokens(): retornar lista de tokens permitidos
- getAllOperations(): retornar todas las operationes

Incluye eventos para: TokenAdded, OperationCreated, OparacionCompleted, OperationCancelled 

Crea tests completos para el contrato Escrow.sol usando Foundry. 
Prueba todos los casos: happy path, reverts, edge cases.

## script de Deployment

Crear script deploy.sh que:
1. Despliegue el contrato Escrow
2. Despliegue dos tokens ERC20 de prueba (TokenA y TokenB)
3. Agrege ambos token al contrato Escrow
4. Mind 1000 token de cada tipo a las cuentas de test de Anvil 
    -(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 
    -(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 
    -(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
5. Actualisa automaticamente la direction del contrato en web/lib/contracts.ts
6. Genera un archivo deployment-info.txt con la directiones

el script debe asumir que Anvil ya esta corriendo en (0.0.0.0:8545->8545/tcp  anvil-local-container)

## Frontend Web

Crea and setup Frontend:
1. Configurar Next.js 15 con typeScript
2. Instalar ethers.js v6
3. configurar Tailwind CSS v4 and for basic Animation 
4. crear el context provider de Ethereum en lib/ethereum.tsx que:
  - Gestione la conexion con MetaMask
  - Provea provider,  signer, account
  - Auto-reconecte al refrescar la pagina
5. Crear lib/contracts.ts con los ABI's contrato Escrow y ERC20

## Componentes

- Componentes de ConnectButton.tsx
- Componentes AddToken.tsx
- Componentes CreateOperation.tsx
- Componentes OperationList.tsx
- Componentes BalanceDebug.tsx

Agregar manejo de errores robusto en todos los componentes

## Testing End-to-End

Documentra el flujo de prueba completo:
1. Iniciar Anvil
2. Ejecutar deploy.sh
3. Importar cuenta de test en MetaMask
4. Agregar tokens permitidos
5. Crear operaciones con cuenta 2
6. Cambiar a cuenta 2 en MetaMask
7. Completar operation con cuenta 2
8. Verificar balances actualizados
9. Probar cancelacion de operacion
 


