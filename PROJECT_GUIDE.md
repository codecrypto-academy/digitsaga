# E-Commerce Project with Blockchain and Stablecoins

**Version**: 1.0.1 | **Last Updated**: Feb-01-2026 | **Status**: ✅ Production-ready

## Overview
This project is a complete blockchain-based e‑commerce system that includes:
- Creation and management of a stablecoin (EuroToken)
- Purchase of stablecoins with credit card (Stripe)
- Crypto payment gateway
- Smart contracts for e‑commerce logic
- Admin web app for businesses
- Web app for end customers

## Project Architecture
```
30_eth_database_ecommerce/
├── stablecoin/
│   ├── sc/                          # EuroToken Smart Contract
│   ├── gateway-stableboin/          # App to buy tokens with Stripe
│   └── payment-gateway/             # Payment gateway using tokens
├── sc-ecommerce/                    # E-commerce Smart Contract
├── web-admin/                       # Admin dashboard
├── web-customer/                    # Customer-facing online store
└── restart-all.sh                   # Full deploy/startup script
```

## Technologies Used

### Blockchain y Smart Contracts
- **Solidity**: Smart contract language
- **Foundry/Forge**: Development and testing framework
- **Anvil**: Local blockchain for development
- **Ethers.js v6**: Library to interact with Ethereum

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Static typing
- **Tailwind CSS**: Styling
- **MetaMask**: Crypto wallet

### Payments
- **Stripe**: Fiat payment processing
- **ERC20**: Token standard for EuroToken

---

## Parte 1: Smart Contract - EuroToken (Stablecoin)

### Goal
Create an ERC20 token that represents digital euros (1 EURT = 1 EUR).

### Location
`stablecoin/sc/src/EuroToken.sol`

### Main Features
```solidity
// Token ERC20 con funcionalidad de mint
contract EuroToken is ERC20 {
    address public owner;

    // Function to create new tokens (owner only)
    function mint(address to, uint256 amount) external onlyOwner

    // Decimals: 6 (to represent euro cents)
    function decimals() public pure returns (uint8) {
        return 6;
    }
}
```
### Developer Tasks

1. **Implement the EuroToken contract**
    - Inherit from OpenZeppelin ERC20
    - Set decimals to 6
    - Implement mint function with access control
    - Add events for auditing

2. **Write test**
    - Deploy test
    - Mint test by owner
    - Mint test by non‑owner (must fail)
    - Transfers between accounts

3. **Deploy script**
    - Create DeployEuroToken.s.sol
    - Deploy to local network (Anvil)
    - Initial mint of 1,000,000 tokens

### Useful Commands
```bash
# Compile
forge build

# Tests
forge test

# Local deploy
forge script script/DeployEuroToken.s.sol --rpc-url http://localhost:8545 --broadcast

# Check balance
cast call DIRECCION_TOKEN "balanceOf(address)(uint256)" DIRECCION_CUENTA --rpc-url http://localhost:8545
```

---

## Part 2: Stablecoin Purchase Application

### Goal
Allow users to buy EuroTokens using a credit card (Stripe).

### Location
stablecoin/gateway-stableboin/

### User Flow
1. User connects MetaMask
2. Enters the amount of tokens to buy (e.g. 100 EUR = 100 EURT)
3. Pays with credit card via Stripe
4. Backend mints tokens to the user’s wallet

### Main Components

#### 1. *Frontend (Next.js)*
```typescript
// Purchase component
export default function EuroTokenPurchase() {
  // 1. Connect MetaMask
  // 2. Create Payment Intent with Stripe
  // 3. Display payment form
  // 4. After successful payment → mint tokens
}
```

#### 2. *Backend (API Routes)*
```typescript
// /api/create-payment-intent
// Create payment intent in Stripe

// /api/mint-tokens
// Mint tokens after successful payment
```

### Developer Tasks

1. **Stripe Setup**
    - Create a test account in Stripe
    - Get API keys (publishable and secret)
    - Configure webhooks

2. **Implement Frontend**
    - MetaMask connection component
    - Form to enter purchase amount
    - Integration with Stripe Elements
    - Display token balance

3. **Implement Backend**
    - Endpoint to create Payment Intent
    - Endpoint to mint tokens
    - Webhook to confirm payments
    - Validate that payment succeeded before minting

4. **Testing**
    - Use Stripe test cards
    - Verify that tokens are credited correctly
    - Test error handling

### Environment Variables
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x... # Para hacer mint desde backend
```   

---

## Part 3: Payment Gateway

### Goal
Enable payments with EuroTokens between customers and merchants.

### Location
stablecoin/payment-gateway/

### Payment Flow
1. User is redirected from the store with payment data
2. Connects MetaMask
3. Confirms amount and recipient
4. Approves token transfer
5. Payment is executed via the Ecommerce contract
6. User is redirected back to the store

### URL Parameters
```
http://localhost:6002/?
  merchant_address=0x...      # Merchant wallet address
  amount=100.50               # Amount in EUR
  invoice=INV-001             # Invoice ID
  date=2025-10-15             # Date
  redirect=http://...         # Return URL
```

### Development Tasks

1. **Implement Payment UI**
    - Show payment details
    - Button to connect MetaMask
    - Check for sufficient balance
    - Show transaction status

2. **Smart Contract Integration**
    - Approve token spending for the Ecommerce contract
    - Call processPayment on the contract
    - Wait for transaction confirmation
    - Update invoice status

3. **Error Handling**
    - Insufficient balance → show link to buy tokens
    - Transaction rejection
    - Network timeouts

4. **Redirection**
    - Automatically redirect after successful payment
    - Pass result parameters back to the merchant

---

## Part 4: E‑commerce Smart Contract

### Goal
Manage companies, products, shopping carts, and invoices on‑chain.

### Location
sc-ecommerce/src/Ecommerce.sol

### Architecture
```
Ecommerce.sol (Main contract)
├── CompanyLib.sol        # Company management
├── ProductLib.sol        # Product management
├── CustomerLib.sol       # Customer management
├── CartLib.sol           # Shopping cart
├── InvoiceLib.sol        # Invoices
└── PaymentLib.sol        # Payment processing
```
### Data Structures
#### Company
```solidity
struct Company {
    uint256 companyId;
    string name;
    address companyAddress;  // Wallet that receives payments
    string taxId;
    bool isActive;
}
```

#### Product
```solidity
struct Product {
    uint256 productId;
    uint256 companyId;
    string name;
    string description;
    uint256 price;           // In euro cents (6 decimals)
    uint256 stock;
    string ipfsImageHash;
    bool isActive;
}
```

#### Invoice
```solidity
struct Invoice {
    uint256 invoiceId;
    uint256 companyId;
    address customerAddress;
    uint256 totalAmount;
    uint256 timestamp;
    bool isPaid;
    bytes32 paymentTxHash;
}
```

### Main Functions
```solidity
// Companies
function registerCompany(string name, string taxId) returns (uint256)
function getCompany(uint256 companyId) returns (Company)

// Products
function addProduct(companyId, name, description, price, stock) returns (uint256)
function updateProduct(productId, price, stock)
function getAllProducts() returns (Product[])

// Cart
function addToCart(uint256 productId, uint256 quantity)
function getCart(address customer) returns (CartItem[])
function clearCart(address customer)

// Invoices
function createInvoice(address customer, uint256 companyId) returns (uint256)
function processPayment(address customer, uint256 amount, uint256 invoiceId)
function getInvoice(uint256 invoiceId) returns (Invoice)
```

### Development Tasts 

1. **Implement Libraries**
    - CompanyLib: CRUD for companies
    - ProductLib: CRUD for products with stock control
    - CartLib: Add/remove products, calculate totals
    - InvoiceLib: Create invoices from cart
    - PaymentLib: Process payments with EuroToken

2. Implement Main Contract
    - Integrate all libraries
    - Access control (only company owner can modify company data)
    - Events for every important operation
    - Business validations

3. Comprehensive Tests
    - Company registration test
    - Add product test
    - Full flow: add to cart → create invoice → pay
    - Stock control test
    - Permissions test

4. Optimizations
    - Use mappings for O(1) lookups
    - Minimize storage writes
    - Gas optimization

## Part 5: Web Admin (Admin Panel)

### Goal
Admin panel for companies to manage products, view invoices, and customers.

### Location
web-admin/

### Funcional Features

1. *Company Management*
Register new company
View company list
Edit company information

2. *Product Management*
Add product (name, price, stock, image)
Edit product
Activate/deactivate product
View available stock

3. *Invoice Management*
View all invoices for the company
Filter by status (paid/pending)
View invoice details
View transaction on blockchain

4. *Customers*
View customer list
Purchase history per customer

### Main Components
```typescript
// Wallet connection
function WalletConnect() {
  // Connect MetaMask
  // Show address and balance
}

// Company registration
function CompanyRegistration() {
  // Form to register a company
  // Only if connected wallet does not already have a company
}

// Product list
function ProductList({ companyId }) {
  // Load products from contract
  // Buttons to edit/delete
}

// Product form
function ProductForm({ companyId, productId? }) {
  // Add or edit product
  // Upload image to IPFS
}
```

### Development Tasts

1. **Project Setup**
    Configure Next.js with TypeScript
    Install Ethers.js and dependencies
    Configure Tailwind CSS
    Environment variables setup

2. **Implement Hooks**
    useWallet: MetaMask connection management
    useContract: Instantiate contracts
    useCompany: Company data
    useProducts: Product list

3. **Implement Pages**
    /: Main dashboard
    /companies: Company list and registration
    /company/[id]: Company detail with tabs
    /company/[id]/products: Product management
    /company/[id]/invoices: Invoice list

4. **Validations**
    Only company owner can edit
    Validate that wallet is connected
    Validate correct network (localhost/31337)
    Handle transaction errors

5. **UX/UI**
    Dark mode support
    Responsive design
    Loading states
    Success/error messages
    Confirmations before transactions

---

## Part 6: Web Customer (Online Store)

### Goal
Online store where customers buy products with EuroTokens.

### Location
web-customer/

### Funcional Features

1. *Product Catalog*
View all available products
Filter by company
View price and stock
Add to cart

2. *Shopping Cart*
View cart items
Change quantities
View total
Proceed to checkout

3. *Checkout*
Create invoice from cart
Redirect to payment gateway
Clear cart after invoice creation

4. *My Invoices*
View purchase history
View payment status
View invoice details

### Purchase Flow
```
1. User browses products
   ↓
2. Adds products to cart
   ↓
3. Goes to /cart and checks out
   ↓
4. Invoice is created on blockchain
   ↓
5. Cart is cleared
   ↓
6. Redirect to payment gateway
   ↓
7. User pays with tokens
   ↓
8. Returns to /orders (invoices)
   ↓
9. Sees invoice marked as "Paid"
```

### Main Components
```Typescript
// Product list
function ProductsPage() {
  // Load products (no wallet required for read-only)
  // "Add to Cart" button (requires wallet)
}

// Cart
function CartPage() {
  // Display cart items
  // Calculate total
  // "Checkout" button → create invoice
}

// My invoices
function OrdersPage() {
  // Load user invoices
  // Show status (Paid/Pending)
  // View details
}
```
### Development Tasks

1. **Implement Catalog**
Load products without wallet (read‑only)
Product card design
Pagination or infinite scroll
Search/filter system

2. **Implement Cart**
useCart hook for state management
Add/remove/update products
Persist cart on blockchain
Calculate total

3. **Implement Checkout**
Group items by company
Create invoice via contract call
Wait for transaction confirmation
Build payment gateway URL
Clear cart
Redirect to gateway

4. **Implement History**
Load user invoices
Show invoice details
Visual status indicator (Paid/Pending)
Link to transaction on blockchain

5. **Optimizations**
Product caching
Optimistic updates in cart
Loading skeletons
Error boundaries

---

## Part 7: Full Integration

### Automated Deploy Script
The restart-all.sh file automates the entire process:
```bash
#!/bin/bash

# 1. Stop previous applications
# 2. Start Anvil (local blockchain)
# 3. Deploy EuroToken
# 4. Deploy Ecommerce
# 5. Update environment variables
# 6. Start all applications
```

### Environment Variables per Application

#### gateway-stableboin
```env
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...STRIPE_SECRET_KEY=sk_test_...
```

#### payment-gateway
```env
NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...

#### web-admin
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
```

#### web-customer
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...NEXT_PUBLIC_EUROTOKEN_CONTRACT_ADDRESS=0x...
```

### Application Ports
- Anvil: http://localhost:8545
- Stablecoin Purchase App: http://localhost:6100
- Payment Gateway: http://localhost:6200
- Web Admin: http://localhost:6300
- Web Customer: http://localhost:6400

---

## Part 8: End‑to‑End System Testing

### Test Scenarios

1. **Initial Setup**
```bash
   # Start the whole system   
   ./restart-all.sh   
   # Get deployed contract addresses   
   # (shown at the end of the script)
```

2. **Buy Tokens**
Go to http://localhost:6001
Connect MetaMask
Buy 1000 EURT with a test card
Check balance in MetaMask

3. **Register Company (Admin)**
Go to http://localhost:6003
Connect with company account
Register company “My Store”
- Add products:
    Product A: €10, Stock: 100
    Product B: €25, Stock: 50

4. **Buy Products (Customer)**
Go to http://localhost:6004
View product catalog
Connect customer wallet
Add Product A (qty: 2) to cart
Add Product B (qty: 1) to cart
Go to cart
Checkout → creates invoice
Redirects to payment gateway

5. **Pay at Gateway**
See payment details (€45)
Connect MetaMask (customer account)
Check sufficient balance
Confirm payment
Approve token spending
Confirm processPayment transaction
See successful payment confirmation

6. **Verify Invoice**
Redirects to http://localhost:6004/orders
See invoice marked as “Paid”
View purchase details

7. **Verify Company (Admin)**
Go back to http://localhost:6003
See invoice in company panel
Verify received token balance
- Verify updated stock:
    Product A: 98
    Product B: 49

### Student Tasks

1. **Document Tests**
Create document with screenshots
Document each step of the flow
Record transaction hashes
Verify states on blockchain

2. **Error Testing**
Try to pay with insufficient balance
Try to add product without wallet
Try to modify another company’s product
Product with no stock

3. **Edge Case Testing**
Multiple products from different companies
Cancel payment at gateway
Change account in MetaMask
Refresh page during the process

---

## Recursos Adicionales

### Documentación
- [Solidity Docs](https://docs.soliditylang.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Ethers.js v6](https://docs.ethers.org/v6/)
- [Next.js Docs](https://nextjs.org/docs)
- [Stripe Docs](https://stripe.com/docs)

### Herramientas
- [Remix IDE](https://remix.ethereum.org/) - IDE online para Solidity
- [MetaMask](https://metamask.io/) - Wallet de criptomonedas
- [IPFS](https://ipfs.io/) - Almacenamiento descentralizado

### Useful Commands
```bash
# Foundry
forge build                    # Compilar contratos
forge test                     # Ejecutar tests
forge test -vvv               # Tests con logs detallados
forge fmt                      # Formatear código
forge clean                    # Limpiar builds

# Anvil
anvil                          # Iniciar blockchain local
anvil --accounts 10           # Con 10 cuentas precargadas

# Cast (interactuar con contratos)
cast call ADDRESS "functionName()" --rpc-url http://localhost:8545
cast send ADDRESS "functionName(args)" --private-key 0x... --rpc-url http://localhost:8545

# Next.js
npm run dev                    # Iniciar dev server
npm run build                  # Build para producción
npm run start                  # Ejecutar build
```

---

## Project Evaluation

### Evaluation Criteria

1. **Smart Contracts (30%)**
Correct ERC20 implementation
Library architecture
Comprehensive tests
Gas optimization
Security and validations

2. **Blockchain Integration (20%)**
MetaMask integration
Transaction handling
Error handling
Events and logs

3. **Functionality (25%)**
All features working
Full purchase flow
State management
Data persistence

4. **UX/UI (15%)**
Intuitive design
Responsive layout
Loading states
Clear messages

5. **Documentation (10%)**
Complete README
Code comments
API documentation
User guide

### Deliverables

1. **Source Code**
Git repository with all code
Meaningful commits
Organized branches

2. **Documentation**
README with installation instructions
Architecture diagrams
Contract documentation
User guide

3. **Demo**
Demo video (5–10 minutes)
Project presentation
Explanation of technical decisions

4. **Tests**
Minimum 80% coverage
Integration tests
Test report

---

## Optional Extensions (Bonus)

1. **Multi‑currency**
Add more stablecoins (USDT, DAI)
Currency exchange

2. **Review System**
Customers can leave reviews
Product ratings

3. **Loyalty Program**
NFTs as rewards
Discounts for frequent customers
Promote Accounts
    Prepayments Event,
    Performance/Engagement
    Campigns
Terms of Services

4. **Multi‑vendor Marketplace**
Multiple companies on one platform
Platform fees

5. **Notifications**
Email on invoice creation
Push notifications for payments

6. **Analytics Dashboard**
Sales charts
Best‑selling products
Business metrics

---

## Conclution

**This project brings together the following modern technologies:**
- [x] Blockchain and Smart Contracts
- [x] DeFi (stablecoins)
- [x] Traditional payments (Stripe)
- [x] Full‑stack web development
- [x] TypeScript and React

**By completing this project, you will gain practical experience in:**
- [x] Developing secure smart contracts
- [x] Integrating with crypto wallets
- [x] Building DApps (Decentralized Applications)
- [x] Designing decentralized application architectures
- [x] Blockchain testing
- [x] Creating UX for crypto applications

---
