# Coding Standards & Conventions

This document defines coding standards for the ESCROW DApp project across Solidity, TypeScript/React, and Git commits.

## Solidity Standards

### File Organization

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 1. Imports (organized: external, internal)
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// 2. Contract declaration
contract Escrow is Ownable, ReentrancyGuard {
    
    // 3. Type declarations (enums, structs)
    enum OperationStatus { PENDING, COMPLETED, CANCELLED }
    
    struct Operation {
        uint id;
        address creator;
        address tokenA;
        address tokenB;
        uint amountA;
        uint amountB;
        OperationStatus status;
    }
    
    // 4. State variables (public, internal, private)
    address[] public allowedTokens;
    mapping(uint => Operation) public operations;
    uint public operationCount;
    
    // 5. Events
    event TokenAdded(address indexed token);
    event OperationCreated(uint indexed opId, address creator, address tokenA, address tokenB);
    
    // 6. Modifiers
    modifier onlyAllowedToken(address token) {
        require(isTokenAllowed(token), "Token not allowed");
        _;
    }
    
    // 7. Constructor
    constructor() Ownable() {}
    
    // 8. External/Public functions (state-changing first, then read-only)
    function addToken(address token) external onlyOwner { ... }
    
    // 9. Internal functions
    function _isTokenInList(address token) internal view returns (bool) { ... }
    
    // 10. View/Pure functions
    function isTokenAllowed(address token) public view returns (bool) { ... }
}
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Contracts | PascalCase | `Escrow`, `TokenA`, `MockERC20` |
| Functions | camelCase | `addToken()`, `createOperation()` |
| State variables | camelCase | `allowedTokens`, `operationCount` |
| Constants | UPPER_SNAKE_CASE | `MAX_UINT256`, `MIN_AMOUNT` |
| Events | PascalCase | `TokenAdded`, `OperationCreated` |
| Enums | PascalCase | `OperationStatus`, `TokenType` |

### Function Visibility

```solidity
// ✅ DO: Explicit visibility
function addToken(address token) external onlyOwner {
    // Implementation
}

// ❌ DON'T: Omit visibility (defaults to internal in Solidity 0.5+)
function addToken(address token) onlyOwner {
    // Implementation
}
```

### Modifiers & Access Control

```solidity
// ✅ DO: Use OpenZeppelin modifiers
import "@openzeppelin/contracts/access/Ownable.sol";

contract Escrow is Ownable {
    function adminFunction() external onlyOwner {
        // Only owner can call
    }
}

// ✅ DO: Check inputs early
function createOperation(address tokenA, address tokenB, uint amountA, uint amountB) external {
    require(tokenA != address(0), "Invalid token A");
    require(tokenB != address(0), "Invalid token B");
    require(amountA > 0, "Amount A must be > 0");
    require(amountB > 0, "Amount B must be > 0");
    // Implementation
}

// ❌ DON'T: Forget to validate inputs
function createOperation(address tokenA, address tokenB, uint amountA, uint amountB) external {
    // What if amounts are 0? What if tokens are address(0)?
    transfer(tokenA, amountA);
}
```

### Token Transfer Safety

```solidity
// ✅ DO: Use safe transfer (requires OpenZeppelin)
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

function deposit(address token, uint amount) external {
    SafeERC20.safeTransferFrom(IERC20(token), msg.sender, address(this), amount);
}

// ✅ DO: Check return value
function deposit(address token, uint amount) external {
    bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
    require(success, "Transfer failed");
}

// ❌ DON'T: Assume transfer always succeeds (some tokens return false)
function deposit(address token, uint amount) external {
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    // What if transfer returned false?
}
```

### Reentrancy Protection

```solidity
// ✅ DO: Use ReentrancyGuard for state-changing functions that call other contracts
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
    function completeOperation(uint opId) external nonReentrant {
        Operation storage op = operations[opId];
        op.status = OperationStatus.COMPLETED;
        
        // Safe: external calls after state change
        IERC20(op.tokenB).transferFrom(msg.sender, op.creator, op.amountB);
        IERC20(op.tokenA).transfer(msg.sender, op.amountA);
    }
}

// ❌ DON'T: Forget nonReentrant modifier
function completeOperation(uint opId) external {
    // Vulnerable to reentrancy attacks
    IERC20(token).transfer(msg.sender, amount);
}
```

### Documentation & Comments

```solidity
// ✅ DO: Document important functions
/// @notice Creates a new token swap operation
/// @param tokenA Address of token creator provides
/// @param tokenB Address of token creator requests
/// @param amountA Amount of tokenA
/// @param amountB Amount of tokenB
/// @return operationId ID of created operation
function createOperation(
    address tokenA,
    address tokenB,
    uint amountA,
    uint amountB
) external returns (uint) {
    // Implementation
}

// ✅ DO: Add comments for non-obvious code
// Transfer tokenA before completing operation (checks-effects-interactions pattern)
IERC20(op.tokenA).transfer(msg.sender, op.amountA);

// ❌ DON'T: Over-comment obvious code
uint count = 0; // set count to 0
```

## TypeScript/React Standards

### File Organization

```typescript
// web/components/ConnectButton.tsx

// 1. Imports (React, libraries, local)
import React, { useState } from 'react';
import { useEthereum } from '@/lib/ethereum';

// 2. Types/Interfaces
interface Props {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// 3. Component
export function ConnectButton({ onConnect, onDisconnect }: Props) {
  const [loading, setLoading] = useState(false);
  const { connected, account, connect, disconnect } = useEthereum();

  // Component logic
  return (
    <button onClick={handleClick}>
      {connected ? 'Disconnect' : 'Connect MetaMask'}
    </button>
  );
}

// 4. Exports
export default ConnectButton;
```

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `ConnectButton`, `CreateOperation` |
| Functions | camelCase | `handleClick()`, `fetchBalance()` |
| Constants | UPPER_SNAKE_CASE | `ESCROW_ADDRESS`, `CHAIN_ID` |
| Variables | camelCase | `isLoading`, `userBalance` |
| Hooks | camelCase, prefix `use` | `useEthereum()`, `useBalance()` |
| Interfaces | PascalCase | `Operation`, `ContractAddresses` |
| Files | kebab-case | `connect-button.tsx`, `balance-debug.tsx` |

### Component Structure

```typescript
// ✅ DO: Functional components with hooks
export function MyComponent() {
  const [state, setState] = useState(null);
  const { data } = useEthereum();

  useEffect(() => {
    // Side effect
  }, [data]);

  return <div>{state}</div>;
}

// ✅ DO: Extract logic into custom hooks
function useBalance(address: string) {
  const [balance, setBalance] = useState(BigInt(0));
  const { tokenContract } = useEthereum();

  useEffect(() => {
    if (tokenContract && address) {
      tokenContract.balanceOf(address).then(setBalance);
    }
  }, [tokenContract, address]);

  return balance;
}

// ❌ DON'T: Class components (unless legacy)
class MyComponent extends React.Component {
  // Use functional components instead
}
```

### TypeScript Usage

```typescript
// ✅ DO: Use explicit types, avoid 'any'
function processOperation(op: Operation): void {
  console.log(op.id);
}

interface Operation {
  id: bigint;
  creator: string;
  status: number;
}

// ✅ DO: Use interfaces for complex objects
interface ContractState {
  account: string | null;
  connected: boolean;
  escrowContract: Contract | null;
}

// ❌ DON'T: Use 'any' type
function processOperation(op: any): any {
  // Type safety lost!
  return op.something.random.property;
}

// ❌ DON'T: Implicit types when explicit would be clear
const balance = balanceOf(); // What's the type? number? string? BigNumber?
const balance: bigint = balanceOf(); // Clear!
```

### Error Handling

```typescript
// ✅ DO: Handle errors and show user messages
async function connectWallet() {
  try {
    await connect();
    showToast('Connected successfully!', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed';
    showToast(message, 'error');
  }
}

// ✅ DO: Provide context-specific error messages
if (!window.ethereum) {
  showToast('MetaMask not installed. Please install it first.', 'error');
}

// ❌ DON'T: Swallow errors silently
async function connectWallet() {
  try {
    await connect();
  } catch (error) {
    // Silent failure! User has no idea what happened
  }
}
```

### Component Best Practices

```typescript
// ✅ DO: Use React.FC for clarity (optional in React 18+)
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  return <div>{prop1}</div>;
};

// ✅ DO: Memoize expensive components
export const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
}: {
  data: Operation[];
}) {
  return (
    <div>
      {data.map(op => (
        <div key={op.id}>{op.id}</div>
      ))}
    </div>
  );
});

// ✅ DO: Use key prop in lists
{operations.map(op => (
  <OperationRow key={op.id} operation={op} />
))}

// ❌ DON'T: Use index as key (causes bugs with dynamic lists)
{operations.map((op, index) => (
  <OperationRow key={index} operation={op} />
))}
```

### Styling with Tailwind

```typescript
// ✅ DO: Use Tailwind utility classes
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
      {children}
    </button>
  );
}

// ✅ DO: Extract repeated classes into components
function PrimaryButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      {children}
    </button>
  );
}

// ❌ DON'T: Use custom CSS unless absolutely necessary
export function Button() {
  return <button style={customButtonStyles}>Click me</button>;
}
```

## Git Commit Standards

### Commit Message Format

```
type(scope): subject

body

footer
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **test**: Test file changes
- **docs**: Documentation updates
- **refactor**: Code refactoring (no functional change)
- **style**: Code style changes (formatting, semicolons, etc)
- **chore**: Build, dependencies, tooling

### Examples

```bash
# Feature
git commit -m "feat(contracts): implement Escrow.sol with all core functions"

# Bug fix
git commit -m "fix(components): handle MetaMask disconnect gracefully"

# Test
git commit -m "test(contracts): add 80%+ coverage test suite for Escrow"

# Documentation
git commit -m "docs: add E2E testing workflow to TESTING.md"

# Refactor
git commit -m "refactor(frontend): extract Web3 logic into custom hooks"
```

### Commit Body (for complex changes)

```bash
git commit -m "feat(contracts): implement token swap operation

- Add createOperation() function to create swaps
- Add completeOperation() to finalize swaps
- Add cancelOperation() to revert swaps
- Implement ReentrancyGuard protection
- Add comprehensive error checking

Closes #123"
```

## Code Review Checklist

Before committing code, verify:

### Smart Contracts
- [ ] Compiles without errors: `forge build`
- [ ] No Solhint warnings: `solhint 'contracts/*.sol'`
- [ ] All functions have error handling
- [ ] State changes before external calls (CEI)
- [ ] Reentrancy guards on vulnerable functions
- [ ] Tests pass: `forge test`
- [ ] Test coverage >= 80%: `forge coverage`

### Frontend
- [ ] No TypeScript errors: `npm run build`
- [ ] ESLint passes: `npm run lint`
- [ ] Component renders without errors
- [ ] No console errors in browser
- [ ] Error messages display to users (not console only)
- [ ] MetaMask integration tested
- [ ] Responsive on mobile

### Both
- [ ] No `.env` or `.env.local` committed
- [ ] `.gitignore` updated if needed
- [ ] Commit message is descriptive
- [ ] Code follows project standards
- [ ] Documentation updated if needed

## Linting Configuration Files

### .solhint.json (Solidity)
```json
{
  "extends": "solhint:all",
  "rules": {
    "compiler-version": ["error", "^0.8.0"],
    "func-visibility": ["error"],
    "const-name-snakecase": "error",
    "line-length": ["error", 120]
  }
}
```

### .eslintrc.json (TypeScript/React)
```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-any": "warn",
    "no-console": "warn",
    "prefer-const": "error",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}
```

### .prettierrc.json (Code Formatting)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```
