# ESCROW DApp

# ESCROW DApp

[LinkedIn Post Reference](https://www.linkedin.com/posts/gabriel-rodriguez-potencial_web3-ugcPost-7465248571483639809-HssU/?utm_source=share&utm_medium=member_desktop&rcm=ACoAABGu8tIBASkBMFxJ5-HGfNyKAHWvHmbnjRg)

A decentralized application (DApp) for secure peer-to-peer token swaps using an Escrow smart contract on the Ethereum blockchain.

## 🎯 Features

- **Token Authorization**: Owner can authorize which ERC20 tokens can be swapped
- **Create Operations**: Users can create token swap operations
- **Complete Operations**: Users can fulfill swap requests
- **Cancel Operations**: Creators can cancel and recover their tokens
- **Debug Panel**: View balances and active operations

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - AI project entry point and configuration
- **[BLUEPRINT.md](./BLUEPRINT.md)** - Multi-phase project plan (6 phases)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Local development setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment workflow
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and component architecture
- **[STANDARDS.md](./STANDARDS.md)** - Coding standards and conventions
- **[README_ESTUDIANTE.md](./README_ESTUDIANTE.md)** - Original project requirements

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (`forge`)
- MetaMask browser extension
- Git

### Setup (Local Development)

1. **Start Anvil (local blockchain)**
   ```bash
   anvil --host 0.0.0.0
   ```

2. **Deploy Contracts**
   ```bash
   ./scripts/deploy.sh
   ```

3. **Start Frontend**
   ```bash
   cd web
   npm install
   npm run dev
   ```

4. **Open in Browser**
   - Visit `http://localhost:3000`
   - Connect MetaMask

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

## 📊 Project Structure

```
ESCROW/
├── contracts/              # Smart contracts (Foundry)
│   ├── src/
│   │   ├── Escrow.sol      # Main escrow contract
│   │   ├── TokenA.sol      # Test ERC20 token
│   │   └── TokenB.sol      # Test ERC20 token 
│   ├── test/               # Foundry tests
│   └── foundry.toml        # Foundry config
│
├── web/                    # Frontend (Next.js 15)
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utilities and hooks
│   └── package.json        # Dependencies
│
├── scripts/
│   └── deploy.sh           # Automated deployment
│
└── docs/                   # Documentation
```

## 🔄 Development Phases

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Project Setup & Environment | 2-3 hrs | ✅ Complete |
| 2 | Smart Contract Development | 8-12 hrs | ⏳ Ready to start |
| 3 | Smart Contract Testing | 6-8 hrs | 🔄 Parallel |
| 4 | Frontend Setup | 6-8 hrs | 🔄 Parallel |
| 5 | Frontend Components | 10-12 hrs | 🔄 Depends on Phase 4 |
| 6 | Deployment & E2E Testing | 4-6 hrs | 🔄 Final phase |

**Total Estimated Time**: 120-160 hours

See [BLUEPRINT.md](./BLUEPRINT.md) for detailed phase breakdown.

## 💻 Tech Stack

- **Smart Contracts**: Solidity ^0.8.0
- **Contract Framework**: Foundry (forge)
- **Frontend Framework**: Next.js 15
- **Styling**: Tailwind CSS v4
- **Web3 Integration**: ethers.js v6
- **Testing**: Foundry + Jest
- **Local Blockchain**: Anvil

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
forge test                    # Run all tests
forge test -vvv               # Verbose output
forge coverage                # Check coverage
```

### Frontend Development
```bash
cd web
npm run lint                  # ESLint
npm run build                 # Build check
npm run dev                   # Dev server
```

## 📝 Coding Standards

- **Solidity**: PascalCase contracts, camelCase functions
- **TypeScript/React**: Full type safety, no `any` types
- **Git**: Conventional commits (feat, fix, test, docs, etc.)
- **Formatting**: Prettier (auto-format on save)
- **Linting**: Solhint + ESLint

See [STANDARDS.md](./STANDARDS.md) for detailed guidelines.

## 🔐 Security

- ✅ ReentrancyGuard protection on state-changing functions
- ✅ Access control (onlyOwner on admin functions)
- ✅ Input validation (non-zero addresses, positive amounts)
- ✅ Safe token transfers (OpenZeppelin SafeERC20)
- ✅ Comprehensive test coverage (80%+)

## 🤝 Contributing

1. Read [CLAUDE.md](./CLAUDE.md) for project entry point
2. Follow [STANDARDS.md](./STANDARDS.md) for code conventions
3. Check [BLUEPRINT.md](./BLUEPRINT.md) for current phase
4. Create feature branch: `git checkout -b feat/feature-name`
5. Commit with conventional message: `git commit -m "feat(scope): description"`

## 📞 Resources

- **Foundry Docs**: https://book.getfoundry.sh
- **Next.js Docs**: https://nextjs.org/docs
- **ethers.js v6**: https://docs.ethers.org/v6
- **Tailwind CSS**: https://tailwindcss.com/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts

## 📄 License

This project is provided for educational purposes.

---

**Status**: Phase 1 Complete ✅  
**Next**: Phase 2 - Smart Contract Development  
**Last Updated**: May 21, 2026
