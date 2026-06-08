#!/bin/bash
## Script para reiniciar todo el sistema: detiene las aplicaciones en los puertos, limpia builds, redeploya contratos y actualiza .env values.
## Este script es útil para desarrollo local, especialmente después de cambios en los contratos o para limpiar el estado.
## NOTA: Asegúrate de que Anvil esté corriendo antes de ejecutar este script (anvil).
## Uso: ./restart-all.sh (asegúrate de tener permisos de ejecución: chmod +x restart-all.sh) 
## use sed or awk para reemplazar líneas específicas en los archivos .env.local
## Recomendación: Usa este script después de hacer cambios en los contratos o para reiniciar el entorno de desarrollo desde cero. 

set -e

echo "🔄 Reiniciando todo el sistema..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="${RPC_URL:-http://localhost:8545}"

# Directorio base (resolución dinámica)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Helper: update or append a key=value in a .env file without overwriting other keys
update_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  if [ ! -f "$file" ]; then
    echo "$key=$value" > "$file"
    return
  fi
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    # Replace existing line (any value after key=)
    sed -i.bak "s|^${key}=.*|${key}=${value}|" "$file" && rm -f "${file}.bak"
  else
    echo "$key=$value" >> "$file"
  fi
}

echo -e "${YELLOW}📦 Paso 1: Deteniendo aplicaciones anteriores...${NC}"

for port in 6001 6002 6003 6004; do
    echo "Deteniendo aplicación en puerto $port..."
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || echo "  No hay proceso en puerto $port"
done

sleep 2

echo -e "${YELLOW}📦 Paso 2: Limpiando builds anteriores...${NC}"
cd "$SCRIPT_DIR/stablecoin/sc"
forge clean 2>/dev/null || true
cd "$SCRIPT_DIR/sc-ecommerce"
forge clean 2>/dev/null || true

echo -e "${YELLOW}📦 Paso 3: Desplegando EuroToken...${NC}"
cd "$SCRIPT_DIR/stablecoin/sc"
DEPLOY_OUTPUT=$(forge script script/DeployEuroToken.s.sol:DeployEuroToken \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY \
  -vv 2>&1)

EURO_TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "EuroToken deployed at:" | grep -oE '0x[a-fA-F0-9]{40}')
if [ -z "$EURO_TOKEN_ADDRESS" ]; then
  echo -e "${RED}Error: No se pudo extraer la dirección de EuroToken${NC}"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi
echo "  EuroToken desplegado en: $EURO_TOKEN_ADDRESS"

echo -e "${YELLOW}📦 Paso 4: Desplegando Ecommerce...${NC}"
cd "$SCRIPT_DIR/sc-ecommerce"
DEPLOY_OUTPUT=$(EURO_TOKEN_ADDRESS=$EURO_TOKEN_ADDRESS forge script script/DeployEcommerce.s.sol:DeployEcommerceScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $PRIVATE_KEY \
  -vv 2>&1)

ECOMMERCE_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Ecommerce deployed at:" | grep -oE '0x[a-fA-F0-9]{40}')
if [ -z "$ECOMMERCE_ADDRESS" ]; then
  echo -e "${RED}Error: No se pudo extraer la dirección de Ecommerce${NC}"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi
echo "  Ecommerce desplegado en: $ECOMMERCE_ADDRESS"

echo -e "${YELLOW}📦 Paso 5: Actualizando variables de entorno...${NC}"

# compra-stableboin — preserves existing Stripe keys, adds contract address + network
update_env "$SCRIPT_DIR/stablecoin/compra-stableboin/.env.local" "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS" "$EURO_TOKEN_ADDRESS"
update_env "$SCRIPT_DIR/stablecoin/compra-stableboin/.env.local" "NEXT_PUBLIC_NETWORK_NAME" "127.0.0.1:8545"
update_env "$SCRIPT_DIR/stablecoin/compra-stableboin/.env.local" "OWNER_PRIVATE_KEY" "$PRIVATE_KEY"
echo "  Actualizado compra-stableboin/.env.local"

# pasarela-de-pago
update_env "$SCRIPT_DIR/stablecoin/pasarela-de-pago/.env.local" "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS" "$EURO_TOKEN_ADDRESS"
update_env "$SCRIPT_DIR/stablecoin/pasarela-de-pago/.env.local" "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS" "$ECOMMERCE_ADDRESS"
echo "  Actualizado pasarela-de-pago/.env.local"

# web-admin
update_env "$SCRIPT_DIR/web-admin/.env.local" "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS" "$ECOMMERCE_ADDRESS"
update_env "$SCRIPT_DIR/web-admin/.env.local" "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS" "$EURO_TOKEN_ADDRESS"
update_env "$SCRIPT_DIR/web-admin/.env.local" "NEXT_PUBLIC_CHAIN_ID" "31337"
echo "  Actualizado web-admin/.env.local"

# web-customer
update_env "$SCRIPT_DIR/web-customer/.env.local" "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS" "$ECOMMERCE_ADDRESS"
update_env "$SCRIPT_DIR/web-customer/.env.local" "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS" "$EURO_TOKEN_ADDRESS"
update_env "$SCRIPT_DIR/web-customer/.env.local" "NEXT_PUBLIC_CHAIN_ID" "31337"
echo "  Actualizado web-customer/.env.local"

echo -e "${YELLOW}📦 Paso 6: Iniciando aplicaciones...${NC}"

cd "$SCRIPT_DIR/stablecoin/compra-stableboin"
npx next dev --port 6001 > /tmp/compra-stableboin.log 2>&1 &
echo "  compra-stableboin iniciado (puerto 6001)"

cd "$SCRIPT_DIR/stablecoin/pasarela-de-pago"
npx next dev --port 6002 > /tmp/pasarela-de-pago.log 2>&1 &
echo "  pasarela-de-pago iniciado (puerto 6002)"

cd "$SCRIPT_DIR/web-admin"
npx next dev --port 6003 > /tmp/web-admin.log 2>&1 &
echo "  web-admin iniciado (puerto 6003)"

cd "$SCRIPT_DIR/web-customer"
npx next dev --port 6004 > /tmp/web-customer.log 2>&1 &
echo "  web-customer iniciado (puerto 6004)"

sleep 5

echo -e "${GREEN}✅ Sistema reiniciado exitosamente!${NC}"
echo ""
echo "📋 Resumen:"
echo "  - Anvil: http://localhost:8545"
echo "  - EuroToken: $EURO_TOKEN_ADDRESS"
echo "  - Ecommerce: $ECOMMERCE_ADDRESS"
echo ""
echo "  - Compra Stablecoin: http://localhost:6001"
echo "  - Pasarela de Pago: http://localhost:6002"
echo "  - Web Admin: http://localhost:6003"
echo "  - Web Customer: http://localhost:6004"
echo ""
echo -e "${YELLOW}💡 Tip: Espera unos segundos para que las aplicaciones estén completamente listas${NC}"
