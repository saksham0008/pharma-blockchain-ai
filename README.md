# PharmChain AI — Anti-Counterfeit Drug Authentication System

> A dual-blockchain pharmaceutical supply chain platform using **Polygon** (public) + **Hyperledger Fabric** (private), AI-powered counterfeit risk scoring, GPS live tracking, QR verification, and real-time WebSocket alerts.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://python.org/)
[![React](https://img.shields.io/badge/React-19-cyan)](https://reactjs.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the System](#running-the-system)
- [API Documentation](#api-documentation)
- [Smart Contract Functions](#smart-contract-functions)
- [AI Risk Scoring](#ai-risk-scoring)
- [How to Use](#how-to-use)
- [Running Tests](#running-tests)
- [Team](#team)
- [License](#license)

---

## Overview

PharmChain AI is a final year B.Tech project that addresses the global pharmaceutical counterfeiting crisis. WHO estimates that 10% of medicines in developing countries are counterfeit, causing thousands of deaths annually.

The system creates an **immutable digital identity** for every drug unit on the blockchain. Supply chain actors record GPS-verified custody transfers, creating a tamper-proof chain-of-custody. Consumers scan a QR code to instantly verify authenticity, view the drug's full journey on an interactive map, and see an AI-computed risk score.

---

## Problem Statement

- WHO estimates 10% of medicines in developing countries are counterfeit
- Traditional supply chains lack end-to-end traceability
- Paper-based batch records can be forged
- No real-time alerting for drug recalls
- Sensitive business data (pricing, invoices) needs to be private but auditable

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  Manufacturer | Distributor | Pharmacy | Admin | Consumer    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP + WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                   BACKEND (Node.js/Express)                   │
│  JWT Auth │ REST API │ WebSocket Server │ Cache (60s TTL)    │
└──────┬────────────────────┬──────────────────────┬──────────┘
       │                    │                      │
       ▼                    ▼                      ▼
┌─────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│  AI Engine  │  │  Polygon Amoy    │  │  Hyperledger Fabric  │
│ Python Flask│  │  Smart Contract  │  │  Private Network     │
│  /score API │  │  (Public Chain)  │  │  (3 Orgs, CouchDB)  │
└─────────────┘  └──────────────────┘  └─────────────────────┘
                          │
                    ┌─────▼──────┐
                    │  MongoDB   │
                    │ (Off-chain │
                    │  metadata) │
                    └────────────┘
```

---

## Features

### 🔗 Blockchain Layer (Polygon Amoy)
- Drug registration with unique ID, name, batch number, expiry date
- Role-based access control — 6 roles: Admin, Manufacturer, Distributor, Pharmacy, Consumer, None
- GPS-tracked custody transfers — each transfer records latitude/longitude as fixed-point integers
- Immutable on-chain transfer history — append-only, tamper-proof
- Dynamic drug status: **Active / Recalled / Expired** (computed from block timestamp)
- On-chain risk score updated by AI engine after every transfer
- Drug recall by admin — broadcasts real-time alert to all stakeholders
- Events: `DrugCreated`, `DrugTransferred`, `RiskScoreUpdated`, `DrugRecalled`, `RoleAssigned`

### 🔒 Hyperledger Fabric (Private Chain)
- 3-organization private network: Manufacturer (Org1), Distributor (Org2), Pharmacy (Org3)
- `PharmaPrivateCollection` — pricing, batch notes, invoices visible to Org1+Org2 only
- Pharmacy (Org3) receives `ACCESS_DENIED` on private data queries
- `SyncToPolygon` event for public/private chain synchronization

### 🤖 AI Risk Scoring Engine
Five additive rules (capped at 100):
| Rule | Score |
|------|-------|
| Expiry within 30 days | +20 |
| Expiry within 90 days | +10 |
| More than 10 transfers | +15 |
| Any two transfers <60s apart | +20 |
| Location jump >1000 km/h | +25 |
| Batch flagged as recalled | +30 |

Risk categories: **Uncolored** (0) / **Low** (1–24) / **Medium** (25–49) / **High** (50–74) / **Critical** (75–100)

### 🌐 Backend API (Node.js)
- JWT authentication via MetaMask wallet signature verification
- 12 REST API endpoints for all supply chain operations
- GPS coordinate validation (lat: -90 to 90, lng: -180 to 180)
- 60-second TTL MongoDB caching with automatic invalidation on transfer
- WebSocket real-time broadcasts on transfer and recall

### 💻 Frontend (React)
- Role-based dashboards for all 5 supply chain roles
- **Manufacturer:** Drug registration, QR code generation & download, history view
- **Distributor:** GPS-validated custody transfers, risk score display
- **Pharmacy:** Dispense drugs to consumers
- **Admin:** Role assignment, drug recall with confirmation
- **Consumer/Public:** Scan QR → full drug info + GPS Leaflet.js map + live updates
- Real-time map and risk score updates via WebSocket
- Dark/Light mode toggle
- WCAG 2.1 AA accessible components

### 📱 QR Code System
- QR encodes a public verify URL: `{BASE_URL}/verify/{drugID}`
- Scanning opens the public verification page — no app needed, works in any browser
- Manufacturer can download/print QR for physical drug labeling

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Public Blockchain | Solidity 0.8.20, Hardhat, Polygon Amoy Testnet |
| Private Blockchain | Hyperledger Fabric 2.5, Fabric-CA 1.5, CouchDB |
| Backend | Node.js 18, Express 5, ethers.js v6 |
| Database | MongoDB 7 with Mongoose ODM |
| AI Engine | Python 3.10, Flask 3.1, Haversine formula |
| Frontend | React 19, React Router v6, Leaflet.js |
| Authentication | JWT (8h expiry), MetaMask signature verification |
| Real-time | WebSocket (`ws` library), 10s polling fallback |
| QR Code | `qrcode` (generation), `html5-qrcode` (scanning) |
| Testing | Hardhat, fast-check (JS property-based), Hypothesis (Python PBT) |

---

## Project Structure

```
pharma-blockchain-ai/
│
├── contracts/
│   └── PharmaSupplyChain.sol       # Extended smart contract
│
├── scripts/
│   └── deploy.ts                   # Hardhat deploy → Polygon Amoy
│
├── test/
│   └── contract/
│       ├── drugRegistration.test.ts  # Property tests (fast-check)
│       └── pharmaSupplyChain.test.ts # Unit tests (19 tests)
│
├── backend/
│   ├── routes/                     # Express route files
│   │   ├── auth.js                 # POST /auth/login, GET /auth/me
│   │   ├── drugs.js                # CRUD + history + GPS
│   │   ├── transfer.js             # POST /api/transfer
│   │   ├── admin.js                # Recall + assignRole
│   │   ├── qr.js                   # QR generation + verify
│   │   └── fabric.js               # Hyperledger endpoint
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification + role guard
│   │   └── validate.js             # GPS bounds validation
│   ├── services/
│   │   ├── contractService.js      # ethers.js v6 wrapper
│   │   ├── cacheService.js         # 60s TTL MongoDB cache
│   │   ├── aiService.js            # AI engine HTTP + retry
│   │   ├── wsService.js            # WebSocket subscriptions
│   │   └── fabricService.js        # Hyperledger gateway
│   ├── models/
│   │   ├── User.js                 # Wallet + role metadata
│   │   ├── GpsLog.js               # GPS coordinates per transfer
│   │   ├── AiScoreLog.js           # AI scoring audit trail
│   │   └── DrugCache.js            # 60s TTL drug data cache
│   ├── abi/
│   │   └── PharmaSupplyChain.json  # Contract ABI
│   ├── server.js                   # Express + WebSocket server
│   ├── contract.js                 # Legacy contract instance
│   └── package.json
│
├── ai-engine/
│   ├── scorer.py                   # 5-rule risk scoring logic
│   ├── app.py                      # Flask HTTP service
│   └── requirements.txt
│
├── fabric/                         # Hyperledger Fabric network
│   ├── docker-compose.yaml         # 3-org network
│   ├── collections_config.json     # Private collection policy
│   ├── chaincode/
│   │   └── pharma/
│   │       ├── pharmaContract.js   # Chaincode
│   │       └── index.js
│   └── scripts/
│       ├── startNetwork.sh
│       └── deployChaincode.sh
│
├── frontend/
│   ├── src/
│   │   ├── contexts/               # AuthContext, ThemeContext
│   │   ├── services/               # api.js (Axios)
│   │   ├── components/             # Shared UI components
│   │   ├── pages/                  # All dashboard pages
│   │   └── hooks/                  # useWebSocket, useDrug
│   ├── public/
│   └── package.json
│
├── team-docs/                      # Team instructions & reports
└── hardhat.config.ts
```

---

## Prerequisites

Before starting, make sure you have:

- [Node.js 18+](https://nodejs.org/) — for backend and Hardhat
- [Python 3.10+](https://python.org/) — for AI engine
- [MongoDB](https://mongodb.com/) — local install or [MongoDB Atlas](https://cloud.mongodb.com/) (free tier)
- [Docker Desktop](https://docker.com/products/docker-desktop/) — for Hyperledger Fabric (optional)
- [MetaMask](https://metamask.io/) — browser extension for wallet login
- Polygon Amoy testnet wallet with test MATIC — get from [Polygon Faucet](https://faucet.polygon.technology/)
- [Git](https://git-scm.com/)

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/saksham0008/pharma-blockchain-ai
cd pharma-blockchain-ai
```

### 2. Install root dependencies (Hardhat)

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Install AI engine dependencies

```bash
cd ai-engine
pip install flask==3.1.0
cd ..
```

### 6. Configure environment variables

Copy the example files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

See the [Environment Variables](#environment-variables) section for what each variable means.

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Polygon / Ethereum
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0xYOUR_WALLET_PRIVATE_KEY_HERE
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS

# Server
PORT=4000
BASE_URL=http://localhost:4000

# Authentication
JWT_SECRET=your-random-256-bit-secret-key-here

# Database
MONGO_URI=mongodb://localhost:27017/pharmachain

# External Services
AI_ENGINE_URL=http://localhost:5000

# Hyperledger Fabric (optional — leave blank if not using Fabric)
FABRIC_CONNECTION_PROFILE=./fabric/connection-profile.json
FABRIC_WALLET_PATH=./fabric/wallet
FABRIC_IDENTITY=admin
```

### Frontend (`frontend/.env`)

```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=ws://localhost:4000
```

### AI Engine (`ai-engine/.env`)

```env
AI_ENGINE_PORT=5000
```

---

## Running the System

Open **4 terminals** and run each service:

### Terminal 1 — AI Engine
```bash
cd ai-engine
python app.py
```
AI Engine starts at http://localhost:5000

### Terminal 2 — Backend
```bash
cd backend
npm start
```
Backend API starts at http://localhost:4000

### Terminal 3 — Frontend
```bash
cd frontend
npm start
```
Frontend starts at http://localhost:3000

### Terminal 4 (Optional) — Hyperledger Fabric
```bash
cd fabric
docker-compose up -d
./scripts/startNetwork.sh
```

---

## Deploy Smart Contract

To deploy the contract to Polygon Amoy testnet:

```bash
# Make sure POLYGON_RPC_URL and PRIVATE_KEY are set in root .env
npx hardhat run scripts/deploy.ts --network amoy
```

The contract address will be printed. Copy it into `backend/.env` as `CONTRACT_ADDRESS`.

The ABI is automatically copied to `backend/abi/PharmaSupplyChain.json`.

---

## API Documentation

All authenticated endpoints require: `Authorization: Bearer <JWT>`

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Login with MetaMask wallet signature |
| GET | `/auth/me` | JWT | Get current user wallet + role |

**POST `/auth/login` body:**
```json
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Login to PharmaChain at 1700000000"
}
```
**Response:** `{ "token": "...", "role": "Manufacturer", "expiresIn": 28800 }`

---

### Drugs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/drugs` | Manufacturer | Register new drug on-chain |
| GET | `/api/drugs/:id` | Any | Get drug details (cached 60s) |
| GET | `/api/drugs/:id/history` | Any | Full transfer history |
| GET | `/api/drugs/:id/status` | Any | Current drug status |
| GET | `/api/drugs/:id/gps` | Any | GPS journey path |

---

### Transfer

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/transfer` | Any | Transfer drug with GPS coordinates |

**POST `/api/transfer` body:**
```json
{
  "drugID": "DRUG-001",
  "toAddress": "0x...",
  "lat": 28.6139,
  "lng": 77.2090
}
```

---

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/assignRole` | Admin | Assign role to wallet (0-5) |
| POST | `/admin/recall` | Admin | Recall a drug |

---

### QR & Verification

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/generateQR/:drugID` | Manufacturer | Generate QR code (base64 PNG) |
| GET | `/verify/:drugID` | None | **Public** drug verification |

---

### Fabric

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/fabric/drug/:id` | Manufacturer/Distributor | Private Fabric data |

---

## Smart Contract Functions

```solidity
// Role Management
assignRole(address user, Role role)              // Admin only

// Drug Lifecycle
createDrug(string drugID, string name, string batchNumber, uint256 expiryDate)   // Manufacturer only
transferDrug(string drugID, address newOwner, int256 lat, int256 lng)            // Current owner only
recallDrug(string drugID)                        // Admin only
updateRiskScore(string drugID, uint256 riskScore) // Admin only

// View Functions
getDrug(string drugID)                           // Returns full Drug struct
getDrugStatus(string drugID)                     // Returns 0=Active, 1=Recalled, 2=Expired
getTransferHistory(string drugID)                // Returns TransferEvent[]
getTransferCount(string drugID)                  // Returns uint256
```

**Role Enum Values:**
```
0 = None
1 = Admin
2 = Manufacturer
3 = Distributor
4 = Pharmacy
5 = Consumer
```

---

## AI Risk Scoring

The AI engine runs at `http://localhost:5000`. Send a POST request to `/score`:

```bash
curl -X POST http://localhost:5000/score \
  -H "Content-Type: application/json" \
  -d '{
    "expiryTimestamp": 1800000000,
    "transferCount": 3,
    "transferTimestamps": [1700000000, 1700003600],
    "gpsCoordinates": [{"lat": 28.6, "lng": 77.2}, {"lat": 19.0, "lng": 72.8}],
    "batchRecalled": false,
    "manufacturerReputation": 0.9
  }'
```

**Response:**
```json
{ "score": 0, "category": "Uncolored" }
```

---

## How to Use

### 1. First-time Setup (Admin)

1. Deploy smart contract, note the contract address
2. Start all services
3. Open http://localhost:3000
4. Connect MetaMask, sign login message
5. As Admin, go to Admin Dashboard → Assign Roles to team wallet addresses

### 2. Manufacturer Workflow

1. Login with Manufacturer wallet
2. Register a drug with ID, name, batch, expiry date
3. Generate QR code and download/print it
4. The QR encodes `http://localhost:4000/verify/{drugID}`

### 3. Distributor Workflow

1. Login with Distributor wallet
2. Receive drug from Manufacturer (they transfer to your address)
3. When forwarding to Pharmacy: enter GPS coordinates of your location
4. Transfer drug to Pharmacy wallet

### 4. Pharmacy Workflow

1. Login with Pharmacy wallet
2. Receive drug from Distributor
3. Dispense to consumer by transferring to consumer wallet

### 5. Consumer Verification

1. Scan QR code on drug label using phone camera
2. Opens http://localhost:4000/verify/{drugID} in browser — **no app needed**
3. See: drug name, status (Active/Recalled/Expired), risk score, full transfer history on map
4. If recalled: large red banner appears immediately

### 6. Drug Recall (Admin)

1. Login with Admin wallet
2. Go to Admin Dashboard → Recall Drug → enter Drug ID
3. All WebSocket subscribers instantly see the recall alert
4. Risk score automatically set to 100 (Critical)

---

## Running Tests

### Smart Contract Tests (Hardhat)

```bash
npx hardhat test
```

Expected output: **23 tests passing**

### AI Engine Tests (Python)

```bash
cd ai-engine
pip install hypothesis pytest
python -m pytest test_scorer.py -v
```

### Backend Syntax Check

```bash
cd backend
node --check server.js
node --check routes/auth.js
node --check routes/drugs.js
```

---

## WebSocket Protocol

Connect to `ws://localhost:4000` and send:

```json
{ "type": "subscribe", "drugID": "DRUG-001" }
```

You will receive broadcasts when the drug is transferred:
```json
{
  "type": "transfer",
  "drugID": "DRUG-001",
  "newOwner": "0x...",
  "lat": 28.6139,
  "lng": 77.2090,
  "timestamp": "2025-01-15T10:30:00Z",
  "riskScore": 15,
  "riskCategory": "Low"
}
```

Or recalled:
```json
{ "type": "recall", "drugID": "DRUG-001", "timestamp": "2025-01-15T10:30:00Z" }
```

---

## Troubleshooting

**MetaMask shows wrong network:**
→ Switch MetaMask to Polygon Amoy testnet (Chain ID: 80002)

**Contract call fails with "Unauthorized role":**
→ Admin must call `assignRole` first for your wallet address

**AI engine not responding:**
→ Make sure `python app.py` is running in the `ai-engine/` folder

**MongoDB connection error:**
→ Start MongoDB: `mongod --dbpath ./data/db` or use MongoDB Atlas

**Fabric container not starting:**
→ Make sure Docker Desktop is running before `docker-compose up`

**QR code not scanning:**
→ Allow camera access in browser settings

---

## Team

| Name | Role | Contribution |
|------|------|-------------|
| **Saksham Gupta** | Team Lead & Blockchain Core | Smart contract, backend, AI engine, WebSocket |
| **Sadaf** | Hyperledger Fabric Engineer | Private blockchain, chaincode, Fabric integration |
| **Pratham Gupta** | Frontend Auth & Routing | React Router, AuthContext, LoginPage, Header |
| **Vaishnavi Bajpai** | Frontend Dashboards | Manufacturer, Distributor, Pharmacy, Admin dashboards |
| **Naira Yadav** | Frontend Map & Verification | GPS map, public verify page, QR scanner, WebSocket hook |
| **Riya Sahu** | QA & Documentation | Property-based tests, README, env templates |

---

## GitHub Repositories

- **Main Repo (AI + Blockchain):** https://github.com/saksham0008/pharma-blockchain-ai
- **Pure Blockchain Repo:** https://github.com/saksham0008/drug-authentication-blockchain

---

## License

MIT License — see [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/) — private blockchain framework
- [Polygon](https://polygon.technology/) — public EVM blockchain
- [OpenStreetMap](https://openstreetmap.org/) — map tiles for Leaflet.js
- [WHO](https://www.who.int/) — pharmaceutical counterfeiting statistics

---

*Built as a Final Year B.Tech Project — 2024-2025*
