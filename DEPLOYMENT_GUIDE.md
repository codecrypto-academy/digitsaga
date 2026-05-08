# Guía de Deployment - DAO Voting Platform

## Paso 1: Iniciar red local

### Opción A: Ejecutar Anvil directamente (viene con Foundry)

```bash
anvil
```

Esto iniciará una blockchain local en `http://127.0.0.1:8545` y te dará 10 cuentas con 10,000 ETH cada una.

### Opción B: Ejecutar Anvil en Container enviroment

Si prefieres ejecutar Anvil en un container:

```bash
# Iniciar el container (ya configurado)
docker start anvil-local-container

# Verificar que está corriendo
docker ps | grep anvil
```

El container expone Anvil en `http://0.0.0.0:8545` (accesible como `http://localhost:8545`).

**Copia una de las private keys** que Anvil muestra (por ejemplo, la primera).

## Paso 2: Configurar environment para deployment

### Opción A: Configuración manual

```bash
cd sc
cp .env.example .env
```

Edita `sc/.env` con:

```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545
MINIMUM_BALANCE=100000000000000000
```

(La private key de arriba es la primera cuenta por defecto de Anvil)

### Opción B: Usar Docker

Si tienes un container de Docker configurado, los environment variables ya estarán configurados en el container:

```bash
# Verificar que el container tiene las variables correctas
docker exec -it <container-name> env | grep -E "(PRIVATE_KEY|RPC_URL)"
```

También puedes usar un volumen para persistir el archivo `.env`:

```bash
docker run -v $(pwd)/sc:/app -w /app <image> cat .env
```

## Paso 3: Deploy de contratos

### Opción A: Ejecutar directamente

```bash
cd sc

# Verificar que los contratos compilan
forge build

# Ejecutar tests
forge test

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Opción B: Ejecutar en Docker

Si tienes un container con Foundry instalado:

```bash
# Compilar y deployar desde el container
docker run --rm \
  -v $(pwd):/app \
  -w /app/sc \
  ghcr.io/foundry-rs/foundry:latest \
  "forge build && forge script script/Deploy.s.sol:DeployScript --rpc-url http://host.docker.internal:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
```

O si tienes un container ya en ejecución:

```bash
# Ejecutar dentro del container (asegurándose que pueda alcanzar el host)
docker exec -w /app/sc <container-name> forge script script/Deploy.s.sol:DeployScript \
  --rpc-url http://host.docker.internal:8545 \
  --broadcast
```

**IMPORTANTE**: Después del deployment, verás en la consola algo como:

```
MinimalForwarder deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
DAOVoting deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**Copia estas direcciones**, las necesitarás en el siguiente paso.

## Paso 4: Configurar la Web App

### Opción A: Configuración manual

```bash
cd ../web
cp .env.example .env.local
```

Edita `web/.env.local` con las direcciones que obtuviste:

```env
# Direcciones de los contratos deployados
NEXT_PUBLIC_DAO_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Relayer (puede ser la misma cuenta que deployó)
RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RELAYER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Red local
RPC_URL=http://127.0.0.1:8545
```

### Opción B: Usar Docker

Si usas Docker Compose, las variables se injectan automáticamente:

```bash
# Usar docker-compose con archivo de entorno
docker compose --env-file ./web/.env.local up
```

O directamente en el container:

```bash
# Verificar variables dentro del container
docker exec <container-name> env | grep NEXT_PUBLIC
docker exec <container-name> env | grep RELAYER
```

## Paso 5: Generar ABIs para la web

### Opción A: Generación manual

```bash
cd ../sc
jq -r '.abi' out/DAOVoting.sol/DAOVoting.json > ../web/src/lib/DAOVoting.abi.json
jq -r '.abi' out/MinimalForwarder.sol/MinimalForwarder.json > ../web/src/lib/MinimalForwarder.abi.json
```

### Opción B: Usar Docker

Si ejecutas forge dentro de un container:

```bash
# Generar ABIs desde el container
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  alpine/jq:latest \
  -r '.abi' sc/out/DAOVoting.sol/DAOVoting.json > web/src/lib/DAOVoting.abi.json
```

O si tienes el container de foundry activo:

```bash
docker exec <container-name> jq -r '.abi' /app/sc/out/DAOVoting.sol/DAOVoting.json > /tmp/DAOVoting.abi.json
docker cp <container-name>:/tmp/DAOVoting.abi.json web/src/lib/
```

## Paso 6: Iniciar la aplicación web

### Opción A: Ejecución local

```bash
cd ../web
npm install
npm run dev
```

La app estará en `http://localhost:3000`

### Opción B: Usar Docker

Si tienes Docker configurado para la web app:

```bash
# Construcción y ejecución del container
docker build -t dao-web ./web
docker run -p 3000:3000 dao-web

# O si usas docker-compose
docker compose up web
```

O si el container ya está en ejecución:

```bash
# Ver logs de la aplicación
docker logs -f <container-name>

# Reiniciar la app
docker restart <container-name>
```

## Paso 7: Configurar MetaMask

### Opción A: Configuración manual

1. Abre MetaMask
2. Ve a Settings → Networks → Add Network
3. Configura:
   - **Network Name**: Localhost
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

4. Importa una cuenta de Anvil:
   - Click en el icono de cuenta
   - "Import Account"
   - Pega una private key de Anvil (usa una diferente a la del relayer)
   - Ejemplo: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` (segunda cuenta)

### Opción B: N/A

MetaMask es una extensión de navegador y no puede ejecutarse dentro de un container. La configuración manual (Opción A) es necesaria.

## Paso 8: Usar la aplicación

### Opción A: Uso manual

1. **Conectar wallet**: Click en "Connect Wallet"
2. **Depositar al DAO**: Deposita al menos 0.1 ETH para poder votar
3. **Fondear el DAO**: El contrato necesita fondos para las propuestas. Deposita varios ETH.
4. **Crear propuesta**:
   - Necesitas al menos 10% del balance del contrato
   - Ingresa recipient, amount, duration, description
   - ¡Votación gasless!
5. **Votar**: Las votaciones son gasless, el relayer paga el gas
6. **Ejecución automática**: El daemon ejecutará propuestas aprobadas automáticamente

### Opción B: Tests E2E en Docker

Si prefieres automatizar las pruebas:

```bash
# Ejecutar tests E2E en container
docker run --rm \
  -v $(pwd)/web:/app \
  -w /app \
  mcr.microsoft.com/playwright:latest \
  npx playwright test

# O con docker-compose
docker compose run e2e-tests
```

Esto ejecutará tests automatizados para verificar el flujo completo de la aplicación.

## Troubleshooting

### Error: "Insufficient balance to create proposal"
- Asegúrate de que tu cuenta tenga al menos 10% del balance del DAO contract
- El DAO contract debe tener fondos

### Error: "ENS name not configured"
- Verifica que las direcciones en `.env.local` estén correctas
- Asegúrate de que los contratos estén deployados en la red correcta

### Error: "User rejected transaction"
- Acepta la firma en MetaMask (no cuesta gas para votar)

### Daemon no ejecuta propuestas
- Verifica que la propuesta esté aprobada (forVotes > againstVotes)
- Verifica que haya pasado el voting deadline + execution delay
- Revisa logs en la consola del navegador

## Testing con múltiples cuentas

Para probar el sistema completo:

1. Importa 3-4 cuentas de Anvil en MetaMask
2. Desde la cuenta principal, deposita fondos al DAO
3. Crea una propuesta
4. Cambia de cuenta en MetaMask para votar
5. Observa cómo el daemon ejecuta la propuesta aprobada

## Deployment a Testnet (Sepolia)

```bash
# En sc/.env
PRIVATE_KEY=<tu-private-key-real>
RPC_URL=https://sepolia.infura.io/v3/<tu-infura-key>

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key <tu-etherscan-key>
```

Luego actualiza `web/.env.local` con las nuevas direcciones.
