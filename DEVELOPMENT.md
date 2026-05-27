# Development Setup Guide

This guide walks through setting up the ESCROW DApp local development environment.

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** — Check with `node --version`
- **npm or yarn** — Check with `npm --version`
- **Foundry** — Check with `forge --version` (install from https://getfoundry.sh)
- **Git** — Check with `git --version`
- **MetaMask** — Browser extension installed (https://metamask.io)

## Step 1: Start Anvil (Local Blockchain)

Anvil is a local Ethereum blockchain for development and testing.

```bash
# Start Anvil on 0.0.0.0:8545
anvil --host 0.0.0.0

# Output will show:
# ⠙ Mining blocks...
# Listening on 0.0.0.0:8545
```

If Anvil is running in a container, use the following command to start it:
If Anvil is already running, you can skip this step. and proceed to the next steps.

```bash
podman run -d --name anvil-local-container -p 8545:8545 anvil:latest --host      
```


**Important**: Keep Anvil running in a separate terminal. Leave it running during development.

### Anvil Accounts

List Accounts and Private Keys 
```bash
podman logs anvil-local-container 2>&1 | grep -A 30 "Available Accountss"
```

Anvil provides 10 test accounts with 10,000 ETH each. These are displayed when Anvil starts:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)
Private Key: 0x5de4111afa1a4b94908f83103db1snf7m5edf2...
(... 7 more accounts)
```

**Save these for later use in MetaMask.**

---

## Step 2: Initialize Foundry Project

The Foundry project structure is in the `contracts/` directory.

```bash
cd /path/to/ESCROW/contracts

# Verify Foundry is installed
forge --version

# You should see: forge 0.x.x (date)
```

### Check Foundry Configuration

The project includes a `foundry.toml` configuration file. Verify it exists:

```bash
cat foundry.toml
```

Expected output includes:
```toml
[profile.default]
optimizer = true
optimizer_runs = 200
```

### Set Up OpenZeppelin Imports

Foundry needs to know where to find OpenZeppelin contracts. A `remappings.txt` file should exist:

```bash
cat remappings.txt

# Expected output:
# @openzeppelin/=lib/openzeppelin-contracts/
```

---

## Step 3: Initialize Next.js 15 Frontend

The frontend is in the `web/` directory.

```bash
cd /path/to/ESCROW/web

# Install dependencies
npm install

# Verify key dependencies are installed
npm ls react next ethers

# You should see:
# react@19.x.x
# next@15.x.x
# ethers@6.x.x
```

### Verify TypeScript Setup

```bash
# Check TypeScript config
cat tsconfig.json

# Build frontend to verify no errors
npm run build
```

---

## Step 4: Configure MetaMask for Local Development

### Add Anvil Network to MetaMask

1. Open MetaMask extension
2. Click **Networks** → **Add Network** → **Add a custom network manually**
3. Fill in:
   - **Network Name**: Anvil Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
   - **Block Explorer URL**: (leave blank)
4. Click **Save**

### Import Test Accounts

1. In MetaMask, click **Profile** → **Import Account**
2. Select **Private Key**
3. Paste private key from Anvil (e.g., `0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000`)
4. Click **Import**
5. Rename account to "Account 0" (or similar for clarity)
6. Repeat for other test accounts (Account 1, Account 2)

### Verify Connection

1. Click the network selector in MetaMask
2. Select "Anvil Local"
3. You should see "Connected" and the account balance should show ~10000 ETH

---

## Step 5: Deploy Contracts

Once Anvil is running, deploy the smart contracts:

```bash
cd /path/to/ESCROW

# Deploy using the automated script
./scripts/deploy.sh

# Script will:
# 1. Compile contracts with forge build
# 2. Deploy Escrow.sol
# 3. Deploy TokenA.sol and TokenB.sol
# 4. Add tokens to Escrow contract
# 5. Mint tokens to test accounts
# 6. Update web/.env.local with contract addresses
# 7. Create deployment-info.txt with summary
```

**Expected output**:
```
🚀 ESCROW DApp Deployment Script
==================================
📦 Compiling contracts...
📤 Deploying Escrow contract...
Escrow: 0x1234...5678
📤 Deploying TokenA...
TokenA: 0x2345...6789
📤 Deploying TokenB...
TokenB: 0x3456...7890
✅ Adding tokens to Escrow...
💰 Minting tokens to test accounts...
⚙️  Updating frontend config...
📝 Saving deployment info...
✨ Deployment complete!
```

### Verify Deployment

Check that contract addresses were created:

```bash
# Check frontend environment config
cat web/.env.local

# Should show:
# NEXT_PUBLIC_ESCROW_ADDRESS=0x1234...5678
# NEXT_PUBLIC_TOKEN_A_ADDRESS=0x2345...6789
# NEXT_PUBLIC_TOKEN_B_ADDRESS=0x3456...7890
# NEXT_PUBLIC_CHAIN_ID=31337

# Check deployment info
cat deployment-info.txt
```

---

## Step 6: Start Frontend Development Server

```bash
cd /path/to/ESCROW/web

# Start dev server
npm run dev

# Output should show:
# ▲ Next.js 15.0.0
# - Local:        http://localhost:3000
#
# Ready in 1.2s
```

### Verify Frontend is Running

Open http://localhost:3000 in your browser:

- You should see the ESCROW DApp UI
- Click "Connect MetaMask" button
- MetaMask should prompt you to connect
- After connecting, you should see your account address

---

## Full Development Workflow

### Starting a Development Session

```bash
# Terminal 1: Start Anvil
anvil --host 0.0.0.0

# Terminal 2: Start Frontend
cd ESCROW/web
npm run dev

# Terminal 3: (Optional) Watch contract changes
cd ESCROW/contracts
forge build --watch
```

### Making Changes

**To modify smart contracts:**
1. Edit `contracts/Escrow.sol`
2. Run `forge build` to compile
3. Run `forge test` to verify tests still pass
4. Re-run `./scripts/deploy.sh` to deploy to Anvil
5. Frontend will auto-reload

**To modify frontend:**
1. Edit `web/app/page.tsx` or component files
2. Save changes
3. Frontend hot-reloads automatically in browser

---

## Testing Smart Contracts Locally

### Run Unit Tests

```bash
cd contracts

# Run all tests
forge test

# Run specific test file
forge test --match-contract EscrowTest

# Verbose output (shows logs)
forge test -vv

# Very verbose (shows stack traces)
forge test -vvv
```

### Check Test Coverage

```bash
cd contracts

# Generate coverage report
forge coverage

# Expected output:
# src/Escrow.sol
# |  Function  | Coverage |
# |------------|----------|
# | addToken   |  100%    |
# | createOp   |  100%    |
# | completeOp |  100%    |
# ...
```

### Gas Analysis

```bash
cd contracts

# Show gas costs for each function
forge test --gas-report

# Output shows gas usage for each function call
```

---

## Linting & Code Quality

### Solidity Linting

```bash
cd contracts

# Lint all contracts
solhint 'src/**/*.sol'

# Expected: No errors or warnings
```

### TypeScript Linting

```bash
cd web

# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Code Formatting

```bash
# Format Solidity (requires Prettier + Solidity plugin)
cd contracts
npx prettier --write 'src/**/*.sol'

# Format TypeScript
cd web
npx prettier --write 'app/**/*.tsx' 'lib/**/*.ts' 'components/**/*.tsx'
```

---

## Troubleshooting

### Anvil Connection Issues

**Problem**: "Cannot connect to Anvil"

```bash
# Check if Anvil is running
nc -z localhost 8545 && echo "Running" || echo "Not running"

# If not running, start it
anvil --host 0.0.0.0

# If port is in use
lsof -i :8545
kill -9 <PID>
```

### Compilation Errors

**Problem**: `forge build` fails with import errors

```bash
# Ensure remappings.txt exists
ls contracts/remappings.txt

# If missing, create it
echo "@openzeppelin/=lib/openzeppelin-contracts/" > contracts/remappings.txt
```

### MetaMask Not Connecting

**Problem**: MetaMask shows "Network Error"

1. Verify Anvil network details in MetaMask:
   - RPC URL should be exactly: `http://127.0.0.1:8545`
   - Chain ID should be: `31337`
2. Disconnect and reconnect: Click MetaMask → Disconnect → Connect again

### Contract Address Mismatch

**Problem**: Frontend shows "Contract not found" errors

```bash
# Regenerate deployment config
./scripts/deploy.sh

# Verify addresses in web/.env.local
cat web/.env.local

# Restart frontend (Ctrl+C, then npm run dev)
```

---

## Next Steps

Once development setup is complete:

1. **Run tests**: `cd contracts && forge test`
2. **Start frontend**: `cd web && npm run dev`
3. **Visit UI**: Open http://localhost:3000
4. **Connect wallet**: Click "Connect MetaMask"
5. **Follow E2E workflow**: See `TESTING.md` for step-by-step guide

For more details on each phase, see `BLUEPRINT.md`.
