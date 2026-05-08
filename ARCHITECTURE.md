# DAO Voting Application Architecture

This document describes the architecture of the DAO voting application with gasless transactions via EIP-2771 meta-transactions.

## Overview

The application follows a three-layer architecture:
1. **Smart Contract Layer** (Solidity/Foundry)
2. **Web3 Provider Layer** (ethers.js)
3. **Frontend Application Layer** (Next.js/React)

## Layer 1: Smart Contract Layer

### DAOVoting Contract
**Purpose**: Core voting logic with proposal management and voting system

**Key Functions**:
- `deposit()` / `receive()` / `fallback()` - ETH deposits to treasury
- `createProposal()` - Create new proposal (requires ≥10% balance)
- `vote()` - Vote on proposal (can change until deadline)
- `executeProposal()` - Execute approved proposal after delays
- Getter functions - Retrieve proposal/user data

**State Variables**:
- `proposalCount` - Total proposals created
- `minimumBalance` - Minimum balance required to vote
- `totalDeposited` - Total ETH deposited by all users
- `proposals` mapping - Stores Proposal structs
- `votes` mapping - Tracks user votes per proposal
- `hasVoted` mapping - Tracks if user voted on proposal
- `balances` mapping - Individual user balances in DAO

**Events**:
- `ProposalCreated` - New proposal submitted
- `Voted` - User voted on proposal
- `ProposalExecuted` - Proposal executed and funds transferred
- `FundsDeposited` - User deposited ETH to DAO

**Inheritance**: Extends `ERC2771Context` for meta-transaction support

### MinimalForwarder Contract
**Purpose**: Processes EIP-2771 meta-transactions for gasless voting

**Key Function**:
- `execute()` - Validates and forwards meta-transactions to target contract

**Trust Relationship**: DAOVoting trusts MinimalForwarder as a forwarder

## Layer 2: Web3 Provider Layer

### Wallet Connection Module
- Detects `window.ethereum` (MetaMask)
- Requests account access from user
- Handles connection/disconnection events
- Validates chain ID

### Provider/Signer Manager
- Creates ethers.js Provider from wallet connection
- Obtains Signer for transaction signing
- Handles network/changes events

### Contract Interaction Layer
- Instantiates DAOVoting and MinimalForwarder contracts
- Provides wrapper functions:
  - Standard transactions (deposit, createProposal, etc.)
  - Meta-transactions (signing and submitting vote requests)
- Handles transaction submission and confirmation

### Event Listening System
- Subscribes to key events from DAOVoting contract:
  - ProposalCreated, Voted, ProposalExecuted, FundsDeposited
- Updates local state when events occur
- Tracks block confirmations for reliability

## Layer 3: Frontend Application Layer

### Pages/Views
- **Home/Dashboard**: Displays active proposals, user/DAO balances
- **Create Proposal**: Form for submitting new proposals
- **Vote Page**: Interface for voting on specific proposals
- **Profile**: User balance overview, deposit/withdraw functionality

### Key Components
- **WalletConnectButton**: Connect/disconnect wallet functionality
- **ProposalCard**: Displays proposal details, voting status, results
- **VoteButtons**: FOR/AGAINST/ABSTAIN buttons with vote counters
- **TransactionStatus**: Shows pending/confirmed/failed transaction states
- **BalanceDisplay**: Shows user balance and DAO total balance

### State Management
- **Wallet State**: Address, provider, signer, connection status
- **Proposals List**: Real-time data fetched from contract events
- **User Votes**: Memoized vote tracking per proposal
- **Transaction Loading States**: Pending/submitted/confirmed/failed states

### Custom Hooks
- `useWallet`: Manages wallet connection state
- `useProposals`: Fetches and maintains real-time proposal data
- `useVote`: Handles vote submission (standard and meta-transaction)
- `useTransaction`: Tracks transaction status and confirmations

## Data Flows

### Standard Transaction Flow (e.g., ETH Deposit)
```
[User Clicks Deposit Button]
        ↓
[Frontend: useDeposit Hook]
        ↓
[Web3: Contract Interaction Layer]
        ↓
[Blockchain Transaction]
        ↓
[Smart Contract: deposit() function]
        ↓
[Event: FundsDeposited]
        ↓
[Web3: Event Listening System]
        ↓
[Frontend: Update Balance Display]
```

### Gasless Voting Flow (Meta-transaction)
```
[User Selects Vote & Signs Message]
        ↓
[Frontend: useVote Hook (creates EIP-712 signature)]
        ↓
[Web3: Send to Relayer API] ←[Relayer Server (off-chain)]
        ↓
[Web3: Relayer Submits to MinimalForwarder]
        ↓
[Smart Contract: MinimalForwarder.execute()]
        ↓
[Smart Contract: ERC2771Context validates & calls DAOVoting]
        ↓
[Smart Contract: DAO.vote() function]
        ↓
[Event: Voted]
        ↓
[Web3: Event Listening System]
        ↓
[Frontend: Update Vote Display]
```

### Proposal Lifecycle
```
[Create Proposal] 
        ↓ (Voting Period Active)
[Voting Open] 
        ↓ (After Voting Duration)
[Voting Ended] 
        ↓ (After Execution Delay)
[Execution Window] 
        ↓ (If FOR Votes > AGAINST Votes)
[Execute Proposal] 
        ↓
[Funds Transferred to Recipient]
```

## External Dependencies

**Blockchain**: Ethereum Virtual Machine (EVM)
**Development Tools**: 
- Foundry (forge test, forge build, anvil)
- Solidity ^0.8.13
**Contracts**: 
- @openzeppelin/contracts (ERC2771Context, ReentrancyGuard)
**Frontend**: 
- Next.js 15, React 19, TypeScript ^5.0
- Tailwind CSS v4
- ethers.js ^6.15.0
**Testing**: 
- Forge testing framework (vm.prank, vm.deal, vm.warp, vm.expectEmit)

## Key Architectural Decisions

1. **Gasless Voting**: Implemented via EIP-2771 meta-transactions to eliminate gas barriers for voters
2. **Proposal Creation Threshold**: Requires ≥10% of total deposited balance to prevent spam proposals
3. **Vote Changing**: Allows users to change votes during voting period to reflect evolving opinions
4. **Execution Delay**: Time-lock between voting end and execution to prevent rushed decisions
5. **Balance Tracking**: Separate tracking of user balances in DAO vs. actual contract balance for accuracy
6. **Event-Driven Frontend**: UI updates via contract event listening rather than polling for efficiency