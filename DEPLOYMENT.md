# Deployment Workflow

This guide covers deploying the ESCROW DApp contracts and frontend.

## Overview

The deployment process is fully automated via the `scripts/deploy.sh` script, which:

1. Compiles smart contracts
2. Deploys Escrow.sol
3. Deploys test tokens (TokenA, TokenB)
4. Authorizes tokens in Escrow
5. Mints tokens to test accounts
6. Updates frontend environment config
7. Generates deployment summary

## Prerequisites

- Anvil running: `anvil --host 0.0.0.0`
- Foundry installed: `forge --version`
- Node.js 18+ installed: `node --version`

## Deployment to Local Anvil

### Automated Deployment

```bash
cd /path/to/ESCROW

# Run deployment script
./scripts/deploy.sh

# Script handles everything automatically
```

### What the Script Does

1. **Checks Anvil is running**
   ```bash
   nc -z localhost 8545 || exit 1
   ```

2. **Compiles contracts**
   ```bash
   cd contracts && forge build
   ```

3. **Deploys Escrow contract**
   ```bash
   forge create Escrow --private-key <PK>
   ```

4. **Deploys TokenA and TokenB**
   ```bash
   forge create TokenA --private-key <PK>
   forge create TokenB --private-key <PK>
   ```

5. **Adds tokens to Escrow**
   ```bash
   cast send <ESCROW_ADDR> "addToken(address)" <TOKEN_A_ADDR> --private-key <PK>
   cast send <ESCROW_ADDR> "addToken(address)" <TOKEN_B_ADDR> --private-key <PK>
   ```

6. **Mints tokens to test accounts**
   ```bash
   cast send <TOKEN_A_ADDR> "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 1000e18
   cast send <TOKEN_A_ADDR> "mint(address,uint256)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 1000e18
   # ... etc for all 3 accounts
   ```

7. **Updates frontend config**
   ```bash
   cat > web/.env.local << EOF
   NEXT_PUBLIC_ESCROW_ADDRESS=0x...
   NEXT_PUBLIC_TOKEN_A_ADDRESS=0x...
   NEXT_PUBLIC_TOKEN_B_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=31337
   EOF
   ```

8. **Saves deployment info**
   ```bash
   cat > deployment-info.txt << EOF
   Deployment Info
   ...
   EOF
   ```

### Verify Deployment

After running the script:

```bash
# Check contract addresses were saved
cat web/.env.local

# Should output:
# NEXT_PUBLIC_ESCROW_ADDRESS=0x1234...5678
# NEXT_PUBLIC_TOKEN_A_ADDRESS=0x2345...6789
# NEXT_PUBLIC_TOKEN_B_ADDRESS=0x3456...7890
# NEXT_PUBLIC_CHAIN_ID=31337

# Check deployment summary
cat deployment-info.txt

# Should show all contract addresses and test accounts
```

## Deployment to Testnet (Sepolia/Goerli)

For testnet deployment (not production):

### 1. Create Testnet Account

```bash
# Create new Anvil account or use existing MetaMask account
# Get testnet ETH from faucet:
# - Sepolia: https://sepoliafaucet.com
# - Goerli: https://goerlifaucet.com
```

### 2. Update Deploy Script for Testnet

```bash
# Edit scripts/deploy.sh and change:
RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
PRIVATE_KEY="0x..." # Your private key (never commit!)
```

### 3. Run Deployment

```bash
./scripts/deploy.sh
```

### 4. Verify on Block Explorer

- Visit Etherscan (Sepolia or Goerli version)
- Paste contract address
- Verify transaction history and function calls

## Manual Deployment (Advanced)

If you need to deploy manually without the script:

### Step 1: Compile Contracts

```bash
cd contracts
forge build
```

### Step 2: Deploy Escrow

```bash
ESCROW=$(forge create Escrow \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000 \
  | grep "Deployed to:" | awk '{print $NF}')

echo "Escrow deployed at: $ESCROW"
```

### Step 3: Deploy Tokens

```bash
TOKEN_A=$(forge create TokenA \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000 \
  | grep "Deployed to:" | awk '{print $NF}')

TOKEN_B=$(forge create TokenB \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000 \
  | grep "Deployed to:" | awk '{print $NF}')

echo "TokenA deployed at: $TOKEN_A"
echo "TokenB deployed at: $TOKEN_B"
```

### Step 4: Add Tokens to Escrow

```bash
cast send $ESCROW "addToken(address)" $TOKEN_A \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000

cast send $ESCROW "addToken(address)" $TOKEN_B \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000
```

### Step 5: Mint Tokens

```bash
# Mint to Account 0
cast send $TOKEN_A "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 1000e18 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000

# ... repeat for Account 1, Account 2, and TokenB
```

### Step 6: Update Frontend Config

```bash
cat > web/.env.local << EOF
NEXT_PUBLIC_ESCROW_ADDRESS=$ESCROW
NEXT_PUBLIC_TOKEN_A_ADDRESS=$TOKEN_A
NEXT_PUBLIC_TOKEN_B_ADDRESS=$TOKEN_B
NEXT_PUBLIC_CHAIN_ID=31337
EOF
```

## Redeploying to Fresh Anvil

Sometimes you need a fresh state. Follow this process:

```bash
# 1. Stop Anvil (Ctrl+C)

# 2. Start fresh Anvil
anvil --host 0.0.0.0

# 3. Redeploy contracts
./scripts/deploy.sh

# 4. Restart frontend
cd web && npm run dev
```

## Troubleshooting

### "Cannot connect to Anvil"

```bash
# Verify Anvil is running
nc -z localhost 8545 && echo "Running" || echo "Not running"

# If not running, start it
anvil --host 0.0.0.0
```

### "Compilation failed"

```bash
# Check forge is installed
forge --version

# Clean build
cd contracts && forge clean && forge build
```

### "Transaction failed"

```bash
# Check if private key is valid
cast account 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000

# Check account balance
cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545
```

### ".env.local not updated"

```bash
# Manually check and update if needed
cat web/.env.local

# If missing, create it
cat > web/.env.local << EOF
NEXT_PUBLIC_ESCROW_ADDRESS=0x1234...5678
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x2345...6789
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x3456...7890
NEXT_PUBLIC_CHAIN_ID=31337
EOF
```

## Next Steps

After deployment:

1. Start frontend: `cd web && npm run dev`
2. Visit http://localhost:3000
3. Connect MetaMask
4. Follow E2E testing guide in `TESTING.md`

For detailed testing steps, see `TESTING.md`.
