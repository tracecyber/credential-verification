# CredentialSBT — Decentralized Academic Credential Verification System

> INTE264 Blockchain Technology Fundamentals — Assignment 3  
> RMIT University Vietnam | Semester 1, 2026  
> **Group:** Anh Nguyen (S4053394) · Nhi Bui (S4086154)

---

## Overview

A decentralized application (DApp) built on the Ethereum blockchain that allows educational institutions to issue tamper-proof academic credentials as **Soulbound Tokens (SBTs)** on-chain. Graduates own their credentials in their wallet, and employers can verify authenticity instantly — no central authority, no intermediary, no delay.

### Live Deployment
| | |
|---|---|
| **Network** | Ethereum Sepolia Testnet |
| **Contract Address** | `0xf2A4aB23Eaf3C041cd00d377F4505b313A0a3214` |
| **Etherscan** | https://sepolia.etherscan.io/address/0xf2A4aB23Eaf3C041cd00d377F4505b313A0a3214 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.28 + OpenZeppelin |
| Development Framework | Hardhat 3 |
| Blockchain | Ethereum Sepolia Testnet |
| Frontend | React + Vite |
| Wallet Integration | MetaMask + ethers.js |
| Metadata Storage | IPFS via Pinata |

---

## Project Structure

```
credential-verification/
├── contracts/
│   └── CredentialSBT.sol        # Main smart contract (Soulbound Token)
├── scripts/
│   └── deploy.ts                # Hardhat deployment script
├── test/
│   └── CredentialSBT.ts         # Test suite — 15 unit tests
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── IssuerPortal.jsx       # Mint & revoke credentials
│       │   ├── HolderDashboard.jsx    # View owned SBTs
│       │   └── VerifierLookup.jsx     # Public credential lookup
│       ├── hooks/
│       │   └── useContract.js         # MetaMask + contract integration
│       └── contractABI.js             # ABI + contract address config
├── hardhat.config.ts
├── .env.example
└── README.md
```

---

## Prerequisites

Before running this project, make sure you have:

- [Node.js](https://nodejs.org) v20 or higher
- [MetaMask](https://metamask.io) browser extension (Chrome recommended)
- A funded Sepolia testnet wallet — get free ETH from:
  - https://cloud.google.com/application/web3/faucet/ethereum/sepolia
  - https://faucets.chain.link/sepolia
- An [Alchemy](https://alchemy.com) account for Sepolia RPC URL

---

## Setup — Smart Contract

### 1. Clone the repository

```bash
git clone https://github.com/tracecyber/credential-verification.git
cd credential-verification
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

### 4. Compile the contract

```bash
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### 5. Run the test suite

```bash
npx hardhat test
```

Expected output:
```
CredentialSBT
  Deployment
    ✔ Should have correct name and symbol
  Issuer Management
    ✔ Owner can authorize an issuer
    ✔ Owner can revoke an issuer
    ✔ Non-owner cannot authorize an issuer
  Issue Credential
    ✔ Authorized issuer can issue a credential
    ✔ Unauthorized address cannot issue a credential
    ✔ Cannot issue with empty IPFS hash
  Verify Credential
    ✔ Valid credential returns correct data
    ✔ Verifying non-existent token should revert
  Revoke Credential
    ✔ Issuer can revoke and credential becomes invalid
    ✔ Cannot revoke an already revoked credential
    ✔ Unauthorized address cannot revoke
  Soulbound — Non-transferable
    ✔ transferFrom should revert

15 passing
```

### 6. Deploy to Sepolia (optional — already deployed)

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Save the contract address printed in the output.

---

## Setup — Frontend

### 1. Install frontend dependencies

```bash
cd frontend
npm install
```

### 2. Create frontend environment file

```bash
echo "VITE_CONTRACT_ADDRESS=0xf2A4aB23Eaf3C041cd00d377F4505b313A0a3214" > .env
```

> If you deployed your own contract, replace the address with your own.

### 3. Run the frontend

```bash
npm run dev
```

Or from the project root:

```bash
cd ..
npm run frontend
```

Open your browser and go to: **http://localhost:5173**

---

## Using the DApp

### Connect your wallet
1. Open http://localhost:5173 in **Chrome** (MetaMask does not work on Safari)
2. Click **Connect Wallet** — MetaMask will prompt you to connect
3. Make sure MetaMask is set to **Sepolia Testnet**

### Role-based access
| Role | How to access | Capabilities |
|---|---|---|
| **Owner** | Deployer wallet | Authorize/revoke issuers + all Issuer capabilities |
| **Issuer** | Whitelisted by Owner | Issue credentials, revoke credentials |
| **Verifier** | Anyone — no wallet needed | Verify any credential by Token ID |
| **Holder** | Connect wallet | View credentials issued to your address |

### Issuing a credential (Issuer/Owner only)
1. Upload credential metadata JSON to [Pinata](https://pinata.cloud) — copy the CID hash
2. Navigate to **Issuer Portal**
3. Enter the graduate's wallet address and the IPFS CID
4. Click **Issue Credential** → confirm in MetaMask
5. Token ID is returned and visible on Etherscan

**Example metadata JSON:**
```json
{
  "studentName": "Nguyen Van A",
  "degree": "Bachelor of Information Technology",
  "institution": "RMIT University Vietnam",
  "issueDate": "2026-05-22",
  "credentialType": "Undergraduate Degree",
  "issuedBy": "0xYourIssuerWalletAddress"
}
```

### Verifying a credential (anyone)
1. Navigate to **Verify** tab
2. Enter the Token ID
3. Click **Verify** — no wallet or fee required
4. Result shows: validity status, holder address, and full metadata from IPFS

### Viewing your credentials (Holder)
1. Connect your MetaMask wallet
2. Navigate to **My Credentials**
3. All SBTs issued to your wallet are displayed with status badges

### Revoking a credential (Issuer/Owner only)
1. Navigate to **Issuer Portal** → **Revoke Credential** section
2. Enter the Token ID to revoke
3. Click **Revoke Credential** → confirm in MetaMask
4. Status immediately updates to REVOKED for all verifiers

---

## Smart Contract — Key Functions

```solidity
// Issue a Soulbound Token credential to a graduate
function issueCredential(address recipient, string memory ipfsHash) 
    external onlyIssuer returns (uint256)

// Revoke a credential on-chain
function revokeCredential(uint256 tokenId) 
    external onlyIssuer

// Verify a credential — public, no wallet needed
function verifyCredential(uint256 tokenId) 
    external view returns (bool valid, string memory ipfsHash, address holder)

// Get all token IDs held by a wallet
function getHolderTokens(address holder) 
    external view returns (uint256[] memory)

// Whitelist an institution as an authorized issuer (owner only)
function authorizeIssuer(address issuer) 
    external onlyOwner
```

---

## Environment Variables Reference

### Root `.env` (for Hardhat)
```
SEPOLIA_RPC_URL=        # Alchemy Sepolia HTTPS URL
SEPOLIA_PRIVATE_KEY=    # Deployer wallet private key (without 0x prefix)
```

### `frontend/.env` (for Vite)
```
VITE_CONTRACT_ADDRESS=  # Deployed contract address
```

---

## LLM Usage Disclosure

As required by RMIT's academic integrity policy:

- **Claude (Anthropic)** was used to assist with smart contract architecture, Hardhat 3 troubleshooting, test suite structure, deployment scripts, and report writing guidance.
- All submitted code and written work reflect the group's own understanding and implementation decisions.

---

## License

MIT
