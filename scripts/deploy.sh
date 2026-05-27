#!/bin/bash
set -e

# =============================================================================
# ESCROW DApp Deployment Script
# =============================================================================
# Deploys Escrow + TokenA + TokenB contracts to Anvil local blockchain,
# adds tokens to the Escrow allowed list, mints tokens to test accounts,
# and generates the frontend .env.local file with contract addresses.
#
# Usage:
#   ./scripts/deploy.sh
#
# Prerequisites:
#   - Anvil running at http://127.0.0.1:8545
#   - Foundry (forge, cast) installed
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  ESCROW DApp - Deployment Script${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# -------------------------------------------------------------------------
# Step 1: Check Anvil is running
# -------------------------------------------------------------------------
echo -e "${YELLOW}[1/7]${NC} Checking Anvil connection..."

if ! nc -z 127.0.0.1 8545 2>/dev/null; then
  echo -e "${RED}❌ Anvil is not running at http://127.0.0.1:8545${NC}"
  echo ""
  echo "Start Anvil in a separate terminal:"
  echo "  anvil"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓${NC} Anvil is running"

# -------------------------------------------------------------------------
# Step 2: Compile contracts
# -------------------------------------------------------------------------
echo -e "${YELLOW}[2/7]${NC} Compiling contracts..."
cd "$PROJECT_DIR/contracts"

forge build --quiet
echo -e "${GREEN}✓${NC} Contracts compiled"

# -------------------------------------------------------------------------
# Step 3: Deploy contracts
# -------------------------------------------------------------------------
ANVIL_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo -e "${YELLOW}[3/7]${NC} Deploying Escrow contract..."
ESCROW_OUTPUT=$(forge create src/Escrow.sol:Escrow \
  --private-key $ANVIL_KEY \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --json 2>/dev/null)
ESCROW_ADDRESS=$(echo "$ESCROW_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['deployedTo'])")
echo -e "${GREEN}✓${NC} Escrow deployed to: $ESCROW_ADDRESS"

echo -e "${YELLOW}[3/7]${NC} Deploying TokenA..."
TOKEN_A_OUTPUT=$(forge create src/TokenA.sol:TokenA \
  --private-key $ANVIL_KEY \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --json 2>/dev/null)
TOKEN_A_ADDRESS=$(echo "$TOKEN_A_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['deployedTo'])")
echo -e "${GREEN}✓${NC} TokenA deployed to: $TOKEN_A_ADDRESS"

echo -e "${YELLOW}[3/7]${NC} Deploying TokenB..."
TOKEN_B_OUTPUT=$(forge create src/TokenB.sol:TokenB \
  --private-key $ANVIL_KEY \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --json 2>/dev/null)
TOKEN_B_ADDRESS=$(echo "$TOKEN_B_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['deployedTo'])")
echo -e "${GREEN}✓${NC} TokenB deployed to: $TOKEN_B_ADDRESS"

# -------------------------------------------------------------------------
# Step 4: Add tokens to Escrow allowed list
# -------------------------------------------------------------------------
echo -e "${YELLOW}[4/7]${NC} Adding tokens to Escrow allowed list..."

cast send $ESCROW_ADDRESS \
  "addToken(address)" $TOKEN_A_ADDRESS \
  --private-key $ANVIL_KEY \
  --rpc-url localhost --quiet 2>&1
echo -e "${GREEN}✓${NC} TokenA added to allowed list"

cast send $ESCROW_ADDRESS \
  "addToken(address)" $TOKEN_B_ADDRESS \
  --private-key $ANVIL_KEY \
  --rpc-url localhost --quiet 2>&1
echo -e "${GREEN}✓${NC} TokenB added to allowed list"

# -------------------------------------------------------------------------
# Step 5: Mint tokens to test accounts
# -------------------------------------------------------------------------
echo -e "${YELLOW}[5/7]${NC} Minting tokens to test accounts..."

# Anvil default accounts
OWNER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
USER1="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
USER2="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"

MINT_AMOUNT="1000000000000000000000" # 1000 tokens (18 decimals)

for ACCOUNT in "$OWNER" "$USER1" "$USER2"; do
  cast send $TOKEN_A_ADDRESS \
    "mint(address,uint256)" $ACCOUNT $MINT_AMOUNT \
    --private-key $ANVIL_KEY \
    --rpc-url localhost --quiet 2>&1

  cast send $TOKEN_B_ADDRESS \
    "mint(address,uint256)" $ACCOUNT $MINT_AMOUNT \
    --private-key $ANVIL_KEY \
    --rpc-url localhost --quiet 2>&1
done

echo -e "${GREEN}✓${NC} Tokens minted to Owner, User1, and User2 (1,000 each)"

# -------------------------------------------------------------------------
# Step 6: Generate frontend .env.local
# -------------------------------------------------------------------------
echo -e "${YELLOW}[6/7]${NC} Generating frontend .env.local..."

WEB_DIR="$PROJECT_DIR/web"

cat > "$WEB_DIR/.env.local" << EOF
NEXT_PUBLIC_ESCROW_ADDRESS=$ESCROW_ADDRESS
NEXT_PUBLIC_TOKEN_A_ADDRESS=$TOKEN_A_ADDRESS
NEXT_PUBLIC_TOKEN_B_ADDRESS=$TOKEN_B_ADDRESS
NEXT_PUBLIC_CHAIN_ID=31337
EOF

echo -e "${GREEN}✓${NC} Frontend config written to web/.env.local"

# -------------------------------------------------------------------------
# Step 7: Save deployment info
# -------------------------------------------------------------------------
echo -e "${YELLOW}[7/7]${NC} Saving deployment info..."

cat > "$PROJECT_DIR/deployment-info.txt" << EOF
============================================
  ESCROW DApp - Deployment Information
============================================
Deployment Timestamp: $(date)
Network: Anvil Local (Chain ID: 31337)

Contract Addresses:
  Escrow:  $ESCROW_ADDRESS
  TokenA:  $TOKEN_A_ADDRESS
  TokenB:  $TOKEN_B_ADDRESS

Test Accounts (Anvil defaults):
  Owner:  $OWNER
  User1:  $USER1
  User2:  $USER2

Deployer Private Key:
  0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Etherscan Links (not applicable for Anvil):
  N/A - Local development only
EOF

echo -e "${GREEN}✓${NC} Deployment info saved to deployment-info.txt"

# -------------------------------------------------------------------------
# Done
# -------------------------------------------------------------------------
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${BLUE}Escrow:${NC}  $ESCROW_ADDRESS"
echo -e "  ${BLUE}TokenA:${NC}  $TOKEN_A_ADDRESS"
echo -e "  ${BLUE}TokenB:${NC}  $TOKEN_B_ADDRESS"
echo ""
echo -e "  ${BLUE}Frontend:${NC} cd web && npm run dev"
echo ""
