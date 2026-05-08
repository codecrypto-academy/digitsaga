# Changelog

All notable changes to this project will be documented in this file.
## [0.1.4] - 2025-05-07

### Added
- Documentation Link for 'DAO Admin' section
- A small "New" badge with a description that fades in below the "Create Proposal" header.

### Technical
- Smart contract: openzeppeling support for Foundry

## [0.1.3] - 2025-05-06

### Architecture Visualization
- **ARCHITECTURE.svg** - Animated architecture diagram visualizing DAO system flows
  - Three-layer architecture visualization (Smart Contracts, Web3 Provider, Frontend)
  - Animated data flow tokens showing transaction progression
  - Standard transaction flow animation (Deposit → Contract → Event → UI)
  - Gasless voting flow animation (Sign → Relayer → Forwarder → Contract → Vote → UI)
  - Proposal lifecycle progression visualization (Create → Voting → Ended → Executable → Executed)
  - Component pulsing effects with glow filters
  - Interactive legend explaining animation indicators
  - Responsive SVG with smooth SMIL animations
  - Vote counter and execution condition displays

### Added -UI Animation System
- **Framer Motion Integration** - Smooth, GPU-accelerated animations across UI components
  - WalletConnect: Button hover/tap effects, connection state fade-in, pulsing status indicator
  - CreateProposal: Card entrance slide-up, form input focus transitions, loading button states
  - ProposalList: Staggered card entrance, vote button interactions, user vote display
  - Motion preferences respected (prefers-reduced-motion accessibility support)
  - Custom CSS animation utilities in globals.css
  - Documented animation patterns and best practices in web/README.md
  - Excluded Treasury section from animations (auto-refreshing financial data)

## [0.1.2] - 2025-05-04

### Fixed
- Meta-transaction "Call failed" error - MinimalForwarder was not appending `req.from` to calldata correctly
- Empty data transactions - Added validation and receive() function to MinimalForwarder
- EIP-2771 compatibility - DAO contract expects sender appended to calldata (last 20 bytes)

### Technical
- MinimalForwarder.execute() now uses `abi.encodePacked(req.data, req.from)` to support ERC2771Context
- Added `require(req.data.length > 0, "Empty data")` validation
- Added `receive() external payable {}` for plain ETH transfers

## [0.1.1] - 2025-05-03

### Fixed
- window.ethereum TypeScript error - Added global Window declaration in src/types/global.d.ts
- any type errors in catch blocks - Changed to proper Error type assertions
- ForwardRequest type mismatch - Updated signMetaTxRequest signature
- userLocks undefined - Removed dead code reference

## [0.1.0] - 2025-04-29

### Added
- Initial release
- DAO voting contract with proposals and voting
- MinimalForwarder for EIP-2771 meta-transactions
- Next.js frontend with MetaMask integration
- Relayer API for gasless transactions
- Daemon for auto-executing approved proposals

### Technical
- Smart contracts: Solidity + Foundry
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS v4