# Design Document — Pharma Blockchain AI

## Overview

The Pharma Blockchain AI platform is a drug authentication and anti-counterfeit system for pharmaceutical supply chains. It extends an existing working prototype by adding GPS-tracked custody transfers, AI-driven risk scoring, role-based dashboards, real-time WebSocket updates, Hyperledger Fabric private data storage, and JWT-based wallet authentication.

The system uses a **dual-blockchain architecture**:
- **Polygon Amoy testnet** — public, tamper-proof audit trail (drug identity, transfer history, risk scores, recall status)
- **Hyperledger Fabric local network** — private data channel for sensitive business information (pricing, batch notes, invoices)

An **AI Risk Engine** (Python Flask microservice) evaluates five additive signals and writes scores on-chain after every transfer. QR codes allow anyone — supply chain actors or consumers — to verify a drug's full chain-of-custody and current risk status by scanning a label.

---

## Architecture

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │             React SPA  (Vite / CRA, port 3000)                     │    │
│   │  Role-Based Dashboards │ Leaflet Map │ QR Scanner │ WebSocket       │    │
│   └─────────────────────────────────┬──────────────────────────────────┘    │
└─────────────────────────────────────┼────────────────────────────────────────┘
                                      │ HTTP / WebSocket
┌─────────────────────────────────────▼────────────────────────────────────────┐
│                           BACKEND LAYER  (Node.js / Express, port 4000)      │
│                                                                              │
│  routes/          middleware/        services/                               │
│  ├─ auth.js       ├─ auth.js         ├─ contractService.js                   │
│  ├─ drugs.js      └─ validate.js     ├─ fabricService.js                     │
│  ├─ transfer.js                      ├─ aiService.js                         │
│  ├─ fabric.js                        ├─ cacheService.js                      │
│  ├─ admin.js                         └─ wsService.js                         │
│  └─ qr.js                                                                    │
│                                                                              │
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │  MongoDB     │  │  ethers.js v6   │  │  ws / socket.io             │    │
│  │  (off-chain) │  │  (Polygon RPC)  │  │  (WebSocket server)         │    │
│  └──────────────┘  └─────────────────┘  └─────────────────────────────┘    │
└──────┬──────────────────────┬──────────────────────┬─────────────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐
│  AI Engine  │  │  Polygon Amoy Testnet  │  │  Hyperledger Fabric      │
│  Python     │  │  PharmaSupplyChain.sol │  │  Local Test-Network      │
│  Flask :5000│  │  (public audit chain)  │  │  (private data channel)  │
└─────────────┘  └────────────────────────┘  └──────────────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND COMPONENTS                          │
│                                                                      │
│  <App>                                                               │
│   ├─ <AuthContext>         (wallet, role, JWT state)                 │
│   ├─ <Header>              (wallet address, role badge, logout)      │
│   ├─ <Router>                                                        │
│   │   ├─ /login            <LoginPage>                               │
│   │   ├─ /manufacturer/*   <ManufacturerDashboard>                   │
│   │   │   ├─ <DrugRegistrationForm>                                  │
│   │   │   ├─ <DrugList>                                              │
│   │   │   └─ <QRGenerator>                                           │
│   │   ├─ /distributor/*    <DistributorDashboard>                    │
│   │   │   ├─ <OwnedDrugs>                                            │
│   │   │   └─ <TransferForm>  (with GPS input)                        │
│   │   ├─ /pharmacy/*       <PharmacyDashboard>                       │
│   │   │   ├─ <OwnedDrugs>                                            │
│   │   │   └─ <DispenseForm>                                          │
│   │   ├─ /verify/:drugID   <PublicVerifyPage>  (no auth)             │
│   │   │   ├─ <DrugInfoCard>                                          │
│   │   │   ├─ <RiskBadge>                                             │
│   │   │   ├─ <RecallBanner>                                          │
│   │   │   ├─ <TransferTimeline>                                      │
│   │   │   └─ <GPSMapView>   (Leaflet.js)                             │
│   │   └─ /admin/*          <AdminDashboard>                          │
│   │       ├─ <RoleAssigner>                                          │
│   │       └─ <RecallManager>                                         │
│   └─ <QRScannerModal>      (html5-qrcode)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: Drug Registration

```
Manufacturer UI
    │  POST /api/drugs  {drugID, name, batch, expiry, manufacturerName, contactEmail}
    ▼
Backend (drugs.js route)
    │  1. Verify JWT (Manufacturer role)
    │  2. Validate ExpiryTimestamp > now
    ├─► contractService.createDrug(drugID, name, batch, expiry)
    │       │  tx.wait()  →  DrugCreated event
    │       ▼
    │   Polygon Amoy  ──►  PharmaSupplyChain.createDrug()
    │
    ├─► MongoDB.users.insert({drugID, manufacturerName, contactEmail, timestamp})
    │
    └─► fabricService.createPrivateDrug(drugID, cost, batchNotes, invoice)
            │  Hyperledger Fabric chaincode
            └─► Private_Collection (Manufacturer + Distributor orgs only)
```

### Flow 2: Drug Transfer with AI Scoring

```
Owner UI
    │  POST /api/transfer  {drugID, toAddress, lat, lng}  +  JWT
    ▼
Backend (transfer.js route)
    │  1. Verify JWT ownership
    │  2. Validate GPS: -90≤lat≤90, -180≤lng≤180  → 400 if invalid
    ├─► contractService.transferDrug(drugID, toAddress, lat*1e6, lng*1e6)
    │       │  tx.wait()  →  DrugTransferred event
    │       ▼
    │   Polygon Amoy  ──►  TransferHistory.push(TransferEvent)
    │
    ├─► MongoDB.gpsLogs.insert({drugID, lat, lng, role, timestamp})
    ├─► MongoDB.drugCache.deleteOne({drugID})   ← cache invalidation
    │
    ├─► aiService.score({drugID, expiry, transfers, timestamps, coords, batch})
    │       │  POST http://AI_ENGINE_URL/score
    │       ▼
    │   AI Engine (Flask)
    │       │  returns {score, category}
    │       ▼
    ├─► contractService.updateRiskScore(drugID, score)
    │       │  retry: exponential backoff (2s, 4s, 8s, max 3 retries)
    │       ▼
    │   Polygon Amoy  ──►  RiskScoreUpdated event
    │
    └─► wsService.broadcast(drugID, {newOwner, lat, lng, timestamp, score})
            │
            └─► All WebSocket subscribers of drugID
```

### Flow 3: QR Scan Verification

```
Consumer (phone camera)
    │  Scans QR → decodes URL: {BASE_URL}/verify/{drugID}
    ▼
Browser
    │  GET /verify/{drugID}  (no auth required)
    ▼
Backend (qr.js route)
    ├─► cacheService.get(drugID)
    │   ├─ HIT (TTL < 60s): return cached drug data
    │   └─ MISS:
    │       ├─► contractService.getDrug(drugID)
    │       ├─► contractService.getDrugStatus(drugID)
    │       ├─► contractService.getTransferHistory(drugID)
    │       ├─► MongoDB.gpsLogs.find({drugID})
    │       └─► cacheService.set(drugID, data, TTL=60s)
    │
    └─► Response: {drugName, batch, manufacturer, expiry, status, riskScore,
                   riskCategory, recallBanner, transferHistory, gpsPath}
```

### Flow 4: Drug Recall

```
Admin UI
    │  POST /api/admin/recall  {drugID}  +  Admin JWT
    ▼
Backend (admin.js route)
    │  1. Verify Admin JWT
    ├─► contractService.recallDrug(drugID)
    │       │  tx.wait()  →  DrugRecalled event
    │       ▼
    │   Polygon Amoy  ──►  drug.status = Recalled
    │
    ├─► aiService.score({...recallFlag: true})
    │       │  Returns score=100, category=Critical
    │       ▼
    ├─► contractService.updateRiskScore(drugID, 100)
    ├─► MongoDB.drugCache.deleteOne({drugID})
    │
    └─► wsService.broadcast(drugID, {type: "RECALL", drugID, timestamp})
```

---

## Smart Contract Architecture

### Extended `PharmaSupplyChain.sol` — Function Signatures

The existing contract is extended with TransferHistory, DrugStatus enum, recall capability, and a RoleAssigned event.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PharmaSupplyChain {

    // ── Enums ──────────────────────────────────────────────────────────
    enum Role       { None, Admin, Manufacturer, Distributor, Pharmacy, Consumer }
    enum DrugStatus { Active, Recalled, Expired }

    // ── Structs ────────────────────────────────────────────────────────
    struct TransferEvent {
        address from;
        address to;
        int256  lat;        // latitude  * 1e6 (fixed-point, range ±90,000,000)
        int256  lng;        // longitude * 1e6 (fixed-point, range ±180,000,000)
        uint256 timestamp;  // block.timestamp at time of transfer
        uint256 index;      // auto-incrementing sequence (0 = first transfer)
    }

    struct Drug {
        string        drugID;
        string        name;
        string        batchNumber;
        uint256       expiryDate;      // Unix epoch seconds
        address       currentOwner;
        uint256       riskScore;       // 0–100
        bool          exists;
        bool          recalled;
        TransferEvent[] transferHistory;
    }

    // ── State ──────────────────────────────────────────────────────────
    mapping(string  => Drug)    private drugs;
    mapping(address => Role)    public  roles;
    address public admin;

    // ── Events ────────────────────────────────────────────────────────
    event DrugCreated       (string drugID, address manufacturer);
    event DrugTransferred   (string drugID, address from, address to,
                             int256 lat, int256 lng, uint256 timestamp);
    event RiskScoreUpdated  (string drugID, uint256 riskScore);
    event DrugRecalled      (string drugID, uint256 timestamp);
    event RoleAssigned      (address indexed user, Role role);

    // ── Modifiers ─────────────────────────────────────────────────────
    modifier onlyAdmin()
    modifier onlyRole(Role role)

    // ── Role Management ───────────────────────────────────────────────
    function assignRole(address user, Role role) external onlyAdmin

    // ── Drug Lifecycle ────────────────────────────────────────────────
    function createDrug(
        string memory _drugID,
        string memory _name,
        string memory _batchNumber,
        uint256       _expiryDate
    ) external onlyRole(Role.Manufacturer)

    function transferDrug(
        string memory _drugID,
        address       _newOwner,
        int256        _lat,
        int256        _lng
    ) external

    function recallDrug(string memory _drugID) external onlyAdmin

    function updateRiskScore(
        string memory _drugID,
        uint256       _riskScore
    ) external onlyAdmin

    // ── View Functions ────────────────────────────────────────────────
    function getDrug(string memory _drugID)
        external view returns (
            string memory drugID,
            string memory name,
            string memory batchNumber,
            uint256       expiryDate,
            address       currentOwner,
            uint256       riskScore,
            bool          exists,
            bool          recalled
        )

    function getDrugStatus(string memory _drugID)
        external view returns (DrugStatus)

    function getTransferHistory(string memory _drugID)
        external view returns (TransferEvent[] memory)

    function getTransferCount(string memory _drugID)
        external view returns (uint256)
}
```

**Key design decisions:**
- GPS coordinates stored as `int256` fixed-point (×1e6) to avoid floating-point in Solidity. The backend converts `lat/lng` floats to integers before calling the contract and converts back when reading.
- `transferHistory` is a dynamic array inside the Drug struct; entries are pushed, never modified or deleted.
- `getDrugStatus` computes `Expired` dynamically from `block.timestamp` — no cron job needed.
- `Admin` is added to the `Role` enum (previously only `msg.sender == admin` was tracked) to allow `assignRole` to set admin-tier wallets and emit `RoleAssigned`.

---

## Components and Interfaces

### Backend Module Structure

```
backend/
├── server.js                  ← Express app factory + server start
├── routes/
│   ├── auth.js                ← POST /auth/login, POST /auth/verify
│   ├── drugs.js               ← POST /drugs, GET /drugs/:id, GET /drugs/:id/history
│   ├── transfer.js            ← POST /transfer
│   ├── qr.js                  ← GET /generateQR/:drugID, GET /verify/:drugID
│   ├── fabric.js              ← GET /fabric/drug/:id
│   └── admin.js               ← POST /admin/recall, POST /admin/assignRole
├── middleware/
│   ├── auth.js                ← JWT verification, role guard factory
│   └── validate.js            ← GPS bounds check, request body validators
├── services/
│   ├── contractService.js     ← ethers.js wrapper for all on-chain calls
│   ├── fabricService.js       ← Fabric SDK wrapper for chaincode calls
│   ├── aiService.js           ← axios calls to AI Engine + retry logic
│   ├── cacheService.js        ← MongoDB TTL cache (60s), invalidation
│   └── wsService.js           ← ws server, subscribe map, broadcast
├── models/
│   ├── User.js                ← Mongoose schema: users collection
│   ├── GpsLog.js              ← Mongoose schema: gpsLogs collection
│   ├── AiScoreLog.js          ← Mongoose schema: aiScoreLogs collection
│   └── DrugCache.js           ← Mongoose schema: drugCache collection
├── abi/
│   └── PharmaSupplyChain.json ← Contract ABI (copied from Hardhat artifacts)
└── .env                       ← All environment variables
```

### AI Engine (Python Flask) Structure

```
ai-engine/
├── app.py                     ← Flask app, /score endpoint
├── scorer.py                  ← Pure scoring logic (5 additive rules)
├── requirements.txt           ← flask, geopy (Haversine distance)
└── .env                       ← AI_ENGINE_PORT
```

### Hyperledger Fabric Structure

```
fabric/
├── docker-compose.yaml        ← peer, orderer, ca, couchdb services
├── configtx.yaml              ← channel and org configuration
├── crypto-config/             ← generated MSP certificates
├── channel-artifacts/         ← genesis block, channel tx
├── chaincode/
│   └── pharma/
│       ├── index.js           ← chaincode entry point
│       ├── pharmaContract.js  ← PharmaContract class
│       └── package.json
└── scripts/
    ├── startNetwork.sh        ← starts Docker Compose + creates channel
    └── deployChaincode.sh     ← packages and installs chaincode
```

---

## Data Models

### MongoDB Collections

#### `users` — supply chain actor metadata

```js
{
  _id:              ObjectId,
  walletAddress:    String,    // Ethereum address (lowercase), indexed unique
  role:             String,    // "Manufacturer" | "Distributor" | "Pharmacy" | "Admin" | "Consumer"
  displayName:      String,    // human-readable name
  contactEmail:     String,
  createdAt:        Date,
  updatedAt:        Date
}
```

#### `drugCache` — TTL cache of on-chain drug data

```js
{
  _id:              ObjectId,
  drugID:           String,    // indexed unique
  data:             Object,    // full getDrug response + status + history
  cachedAt:         Date,      // TTL index: expires after 60 seconds
  expiresAt:        Date       // cachedAt + 60 seconds; MongoDB TTL index on this field
}
```

#### `gpsLogs` — GPS coordinates per transfer

```js
{
  _id:              ObjectId,
  drugID:           String,    // indexed
  transferIndex:    Number,    // matches TransferEvent.index on-chain
  lat:              Number,    // decimal degrees
  lng:              Number,    // decimal degrees
  actorAddress:     String,    // the "from" wallet of the transfer
  actorRole:        String,
  locationName:     String,    // reverse-geocoded (may be null)
  timestamp:        Date,      // block timestamp
  createdAt:        Date
}
```

#### `aiScoreLogs` — AI scoring audit trail

```js
{
  _id:              ObjectId,
  drugID:           String,    // indexed
  inputs: {
    expiryTimestamp:  Number,
    transferCount:    Number,
    transferTimestamps: [Number],
    gpsCoordinates:   [{lat: Number, lng: Number}],
    batchRecalled:    Boolean,
    manufacturerReputation: Number
  },
  score:            Number,    // 0–100
  category:         String,    // "Low" | "Medium" | "High" | "Critical" | "Uncolored"
  scoredAt:         Date,
  triggeredBy:      String     // "transfer" | "recall" | "manual"
}
```

### On-Chain Data Model (Solidity)

As defined in the smart contract section — `Drug` struct with embedded `TransferEvent[]` array. GPS coordinates stored as `int256` fixed-point ×1e6.

### Hyperledger Fabric Private Data

**Public ledger** (world state — all orgs):
```json
{
  "drugID":       "string",
  "publicHash":   "string",
  "syncedToPolygon": true,
  "lastSyncedAt": "ISO8601"
}
```

**Private collection** (`PharmaPrivateCollection` — Manufacturer + Distributor only):
```json
{
  "drugID":              "string",
  "unitCost":            "number",
  "batchProductionNotes":"string",
  "supplierInvoiceRef":  "string",
  "createdBy":           "MSP identity",
  "createdAt":           "ISO8601"
}
```

---

## API Endpoint List

All authenticated endpoints require `Authorization: Bearer <JWT>` header. Role requirements are noted per endpoint.

### Auth Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | None | Wallet login: verify on-chain role → verify signature → issue JWT |
| GET  | `/auth/me` | JWT (any role) | Returns decoded wallet address and role |

**POST `/auth/login` request:**
```json
{ "walletAddress": "0x...", "signature": "0x...", "message": "Login to PharmaChain at <timestamp>" }
```
**Response 200:** `{ "token": "<JWT>", "role": "Manufacturer", "expiresIn": 28800 }`
**Response 403:** Wallet has no on-chain role.
**Response 401:** Signature invalid or JWT issuance failure.

---

### Drug Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/drugs` | JWT (Manufacturer) | Register new drug on-chain + store metadata in MongoDB |
| GET  | `/api/drugs/:id` | JWT (any) | Get drug details (cached, 60s TTL) |
| GET  | `/api/drugs/:id/history` | JWT (any) | Get full transfer history with formatted events |
| GET  | `/api/drugs/:id/status` | JWT (any) | Get current DrugStatus enum value |

**POST `/api/drugs` request:**
```json
{
  "drugID": "DRUG-001", "name": "Paracetamol 500mg", "batchNumber": "BATCH-2025-A",
  "expiryTimestamp": 1800000000, "manufacturerName": "PharmaCo", "contactEmail": "mfg@pharmaco.com"
}
```
**Response 201:** `{ "success": true, "txHash": "0x...", "drugID": "DRUG-001" }`

**GET `/api/drugs/:id/history` response:**
```json
{
  "drugID": "DRUG-001",
  "status": "Active",
  "riskScore": 15,
  "riskCategory": "Low",
  "recallNotice": null,
  "transferHistory": [
    {
      "index": 0, "from": "0xManufacturer", "fromRole": "Manufacturer",
      "to": "0xDistributor", "toRole": "Distributor",
      "timestamp": "2025-01-15T10:30:00Z",
      "lat": 28.6139, "lng": 77.2090, "locationName": "New Delhi, India"
    }
  ]
}
```

---

### Transfer Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/transfer` | JWT (Manufacturer/Distributor/Pharmacy) | Record drug transfer with GPS |

**POST `/api/transfer` request:**
```json
{ "drugID": "DRUG-001", "toAddress": "0x...", "lat": 28.6139, "lng": 77.2090 }
```
**Response 200:** `{ "success": true, "txHash": "0x...", "newRiskScore": 15, "riskCategory": "Low" }`
**Response 400:** GPS coordinates out of range.

---

### QR Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/generateQR/:drugID` | JWT (Manufacturer) | Generate QR code as base64 PNG data URL |
| GET | `/verify/:drugID` | None | Public verification page (HTML or JSON) |

**GET `/verify/:drugID` response (JSON, Accept: application/json):**
```json
{
  "drugID": "DRUG-001", "name": "Paracetamol 500mg", "batchNumber": "BATCH-2025-A",
  "manufacturer": "PharmaCo", "expiryDate": "2027-01-01",
  "status": "Active", "riskScore": 15, "riskCategory": "Low",
  "recallNotice": null,
  "transferHistory": [...], "gpsPath": [...]
}
```

---

### Fabric Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/fabric/drug/:id` | JWT (Manufacturer or Distributor) | Full Hyperledger record including private fields |

---

### Admin Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/recall` | JWT (Admin) | Recall a drug by DrugID or BatchNumber |
| POST | `/admin/assignRole` | JWT (Admin) | Assign on-chain role to a wallet address |

**POST `/admin/recall` request:**
```json
{ "drugID": "DRUG-001" }
```
or
```json
{ "batchNumber": "BATCH-2025-A" }
```

---

### GPS Tracking Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/drugs/:id/gps` | JWT (any) | Ordered GPS log entries for map rendering |

---

## WebSocket Design

The WebSocket server runs on the same port as the HTTP API (sharing the `http.Server` instance). The `ws` library is used.

### Message Protocol

**Client → Server: Subscribe**
```json
{ "type": "subscribe", "drugID": "DRUG-001" }
```

**Client → Server: Unsubscribe**
```json
{ "type": "unsubscribe", "drugID": "DRUG-001" }
```

**Server → Client: Transfer Update**
```json
{
  "type": "transfer",
  "drugID": "DRUG-001",
  "newOwner": "0x...",
  "lat": 28.6139,
  "lng": 77.2090,
  "timestamp": "2025-01-15T10:30:00Z",
  "riskScore": 22,
  "riskCategory": "Low"
}
```

**Server → Client: Recall Alert**
```json
{
  "type": "recall",
  "drugID": "DRUG-001",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Subscription Map

`wsService.js` maintains an in-memory `Map<drugID, Set<WebSocket>>`. On disconnect, the client socket is removed from all subscription sets. Subscriptions are keyed by drugID — a single client can subscribe to multiple drugs.

**Polling fallback:** If `WebSocket` is not available in the browser, the frontend falls back to polling `GET /api/drugs/:id/history` every 10 seconds using `setInterval`.

---

## AI Engine Design

### Scoring Rules (Python Flask `/score` endpoint)

The AI Engine is a pure-function scoring service. All five rules are **additive** and capped at 100.

```python
# scorer.py — rule-based additive scoring

from geopy.distance import geodesic
import time

RULES = {
    "expiry_30d":    20,
    "expiry_90d":    10,
    "transfer_count": 15,
    "time_jump":     20,
    "location_jump": 25,
    "batch_recall":  30,
}

def compute_risk_score(inputs: dict) -> dict:
    """
    inputs = {
      "expiryTimestamp":        int,       # Unix epoch seconds
      "transferCount":          int,
      "transferTimestamps":     [int],     # ordered list, Unix seconds
      "gpsCoordinates":         [{lat, lng}],  # ordered, same length as transferTimestamps
      "batchRecalled":          bool,
      "manufacturerReputation": float      # 0.0–1.0 (reserved, not used in scoring yet)
    }
    """
    score = 0
    now = int(time.time())
    seconds_to_expiry = inputs["expiryTimestamp"] - now

    # Rule 1: Expiry proximity
    if seconds_to_expiry <= 30 * 86400:
        score += RULES["expiry_30d"]
    elif seconds_to_expiry <= 90 * 86400:
        score += RULES["expiry_90d"]

    # Rule 2: Transfer count anomaly
    if inputs["transferCount"] > 10:
        score += RULES["transfer_count"]

    # Rule 3: Transfer time anomaly (any two consecutive < 60 seconds apart)
    ts = inputs["transferTimestamps"]
    if any(ts[i+1] - ts[i] < 60 for i in range(len(ts)-1)):
        score += RULES["time_jump"]

    # Rule 4: Location jump anomaly (speed > 1000 km/h between consecutive GPS points)
    coords = inputs["gpsCoordinates"]
    for i in range(len(coords)-1):
        if len(ts) > i+1 and ts[i+1] != ts[i]:
            dist_km = geodesic(
                (coords[i]["lat"], coords[i]["lng"]),
                (coords[i+1]["lat"], coords[i+1]["lng"])
            ).km
            hours = (ts[i+1] - ts[i]) / 3600.0
            if hours > 0 and dist_km / hours > 1000:
                score += RULES["location_jump"]
                break

    # Rule 5: Batch recall history
    if inputs["batchRecalled"]:
        score += RULES["batch_recall"]

    score = min(score, 100)

    if score == 0:     category = "Uncolored"
    elif score <= 24:  category = "Low"
    elif score <= 49:  category = "Medium"
    elif score <= 74:  category = "High"
    else:              category = "Critical"

    return {"score": score, "category": category}
```

**POST `/score` request body:**
```json
{
  "expiryTimestamp": 1800000000,
  "transferCount": 3,
  "transferTimestamps": [1700000000, 1700003600, 1700007200],
  "gpsCoordinates": [{"lat": 28.6, "lng": 77.2}, {"lat": 19.0, "lng": 72.8}, {"lat": 12.9, "lng": 77.5}],
  "batchRecalled": false,
  "manufacturerReputation": 0.9
}
```
**Response 200:** `{ "score": 0, "category": "Uncolored" }`

---

## Auth Flow

### Wallet Signature Authentication

```
Client                              Backend
  │                                    │
  │── GET /auth/challenge ──────────►  │  (optional: server-issued nonce)
  │◄────── { message: "Login to        │
  │          PharmaChain at 1700000" } │
  │                                    │
  │  wallet.signMessage(message)       │
  │── POST /auth/login ────────────►  │
  │   { walletAddress, signature,      │
  │     message }                      │
  │                                    │
  │                    1. Check roles[walletAddress] on-chain
  │                       ├─ None → 403 (no role assigned)
  │                       └─ role found → continue
  │                    2. ethers.verifyMessage(message, signature)
  │                       ├─ recovered != walletAddress → 401
  │                       └─ match → issue JWT
  │                    3. jwt.sign({walletAddress, role}, JWT_SECRET,
  │                                {expiresIn: "8h"})
  │◄── 200 { token, role, expiresIn } ─│
```

**JWT Payload:**
```json
{ "walletAddress": "0x...", "role": "Manufacturer", "iat": 1700000000, "exp": 1700028800 }
```

The challenge message includes a current Unix timestamp. The backend accepts messages issued within the last 5 minutes to prevent replay attacks.

---

## Frontend Component Tree and Routing

```
src/
├── index.js                      ← ReactDOM.createRoot
├── App.js                        ← Router + AuthContext + ThemeContext
├── contexts/
│   ├── AuthContext.js            ← { wallet, role, token, login, logout }
│   └── ThemeContext.js           ← { darkMode, toggleDarkMode }
├── components/
│   ├── Header.jsx                ← logo, wallet address, role badge, logout, theme toggle
│   ├── ProtectedRoute.jsx        ← redirects to /login if no valid JWT
│   ├── RiskBadge.jsx             ← color-coded score display (pure component)
│   ├── RecallBanner.jsx          ← prominent recall warning banner
│   ├── TransferTimeline.jsx      ← ordered list of transfer steps
│   ├── GPSMapView.jsx            ← Leaflet map + polyline + markers
│   ├── QRGenerator.jsx           ← display + download QR image
│   ├── QRScannerModal.jsx        ← html5-qrcode scanner overlay
│   └── LoadingSpinner.jsx        ← spinner / skeleton state
├── pages/
│   ├── LoginPage.jsx             ← MetaMask connect + sign + login
│   ├── ManufacturerDashboard.jsx ← drug list + register + QR + history
│   ├── DistributorDashboard.jsx  ← owned drugs + transfer form (GPS)
│   ├── PharmacyDashboard.jsx     ← held drugs + dispense form
│   ├── AdminDashboard.jsx        ← role assigner + recall manager
│   └── PublicVerifyPage.jsx      ← /verify/:drugID — no auth required
├── services/
│   └── api.js                    ← Axios instance (baseURL = REACT_APP_API_URL)
├── hooks/
│   ├── useWebSocket.js           ← subscribe/unsubscribe, fallback polling
│   └── useDrug.js                ← fetch + cache drug data
└── App.css                       ← global styles (dark/light theme vars)
```

**React Router routes:**
```
/login                    → <LoginPage>
/manufacturer             → <ProtectedRoute role="Manufacturer"> <ManufacturerDashboard>
/distributor              → <ProtectedRoute role="Distributor">  <DistributorDashboard>
/pharmacy                 → <ProtectedRoute role="Pharmacy">     <PharmacyDashboard>
/admin                    → <ProtectedRoute role="Admin">        <AdminDashboard>
/verify/:drugID           → <PublicVerifyPage>  (no ProtectedRoute)
*                         → redirect to /login
```

---

## Hyperledger Fabric Chaincode

### Chaincode Contract (`pharmaContract.js`)

```javascript
// fabric/chaincode/pharma/pharmaContract.js
const { Contract } = require('fabric-contract-api');

const PRIVATE_COLLECTION = 'PharmaPrivateCollection';

class PharmaContract extends Contract {

    // ── Invokes (write, requires org MSP) ─────────────────────────────

    async CreateDrugPrivate(ctx, drugID) {
        // Reads transient data for private fields:
        // { unitCost, batchProductionNotes, supplierInvoiceRef }
        // Writes public ledger entry + private collection entry
    }

    async StorePrivateData(ctx, drugID) {
        // Allows Manufacturer or Distributor to update private fields
        // Reads transient data for updated private fields
    }

    async SyncToPolygon(ctx, drugID, eventType) {
        // Emits a Sync_Event that the backend relays to Polygon
        // eventType: "CREATED" | "TRANSFERRED"
        // Sets syncedToPolygon: false — backend confirms with true after relay
    }

    // ── Queries (read-only) ───────────────────────────────────────────

    async GetDrug(ctx, drugID) {
        // Returns public ledger entry
    }

    async GetDrugPrivate(ctx, drugID) {
        // Returns private collection entry
        // Fails with ACCESS_DENIED for Pharmacy MSP
    }

    async GetDrugHistory(ctx, drugID) {
        // Returns full CouchDB history for the drug key
    }
}
```

### Docker Compose Layout (`fabric/docker-compose.yaml`)

```
Services:
  orderer.example.com     ← Solo orderer (dev mode)
  peer0.org1.example.com  ← Manufacturer org peer
  peer0.org2.example.com  ← Distributor org peer
  peer0.org3.example.com  ← Pharmacy org peer (read-only to private collection)
  ca.org1.example.com     ← CA for Manufacturer org
  ca.org2.example.com     ← CA for Distributor org
  couchdb0                ← State database for peer0.org1
  couchdb1                ← State database for peer0.org2
  cli                     ← Fabric CLI container for setup scripts
```

The `PharmaPrivateCollection` is configured in `collections_config.json` with `memberOrgsPolicy` set to `OR('Org1MSP.member', 'Org2MSP.member')` — excluding Org3 (Pharmacy).

---

## Environment Configuration

All configuration is externalized via environment variables. No secrets or URLs are hardcoded in source.

### Backend `.env`

```dotenv
# Polygon / Ethereum
RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0x...                  # Admin wallet private key
CONTRACT_ADDRESS=0x...

# Server
PORT=4000
BASE_URL=http://localhost:4000

# Auth
JWT_SECRET=<random-256-bit-hex>

# Database
MONGO_URI=mongodb://localhost:27017/pharmachain

# External Services
AI_ENGINE_URL=http://localhost:5000
FABRIC_CONNECTION_PROFILE=./fabric/connection-profile.json
FABRIC_WALLET_PATH=./fabric/wallet

# WebSocket (optional override; defaults to same port as HTTP)
WS_PORT=4000
```

### Frontend `.env`

```dotenv
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=ws://localhost:4000
```

### AI Engine `.env`

```dotenv
AI_ENGINE_PORT=5000
```

---

## Deployment Architecture

### Local Development

```
┌─────────────────────────────────────────────────────────────────┐
│                     Developer Machine                            │
│                                                                  │
│  npm start (frontend :3000)  ←── REACT_APP_API_URL=:4000        │
│                                                                  │
│  npm start (backend :4000)   ←── .env                           │
│      │                                                           │
│      ├─ ethers.js ──────────────── Polygon Amoy (remote RPC)    │
│      ├─ Axios ─────────────────── AI Engine :5000               │
│      ├─ Fabric SDK ─────────────── Docker Compose (Fabric)      │
│      └─ Mongoose ──────────────── MongoDB :27017                │
│                                                                  │
│  python app.py (ai-engine :5000)                                 │
│                                                                  │
│  docker-compose up (fabric/ → orderer, peers, CAs, CouchDB)     │
│                                                                  │
│  mongod (MongoDB :27017)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Hardhat deploy
                              ▼
                    Polygon Amoy Testnet
               PharmaSupplyChain.sol (deployed once)
```

### Startup Commands

```bash
# 1. Deploy smart contract (once)
cd pharma-blockchain-ai
npx hardhat run scripts/deploy.ts --network amoy

# 2. Start Hyperledger Fabric network
cd fabric
docker-compose up -d
./scripts/startNetwork.sh
./scripts/deployChaincode.sh

# 3. Start MongoDB (if not running)
mongod --dbpath ./data/db

# 4. Start AI Engine
cd ai-engine
python app.py

# 5. Start Backend
cd backend
npm start

# 6. Start Frontend
cd frontend
npm start
```

---

## Error Handling

### Smart Contract Reverts

All revert strings are human-readable. The backend surfaces `error.reason` from ethers.js to the frontend in JSON error responses. The frontend displays them using the `<ErrorToast>` component.

| Condition | Revert Message |
|-----------|----------------|
| DrugID already exists | `"Drug already exists"` |
| Caller not Manufacturer | `"Unauthorized role"` |
| Expiry in the past | `"Expiry must be future date"` |
| Drug not found | `"Drug not found"` |
| Caller not current owner | `"Not owner"` |
| Caller not Admin | `"Only admin allowed"` |
| Risk score out of range | `"Risk score out of range"` |

### Backend Error Responses

All errors follow a consistent JSON shape:
```json
{ "error": "<human-readable message>", "code": "<ERROR_CODE>", "details": {} }
```

HTTP status codes:
- `400` — validation errors (invalid GPS, missing fields, expiry in past)
- `401` — JWT invalid or expired
- `403` — no on-chain role for wallet address
- `404` — drug not found
- `500` — unexpected internal error (blockchain call failure, DB failure)

### AI Engine Unavailability

When `AI_ENGINE_URL` is unreachable:
1. `aiService.js` catches the connection error
2. Last known `riskScore` is retrieved from `MongoDB.drugCache` or on-chain
3. Transfer completes successfully with the preserved score
4. A `{ level: "warn", event: "ai_engine_unavailable", drugID }` log entry is written

### Blockchain Call Retry

`contractService.js` wraps `updateRiskScore` calls in a retry helper:
```
attempt 1 → fails → wait 2s
attempt 2 → fails → wait 4s
attempt 3 → fails → wait 8s
attempt 4 → fails → log error and give up (score update deferred)
```

### WebSocket Errors

- If a WebSocket message cannot be parsed as JSON, the server logs the error and closes the connection with code `1008` (policy violation).
- If `broadcast()` fails for an individual subscriber (socket closed mid-write), that subscriber is silently removed from the subscription map.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The prework analysis classified all 16 requirements' acceptance criteria. Properties were identified, redundancies eliminated, and the final set below represents unique, non-overlapping correctness invariants. The feature involves pure business logic functions (GPS validation, scoring, caching, JWT issuance, smart contract state transitions) that are well-suited to property-based testing with a library such as **fast-check** (Node.js/TypeScript) or **Hypothesis** (Python).

**Property Reflection — Redundancy Elimination:**
- Criteria 1.1 (registration round-trip) and 1.4 (initial field values) are combined into a single round-trip property.
- Criteria 3.1 / 3.4 / 3.5 (transfer round-trip, event fields, history growth) are consolidated into one transfer round-trip property.
- Criteria 4.3 / 3.6 (append-only immutability and ordering) are merged into the immutability property.
- Criteria 7.1 and 7.2 (QR URL identity) are identical — kept as one property.
- Criteria 2.6 and 10.5 (expired/invalid JWT → 401) are consolidated into one auth property.
- Criteria 5.1 and the expiry portion of getDrugStatus are the same property.

---

### Property 1: Drug Registration Round-Trip

*For any* valid combination of unique DrugID, name, BatchNumber, and future ExpiryTimestamp submitted to `createDrug` by a Manufacturer wallet, calling `getDrug` with that DrugID SHALL return a record where `drugID`, `name`, `batchNumber`, and `expiryDate` exactly match the submitted values, `currentOwner` equals the Manufacturer's wallet address, `riskScore` equals 0, and `exists` is true.

**Validates: Requirements 1.1, 1.4**

---

### Property 2: Duplicate Drug Registration Is Always Rejected

*For any* DrugID that has already been successfully registered on-chain, any subsequent call to `createDrug` with that same DrugID SHALL revert, regardless of the other parameters supplied.

**Validates: Requirements 1.2**

---

### Property 3: Unauthorized Role Always Reverts createDrug

*For any* wallet address whose on-chain role is not Manufacturer, calling `createDrug` SHALL always revert with an unauthorized role error.

**Validates: Requirements 1.3**

---

### Property 4: Past Expiry Timestamp Is Always Rejected

*For any* ExpiryTimestamp value that is less than or equal to `block.timestamp` at the time of the transaction, `createDrug` SHALL revert, and no Drug record SHALL be created.

**Validates: Requirements 1.6**

---

### Property 5: Role Assignment Round-Trip

*For any* wallet address and any valid Role enum value assigned by the Admin via `assignRole`, the `roles` mapping for that address SHALL immediately return the assigned role, and a `RoleAssigned` event SHALL have been emitted with the matching address and role.

**Validates: Requirements 2.2**

---

### Property 6: Non-Admin Cannot Assign Roles

*For any* wallet address whose on-chain role is not Admin, calling `assignRole` SHALL always revert.

**Validates: Requirements 2.3**

---

### Property 7: JWT Role Claim Matches On-Chain Role

*For any* wallet address that has been assigned a role on-chain, after a successful login (valid wallet signature and valid message), the issued JWT's `role` claim SHALL exactly match the role returned by the smart contract for that address.

**Validates: Requirements 2.4, 10.1**

---

### Property 8: Invalid or Expired JWT Always Returns 401

*For any* string that is not a currently valid, unexpired JWT signed with `JWT_SECRET`, submitting it as a Bearer token to any JWT-protected endpoint SHALL result in an HTTP 401 response.

**Validates: Requirements 2.6, 10.5**

---

### Property 9: Transfer Round-Trip — Owner Update and History Growth

*For any* drug with a transfer history of length `n`, after a valid `transferDrug` call by the current owner to a new recipient with valid GPS coordinates, the drug's `currentOwner` SHALL equal the recipient address, and the transfer history SHALL have length `n + 1`, with the new entry containing: the original owner as `from`, the recipient as `to`, block timestamp, the supplied GPS coordinates, and index `n`.

**Validates: Requirements 3.1, 3.4, 3.5**

---

### Property 10: Non-Owner Transfer Always Reverts

*For any* DrugID and any wallet address that is not the current owner of that drug, calling `transferDrug` SHALL always revert with a "Not owner" error.

**Validates: Requirements 3.2**

---

### Property 11: Transfer on Non-Existent Drug Always Reverts

*For any* string DrugID that has not been registered on-chain, calling `transferDrug` SHALL always revert with a "Drug not found" error.

**Validates: Requirements 3.3**

---

### Property 12: Transfer History Is Append-Only and Immutable

*For any* DrugID with transfer history of length `n`, after any number of additional `transferDrug` calls, the entries at indices `0` through `n-1` SHALL remain identical in all fields (`from`, `to`, `lat`, `lng`, `timestamp`, `index`) to their original values, and the total history length SHALL be greater than or equal to `n`.

**Validates: Requirements 3.6, 4.3**

---

### Property 13: GPS Validation — Out-of-Range Coordinates Always Rejected

*For any* transfer request where latitude is outside the range [-90, 90] or longitude is outside the range [-180, 180], the Backend SHALL return HTTP 400 and SHALL NOT submit any transaction to the smart contract. *For any* GPS log entry stored in MongoDB, latitude SHALL satisfy `-90 ≤ lat ≤ 90` and longitude SHALL satisfy `-180 ≤ lng ≤ 180`.

**Validates: Requirements 3.7, Property 6 (requirements doc)**

---

### Property 14: Transfer History Response Contains All Required Fields

*For any* transfer event returned by the Backend's history endpoint, the response object SHALL contain: sequence index, `fromRole` label, `toRole` label, human-readable timestamp string, latitude, longitude, and (where available) locationName. The response SHALL also include the current `status`, `riskScore`, and `riskCategory` at the top level.

**Validates: Requirements 4.2, 4.4**

---

### Property 15: Expired Drug Always Returns Expired Status

*For any* DrugID where `block.timestamp > drug.expiryDate`, the Smart Contract's `getDrugStatus` function SHALL return `Expired`, and the Backend's verification response for that DrugID SHALL include status `"Expired"`, regardless of RiskScore or recall state.

**Validates: Requirements 5.1, 5.5**

---

### Property 16: Recall Sets Status to Recalled

*For any* DrugID, after the Admin calls `recallDrug`, `getDrugStatus` SHALL return `Recalled`, and all Backend verification and history responses for that drug SHALL include a recall notice.

**Validates: Requirements 5.2, 5.4**

---

### Property 17: Non-Admin Cannot Recall

*For any* wallet address whose on-chain role is not Admin, calling `recallDrug` SHALL always revert.

**Validates: Requirements 5.3**

---

### Property 18: AI Risk Score Is Always Bounded [0, 100]

*For any* valid scoring inputs passed to the AI Engine's `/score` endpoint, the returned `score` field SHALL satisfy `0 ≤ score ≤ 100`. This holds even when multiple rules fire simultaneously — the sum is capped at 100.

**Validates: Requirements 6.2, Property 4 (requirements doc)**

---

### Property 19: AI Scoring Rules Are Correctly Applied

*For any* input where exactly one scoring rule condition is triggered (e.g., expiry within 30 days but all other conditions false), the returned score SHALL equal exactly the weight defined for that rule. When multiple rules fire, the score SHALL equal the sum of their weights, capped at 100.

**Validates: Requirements 6.3**

---

### Property 20: Recalled Drug Always Scores Critical

*For any* scoring request where `batchRecalled` is true, the AI Engine SHALL return `score = 100` and `category = "Critical"`, regardless of all other input values.

**Validates: Requirements 13.5, Property 8 (requirements doc)**

---

### Property 21: QR Code Resolves to Correct Drug

*For any* registered DrugID `d`, the QR code generated by the Backend SHALL encode a VerifyURL `u` such that fetching `u` returns data for DrugID `d` and only DrugID `d`. Formally: `decode(QRCode(d))` yields URL `u`, and `GET(u).drugID == d`.

**Validates: Requirements 7.1, 7.2, Property 7 (requirements doc)**

---

### Property 22: Unregistered Drug Verify Returns Not Found

*For any* DrugID that has never been registered on-chain, a request to `GET /verify/:drugID` SHALL return a response clearly indicating the drug is not found (HTTP 404 or explicit not-found field), and SHALL NOT return any drug data.

**Validates: Requirements 7.4, Property 1 (requirements doc)**

---

### Property 23: RiskScore Color Mapping Is Total and Correct

*For any* integer RiskScore `r` in [0, 100], the Frontend's `getRiskColor(r)` function SHALL return: no badge when `r == 0`; `"green"` when `1 ≤ r ≤ 24`; `"yellow"` when `25 ≤ r ≤ 49`; `"orange"` when `50 ≤ r ≤ 74`; `"red"` when `75 ≤ r ≤ 100`. No value in [0, 100] SHALL return an undefined or incorrect color.

**Validates: Requirements 15.2**

---

### Property 24: Drug Cache TTL Is Exactly 60 Seconds

*For any* drug cache entry written by the Backend, the `expiresAt` field SHALL equal `cachedAt + 60 seconds` (within 1 second tolerance for clock precision). No cache entry SHALL be valid beyond 60 seconds from insertion.

**Validates: Requirements 14.3**

---

### Property 25: Transfer Invalidates Cache

*For any* DrugID that has a cache entry, immediately after a successful transfer for that DrugID is recorded, the cache entry for that DrugID SHALL be absent (cache miss) so the next read reflects updated on-chain state.

**Validates: Requirements 14.4**

---

### Property 26: JWT Expiry Is Always 8 Hours

*For any* JWT issued by the Backend's login endpoint, the `exp` claim SHALL equal `iat + 28800` (8 hours in seconds).

**Validates: Requirements 10.2**

---

### Property 27: No On-Chain Role Returns 403 on Login

*For any* wallet address that has no role assigned on-chain (role == None), a login attempt SHALL return HTTP 403 before any signature verification is performed.

**Validates: Requirements 10.3**

---

### Property 28: WebSocket Broadcast Contains All Required Fields

*For any* confirmed drug transfer for a subscribed DrugID, the WebSocket broadcast message SHALL contain all four required fields: `newOwner` (address string), `lat` (number), `lng` (number), `timestamp` (ISO string), and `riskScore` (number).

**Validates: Requirements 12.3**

---

### Property 29: GPS Log Round-Trip

*For any* transfer recorded with GPS coordinates, a subsequent query to `GET /api/drugs/:id/gps` SHALL include an entry matching that transfer's latitude, longitude, and sequence index.

**Validates: Requirements 8.1, 8.2**

---

### Property 30: AI Scoring Audit Log Is Always Written

*For any* scoring request that the AI Engine responds to, the Backend SHALL write an audit log entry to MongoDB's `aiScoreLogs` collection containing: `drugID`, all input fields, returned `score`, `category`, and `scoredAt` timestamp.

**Validates: Requirements 14.5**

---

## Testing Strategy

### Dual Testing Approach

The testing strategy combines **unit/example-based tests** for specific scenarios and edge cases with **property-based tests** for universal correctness guarantees. Both layers are complementary — unit tests catch concrete bugs with readable scenarios, property tests verify general correctness across the full input space.

### Property-Based Testing

**Library choices:**
- Backend (Node.js): **fast-check** (`npm install --save-dev fast-check`)
- AI Engine (Python): **Hypothesis** (`pip install hypothesis`)
- Smart contract (Hardhat): **fast-check** with ethers.js test helpers

**Configuration:** Each property test runs a minimum of **100 iterations** (`numRuns: 100` in fast-check, `@settings(max_examples=100)` in Hypothesis). Properties are tagged with a comment referencing their design number.

**Tag format:** `// Feature: pharma-blockchain-ai, Property N: <property_text>`

**Mapping of correctness properties to tests:**

| Property | Test Location | Library | Pattern |
|----------|---------------|---------|---------|
| 1  | `test/contract/drugRegistration.test.ts` | fast-check | Round-trip |
| 2  | `test/contract/drugRegistration.test.ts` | fast-check | Error condition |
| 3  | `test/contract/access.test.ts` | fast-check | Access control |
| 4  | `test/contract/drugRegistration.test.ts` | fast-check | Edge case / error |
| 5  | `test/contract/roles.test.ts` | fast-check | Round-trip |
| 6  | `test/contract/roles.test.ts` | fast-check | Access control |
| 7  | `test/backend/auth.test.js` | fast-check | Round-trip |
| 8  | `test/backend/auth.test.js` | fast-check | Error condition |
| 9  | `test/contract/transfer.test.ts` | fast-check | Round-trip |
| 10 | `test/contract/transfer.test.ts` | fast-check | Access control |
| 11 | `test/contract/transfer.test.ts` | fast-check | Error condition |
| 12 | `test/contract/transfer.test.ts` | fast-check | Invariant |
| 13 | `test/backend/validation.test.js` | fast-check | Input validation |
| 14 | `test/backend/history.test.js` | fast-check | Invariant |
| 15 | `test/contract/status.test.ts` | fast-check | Invariant |
| 16 | `test/contract/recall.test.ts` | fast-check | Round-trip |
| 17 | `test/contract/recall.test.ts` | fast-check | Access control |
| 18 | `test/ai/scorer.test.py` | Hypothesis | Invariant |
| 19 | `test/ai/scorer.test.py` | Hypothesis | Metamorphic |
| 20 | `test/ai/scorer.test.py` | Hypothesis | Invariant |
| 21 | `test/backend/qr.test.js` | fast-check | Round-trip |
| 22 | `test/backend/qr.test.js` | fast-check | Error condition |
| 23 | `test/frontend/riskBadge.test.js` | fast-check | Total function |
| 24 | `test/backend/cache.test.js` | fast-check | Invariant |
| 25 | `test/backend/cache.test.js` | fast-check | Invariant |
| 26 | `test/backend/auth.test.js` | fast-check | Invariant |
| 27 | `test/backend/auth.test.js` | fast-check | Error condition |
| 28 | `test/backend/websocket.test.js` | fast-check | Invariant |
| 29 | `test/backend/gps.test.js` | fast-check | Round-trip |
| 30 | `test/backend/aiLog.test.js` | fast-check | Round-trip |

### Example Property Test (fast-check)

```typescript
// Feature: pharma-blockchain-ai, Property 18: AI risk score is always in [0,100]
import * as fc from 'fast-check';
import { computeRiskScore } from '../scorer';

test('risk score is always in [0, 100]', () => {
  fc.assert(
    fc.property(
      fc.record({
        expiryTimestamp:         fc.integer({ min: 0 }),
        transferCount:           fc.nat(),
        transferTimestamps:      fc.array(fc.integer({ min: 0 })),
        gpsCoordinates:          fc.array(fc.record({
                                   lat: fc.float({ min: -90,  max: 90  }),
                                   lng: fc.float({ min: -180, max: 180 })
                                 })),
        batchRecalled:           fc.boolean(),
        manufacturerReputation:  fc.float({ min: 0, max: 1 })
      }),
      (inputs) => {
        const result = computeRiskScore(inputs);
        return result.score >= 0 && result.score <= 100;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Example Property Test (Hypothesis — Python)

```python
# Feature: pharma-blockchain-ai, Property 20: recalled drug always scores Critical
from hypothesis import given, settings
from hypothesis import strategies as st
from scorer import compute_risk_score

@given(
    st.fixed_dictionaries({
        "expiryTimestamp":        st.integers(min_value=0),
        "transferCount":          st.integers(min_value=0),
        "transferTimestamps":     st.lists(st.integers(min_value=0)),
        "gpsCoordinates":         st.lists(st.fixed_dictionaries({
                                      "lat": st.floats(-90, 90),
                                      "lng": st.floats(-180, 180)
                                  })),
        "batchRecalled":          st.just(True),          # always recalled
        "manufacturerReputation": st.floats(0, 1)
    })
)
@settings(max_examples=100)
def test_recalled_drug_always_critical(inputs):
    result = compute_risk_score(inputs)
    assert result["score"] == 100
    assert result["category"] == "Critical"
```

### Unit Tests

Unit tests focus on specific scenarios, integration points, and edge cases that aren't covered by property generators:

- **Smart Contract**: deploy fixture, specific role transitions, exact revert message strings
- **Backend routes**: HTTP status code tests for each endpoint, header validation, body parsing
- **Auth middleware**: correct JWT decoding, role guard behavior for each role
- **Fabric service**: mock Fabric SDK, verify chaincode call signatures
- **WebSocket**: connection lifecycle, multi-subscriber broadcast isolation
- **Frontend components**: React Testing Library snapshot tests for all dashboard pages, `<RiskBadge>` rendering, `<RecallBanner>` visibility, `<TransferTimeline>` ordering

### Integration Tests

Integration tests verify cross-component behavior with real (local) services:

- Full drug lifecycle: register → transfer × 3 → verify → recall → verify again
- Auth flow end-to-end: wallet sign → login → use JWT on protected endpoints
- AI Engine trigger: confirm AI Engine is called after each transfer
- WebSocket broadcast: connect client → record transfer → verify broadcast received
- Fabric private data: store data as Org1 → query as Org1 (success) → query as Org3 (access denied)
- Cache invalidation: read drug (populate cache) → transfer → read again (verify fresh data)

### Smoke Tests

Run once at startup to verify the environment:
- Smart contract is deployed and reachable at `CONTRACT_ADDRESS`
- MongoDB connection succeeds with `MONGO_URI`
- AI Engine `/health` endpoint returns 200
- Fabric test network peers are reachable
- `getDrugStatus` function exists on the deployed contract
- Backend starts and `/` returns 200

### Test Execution

```bash
# Smart contract tests (Hardhat)
npx hardhat test

# Backend unit + property tests
cd backend
npm test

# AI Engine tests
cd ai-engine
pytest

# Frontend tests
cd frontend
npm test -- --watchAll=false
```
