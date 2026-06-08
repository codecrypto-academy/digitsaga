#!/bin/bash

# Simple deployment script using forge create
# NOTE: Prefer deploy-all.sh or restart-all.sh for full deployment
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RPC_URL="http://localhost:8545"
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting simple deployment...${NC}"
echo ""

# Check Anvil
if ! nc -z localhost 8545 2>/dev/null; then
    echo -e "${RED}❌ Anvil not running. Start with: anvil${NC}"
    exit 1
fi

# 1. Deploy EuroToken
echo -e "${BLUE}1. Deploying EuroToken...${NC}"
cd "${SCRIPT_DIR}/stablecoin/sc"
EURO_OUTPUT=$(forge create --rpc-url ${RPC_URL} \
    --private-key ${PRIVATE_KEY} \
    src/EuroToken.sol:EuroToken \
    --constructor-args 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 2>&1)

EURO_TOKEN_ADDRESS=$(echo "$EURO_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✅ EuroToken: ${EURO_TOKEN_ADDRESS}${NC}"

# 2. Deploy Ecommerce
echo -e "${BLUE}2. Deploying Ecommerce...${NC}"
cd "${SCRIPT_DIR}/sc-ecommerce"
MAIN_OUTPUT=$(forge create --rpc-url ${RPC_URL} \
    --private-key ${PRIVATE_KEY} \
    src/Ecommerce.sol:Ecommerce \
    --constructor-args ${EURO_TOKEN_ADDRESS} 2>&1)

ECOMMERCE_ADDRESS=$(echo "$MAIN_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✅ Ecommerce: ${ECOMMERCE_ADDRESS}${NC}"

# 3. Update .env files
echo -e "${BLUE}3. Updating .env files...${NC}"

update_env() {
    local FILE=$1
    shift
    for VAR in "$@"; do echo "$VAR" >> "$FILE"; done
}

: > "${SCRIPT_DIR}/stablecoin/compra-stableboin/.env.local"
update_env "${SCRIPT_DIR}/stablecoin/compra-stableboin/.env.local" \
    "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=${EURO_TOKEN_ADDRESS}" \
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_..." \
    "STRIPE_SECRET_KEY=sk_test_..." \
    "OWNER_PRIVATE_KEY=${PRIVATE_KEY}"

: > "${SCRIPT_DIR}/stablecoin/pasarela-de-pago/.env.local"
update_env "${SCRIPT_DIR}/stablecoin/pasarela-de-pago/.env.local" \
    "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=${EURO_TOKEN_ADDRESS}" \
    "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=${ECOMMERCE_ADDRESS}"

: > "${SCRIPT_DIR}/web-admin/.env.local"
update_env "${SCRIPT_DIR}/web-admin/.env.local" \
    "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=${ECOMMERCE_ADDRESS}" \
    "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=${EURO_TOKEN_ADDRESS}"

: > "${SCRIPT_DIR}/web-customer/.env.local"
update_env "${SCRIPT_DIR}/web-customer/.env.local" \
    "NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=${ECOMMERCE_ADDRESS}" \
    "NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=${EURO_TOKEN_ADDRESS}" \
    "OWNER_PRIVATE_KEY=${PRIVATE_KEY}"

echo -e "${GREEN}✅ Updated .env.local files${NC}"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "Addresses:"
echo -e "  EuroToken:  ${EURO_TOKEN_ADDRESS}"
echo -e "  Ecommerce:  ${ECOMMERCE_ADDRESS}"
