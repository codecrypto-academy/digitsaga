# ESCROW DApp - Project Blueprint

**Project**: Secure ERC20 Token Swap DApp with Escrow Smart Contract  
**Date Created**: May 21, 2026  
**Status**: Planning Phase  
**Target Completion**: 6-8 weeks (estimated)

---

## Executive Summary

This blueprint breaks the ESCROW DApp project into **6 phases** with **clear dependencies**, **parallel opportunities**, and **defined quality gates**. The project can be executed by fresh agents at any phase with zero prior context loss.

### Key Stats
- **Total Phases**: 6 (sequential foundation → parallel development → integration)
- **Parallel Phases**: Phases 3-4 can run in parallel (3: smart contract tests, 4: frontend setup)
- **Critical Path**: Phase 1 → Phase 2 → Phase 5 (integration)
- **Estimated Effort**: 120-160 hours total
- **Risk Level**: Medium (Web3 integration complexity)

---

## Phase Overview & Dependencies

```
Phase 1: Project Setup & Environment
    ↓
Phase 2: Smart Contract Development (Escrow.sol)
    ├→ Phase 3: Smart Contract Testing & Security Audit [PARALLEL]
    │   ↓
    └→ Phase 4: Frontend Setup & Web3 Integration [PARALLEL]
        ↓
Phase 5: Frontend Components & Contract Interaction
    ↓
Phase 6: Deployment Automation & End-to-End Testing
```

### Parallelization Opportunities
- **Phases 3 & 4**: Contract testing can run in parallel with frontend setup (independent concerns)
- **Phases 5**: Component development can be parallelized (ConnectButton, AddToken, CreateOperation, OperationList, BalanceDebug are mostly independent)

---

## Phase 1: Project Setup & Environment

**Duration**: 2-3 hours  
**Complexity**: Low  
**Dependencies**: None  
**Blockers**: None  
**Next Phase**: Phase 2

### Objectives
- Initialize project structure (Foundry + Next.js)
- Set up development environment (Anvil, MetaMask)
- Create configuration files and documentation
- Establish coding standards

### Tasks

#### Task 1.1: Initialize Foundry Project
- [ ] Create `contracts/` directory
- [ ] Install Foundry (`forge` command)
- [ ] Run `forge init` to create base structure
- [ ] Create `foundry.toml` with project config
- [ ] Add OpenZeppelin imports to `remappings.txt`
- [ ] Create `contracts/Escrow.sol` stub file

**Verification**:
```bash
forge --version
ls -la contracts/
cat foundry.toml | grep -E "\[profile|optimizer"
```

#### Task 1.2: Initialize Next.js 15 Frontend
- [ ] Create `web/` directory (or use `frontend/`)
- [ ] Run `npx create-next-app@latest web --typescript --tailwind`
- [ ] Configure Next.js 15 settings in `next.config.js`
- [ ] Install ethers.js v6: `npm install ethers@6`
- [ ] Install additional Web3 deps: `npm install @wagmi/core` (optional, for wallet connection)
- [ ] Create `lib/` directory for utilities

**Verification**:
```bash
cd web && npm ls | grep -E "next|ethers|react"
cat package.json | grep "\"version\""
```

#### Task 1.3: Create Project Documentation
- [ ] Create `CLAUDE.md` (AI project entry point)
- [ ] Create `DEPLOYMENT.md` (deployment workflow)
- [ ] Create `ARCHITECTURE.md` (system design overview)
- [ ] Create `.env.example` for environment variables
- [ ] Create `DEVELOPMENT.md` (local dev setup)

**Content for CLAUDE.md**:
```markdown
# ESCROW DApp — AI Project Entry Point

## Quick Start
- Smart contracts: `/contracts/Escrow.sol`
- Frontend: `/web` (Next.js 15)
- Deployment: `/scripts/deploy.sh`

## Key Files
- Escrow ABI: `/contracts/Escrow.sol`
- Frontend entry: `/web/app/page.tsx`
- Context provider: `/web/lib/ethereum.tsx`

## Development
```bash
anvil  # Start local blockchain
forge test  # Run tests
cd web && npm run dev  # Start frontend
```

## Environment
- Anvil: 0.0.0.0:8545
- Chain ID: 31337 (local)
- Test accounts: 10 accounts with 10000 ETH each
```

#### Task 1.4: Create Coding Standards & Patterns
- [ ] Create `.solhint.json` for Solidity linting
- [ ] Create `.eslintrc.json` for TypeScript/React
- [ ] Create `.prettierrc.json` for code formatting
- [ ] Document naming conventions (Solidity: PascalCase contracts, camelCase functions)
- [ ] Document error handling patterns
- [ ] Create testing patterns document

**Files to Create**:
- `/.solhint.json`
- `/web/.eslintrc.json`
- `/web/.prettierrc.json`
- `/STANDARDS.md` (coding guidelines)

#### Task 1.5: Set Up Git & Version Control
- [ ] Initialize Git: `git init`
- [ ] Create `.gitignore` (Foundry + Next.js)
- [ ] Create initial commit
- [ ] Create main branch protection rules (if using GitHub)

**.gitignore content** (essential entries):
```
# Foundry
/out/
/cache/
.foundry/

# Next.js
/web/.next/
/web/node_modules/
/web/.env.local

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp

# Artifacts
*.log
deployment-info.txt
```

### Exit Criteria (Phase 1 Complete)

- [ ] Foundry project initialized and `forge --version` works
- [ ] Next.js 15 frontend initialized with ethers.js installed
- [ ] `CLAUDE.md` written and describes key project entry points
- [ ] Coding standards documented (ESLint, Solhint, Prettier configured)
- [ ] Git initialized with proper `.gitignore`
- [ ] All documentation files created in project root
- [ ] CI/linting pipelines set up (GitHub Actions optional)

**Commit**: `Initial project setup: Foundry + Next.js + Documentation`

---

## Phase 2: Smart Contract Development (Escrow.sol)

**Duration**: 8-12 hours  
**Complexity**: High  
**Dependencies**: Phase 1 complete  
**Blockers**: None  
**Parallel with**: Phase 3 (after contract written) + Phase 4  
**Next Phase**: Phase 3 (testing)

### Objectives
- Implement complete Escrow.sol contract
- Define all functions, events, and data structures
- Implement access controls and reentrancy protection
- Create test ERC20 token stub for testing

### Context Brief (for fresh agents)

**What**: Escrow smart contract managing token swap operations  
**Why**: Enable secure, trustless peer-to-peer token exchanges  
**Where**: `/contracts/Escrow.sol`  
**How**: Use OpenZeppelin Ownable & ReentrancyGuard, implement operation struct with state tracking

### Tasks

#### Task 2.1: Define Contract Structure & Imports
- [ ] Import OpenZeppelin contracts (Ownable, ReentrancyGuard, IERC20)
- [ ] Define data structures:
  - `Operation` struct (id, creator, tokenA, tokenB, amountA, amountB, status)
  - `OperationStatus` enum (PENDING, COMPLETED, CANCELLED)
  - State variables: `allowedTokens[]`, `operations[]`, `operationCount`
- [ ] Define events:
  - `TokenAdded(address indexed token)`
  - `OperationCreated(uint indexed opId, address creator, address tokenA, address tokenB)`
  - `OperationCompleted(uint indexed opId, address completer)`
  - `OperationCancelled(uint indexed opId)`

**Verification**:
```solidity
// Check imports
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Check struct definition
struct Operation { ... }
event OperationCreated(...);
```

#### Task 2.2: Implement `addToken()` Function
- [ ] **Function**: `addToken(address token)`
  - Onlyowner modifier
  - Check token is not zero address
  - Check token not already added
  - Add to `allowedTokens[]` array
  - Emit `TokenAdded(token)`

- [ ] **Function**: `isTokenAllowed(address token) public view returns (bool)`
  - Helper to check if token is in allowed list

- [ ] **Function**: `getAllowedTokens() public view returns (address[])`
  - Return complete list of allowed tokens

**Code Structure**:
```solidity
function addToken(address token) external onlyOwner {
    require(token != address(0), "Invalid token address");
    require(!isTokenAllowed(token), "Token already allowed");
    allowedTokens.push(token);
    emit TokenAdded(token);
}
```

#### Task 2.3: Implement `createOperation()` Function
- [ ] **Function**: `createOperation(address tokenA, address tokenB, uint amountA, uint amountB)`
  - Check both tokens are allowed
  - Check amounts > 0
  - Transfer `amountA` from user to contract (use SafeERC20 if available)
  - Create Operation struct with PENDING status
  - Store in operations mapping
  - Emit `OperationCreated` event
  - Return operation ID

- [ ] **Security**: Add ReentrancyGuard to prevent reentrancy attacks

**Error Conditions**:
- Token not allowed
- Amount is zero
- Transfer fails
- Contract already has pending operation with same tokens

**Code Structure**:
```solidity
function createOperation(
    address tokenA,
    address tokenB,
    uint amountA,
    uint amountB
) external nonReentrant returns (uint) {
    require(isTokenAllowed(tokenA) && isTokenAllowed(tokenB), "Token not allowed");
    require(amountA > 0 && amountB > 0, "Amounts must be > 0");
    
    IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
    
    uint opId = operationCount++;
    operations[opId] = Operation({
        id: opId,
        creator: msg.sender,
        tokenA: tokenA,
        tokenB: tokenB,
        amountA: amountA,
        amountB: amountB,
        status: OperationStatus.PENDING
    });
    
    emit OperationCreated(opId, msg.sender, tokenA, tokenB);
    return opId;
}
```

#### Task 2.4: Implement `completeOperation()` Function
- [ ] **Function**: `completeOperation(uint operationId)`
  - Check operation exists and is PENDING
  - Check caller is NOT the creator (different user)
  - Transfer `tokenB` from caller to creator
  - Transfer `tokenA` from contract to caller
  - Mark operation as COMPLETED
  - Emit `OperationCompleted` event

- [ ] **Security**: Use nonReentrant, verify both transfers succeed

**Error Conditions**:
- Operation not found
- Operation not PENDING
- Caller is the creator (cannot complete own operation)
- Transfer fails

**Code Structure**:
```solidity
function completeOperation(uint operationId) external nonReentrant {
    Operation storage op = operations[operationId];
    require(op.status == OperationStatus.PENDING, "Operation not pending");
    require(msg.sender != op.creator, "Cannot complete own operation");
    
    op.status = OperationStatus.COMPLETED;
    
    IERC20(op.tokenB).transferFrom(msg.sender, op.creator, op.amountB);
    IERC20(op.tokenA).transfer(msg.sender, op.amountA);
    
    emit OperationCompleted(operationId, msg.sender);
}
```

#### Task 2.5: Implement `cancelOperation()` Function
- [ ] **Function**: `cancelOperation(uint operationId)`
  - Check operation exists and is PENDING
  - Check caller IS the creator
  - Return `tokenA` to creator
  - Mark operation as CANCELLED
  - Emit `OperationCancelled` event

**Error Conditions**:
- Operation not found
- Operation not PENDING
- Caller is not the creator

**Code Structure**:
```solidity
function cancelOperation(uint operationId) external nonReentrant {
    Operation storage op = operations[operationId];
    require(op.status == OperationStatus.PENDING, "Operation not pending");
    require(msg.sender == op.creator, "Only creator can cancel");
    
    op.status = OperationStatus.CANCELLED;
    
    IERC20(op.tokenA).transfer(op.creator, op.amountA);
    
    emit OperationCancelled(operationId);
}
```

#### Task 2.6: Implement Query Functions
- [ ] **Function**: `getOperation(uint operationId) public view returns (Operation)`
  - Return single operation details

- [ ] **Function**: `getAllOperations() public view returns (Operation[])`
  - Return all operations (or paginated version if > 10k ops)

- [ ] **Function**: `getOperationsByCreator(address creator) public view returns (uint[])`
  - Return operation IDs created by specific address

- [ ] **Function**: `getContractBalance(address token) public view returns (uint)`
  - Return current balance of token in contract

### Exit Criteria (Phase 2 Complete)

- [ ] Escrow.sol compiles without errors: `forge build`
- [ ] All functions implemented and visible in ABI
- [ ] Contract uses OpenZeppelin's Ownable & ReentrancyGuard
- [ ] All events defined and emitted correctly
- [ ] State variables properly initialized
- [ ] No obvious security issues in code review
- [ ] Contract gas-optimized (no unnecessary storage reads)

**Commit**: `Implement Escrow.sol smart contract with all core functions`

---

## Phase 3: Smart Contract Testing & Security Audit

**Duration**: 6-8 hours  
**Complexity**: Medium-High  
**Dependencies**: Phase 2 complete  
**Parallel with**: Phase 4 (independent)  
**Next Phase**: Phase 5 (after both 3 & 4)

### Objectives
- Achieve 80%+ test coverage on Escrow.sol
- Test all happy paths, reverts, and edge cases
- Perform security audit for reentrancy, access control, token transfer safety
- Create test helper functions and fixtures

### Context Brief (for fresh agents)

**What**: Comprehensive test suite for Escrow.sol using Foundry  
**Why**: Ensure contract is secure, reliable, and handles edge cases  
**Where**: `/contracts/test/Escrow.t.sol`  
**How**: Use Foundry test framework, write test functions covering all scenarios

### Tasks

#### Task 3.1: Set Up Foundry Test Infrastructure
- [ ] Create `/contracts/test/` directory
- [ ] Create `/contracts/test/Escrow.t.sol` test file
- [ ] Set up test contract inheriting from `forge-std/Test.sol`
- [ ] Create fixture to deploy Escrow + TokenA + TokenB in `setUp()`
- [ ] Create helper functions for common test operations

**Test Setup Code**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../Escrow.sol";
import "../mocks/MockERC20.sol";

contract EscrowTest is Test {
    Escrow escrow;
    MockERC20 tokenA;
    MockERC20 tokenB;
    
    address owner = address(1);
    address user1 = address(2);
    address user2 = address(3);
    
    function setUp() public {
        vm.startPrank(owner);
        escrow = new Escrow();
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        
        escrow.addToken(address(tokenA));
        escrow.addToken(address(tokenB));
        vm.stopPrank();
        
        // Mint tokens to users
        tokenA.mint(user1, 1000e18);
        tokenB.mint(user2, 1000e18);
    }
}
```

#### Task 3.2: Create MockERC20 for Testing
- [ ] Create `/contracts/mocks/MockERC20.sol`
- [ ] Implement basic ERC20 with mint/burn functions
- [ ] Use OpenZeppelin ERC20 as base
- [ ] Make it compatible with Foundry cheatcodes

**File**: `/contracts/mocks/MockERC20.sol`

#### Task 3.3: Test `addToken()` Function
- [ ] Test happy path: owner adds valid token ✓
- [ ] Test revert: non-owner calls addToken ✗
- [ ] Test revert: zero address token ✗
- [ ] Test revert: duplicate token ✗
- [ ] Test event emission: TokenAdded event fired ✓
- [ ] Test state: token added to allowedTokens list ✓

**Test Functions**:
```solidity
function testAddTokenSuccess() public {
    address newToken = address(new MockERC20("New", "NEW", 18));
    vm.prank(owner);
    escrow.addToken(newToken);
    assertTrue(escrow.isTokenAllowed(newToken));
}

function testAddTokenNonOwnerReverts() public {
    address newToken = address(new MockERC20("New", "NEW", 18));
    vm.prank(user1);
    vm.expectRevert("Ownable: caller is not the owner");
    escrow.addToken(newToken);
}

function testAddTokenZeroAddressReverts() public {
    vm.prank(owner);
    vm.expectRevert("Invalid token address");
    escrow.addToken(address(0));
}
```

#### Task 3.4: Test `createOperation()` Function
- [ ] Test happy path: valid operation created ✓
- [ ] Test revert: invalid tokens (not allowed) ✗
- [ ] Test revert: zero amounts ✗
- [ ] Test revert: insufficient token balance ✗
- [ ] Test token transfer: tokenA transferred to contract ✓
- [ ] Test event: OperationCreated event fired ✓
- [ ] Test state: operation stored with correct data ✓

**Test Functions**:
```solidity
function testCreateOperationSuccess() public {
    vm.prank(user1);
    tokenA.approve(address(escrow), 100e18);
    uint opId = escrow.createOperation(
        address(tokenA), 
        address(tokenB), 
        100e18, 
        50e18
    );
    
    (,,,,uint status) = escrow.getOperation(opId);
    assertEq(status, uint(OperationStatus.PENDING));
    assertEq(tokenA.balanceOf(address(escrow)), 100e18);
}

function testCreateOperationInvalidTokenReverts() public {
    vm.prank(user1);
    tokenA.approve(address(escrow), 100e18);
    vm.expectRevert("Token not allowed");
    escrow.createOperation(address(user1), address(tokenB), 100e18, 50e18);
}
```

#### Task 3.5: Test `completeOperation()` Function
- [ ] Test happy path: operation completed successfully ✓
- [ ] Test revert: operation not pending ✗
- [ ] Test revert: creator tries to complete own operation ✗
- [ ] Test transfers: tokenA to completer, tokenB to creator ✓
- [ ] Test event: OperationCompleted event fired ✓
- [ ] Test state: operation marked as COMPLETED ✓
- [ ] Test edge case: insufficient tokenB balance ✗

**Test Functions**:
```solidity
function testCompleteOperationSuccess() public {
    // User1 creates operation
    vm.prank(user1);
    tokenA.approve(address(escrow), 100e18);
    uint opId = escrow.createOperation(address(tokenA), address(tokenB), 100e18, 50e18);
    
    // User2 completes operation
    vm.prank(user2);
    tokenB.approve(address(escrow), 50e18);
    escrow.completeOperation(opId);
    
    // Verify balances
    assertEq(tokenA.balanceOf(user2), 100e18);
    assertEq(tokenB.balanceOf(user1), 50e18);
}

function testCompleteOperationCreatorReverts() public {
    // User1 creates and tries to complete own operation
    vm.prank(user1);
    tokenA.approve(address(escrow), 100e18);
    uint opId = escrow.createOperation(address(tokenA), address(tokenB), 100e18, 50e18);
    
    vm.prank(user1);
    vm.expectRevert("Cannot complete own operation");
    escrow.completeOperation(opId);
}
```

#### Task 3.6: Test `cancelOperation()` Function
- [ ] Test happy path: creator cancels operation ✓
- [ ] Test revert: operation not pending ✗
- [ ] Test revert: non-creator calls cancel ✗
- [ ] Test transfer: tokenA returned to creator ✓
- [ ] Test event: OperationCancelled event fired ✓
- [ ] Test state: operation marked as CANCELLED ✓

#### Task 3.7: Test Security & Edge Cases
- [ ] **Reentrancy**: Ensure completeOperation cannot be reentered
  ```solidity
  function testReentrancyGuard() public { ... }
  ```

- [ ] **Access Control**: Only owner can call admin functions
  ```solidity
  function testOnlyOwnerFunctions() public { ... }
  ```

- [ ] **Token Transfer Safety**: Ensure failed transfers revert
  ```solidity
  function testFailedTransferReverts() public { ... }
  ```

- [ ] **State Consistency**: Operations cannot be double-completed/cancelled
  ```solidity
  function testDoubleCompleteReverts() public { ... }
  ```

### Exit Criteria (Phase 3 Complete)

- [ ] All tests pass: `forge test` exits with code 0
- [ ] Test coverage >= 80%: `forge coverage`
- [ ] No security warnings from Solhint: `solhint contracts/*.sol`
- [ ] At least 30+ test cases covering happy path + reverts + edge cases
- [ ] All test functions documented with intent
- [ ] CI passes (if using GitHub Actions)

**Commit**: `Add comprehensive test suite for Escrow.sol with 80%+ coverage`

---

## Phase 4: Frontend Setup & Web3 Integration

**Duration**: 6-8 hours  
**Complexity**: Medium  
**Dependencies**: Phase 1 complete  
**Parallel with**: Phase 3 (independent)  
**Next Phase**: Phase 5 (after both 3 & 4)

### Objectives
- Set up Next.js 15 with TypeScript & Tailwind CSS v4
- Create Ethereum context provider for wallet connection
- Create contract ABIs and utility functions
- Implement MetaMask wallet connection

### Context Brief (for fresh agents)

**What**: Frontend infrastructure for Web3 dapp  
**Why**: Enable users to connect wallets and interact with contracts  
**Where**: `/web` directory with Next.js app  
**How**: Use ethers.js v6, create context provider for shared wallet state

### Tasks

#### Task 4.1: Configure Next.js 15 & Dependencies
- [ ] Verify Next.js 15 installed: `npm ls next`
- [ ] Install additional dependencies:
  ```bash
  npm install ethers@6 @types/node @types/react typescript
  npm install -D tailwindcss postcss autoprefixer eslint
  ```
- [ ] Configure `next.config.js`:
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    experimental: {
      esmExternals: true,
    },
  };
  module.exports = nextConfig;
  ```

- [ ] Configure `tsconfig.json` with path aliases:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./*"],
        "@/lib/*": ["./lib/*"],
        "@/components/*": ["./components/*"]
      }
    }
  }
  ```

**Verification**:
```bash
cd web
npm ls | grep -E "next|ethers|react|tailwind"
npx next --version
```

#### Task 4.2: Create Contract ABIs & Utilities
- [ ] Create `/web/lib/contracts.ts`:
  ```typescript
  // Contract addresses (will be populated by deploy.sh)
  export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '';
  export const TOKEN_A_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS || '';
  export const TOKEN_B_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS || '';
  
  // Escrow contract ABI (export from compiled JSON)
  export const ESCROW_ABI = [ ... ];
  
  // ERC20 contract ABI
  export const ERC20_ABI = [ ... ];
  ```

- [ ] Extract Escrow ABI from compiled contract:
  ```bash
  cd contracts
  forge build
  cat out/Escrow.sol/Escrow.json | jq '.abi' > ../web/lib/escrow-abi.json
  ```

- [ ] Create `/web/lib/types.ts` with TypeScript interfaces:
  ```typescript
  export interface Operation {
    id: bigint;
    creator: string;
    tokenA: string;
    tokenB: string;
    amountA: bigint;
    amountB: bigint;
    status: number; // 0=PENDING, 1=COMPLETED, 2=CANCELLED
  }
  
  export interface ContractAddresses {
    escrow: string;
    tokenA: string;
    tokenB: string;
  }
  ```

#### Task 4.3: Create Ethereum Context Provider
- [ ] Create `/web/lib/ethereum.tsx` context provider:
  ```typescript
  'use client';
  
  import React, { createContext, useContext, useState, useEffect } from 'react';
  import { BrowserProvider, Contract, Signer } from 'ethers';
  import { ESCROW_ABI, ERC20_ABI, ESCROW_ADDRESS, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS } from './contracts';
  
  interface EthereumContextType {
    connected: boolean;
    account: string | null;
    provider: BrowserProvider | null;
    signer: Signer | null;
    chainId: number | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    escrowContract: Contract | null;
    tokenAContract: Contract | null;
    tokenBContract: Contract | null;
    error: string | null;
  }
  
  const EthereumContext = createContext<EthereumContextType | undefined>(undefined);
  
  export function EthereumProvider({ children }: { children: React.ReactNode }) {
    const [connected, setConnected] = useState(false);
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const connect = async () => {
      try {
        if (!window.ethereum) throw new Error('MetaMask not installed');
        
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const network = await provider.getNetwork();
        
        setProvider(provider);
        setAccount(accounts[0]);
        setSigner(signer);
        setChainId(Number(network.chainId));
        setConnected(true);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setConnected(false);
      }
    };
    
    const disconnect = () => {
      setConnected(false);
      setAccount(null);
      setProvider(null);
      setSigner(null);
      setChainId(null);
    };
    
    // Auto-reconnect on page load
    useEffect(() => {
      if (typeof window !== 'undefined' && window.ethereum) {
        connect();
      }
    }, []);
    
    // Contract instances
    const escrowContract = signer ? new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer) : null;
    const tokenAContract = signer ? new Contract(TOKEN_A_ADDRESS, ERC20_ABI, signer) : null;
    const tokenBContract = signer ? new Contract(TOKEN_B_ADDRESS, ERC20_ABI, signer) : null;
    
    return (
      <EthereumContext.Provider value={{
        connected,
        account,
        provider,
        signer,
        chainId,
        connect,
        disconnect,
        escrowContract,
        tokenAContract,
        tokenBContract,
        error,
      }}>
        {children}
      </EthereumContext.Provider>
    );
  }
  
  export function useEthereum() {
    const context = useContext(EthereumContext);
    if (context === undefined) throw new Error('useEthereum must be used within EthereumProvider');
    return context;
  }
  ```

#### Task 4.4: Create Layout & Root Provider
- [ ] Create `/web/app/layout.tsx`:
  ```typescript
  import type { Metadata } from 'next';
  import { EthereumProvider } from '@/lib/ethereum';
  import './globals.css';
  
  export const metadata: Metadata = {
    title: 'ESCROW DApp',
    description: 'Secure token swaps with Escrow',
  };
  
  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body>
          <EthereumProvider>
            {children}
          </EthereumProvider>
        </body>
      </html>
    );
  }
  ```

#### Task 4.5: Configure Environment Variables
- [ ] Create `/web/.env.local` (from `.env.example`):
  ```
  NEXT_PUBLIC_ESCROW_ADDRESS=0x0000000000000000000000000000000000000000
  NEXT_PUBLIC_TOKEN_A_ADDRESS=0x0000000000000000000000000000000000000000
  NEXT_PUBLIC_TOKEN_B_ADDRESS=0x0000000000000000000000000000000000000000
  NEXT_PUBLIC_CHAIN_ID=31337
  ```

#### Task 4.6: Set Up Tailwind CSS v4
- [ ] Verify Tailwind installed: `npm ls tailwindcss`
- [ ] Create `/web/tailwind.config.ts`:
  ```typescript
  import type { Config } from 'tailwindcss'
  
  const config: Config = {
    content: [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
  export default config
  ```

- [ ] Create `/web/postcss.config.js`:
  ```javascript
  module.exports = {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  }
  ```

- [ ] Create `/web/app/globals.css`:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

### Exit Criteria (Phase 4 Complete)

- [ ] Next.js dev server starts: `npm run dev` works without errors
- [ ] Ethereum context provider compiles without TypeScript errors
- [ ] Contract ABIs exported and accessible in `/web/lib/contracts.ts`
- [ ] Tailwind CSS working (utility classes in components render correctly)
- [ ] MetaMask connection logic implemented (connect/disconnect functions)
- [ ] Environment variables configured in `.env.local`
- [ ] Layout wraps app with EthereumProvider

**Commit**: `Setup Next.js 15 frontend with Web3 integration and Ethereum context`

---

## Phase 5: Frontend Components & Contract Interaction

**Duration**: 10-12 hours  
**Complexity**: Medium  
**Dependencies**: Phase 4 complete + Phase 3 complete  
**Parallel within**: Components can be built in parallel by different agents  
**Next Phase**: Phase 6 (integration testing)

### Objectives
- Build all frontend components for user interactions
- Implement contract function calls via ethers.js
- Add error handling and loading states
- Create intuitive UI for all operations

### Context Brief (for fresh agents)

**What**: React components for ESCROW DApp UI  
**Why**: Enable users to interact with contract via web interface  
**Where**: `/web/components/`  
**How**: Use React hooks + ethers.js to call contract functions, manage state with useState/useEffect

### Tasks

#### Task 5.1: ConnectButton Component
- [ ] Create `/web/components/ConnectButton.tsx`
- [ ] Show wallet address when connected
- [ ] Show "Connect MetaMask" button when disconnected
- [ ] Display network/chain ID
- [ ] Handle connection errors

**Features**:
- Display formatted account address (0x1234...5678)
- Show disconnect button when connected
- Fallback if MetaMask not installed

#### Task 5.2: AddToken Component (Owner Only)
- [ ] Create `/web/components/AddToken.tsx`
- [ ] Input field for token address
- [ ] "Add Token" button (only visible if owner)
- [ ] Display list of allowed tokens
- [ ] Show success/error messages

**Features**:
- Validate address format before sending
- Disable button while transaction pending
- Show gas estimate

#### Task 5.3: CreateOperation Component
- [ ] Create `/web/components/CreateOperation.tsx`
- [ ] Select TokenA from dropdown
- [ ] Input amountA
- [ ] Select TokenB from dropdown
- [ ] Input amountB
- [ ] "Create Operation" button

**Features**:
- Validate inputs (amounts > 0, tokens different)
- Check token allowance before creating
- Show loading spinner during transaction
- Display operation ID on success

#### Task 5.4: OperationList Component
- [ ] Create `/web/components/OperationList.tsx`
- [ ] Fetch all operations from contract
- [ ] Display table with: ID, Creator, TokenA/B, Amounts, Status
- [ ] Show "Complete" button for operations not created by user
- [ ] Show "Cancel" button for own operations
- [ ] Filter operations by status

**Features**:
- Paginate if > 20 operations
- Auto-refresh every 5 seconds
- Color-code status (PENDING=yellow, COMPLETED=green, CANCELLED=gray)

#### Task 5.5: BalanceDebug Component
- [ ] Create `/web/components/BalanceDebug.tsx`
- [ ] Display balances:
  - User's TokenA balance
  - User's TokenB balance
  - Contract's TokenA balance
  - Contract's TokenB balance
- [ ] Show operation count
- [ ] Refresh button

**Features**:
- Update on component mount
- Update after operations complete
- Display with proper decimals (18)

#### Task 5.6: Main Page Layout
- [ ] Create `/web/app/page.tsx` (main app page)
- [ ] Arrange components in grid:
  ```
  ┌─ Header (ESCROW DApp) ──────────────────┐
  ├─ ConnectButton (top-right) ─────────────┤
  ├─ Instructions ──────────────────────────┤
  ├─ Tabs: Create | Browse | Debug ─────────┤
  │
  │ Tab 1: Create Operation
  │   ├─ AddToken (if owner)
  │   └─ CreateOperation
  │
  │ Tab 2: Browse Operations
  │   └─ OperationList
  │
  │ Tab 3: Debug
  │   └─ BalanceDebug
  └─────────────────────────────────────────┘
  ```

#### Task 5.7: Error & Loading Boundaries
- [ ] Create `/web/components/ErrorBoundary.tsx`
  - Catch React errors and display user-friendly messages
  
- [ ] Create `/web/components/LoadingSpinner.tsx`
  - Show during transaction confirmation
  
- [ ] Create `/web/components/Toast.tsx` (optional)
  - Display success/error messages

#### Task 5.8: Styling & Animations
- [ ] Style with Tailwind CSS v4
- [ ] Add animations:
  - Fade-in for components
  - Button hover effects
  - Transaction pending spinner
  - Status badge animations
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support (optional)

### Exit Criteria (Phase 5 Complete)

- [ ] All 5 core components implemented and compilable
- [ ] Each component handles MetaMask disconnect gracefully
- [ ] Contract calls execute without throwing unhandled errors
- [ ] UI responsive on desktop + mobile
- [ ] Loading states visible during transactions
- [ ] Error messages displayed to user (not console only)
- [ ] No TypeScript errors in components

**Commit**: `Implement all frontend components with Web3 integration`

---

## Phase 6: Deployment Automation & End-to-End Testing

**Duration**: 4-6 hours  
**Complexity**: Medium  
**Dependencies**: Phase 2, Phase 5 complete  
**Blockers**: None (but requires all prior phases)  
**Next Phase**: Done  

### Objectives
- Create automated deployment script (deploy.sh)
- Test full E2E flow locally
- Document testing workflow
- Set up CI/CD (optional)

### Context Brief (for fresh agents)

**What**: Deploy scripts + E2E testing guide  
**Why**: Enable repeatable deployments and verification of full DApp  
**Where**: `/scripts/deploy.sh`, `/DEPLOYMENT.md`  
**How**: Use Foundry for contract deployment, forge commands for automation

### Tasks

#### Task 6.1: Create deploy.sh Script
- [ ] Create `/scripts/deploy.sh`:
  ```bash
  #!/bin/bash
  set -e
  
  echo "🚀 ESCROW DApp Deployment Script"
  echo "=================================="
  
  # Check Anvil is running
  if ! nc -z localhost 8545; then
    echo "❌ Anvil not running at 0.0.0.0:8545"
    exit 1
  fi
  
  # Compile contracts
  echo "📦 Compiling contracts..."
  cd contracts
  forge build
  
  # Deploy Escrow
  echo "📤 Deploying Escrow contract..."
  ESCROW_OUTPUT=$(forge create Escrow --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cादcontractscadmin)
  ESCROW_ADDRESS=$(echo $ESCROW_OUTPUT | grep "Deployed to:" | awk '{print $NF}')
  
  # Deploy TokenA
  echo "📤 Deploying TokenA..."
  TOKEN_A_OUTPUT=$(forge create TokenA ...)
  TOKEN_A_ADDRESS=$(echo $TOKEN_A_OUTPUT | grep "Deployed to:" | awk '{print $NF}')
  
  # Deploy TokenB
  echo "📤 Deploying TokenB..."
  TOKEN_B_OUTPUT=$(forge create TokenB ...)
  TOKEN_B_ADDRESS=$(echo $TOKEN_B_OUTPUT | grep "Deployed to:" | awk '{print $NF}')
  
  # Add tokens to Escrow
  echo "✅ Adding tokens to Escrow..."
  cast send $ESCROW_ADDRESS "addToken(address)" $TOKEN_A_ADDRESS --private-key 0xac0974...
  cast send $ESCROW_ADDRESS "addToken(address)" $TOKEN_B_ADDRESS --private-key 0xac0974...
  
  # Mint tokens to test accounts
  echo "💰 Minting tokens to test accounts..."
  ACCOUNTS=(
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  )
  
  for ACCOUNT in "${ACCOUNTS[@]}"; do
    cast send $TOKEN_A_ADDRESS "mint(address,uint256)" $ACCOUNT "1000000000000000000000" --private-key 0xac0974...
    cast send $TOKEN_B_ADDRESS "mint(address,uint256)" $ACCOUNT "1000000000000000000000" --private-key 0xac0974...
  done
  
  # Update frontend config
  echo "⚙️  Updating frontend config..."
  cat > ../web/.env.local << EOF
  NEXT_PUBLIC_ESCROW_ADDRESS=$ESCROW_ADDRESS
  NEXT_PUBLIC_TOKEN_A_ADDRESS=$TOKEN_A_ADDRESS
  NEXT_PUBLIC_TOKEN_B_ADDRESS=$TOKEN_B_ADDRESS
  NEXT_PUBLIC_CHAIN_ID=31337
  EOF
  
  # Save deployment info
  echo "📝 Saving deployment info..."
  cat > ../deployment-info.txt << EOF
  Deployment Timestamp: $(date)
  
  Contract Addresses:
  - Escrow: $ESCROW_ADDRESS
  - TokenA: $TOKEN_A_ADDRESS
  - TokenB: $TOKEN_B_ADDRESS
  
  Test Accounts:
  - Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (Owner)
  - Account 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (User1)
  - Account 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC (User2)
  EOF
  
  echo "✨ Deployment complete!"
  echo "Escrow: $ESCROW_ADDRESS"
  echo "TokenA: $TOKEN_A_ADDRESS"
  echo "TokenB: $TOKEN_B_ADDRESS"
  ```

- [ ] Make script executable: `chmod +x scripts/deploy.sh`
- [ ] Test script runs without errors

#### Task 6.2: Create TokenA & TokenB Mock Contracts
- [ ] Create `/contracts/TokenA.sol` (ERC20 with mint)
- [ ] Create `/contracts/TokenB.sol` (ERC20 with mint)
- [ ] Both inherit from OpenZeppelin ERC20
- [ ] Only Escrow (owner) can call mint()

#### Task 6.3: Document E2E Testing Workflow
- [ ] Create `/TESTING.md` with step-by-step workflow:
  ```markdown
  # End-to-End Testing Guide
  
  ## Prerequisites
  - Anvil running: `anvil`
  - MetaMask installed
  
  ## Step 1: Start Anvil
  ```bash
  anvil --host 0.0.0.0
  ```
  
  ## Step 2: Deploy Contracts
  ```bash
  ./scripts/deploy.sh
  ```
  
  ## Step 3: Import Test Account in MetaMask
  - Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d52b7f990793feae9000
  - Account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  
  ## Step 4: Start Frontend
  ```bash
  cd web && npm run dev
  ```
  
  ## Step 5: Connect MetaMask
  - Visit http://localhost:3000
  - Click "Connect MetaMask"
  - Approve connection
  
  ## Step 6: Add Tokens (Owner Only)
  - Paste TokenA address in "Add Token" field
  - Click "Add Token"
  - Repeat for TokenB
  
  ## Step 7: Create Operation (User1)
  - Select TokenA and amount
  - Select TokenB and amount
  - Click "Create Operation"
  - Note operation ID
  
  ## Step 8: Switch to User2
  - In MetaMask, switch to second account
  - (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
  
  ## Step 9: Complete Operation (User2)
  - Go to "Browse Operations" tab
  - Find the operation from User1
  - Click "Complete Operation"
  - Approve in MetaMask
  
  ## Step 10: Verify
  - Check balances in "Debug" tab
  - User1 should have TokenB
  - User2 should have TokenA
  ```

#### Task 6.4: Create CI/CD Workflow (Optional)
- [ ] Create `.github/workflows/test.yml`:
  ```yaml
  name: Test
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: foundry-rs/foundry-toolchain@v1
        - run: forge test
        - run: forge coverage
  ```

#### Task 6.5: Smoke Tests
- [ ] Create `/contracts/test/Smoke.t.sol`
- [ ] Deploy Escrow
- [ ] Deploy TokenA + TokenB
- [ ] Verify basic operations work
- [ ] Verify balances correct

### Exit Criteria (Phase 6 Complete)

- [ ] `./scripts/deploy.sh` runs successfully and deploys all contracts
- [ ] Contract addresses written to `.env.local`
- [ ] Deployment info saved to `deployment-info.txt`
- [ ] E2E testing workflow documented
- [ ] Manual E2E test completed successfully (local run)
- [ ] All tests pass: `forge test`
- [ ] Frontend connects and loads contract addresses

**Commit**: `Add deployment automation and E2E testing documentation`

---

## Risk Assessment & Mitigation

### High-Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Reentrancy bugs in contracts | Critical loss of funds | Medium | Use ReentrancyGuard, comprehensive tests, external audit |
| MetaMask disconnects during tx | User confusion | Low | Auto-reconnect, error messaging, retry logic |
| Token decimals mismatch | Incorrect amounts | Medium | Test with 18 decimals, document assumptions |
| Anvil crashes during testing | Lost test progress | Low | Run Anvil in Docker, checkpoint state |
| Frontend-contract ABI mismatch | Transactions fail silently | Low | Auto-generate ABI from contract, version it |

### Medium-Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Gas limits exceeded | Transactions fail | Low | Optimize contract code, test on Anvil first |
| UI rendering issues on mobile | Poor UX | Medium | Test responsive design, use Tailwind utilities |
| Environment variable not set | App crashes on load | Low | Validate env vars at startup, use defaults |
| Test flakiness | CI failures | Low | Use fixed seeds, mock time, deterministic tests |

---

## Quality Gates & Acceptance Criteria

### Per Phase

| Phase | Gate | Criteria |
|-------|------|----------|
| 1 | Setup | All config files created, linting passes, git initialized |
| 2 | Smart Contract | Code compiles, no Solhint warnings, basic unit tests pass |
| 3 | Testing | 80%+ coverage, all test categories pass (happy + revert + edge) |
| 4 | Frontend Setup | Next.js dev server runs, ethers.js imports work, no TS errors |
| 5 | Components | All components render, connect/disconnect works, no runtime errors |
| 6 | Deployment | Scripts run without errors, manual E2E flow completes end-to-end |

### Final Sign-Off

- [ ] Smart contract passes security review (manual + Solhint)
- [ ] Frontend loads without errors and connects to MetaMask
- [ ] All 6 operations (add token, create, complete, cancel, query, debug) work via UI
- [ ] E2E test completed successfully on local Anvil
- [ ] All code documented and follows project standards
- [ ] No open GitHub issues or TODOs in code

---

## Anti-Pattern Catalog

### Smart Contract Anti-Patterns ❌

- **Avoid**: `transfer()` without checking return value → **Do**: Use `safeTransfer()` or check return
- **Avoid**: Storing sensitive data on-chain → **Do**: Use events for off-chain indexing
- **Avoid**: Unbounded loops in contracts → **Do**: Paginate or limit loop iterations
- **Avoid**: User-supplied gas in calculations → **Do**: Use fixed gas estimates

### Frontend Anti-Patterns ❌

- **Avoid**: Direct `window.ethereum` access → **Do**: Use context provider wrapper
- **Avoid**: Polling contract state every 100ms → **Do**: Use 5-second intervals or event subscriptions
- **Avoid**: Storing private keys in `.env` → **Do**: Use MetaMask only
- **Avoid**: Hardcoded contract addresses → **Do**: Use environment variables

### Deployment Anti-Patterns ❌

- **Avoid**: Deploying to mainnet for testing → **Do**: Use Anvil local, testnets only
- **Avoid**: Manual contract address updates → **Do**: Automate via deploy script
- **Avoid**: No rollback strategy → **Do**: Test deploy script locally first

---

## Branching & Git Strategy

```
main (production ready)
  ↑
  ├─ develop (integration branch)
  │   ├─ feat/smart-contract (Phase 2-3)
  │   ├─ feat/frontend-setup (Phase 4)
  │   ├─ feat/frontend-components (Phase 5)
  │   └─ feat/deployment (Phase 6)
```

**Commit Convention**:
```
feat(contracts): implement Escrow.sol with add/create/complete/cancel functions
test(contracts): add comprehensive test suite with 80%+ coverage
feat(frontend): create Ethereum context provider for wallet connection
fix(components): handle MetaMask disconnect gracefully
docs: add E2E testing workflow to TESTING.md
```

---

## Success Criteria Summary

✅ **All Phases Complete When**:
1. Smart contract deploys successfully and all tests pass
2. Frontend connects to MetaMask and loads contract addresses
3. All 5 UI components render without errors
4. Full E2E flow (create → complete → cancel) works locally
5. Deployment script runs idempotently
6. Documentation complete and accurate
7. No security warnings or TypeScript errors
8. Git history clean with descriptive commits

---

## Next Actions

1. **Approve this blueprint** — Confirm phases and dependencies make sense
2. **Select starting phase** — Begin with Phase 1 (Setup)
3. **Create session files** — Copy this blueprint to `.tmp/blueprint-escrow.md`
4. **Delegate phases** — Use CoderAgent to execute each phase sequentially
5. **Track progress** — Update status as phases complete

**Ready to start?** Which phase should we begin with?
