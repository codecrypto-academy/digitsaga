# AGENTS.md

This file provides guidance for AI coding agents operating in this repository.

## Project Overview

Full-stack DAO voting application with gasless transactions via EIP-2771 meta-transactions.

## Project Structure

- **`sc/`**: Smart contracts (Foundry/Solidity)
- **`web/`**: Frontend (Next.js 15, React 19, TypeScript, Tailwind CSS v4)

---

## Build/Lint/Test Commands

### Smart Contracts (`sc/`)

```bash
# Build contracts
forge build

# Run all tests
forge test

# Run single test function
forge test --match-test testDeposit

# Run specific test file
forge test --match-path test/DAOVoting.t.sol

# Run tests with execution traces (debugging)
forge test -vvv   # Only failing tests
forge test -vvvv  # All tests

# Format code
forge fmt

# Generate gas snapshot
forge snapshot

# Start local node (anvil)
anvil

# Deploy contracts
forge script script/Deploy.s.sol:Deploy --rpc-url <url> --private-key <key>
```

### Frontend (`web/`)

```bash
# Run from web/ directory
cd web

# Development server
npm run dev

# Production build
npm run build

# Run linter
npm run lint

# Start production server
npm start
```

---

## Code Style Guidelines

### Smart Contracts (Solidity)

**File Structure:**
- First line: `// SPDX-License-Identifier: MIT`
- Second line: `pragma solidity ^0.8.X;`
- Then imports, then contract definition
- NatSpec comments for contracts (`@title`, `@dev`)

**Naming Conventions:**
- Contracts/Interfaces: `PascalCase` (e.g., `DAOVoting`, `MinimalForwarder`)
- Functions/variables: `camelCase` (e.g., `createProposal`, `totalDeposited`)
- Events: `PascalCase` with `Event` suffix (e.g., `ProposalCreated`)
- Structs: `PascalCase` (e.g., `Proposal`, `VoteType` enum)
- Constants: `UPPER_SNAKE_CASE` (e.g., `EXECUTION_DELAY`)

**Imports:**
- OpenZeppelin: `@openzeppelin/contracts/...`
- Forge std: `forge-std/...`

**Error Handling:**
- Use `require(condition, "Error message");`
- Revert custom errors with `revert CustomError();` for complex cases

**Visibility:**
- Explicitly declare all functions as `external`, `public`, `internal`, or `private`
- Prefer `external` for gas optimization on contracts called externally
- Use `view`/`pure` modifiers when appropriate

**Best Practices:**
- Check effects interactions (CEI) - state changes before external calls
- Use `nonReentrant` modifier from ReentrancyGuard for functions transferring ETH
- Always validate address inputs with `address(0)` checks
- Use `calldata` for read-only function parameters to save gas
- Emit events for important state changes
- Document access controls in NatSpec

**Testing:**
- Use `forge-std/Test.sol` base contract
- Test naming: `testFunctionName` or `testFunctionName_Scenario`
- Use `vm.prank(address)` to mock msg.sender
- Use `vm.deal(address, amount)` to fund accounts
- Use `vm.warp(timestamp)` to manipulate block time
- Use `vm.expectEmit()` to test event emissions

---

### Frontend (TypeScript/React)

**File Structure:**
- Client components: `'use client';` directivE first line
- Server components: No directive
- Imports: Group by absolute paths (`@/lib/`, `@/components/`) then relative

**Imports Order:**
1. React/Next imports
2. External libraries
3. `@/` absolute imports
4. Relative imports from same package
5. Relative imports from other packages

**Naming Conventions:**
- Components: `PascalCase` (e.g., `WalletConnect.tsx`)
- Hooks: `use` prefix (e.g., `useWalletConnect`)
- Utilities: `camelCase` (e.g., `daoHelpers.ts`)
- Constants: `UPPER_SNAKE_CASE` in separate files
- Types/Interfaces: `PascalCase` (e.g., `VoteType`)

**TypeScript Guidelines:**
- Use explicit types for function parameters and returns
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `bigint` for Ether values (ethers.js)
- Use `Promise<T>` for async return types

**React Best Practices:**
- Call all hooks at the top level (not in loops/conditions)
- Use `'use client'` for components using hooks, events, or browser APIs
- Keep client components small; extract logic to custom hooks
- Use `use client` sparingly - prefer Server Components
- Wrap async handlers with proper loading/error states

**Web3/Ethers.js:**
- Always handle connection errors gracefully
- Check `window.ethereum` before MetaMask access
- Use `ethers.AbiCoder` for custom encoding
- Handle provider/signer not available cases

**Error Handling:**
- Display user-friendly error messages in UI
- Log detailed errors to console for debugging
- Use try/catch for all async blockchain calls

---

## Key Contract Addresses (Local Development)

```
MinimalForwarder: 0x5FbDB2315678afecb367f032d93F642f64180aa3
DAOVoting:        0xe7f1725E7734CE288F8367e1Bb2E83fC7e9bC3C6
Relayer Address:  0xf39Fd6e51aad88F6F4ce6aB8827279cffb922b66
```

---

## Common Patterns

### Creating a Proposal
```solidity
vm.prank(alice);
dao.createProposal(recipient, amount, duration, description);
```

### Voting
```solidity
vm.prank(bob);
dao.vote(proposalId, DAOVoting.VoteType.FOR);
```

### Meta-Transaction (Gasless)
1. User signs vote request off-chain
2. Relayer (web API) submits to MinimalForwarder
3. MinimalForwarder validates and forwards to DAO
4. ERC2771Context extracts original sender

---

## Useful Aliases

Add to `.bashrc` for convenience:
```bash
alias forge-test="cd sc && forge test"
alias forge-build="cd sc && forge build"
alias web-dev="cd web && npm run dev"
alias web-lint="cd web && npm run lint"
```