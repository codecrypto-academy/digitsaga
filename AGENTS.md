# AGENTS.md — Ecommerce Monorepo

## Project Overview

Monorepo with 2 Foundry Solidity projects and 4 Next.js 15 apps:

| Path | Tech | Purpose |
|------|------|---------|
| `sc-ecommerce/` | Foundry 0.8.30 | Main Ecommerce contract (monolithic) |
| `stablecoin/sc/` | Foundry 0.8.30 | EuroToken ERC20 (6 decimals) |
| `web-admin/` | Next.js 15 + ethers v6 | Admin panel |
| `web-customer/` | Next.js 15 + ethers v6 | Customer storefront |
| `stablecoin/compra-stableboin/` | Next.js 15 + Stripe | Stablecoin purchase via Stripe |
| `stablecoin/pasarela-de-pago/` | Next.js 15 + ethers | Payment gateway |

Anvil runs on `localhost:8545` (block 1 = Anvil default). API routes run in each app dir.

---

## Commands

### Solidity (Foundry)

```bash
# Build
forge build                                          # both projects

# Run all tests
forge test                                           # sc-ecommerce or stablecoin/sc
forge test -vv                                       # verbose (emit console.log)

# Run a single test
forge test --match-test test_RegisterCompany          # single test by name
forge test --match-contract CompanyRegistryTest       # whole test contract
forge test --match-path test/CompanyRegistry.t.sol    # single test file

# Deploy to Anvil (requires running anvil)
forge script script/DeployEuroToken.s.sol:DeployEuroToken --broadcast --rpc-url http://localhost:8545 --private-key 0xac09...
forge script script/DeployEcommerce.s.sol:DeployEcommerceScript --broadcast --rpc-url http://localhost:8545 --private-key 0xac09...
```

### Next.js Apps

```bash
# Each app follows the same pattern (run from app dir):
npm run dev              # next dev --turbopack
npm run build            # next build --turbopack
npm run lint             # eslint
npx next dev --port 6001 # specific port

# Ports: compra-stableboin=6001, pasarela=6002, web-admin=6003, web-customer=6004
```

### Scripts (from repo root)

```bash
./restart-all.sh         # redeploy contracts + restart all 4 apps (preserves .env.local keys)
./deploy-all.sh          # deploy contracts, gen env files, start apps (overwrites env)
./simple-deploy.sh       # quick deploy, minimal output
```

---

## Contract Addresses (deployed on Anvil)

- **EuroToken**: `0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519`
- **Ecommerce**: `0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496`
- **Owner private key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

---

## Code Style

### Solidity

- **Version**: `pragma solidity ^0.8.13;`
- **License**: `// SPDX-License-Identifier: MIT`
- **Imports**: Named imports only: `import {Contract} from "path.sol";`
- **Naming**: `snake_case` for variables and params (`_companyId`, `_amount`); `camelCase` for functions
- **Underscore prefix** on function params to distinguish from storage (`_amount`, `_customer`)
- **Test naming**: `test_FeatureName()` for success cases, `test_RevertWhen_Condition()` for reverts
- **Test addresses**: `makeAddr("name")` pattern, avoid hardcoded addresses
- **Test setup**: declare vars at contract level, init in `setUp()`
- **Error strings**: short lowercase like `"Only owner"`, `"Company not found"`, `"Name required"`
- **Modifiers**: `onlyOwner()` pattern, wrap modifier logic for gas optimization
- **Events**: emit at end of state-changing functions, `indexed` on filterable params
- **Structs**: PascalCase, defined at contract level or in library
- **Storage**: private storage variables, internal library structs
- **Spacing**: 4-space indent, blank line between sections

### TypeScript / React

- **Version**: TypeScript 5, `strict: true`, `moduleResolution: bundler`
- **Imports**: Named imports: `import { useState } from 'react';`
- **Path alias**: `@/*` maps to `./src/*`
- **Components**: PascalCase filenames and function names
- **Hooks**: `camelCase`, prefixed `use`, stored in `src/hooks/`
- **Client components**: Always start with `'use client';` directive
- **State**: `useState` for local, custom hooks for shared (no global store)
- **Types**: Interfaces with `interface`, PascalCase, in same file or co-located
- **Nullable**: Avoid `any` (configured as warning in eslint). Use `| null` union, guard with `if (!x) return;` or `x!` assertion when safe
- **Env vars**: `NEXT_PUBLIC_` prefix for client-accessible, `!` non-null assertion when required
- **Error handling**: `try/catch` around blockchain calls, `console.error(...)` + user feedback
- **Async**: `async/await` for blockchain ops, no raw `.then()`
- **Wallet**: `window.ethereum` via `BrowserProvider` from ethers v6
- **Styling**: Tailwind CSS v4 utility classes
- **ESLint**: Flat config `eslint.config.mjs`, extends `next/core-web-vitals`

### General

- **No comments in code** unless clarifying complex logic
- **`set -e`** in bash scripts for fail-fast
- **Chain ID 31337** = Anvil/Hardhat local network (hex `0x7a69`)
- **EuroToken decimals**: 6 (not 18). Always use `ethers.parseUnits(amount, 6)` / `ethers.formatUnits(balance, 6)`

---

## .env.local Pattern

Each of the 4 Next.js apps has its own `.env.local`. The `update_env()` helper in `restart-all.sh` replaces only contract address lines without touching custom keys (Stripe, etc.). Never overwrite entire `.env.local` files — use `sed` to replace specific lines.

All `.env.local` files are gitignored by default (Next.js convention). Stripe keys are user-provided test keys.
