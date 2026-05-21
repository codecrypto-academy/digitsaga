# Architecture Overview

## System Architecture

The ESCROW DApp is a full-stack Web3 application with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User (Browser)                            │
│                     + MetaMask Wallet                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Web3 Transactions
                           │ (ethers.js)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Frontend Layer (Next.js 15)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Components (React)                                        │   │
│  │ ├─ ConnectButton.tsx      → Wallet connection UI          │   │
│  │ ├─ AddToken.tsx           → Add allowed tokens            │   │
│  │ ├─ CreateOperation.tsx    → Create swap                   │   │
│  │ ├─ OperationList.tsx      → Browse operations             │   │
│  │ ├─ BalanceDebug.tsx       → View balances                 │   │
│  │ └─ ErrorBoundary.tsx      → Error handling                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ▲                                       │
│                           │                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Ethereum Context Provider (lib/ethereum.tsx)            │   │
│  │ ├─ useEthereum() hook                                    │   │
│  │ ├─ Provider state (account, signer, connected)          │   │
│  │ ├─ Contract instances (Escrow, TokenA, TokenB)          │   │
│  │ └─ Auto-reconnect on page load                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ▲                                       │
│                           │                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Utilities (lib/)                                          │   │
│  │ ├─ contracts.ts     → ABIs + contract addresses          │   │
│  │ ├─ types.ts         → TypeScript interfaces              │   │
│  │ └─ ...                                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ▲                                       │
└───────────────────────────┼───────────────────────────────────────┘
                            │ JSON-RPC Calls
                            │ (ethers.js)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│         Local Blockchain (Anvil)                                 │
│         Endpoint: 0.0.0.0:8545                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ EVM Operations
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│           Smart Contract Layer (Solidity)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Escrow.sol (Main Contract)                               │   │
│  │ ├─ addToken(address) - Authorize tokens (owner only)     │   │
│  │ ├─ createOperation(...) - Create swap operation          │   │
│  │ ├─ completeOperation(uint) - Finalize swap               │   │
│  │ ├─ cancelOperation(uint) - Revert operation              │   │
│  │ ├─ getAllowedTokens() - List authorized tokens           │   │
│  │ └─ getAllOperations() - List all operations              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ TokenA.sol (Test ERC20)      │ TokenB.sol (Test ERC20)   │   │
│  │ ├─ mint()                    │ ├─ mint()                │   │
│  │ ├─ burn()                    │ ├─ burn()                │   │
│  │ └─ transfer()                │ └─ transfer()            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ OpenZeppelin Libraries                                   │   │
│  │ ├─ Ownable.sol       → Access control                    │   │
│  │ ├─ ReentrancyGuard   → Security protection               │   │
│  │ ├─ ERC20.sol         → Token standard                    │   │
│  │ └─ SafeERC20         → Safe transfers                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Creating & Completing an Operation

### Scenario: User1 creates swap, User2 completes it

```
Step 1: User1 Creates Operation
┌────────────────────────────────────────────────────────────────┐
│ User1 (MetaMask)                                                 │
├────────────────────────────────────────────────────────────────┤
│ 1. Calls: escrow.createOperation(TokenA, TokenB, 100, 50)      │
│ 2. Approves: TokenA.approve(Escrow, 100)                       │
│ 3. Submits transaction                                          │
│ 4. Waits for confirmation                                       │
└────────────────────────────────────────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ Escrow.sol - createOperation()                                  │
├────────────────────────────────────────────────────────────────┤
│ 1. Validate tokens are allowed: isTokenAllowed(A) & isTokenAllowed(B) │
│ 2. Validate amounts: amountA > 0, amountB > 0                  │
│ 3. Transfer TokenA from User1 to Escrow:                       │
│    IERC20(TokenA).transferFrom(User1, Escrow, 100)             │
│ 4. Create Operation struct:                                    │
│    op = {                                                       │
│      id: 0,                                                    │
│      creator: User1,                                           │
│      tokenA: TokenA,                                           │
│      tokenB: TokenB,                                           │
│      amountA: 100,                                             │
│      amountB: 50,                                              │
│      status: PENDING                                           │
│    }                                                            │
│ 5. Store in mapping: operations[0] = op                        │
│ 6. Emit event: OperationCreated(0, User1, TokenA, TokenB)     │
│ 7. Return operationId = 0                                      │
└────────────────────────────────────────────────────────────────┘
                           ▼
Step 2: User2 Completes Operation
┌────────────────────────────────────────────────────────────────┐
│ User2 (MetaMask)                                                 │
├────────────────────────────────────────────────────────────────┤
│ 1. Sees operation in UI: ID=0, needs TokenB (50)               │
│ 2. Calls: escrow.completeOperation(0)                          │
│ 3. Approves: TokenB.approve(Escrow, 50)                        │
│ 4. Submits transaction                                          │
└────────────────────────────────────────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────────────┐
│ Escrow.sol - completeOperation(0)                              │
├────────────────────────────────────────────────────────────────┤
│ 1. Load operation: op = operations[0]                          │
│ 2. Validate is PENDING: op.status == PENDING                   │
│ 3. Validate not creator: msg.sender != User1                   │
│ 4. Mark completed: op.status = COMPLETED                       │
│ 5. Transfer TokenB from User2 to User1:                        │
│    IERC20(TokenB).transferFrom(User2, User1, 50)               │
│ 6. Transfer TokenA from Escrow to User2:                       │
│    IERC20(TokenA).transfer(User2, 100)                         │
│ 7. Emit event: OperationCompleted(0, User2)                    │
└────────────────────────────────────────────────────────────────┘
                           ▼
Step 3: Frontend Reflects Changes
┌────────────────────────────────────────────────────────────────┐
│ OperationList Component                                          │
├────────────────────────────────────────────────────────────────┤
│ 1. Listens for OperationCompleted event                        │
│ 2. Refreshes operations list                                   │
│ 3. Shows operation #0 as COMPLETED (green)                     │
│ 4. User1 can verify: tokenB balance increased by 50            │
│ 5. User2 can verify: tokenA balance increased by 100           │
└────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ App (page.tsx)                                                 │
│ ├─ Render tabs: Create | Browse | Debug                       │
│ └─ Layout: Header, Connect Button, Content                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
    ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐
    │ Connect │  │ Add Token│  │Operations │  │ Balance  │
    │ Button  │  │          │  │   List    │  │  Debug   │
    └────┬────┘  └────┬─────┘  └─────┬─────┘  └────┬─────┘
         │            │              │             │
         └────────────┼──────────────┼─────────────┘
                      │              │
                      ▼              ▼
         ┌────────────────────────────────────┐
         │  Ethereum Context Provider         │
         │  (lib/ethereum.tsx)                │
         │  • provider: BrowserProvider       │
         │  • signer: Signer                  │
         │  • account: string                 │
         │  • escrowContract: Contract        │
         │  • tokenAContract: Contract        │
         │  • tokenBContract: Contract        │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │  ethers.js                         │
         │  • BrowserProvider (window.ethereum│
         │  • Signer for transactions         │
         │  • Contract ABI binding            │
         └────────────┬───────────────────────┘
                      │
                      ▼ (JSON-RPC)
         ┌────────────────────────────────────┐
         │  Anvil (0.0.0.0:8545)              │
         │  Chain ID: 31337                   │
         │  10 test accounts with 10k ETH     │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │  Smart Contracts                   │
         │  • Escrow.sol                      │
         │  • TokenA.sol                      │
         │  • TokenB.sol                      │
         │  • OpenZeppelin (Ownable, ERC20)   │
         └────────────────────────────────────┘
```

## State Management Pattern

### Frontend State Flow

```
User Action (e.g., "Create Operation")
    ▼
Component (ConnectButton, CreateOperation, etc)
    ▼
useEthereum() Hook
    ▼
Get contract instance from context
    ▼
Call contract function with ethers.js
    ▼
Transaction sent to blockchain
    ▼
Wait for confirmation
    ▼
Update local state (UI)
    ▼
Render updated component
```

### Example: CreateOperation Component State

```typescript
function CreateOperation() {
  // Local state
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Context state (shared)
  const { escrowContract, connected, account } = useEthereum();
  
  // Handle create
  const handleCreate = async () => {
    if (!escrowContract) return;
    
    setLoading(true);
    setError('');
    
    try {
      const tx = await escrowContract.createOperation(
        tokenA,
        tokenB,
        parseEther(amountA),
        parseEther(amountB)
      );
      
      const receipt = await tx.wait();
      showToast('Operation created!', 'success');
      
      // Clear form
      setTokenA('');
      setTokenB('');
      setAmountA('');
      setAmountB('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    // UI
  );
}
```

## Deployment Architecture

### Local Development

```
Anvil (local blockchain)
  ├─ Escrow.sol
  ├─ TokenA.sol
  ├─ TokenB.sol
  └─ Deploy script (scripts/deploy.sh)
      └─ Updates web/.env.local with addresses
          └─ Frontend loads addresses at startup
```

### Environment Variables

```bash
# web/.env.local (generated by deploy.sh)
NEXT_PUBLIC_ESCROW_ADDRESS=0x1234...5678
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x2345...6789
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x3456...7890
NEXT_PUBLIC_CHAIN_ID=31337
```

## Security Architecture

### Smart Contract Security

1. **Access Control**: Only owner can call `addToken()`
2. **Reentrancy Guard**: `nonReentrant` on state-changing functions
3. **Input Validation**: Check addresses, amounts > 0
4. **Safe Transfers**: Use OpenZeppelin's `SafeERC20`
5. **State Management**: Mark operations as completed/cancelled to prevent double-spending

### Frontend Security

1. **No Private Keys**: All key management via MetaMask
2. **Input Validation**: Verify user inputs before calling contract
3. **Error Display**: Show errors to user, not just console
4. **Contract Address Validation**: Verify addresses are ERC20 format
5. **Account Isolation**: Each user's operations are creator-based

## Scalability Considerations

### Current Limitations

- All operations stored in contract (unbounded array)
- No pagination on operation queries
- Single contract instance (no sharding)

### Future Improvements

- Paginated operation queries
- Event indexing (TheGraph/Subgraph)
- Multi-chain support
- Operation archival/cleanup
- Gas optimization for large operation counts

## Testing Architecture

### Unit Tests (Foundry)

```
forge test
  ├─ Escrow.t.sol
  │   ├─ addToken() - Happy path + reverts
  │   ├─ createOperation() - Happy path + reverts
  │   ├─ completeOperation() - Happy path + reverts
  │   ├─ cancelOperation() - Happy path + reverts
  │   └─ Security tests (reentrancy, access control)
  └─ Smoke.t.sol
      └─ Integration tests (full workflows)
```

### E2E Tests (Manual)

```
1. Start Anvil
2. Deploy contracts
3. Connect MetaMask
4. Create operation (User1)
5. Complete operation (User2)
6. Verify balances
7. Cancel operation
8. Verify cancellation
```
