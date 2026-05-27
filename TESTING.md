# End-to-End Testing Guide

This guide walks through the complete E2E workflow for the ESCROW DApp:
starting Anvil, deploying contracts, connecting MetaMask, creating a swap,
completing it from another account, and verifying the result.

---

## Prerequisites

- **Foundry** installed (`forge`, `cast`, `anvil`)
- **Node.js** 18+ and **npm**
- **MetaMask** browser extension installed
- This repository cloned

---

## Quick Start (5 commands)

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy contracts
./scripts/deploy.sh

# Terminal 3: Start frontend
cd web && npm run dev

# Open browser at http://localhost:3000
# Connect MetaMask and start swapping!
```

---

## Step-by-Step Walkthrough

### Step 1: Start Anvil (Local Blockchain)

Open **Terminal 1** and run:

```bash
anvil
```

Expected output:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545

Accounts
========
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
(2) 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (10000 ETH)

Private Keys
========
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
(2) 0x5de4111afa1a4b94908f83103eb1f15b2636f0e2c2bcf1f0c2b8e0d1b2a3b4c5d
```

> **Keep Anvil running** — all other steps depend on it.

---

### Step 2: Deploy Contracts

Open **Terminal 2** and run:

```bash
./scripts/deploy.sh
```

Expected output:
```
============================================
  ESCROW DApp - Deployment Script
============================================

[1/7] Checking Anvil connection...
✓ Anvil is running
[2/7] Compiling contracts...
✓ Contracts compiled
[3/7] Deploying Escrow contract...
✓ Escrow deployed to: 0x...
[3/7] Deploying TokenA...
✓ TokenA deployed to: 0x...
[3/7] Deploying TokenB...
✓ TokenB deployed to: 0x...
[4/7] Adding tokens to Escrow allowed list...
✓ TokenA added to allowed list
✓ TokenB added to allowed list
[5/7] Minting tokens to test accounts...
✓ Tokens minted to Owner, User1, and User2 (1,000 each)
[6/7] Generating frontend .env.local...
✓ Frontend config written to web/.env.local
[7/7] Saving deployment info...
✓ Deployment info saved to deployment-info.txt

============================================
  Deployment Complete!
============================================

  Escrow:  0x...
  TokenA:  0x...
  TokenB:  0x...
```

The script:
- Deploys `Escrow`, `TokenA`, and `TokenB` contracts
- Adds both tokens to the Escrow allowed list
- Mints 1,000 TokenA and 1,000 TokenB to 3 test accounts
- Generates `web/.env.local` with contract addresses
- Saves `deployment-info.txt` with all addresses

> **Troubleshooting**: If deploy.sh fails, check:
> - Anvil is running: `nc -z 127.0.0.1 8545`
> - Port 8545 not in use: `lsof -i :8545`

---

### Step 3: Start Frontend

Open **Terminal 3** and run:

```bash
cd web
npm run dev
```

Expected output:
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
```

---

### Step 4: Configure MetaMask

#### 4a. Add Anvil Network

1. Open MetaMask browser extension
2. Click network dropdown (top) → **Add Network** → **Add a network manually**
3. Enter these values:

| Field | Value |
|-------|-------|
| Network Name | `Anvil Local` |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |
| Block Explorer URL | (leave blank) |

4. Click **Save**

#### 4b. Import Test Account (Owner)

1. In MetaMask, click account icon (top-right) → **Add account or hardware wallet** → **Import account**
2. Paste the Anvil Account 0 private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Click **Import**
4. Rename to "Owner" (right-click → Account details → Edit name)

#### 4c. Import Test Account (User1)

1. Repeat import with Account 1 private key:
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
2. Rename to "User1"

#### 4d. Import Test Account (User2)

1. Repeat import with Account 2 private key:
   ```
   0x5de4111afa1a4b94908f83103eb1f15b2636f0e2c2bcf1f0c2b8e0d1b2a3b4c5d
   ```
2. Rename to "User2"

> You should now have 3 MetaMask accounts: Owner, User1, User2.
> Each has 10,000 ETH (from Anvil) + 1,000 TokenA + 1,000 TokenB (from deploy.sh).

---

### Step 5: Connect to DApp

1. Open **http://localhost:3000** in your browser
2. Click **"Connect MetaMask"** button
3. In MetaMask popup, select the **Owner** account
4. Click **Connect**
5. MetaMask will prompt to switch network → click **Switch network** to Anvil Local
6. The header should now show `0xf39F...2266 (Chain: 31337)` with a green dot

---

### Step 6: Add Tokens to Escrow (Owner)

1. In the **Create Operation** tab, you should see the **"Add Token (Owner Only)"** section
2. Open `deployment-info.txt` to find the TokenA address
3. Copy the TokenA address and paste it into the input field
4. Click **"Add Token"**
5. MetaMask will open — click **Confirm**
6. A green toast notification will appear: **"Token added successfully"**
7. The token should now appear in the "Allowed Tokens" list
8. Repeat for TokenB

> If you don't see the "Add Token" section, you're not connected as the Owner.
> Switch to the Owner account in MetaMask and refresh.

---

### Step 7: Create Operation (User1)

1. In MetaMask, switch to the **User1** account
2. Refresh the page at http://localhost:3000
3. The header should now show `0x7099...79C8`
4. In the **Create Operation** tab:
   - **You give (Token A)**: Select the TokenA option from dropdown
   - **Amount A**: Enter `10`
   - **You receive (Token B)**: Select the TokenB option
   - **Amount B**: Enter `5`
5. Click **"Create Operation"**
6. MetaMask will open for the **approve** transaction:
   - This approves the Escrow contract to spend 10 TokenA
   - Click **Confirm**
7. MetaMask will open again for the **createOperation** transaction:
   - This deposits 10 TokenA and creates the swap
   - Click **Confirm**
8. Expected toast: **"Operation #0 created successfully"**

---

### Step 8: Browse Operations

1. Click the **"Browse Operations"** tab
2. You should see one operation in the table:
   - **ID**: 0
   - **Creator**: User1 address (0x7099...79C8)
   - **Give**: 10 TKA
   - **Receive**: 5 TKB
   - **Status**: PENDING (yellow badge)
   - **Actions**: Cancel button (since you're the creator)

---

### Step 9: Complete Operation (User2)

1. In MetaMask, switch to the **User2** account
2. Refresh the page (do NOT navigate away from Browse tab)
3. The table should now show the same operation, but with a **"Complete"** button
   (since User2 is NOT the creator)
4. Click **"Complete"**
5. MetaMask will open for the **approve** transaction:
   - Approves Escrow to spend 5 TokenB
   - Click **Confirm**
6. MetaMask will open for the **completeOperation** transaction:
   - User2 sends 5 TokenB to User1, receives 10 TokenA from Escrow
   - Click **Confirm**
7. Expected toast: **"Operation #0 completed"**
8. The operation status should now show **COMPLETED** (green badge)

---

### Step 10: Verify Results

1. Click the **"Debug"** tab
2. Verify User2 balances:
   - **TokenA**: Should have increased by 10 (received from swap)
   - **TokenB**: Should have decreased by 5 (sent to User1)
3. Switch MetaMask to **User1** and refresh
4. **TokenB**: Should have increased by 5 (received from swap)
5. **TokenA**: Should have decreased by 10 (deposited in escrow)
6. **Contract TokenA balance**: 0 (returned to User2 on completion)
7. **Contract TokenB balance**: 0 (sent to User1 on completion)
8. **Total Operations**: 1

---

## Test Scenarios

### Scenario 1: Happy Path (Create → Complete)
1. User1 creates operation (10 TKA → 5 TKB)
2. User2 completes operation
3. ✅ User1 gets 5 TKB, User2 gets 10 TKA

### Scenario 2: Create → Cancel
1. User1 creates operation
2. User1 cancels operation (Browse tab → Cancel)
3. ✅ User1 gets TKA back, Contract balance returns to 0

### Scenario 3: Cannot Complete Own Operation
1. User1 creates operation
2. User1 tries to Complete (should see no button — only Cancel available)
3. ✅ No way to self-complete an operation

### Scenario 4: Cannot Cancel Another User's Operation
1. User2 tries to Cancel User1's operation
2. ✅ Cancel button is not visible to non-creators

### Scenario 5: Multiple Operations
1. User1 creates operation #1
2. User2 creates operation #2
3. Browse shows both operations
4. ✅ Pagination kicks in at 20+ operations

### Scenario 6: Operation List Auto-Refresh
1. Keep Browse tab open
2. In another account, create/complete/cancel an operation
3. ✅ Table updates automatically within 5 seconds

---

## Manual Test Commands (Without Frontend)

You can use `cast` to interact with contracts directly for quick verification:

```bash
# Check contract balances
cast call <ESCROW_ADDRESS> "getContractBalance(address)" <TOKEN_ADDRESS> --rpc-url http://127.0.0.1:8545

# Check user balance
cast call <TOKEN_ADDRESS> "balanceOf(address)" <USER_ADDRESS> --rpc-url http://127.0.0.1:8545

# Check operation count
cast call <ESCROW_ADDRESS> "operationCount()" --rpc-url http://127.0.0.1:8545

# Check operation details
cast call <ESCROW_ADDRESS> "getOperation(uint256)" <OP_ID> --rpc-url http://127.0.0.1:8545

# Check allowed tokens
cast call <ESCROW_ADDRESS> "getAllowedTokens()" --rpc-url http://127.0.0.1:8545
```

---

## Troubleshooting

### MetaMask Issues

| Problem | Solution |
|---------|----------|
| "MetaMask not installed" | Install MetaMask extension and refresh |
| "Unknown chain ID" | Add Anvil network (chain ID 31337) |
| Wrong account shown | Switch account in MetaMask |
| Transaction pending forever | Reset MetaMask: Settings → Advanced → Clear activity tab data |
| Nonce too high | Settings → Advanced → Clear activity tab data, or restart Anvil |

### Frontend Issues

| Problem | Solution |
|---------|----------|
| Blank page | Check browser console for errors |
| Contract methods not working | Ensure `.env.local` has correct addresses (re-run deploy.sh) |
| "Cannot read properties of null" | Ensure wallet is connected |
| Type errors | Run `npm run build` to check |
| Stale data | Refresh the page |

### Contract Issues

| Problem | Solution |
|---------|----------|
| Revert: "Token not allowed" | Owner must call `addToken()` first |
| Revert: "Amounts must be > 0" | Enter positive amounts |
| Revert: "Tokens must be different" | Select different tokens for A and B |
| Revert: "Operation not pending" | Operation was already completed or cancelled |
| Revert: "Only creator can cancel" | Only the operation creator can cancel |
| Revert: "Cannot complete own operation" | Switch to a different MetaMask account |
| Stuck transactions | Restart Anvil and re-deploy |

---

## Deployment Info

After running `deploy.sh`, all contract addresses are saved in:

| File | Contents |
|------|----------|
| `deployment-info.txt` | Human-readable deployment summary |
| `web/.env.local` | Environment variables for frontend |

---

## CI/CD

This project includes GitHub Actions CI workflow (`.github/workflows/test.yml`)
that automatically:
- Runs `forge build` and `forge test` on every push/PR
- Runs `forge coverage` for code coverage
- Checks Solhint linting on Solidity files
- Builds the Next.js frontend

---

## Cleanup

To reset your local environment:

```bash
# Stop Anvil (Ctrl+C in Terminal 1)

# Restart Anvil
anvil

# Re-deploy contracts
./scripts/deploy.sh

# Clear MetaMask activity (if needed)
# Settings → Advanced → Clear activity tab data
```
