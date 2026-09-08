# Implementation Plan: Pharma Blockchain AI

## Overview

Incremental implementation across nine phases: Smart Contract extension, Backend foundation and APIs, Python AI Engine, WebSocket layer, Hyperledger Fabric private network, React frontend, and tests. Each task builds on the previous, ending with full integration. Languages used: Solidity (contract), TypeScript (Hardhat scripts/tests), JavaScript (Node.js backend), Python (AI Engine), JavaScript/React (frontend).

---

## Tasks

### Phase 1: Smart Contract

- [x] 1. Extend PharmaSupplyChain.sol with new types and storage
  - [x] 1.1 Add Role enum Consumer entry, DrugStatus enum, TransferEvent struct, and TransferHistory to Drug struct
    - Add `Consumer` to `Role` enum (Admin, Manufacturer, Distributor, Pharmacy, Consumer)
    - Add `DrugStatus { Active, Recalled, Expired }` enum
    - Add `TransferEvent { from, to, int256 lat, int256 lng, uint256 timestamp, uint256 index }` struct
    - Add `TransferEvent[] transferHistory` field inside the `Drug` struct
    - Add `bool recalled` field to `Drug` struct
    - _Requirements: 2.1, 3.4, 5.1_

  - [x] 1.2 Implement RoleAssigned event, updated assignRole, and recallDrug function
    - Emit `RoleAssigned(address indexed user, Role role)` from `assignRole`
    - Implement `recallDrug(string _drugID) external onlyAdmin` — sets `recalled = true`, emits `DrugRecalled`
    - Implement `getDrugStatus(string _drugID) external view returns (DrugStatus)` — returns Expired if block.timestamp > expiryDate, Recalled if recalled, else Active
    - _Requirements: 2.2, 5.2, 5.5_

  - [ ]* 1.3 Write property test for Role/DrugStatus correctness (Properties 5, 6, 15, 16, 17)
    - **Property 5: Role assignment round-trip** — `roles[addr]` equals assigned role after `assignRole`
    - **Property 6: Non-admin assignRole always reverts**
    - **Property 15: Expired drug always returns Expired status**
    - **Property 16: Recall sets status to Recalled**
    - **Property 17: Non-admin cannot recall**
    - **Validates: Requirements 2.2, 2.3, 5.1, 5.2, 5.3, 5.5**

  - [x] 1.4 Update transferDrug to accept lat/lng params and append to TransferHistory
    - Change signature to `transferDrug(string _drugID, address _newOwner, int256 _lat, int256 _lng)`
    - Push new `TransferEvent` to `drug.transferHistory` with auto-incrementing index
    - Emit updated `DrugTransferred(string drugID, address from, address to, int256 lat, int256 lng, uint256 timestamp)`
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

  - [ ]* 1.5 Write property test for transfer round-trip and immutability (Properties 9, 10, 11, 12)
    - **Property 9: Transfer round-trip — owner update and history growth**
    - **Property 10: Non-owner transfer always reverts**
    - **Property 11: Transfer on non-existent drug always reverts**
    - **Property 12: Transfer history is append-only and immutable**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

  - [x] 1.6 Implement getTransferHistory and getTransferCount view functions
    - `getTransferHistory(string _drugID) external view returns (TransferEvent[] memory)`
    - `getTransferCount(string _drugID) external view returns (uint256)`
    - _Requirements: 4.1, 4.3_

  - [x] 1.7 Write property test for drug registration round-trip and access control (Properties 1, 2, 3, 4)
    - **Property 1: Drug registration round-trip** — getDrug returns exact submitted values
    - **Property 2: Duplicate drug registration is always rejected**
    - **Property 3: Unauthorized role always reverts createDrug**
    - **Property 4: Past expiry timestamp is always rejected**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6**
    - _(Note: these test existing createDrug behavior with fast-check)_

- [x] 2. Update Hardhat deploy script and compile contract
  - [x] 2.1 Update scripts/deploy.ts to deploy the extended contract and log new function addresses
    - Redeploy `PharmaSupplyChain` with constructor args if needed
    - Copy freshly compiled ABI from `artifacts/contracts/PharmaSupplyChain.sol/PharmaSupplyChain.json` to `backend/abi/PharmaSupplyChain.json`
    - _Requirements: 16.2_

  - [x] 2.2 Write Hardhat unit tests for the extended contract (non-PBT scenarios)
    - Test exact revert message strings: "Drug already exists", "Unauthorized role", "Expiry must be future date", "Not owner", "Drug not found", "Only admin allowed"
    - Test `getDrugStatus` returns Active/Recalled/Expired at the correct block timestamps
    - Test `getTransferCount` increments correctly
    - _Requirements: 1.2, 1.3, 1.6, 3.2, 3.3, 5.1, 5.2, 5.3_

- [x] 3. Checkpoint — Smart Contract
  - Ensure all Hardhat tests pass: `npx hardhat test`
  - Verify ABI in `backend/abi/` is up to date

### Phase 2: Backend Foundation

- [x] 4. Restructure backend into modular layout and add MongoDB models
  - [x] 4.1 Create backend directory structure: routes/, middleware/, services/, models/
    - Create `backend/routes/auth.js`, `backend/routes/drugs.js`, `backend/routes/transfer.js`, `backend/routes/qr.js`, `backend/routes/admin.js`, `backend/routes/fabric.js`
    - Create `backend/middleware/auth.js`, `backend/middleware/validate.js`
    - Create `backend/services/` directory with placeholder files for contractService, fabricService, aiService, cacheService, wsService
    - Refactor existing `backend/server.js` to use Express app factory and mount new route files
    - _Requirements: 16.1, 16.3_

  - [x] 4.2 Implement Mongoose models: User, GpsLog, AiScoreLog, DrugCache
    - `User.js`: walletAddress (unique indexed), role, displayName, contactEmail, createdAt, updatedAt
    - `GpsLog.js`: drugID (indexed), transferIndex, lat, lng, actorAddress, actorRole, locationName, timestamp, createdAt
    - `AiScoreLog.js`: drugID (indexed), inputs object, score, category, scoredAt, triggeredBy
    - `DrugCache.js`: drugID (unique indexed), data, cachedAt, expiresAt with TTL index of 60 seconds (MongoDB `expireAfterSeconds: 0` on expiresAt field — validate 60s window at startup)
    - _Requirements: 14.1, 14.3_

  - [ ]* 4.3 Write property test for DrugCache TTL correctness (Properties 24, 25)
    - **Property 24: Drug cache TTL is exactly 60 seconds** — expiresAt == cachedAt + 60s
    - **Property 25: Transfer invalidates cache** — cache entry absent after transfer
    - **Validates: Requirements 14.3, 14.4**

- [x] 5. Implement core backend services
  - [x] 5.1 Implement contractService.js — ethers.js v6 wrapper for all on-chain calls
    - Initialize `ethers.JsonRpcProvider` with `RPC_URL`, `ethers.Wallet` with `PRIVATE_KEY`
    - Implement: `createDrug`, `transferDrug(drugID, toAddr, latInt, lngInt)`, `recallDrug`, `updateRiskScore`, `assignRole`
    - Implement view wrappers: `getDrug`, `getDrugStatus`, `getTransferHistory`, `getTransferCount`
    - Convert float lat/lng to `int256` fixed-point ×1e6 on write; convert back on read
    - _Requirements: 3.1, 4.1, 5.5, 16.1_

  - [x] 5.2 Implement cacheService.js — 60s TTL, invalidation on transfer
    - `get(drugID)`: find DrugCache document, return `data` if not expired else null
    - `set(drugID, data)`: upsert DrugCache document with `cachedAt = now`, `expiresAt = now + 60s`
    - `invalidate(drugID)`: deleteOne where `drugID` matches
    - Validate at startup that TTL configuration equals exactly 60s; throw if misconfigured
    - _Requirements: 14.3, 14.4_

  - [x] 5.3 Implement JWT auth middleware and wallet signature verification
    - `backend/middleware/auth.js`: verify `Authorization: Bearer <JWT>` with `JWT_SECRET`; attach `{walletAddress, role}` to `req.user`; return 401 for invalid/expired token
    - `roleGuard(requiredRole)`: factory that returns a middleware checking `req.user.role`
    - Wallet signature verification in auth route: `ethers.verifyMessage(message, signature)` must recover `walletAddress`; check message timestamp within 5 minutes
    - _Requirements: 2.5, 2.6, 10.1, 10.4, 10.5, 10.6_

  - [ ]* 5.4 Write property test for JWT auth invariants (Properties 7, 8, 26, 27)
    - **Property 7: JWT role claim matches on-chain role**
    - **Property 8: Invalid or expired JWT always returns 401**
    - **Property 26: JWT expiry is always 8 hours**
    - **Property 27: No on-chain role returns 403 on login**
    - **Validates: Requirements 2.4, 2.6, 10.1, 10.2, 10.3, 10.5**

  - [x] 5.5 Implement GPS validation middleware (validate.js)
    - `validateGPS`: check `lat ∈ [-90, 90]` and `lng ∈ [-180, 180]`; return HTTP 400 with `{ error, code: "INVALID_GPS" }` if out of range
    - _Requirements: 3.7_

  - [ ]* 5.6 Write property test for GPS validation (Property 13)
    - **Property 13: Out-of-range GPS coordinates always rejected with HTTP 400**
    - **Validates: Requirements 3.7**

- [x] 6. Checkpoint — Backend Foundation
  - Ensure MongoDB models connect without error
  - Ensure contractService initializes against deployed contract ABI
  - Run backend unit tests: `cd backend && npm test`

### Phase 3: Backend API Routes

- [x] 7. Implement Auth routes
  - [x] 7.1 Implement POST /auth/login and GET /auth/me
    - `POST /auth/login`: check on-chain role (403 if None), verify wallet signature with ethers.verifyMessage, issue JWT (`{walletAddress, role}`, 8h expiry); return `{token, role, expiresIn: 28800}`
    - `GET /auth/me`: JWT-protected; return `{walletAddress, role}` from `req.user`
    - _Requirements: 2.4, 10.1, 10.2, 10.3, 10.6_

- [x] 8. Implement Drug routes
  - [x] 8.1 Implement POST /api/drugs — register drug on-chain and store metadata
    - Verify Manufacturer JWT; validate ExpiryTimestamp > now (400 if past)
    - Call `contractService.createDrug`; on tx confirmed emit tx hash
    - Insert User metadata (manufacturerName, contactEmail) into MongoDB `users` collection
    - Return 201 `{success, txHash, drugID}`
    - _Requirements: 1.1, 1.5, 1.6_

  - [x] 8.2 Implement GET /api/drugs/:id — cached drug detail
    - Check cacheService; on miss call `contractService.getDrug` + `getDrugStatus`, set cache with 60s TTL
    - Return drug fields including status and riskScore
    - _Requirements: 4.1, 4.4, 14.3_

  - [x] 8.3 Implement GET /api/drugs/:id/history — full formatted transfer history
    - Call `contractService.getTransferHistory`; for each event look up `actorRole` from `roles` mapping, format timestamp as ISO string, include locationName from gpsLogs collection
    - Include `status`, `riskScore`, `riskCategory`, and `recallNotice` in response
    - _Requirements: 4.2, 4.4, 5.4_

  - [ ]* 8.4 Write property test for transfer history response fields (Property 14)
    - **Property 14: Transfer history response contains all required fields**
    - **Validates: Requirements 4.2, 4.4**

  - [x] 8.5 Implement GET /api/drugs/:id/status
    - Call `contractService.getDrugStatus`; return `{drugID, status}`
    - _Requirements: 5.5_

  - [x] 8.6 Implement GET /api/drugs/:id/gps — ordered GPS log entries
    - Query MongoDB `gpsLogs` sorted by `transferIndex` ascending; return array for map rendering
    - _Requirements: 8.1, 8.2_

  - [ ]* 8.7 Write property test for GPS log round-trip (Property 29)
    - **Property 29: GPS log round-trip** — GET /api/drugs/:id/gps includes entry for every recorded transfer
    - **Validates: Requirements 8.1, 8.2**

- [x] 9. Implement Transfer route
  - [x] 9.1 Implement POST /api/transfer — GPS validation, on-chain transfer, cache invalidation, AI trigger
    - Validate GPS via `validateGPS` middleware (400 if invalid)
    - Call `contractService.transferDrug(drugID, toAddress, lat*1e6, lng*1e6)`; wait for tx
    - Insert GPS log entry into MongoDB `gpsLogs`
    - Call `cacheService.invalidate(drugID)`
    - Trigger `aiService.score(...)` asynchronously; on success call `contractService.updateRiskScore` with retry backoff (2s, 4s, 8s, max 3 retries)
    - Broadcast via `wsService.broadcast` after tx confirmed
    - Return `{success, txHash, newRiskScore, riskCategory}`
    - _Requirements: 3.1, 3.7, 3.8, 8.1, 14.4_

- [x] 10. Implement Admin routes
  - [x] 10.1 Implement POST /admin/recall
    - Admin JWT required; call `contractService.recallDrug(drugID)`
    - Trigger AI re-score (will return 100/Critical due to recall flag)
    - Invalidate cache; broadcast WebSocket recall alert
    - _Requirements: 5.2, 13.1, 13.2, 13.4_

  - [x] 10.2 Implement POST /admin/assignRole
    - Admin JWT required; call `contractService.assignRole(address, roleEnum)`
    - Return `{success, txHash}`
    - _Requirements: 2.2_

- [ ] 11. Implement QR routes
  - [x] 11.1 Implement GET /api/generateQR/:drugID
    - Manufacturer JWT required; verify drugID exists on-chain
    - Generate QR code encoding `{BASE_URL}/verify/{drugID}` using qrcode npm package; return base64 PNG data URL
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ]* 11.2 Write property test for QR code correctness (Properties 21, 22)
    - **Property 21: QR code resolves to correct drug** — decoded URL drugID matches requested drugID
    - **Property 22: Unregistered drug verify returns not found**
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [x] 11.3 Implement GET /verify/:drugID — public verification endpoint (no auth)
    - Check cache; on miss fetch on-chain data + GPS logs; set cache
    - If drug not found return 404 with `{error: "Drug not found or may be counterfeit"}`
    - If recalled include `recallNotice` at top of response
    - Support both HTML and JSON responses based on `Accept` header
    - _Requirements: 7.3, 7.4, 13.3_

- [x] 12. Checkpoint — Backend API Routes
  - All routes mounted and returning correct HTTP status codes
  - Run backend tests: `cd backend && npm test`

### Phase 4: AI Engine (Python Flask)

- [x] 13. Implement Python AI Engine
  - [x] 13.1 Create ai-engine/ project structure and implement scorer.py
    - Create `ai-engine/scorer.py` with `compute_risk_score(inputs: dict) -> dict`
    - Implement all 5 additive rules: expiry proximity (+20/+10), transfer count anomaly (+15), time jump (+20), location jump (+25 via geopy geodesic), batch recall (+30)
    - Cap total at 100; derive category: Uncolored (0), Low (1–24), Medium (25–49), High (50–74), Critical (75–100)
    - Create `ai-engine/requirements.txt` with pinned versions: flask, geopy, hypothesis
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 13.2 Write Hypothesis property tests for scorer.py (Properties 18, 19, 20)
    - **Property 18: AI risk score is always bounded [0, 100]**
    - **Property 19: Individual rules fire at correct weights; multiple rules sum correctly, capped at 100**
    - **Property 20: Recalled drug always scores 100 / Critical**
    - **Validates: Requirements 6.2, 6.3, 13.5**

  - [x] 13.3 Implement Flask app.py with /score endpoint
    - `POST /score`: parse JSON body, call `compute_risk_score`, return `{score, category}`
    - Add `GET /health` endpoint returning `{status: "ok"}` (for smoke tests)
    - Read port from `AI_ENGINE_PORT` env var; default 5000
    - _Requirements: 6.8, 16.6_

  - [x] 13.4 Implement aiService.js in backend — HTTP call to AI Engine with exponential retry backoff
    - `score(inputs)`: POST to `AI_ENGINE_URL/score`; if response within 5s return `{score, category}`
    - On connection failure: retain last known riskScore from cache/on-chain, log `{level:"warn", event:"ai_engine_unavailable", drugID}`, do NOT block transfer
    - Retry for `updateRiskScore` on-chain call: 2s → 4s → 8s, max 3 retries then log failure
    - Write audit log to `aiScoreLogs` collection for every score call (inputs, score, category, scoredAt, triggeredBy)
    - _Requirements: 6.4, 6.5, 6.6, 14.5_

  - [ ]* 13.5 Write property test for AI scoring audit log (Property 30)
    - **Property 30: AI scoring audit log is always written** — every score call produces an aiScoreLog entry
    - **Validates: Requirements 14.5**

### Phase 5: WebSocket Layer

- [x] 14. Implement WebSocket service and wire into transfer/recall flows
  - [x] 14.1 Implement wsService.js — subscription map and broadcast
    - Initialize `ws.Server` on the shared `http.Server` instance (or dedicated `WS_PORT`)
    - Maintain `Map<drugID, Set<WebSocket>>` in memory
    - On message: parse JSON; handle `{type:"subscribe", drugID}` (add to map) and `{type:"unsubscribe", drugID}` (remove from map); queue subscribe if server not yet active
    - On disconnect: remove socket from all subscription sets
    - `broadcast(drugID, payload)`: serialize payload to JSON; send to all subscribers of drugID; silently remove closed sockets
    - On malformed JSON: log error, close connection with code 1008
    - _Requirements: 12.1, 12.2, 12.4_

  - [ ]* 14.2 Write property test for WebSocket broadcast payload (Property 28)
    - **Property 28: WebSocket broadcast contains all required fields** — newOwner, lat, lng, timestamp, riskScore
    - **Validates: Requirements 12.3**

  - [x] 14.3 Wire wsService broadcasts into transfer route (POST /api/transfer) and recall route (POST /admin/recall)
    - After confirmed transfer: `wsService.broadcast(drugID, {type:"transfer", newOwner, lat, lng, timestamp, riskScore, riskCategory})`
    - After confirmed recall: `wsService.broadcast(drugID, {type:"recall", drugID, timestamp})`
    - _Requirements: 12.3, 13.2_

### Phase 6: Hyperledger Fabric

- [ ] 15. Set up Hyperledger Fabric local network
  - [-] 15.1 Create fabric/docker-compose.yaml with orderer, 3 org peers, CAs, and CouchDB
    - Services: `orderer.example.com` (Solo), `peer0.org1`, `peer0.org2`, `peer0.org3`, `ca.org1`, `ca.org2`, CouchDB instances for org1 and org2, `cli` container
    - Configure `PharmaPrivateCollection` in `collections_config.json`: `memberOrgsPolicy = OR('Org1MSP.member', 'Org2MSP.member')` (excludes Org3/Pharmacy)
    - Create `fabric/scripts/startNetwork.sh` and `fabric/scripts/deployChaincode.sh`
    - _Requirements: 11.3, 11.6, 16.5_

  - [ ] 15.2 Implement pharmaContract.js chaincode
    - `CreateDrugPrivate(ctx, drugID)`: write public ledger entry + private collection entry from transient data
    - `StorePrivateData(ctx, drugID)`: update private fields for Manufacturer/Distributor MSP; reject Pharmacy MSP
    - `SyncToPolygon(ctx, drugID, eventType)`: set `syncedToPolygon: false` and emit Sync_Event; backend confirms with `true` after relay
    - `GetDrug(ctx, drugID)`: return public ledger entry
    - `GetDrugPrivate(ctx, drugID)`: return private collection entry; return ACCESS_DENIED for Org3 MSP
    - `GetDrugHistory(ctx, drugID)`: return CouchDB history for drug key
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 15.3 Implement fabricService.js in backend and GET /fabric/drug/:id endpoint
    - `fabricService.js`: initialize Fabric gateway with `FABRIC_CONNECTION_PROFILE` and `FABRIC_WALLET_PATH`; wrap `GetDrugPrivate`, `CreateDrugPrivate`, `StorePrivateData`, `SyncToPolygon`
    - Handle Sync_Event relay: on Sync_Event from Fabric chaincode, relay to Polygon via `contractService`; retry indefinitely with exponential backoff if relay fails
    - `GET /fabric/drug/:id`: JWT-protected (Manufacturer or Distributor only); call `fabricService.GetDrugPrivate`; return full Hyperledger record including private fields
    - _Requirements: 11.2, 11.4, 11.5_

- [~] 16. Checkpoint — Fabric and Backend Integration
  - Ensure `docker-compose up` starts all Fabric services without errors
  - Ensure `/fabric/drug/:id` returns correct data for Manufacturer/Distributor and 403 for Pharmacy

### Phase 7: Frontend

- [ ] 17. Set up React application structure, routing, and contexts
  - [~] 17.1 Configure React Router, AuthContext, ThemeContext, and api.js Axios instance
    - Create `src/contexts/AuthContext.js`: state `{wallet, role, token}`, actions `login(token, role, wallet)`, `logout()`; persist token to localStorage
    - Create `src/contexts/ThemeContext.js`: `{darkMode, toggleDarkMode}`; read initial value from localStorage
    - Create `src/services/api.js`: Axios instance with `baseURL = process.env.REACT_APP_API_URL`; attach `Authorization: Bearer <token>` from AuthContext on every request
    - Replace all hardcoded render.com URLs in existing `App.js`/`frontend/src` with `REACT_APP_API_URL`
    - Wire React Router with routes: `/login`, `/manufacturer`, `/distributor`, `/pharmacy`, `/admin`, `/verify/:drugID`, `*` → `/login`
    - _Requirements: 9.5, 9.6, 16.4_

  - [~] 17.2 Implement ProtectedRoute and Header components
    - `ProtectedRoute.jsx`: check `token` in AuthContext; redirect to `/login` if absent; optionally check `role` prop and redirect if mismatch
    - `Header.jsx`: display truncated wallet address, role badge (color-coded), logout button (calls `logout()` and pushes to `/login`), dark/light mode toggle
    - `LoadingSpinner.jsx`: spinner/skeleton component shown during async operations
    - _Requirements: 9.5, 9.6, 15.1, 15.4_

- [ ] 18. Implement shared UI components
  - [~] 18.1 Implement RiskBadge, RecallBanner, TransferTimeline, and QRGenerator
    - `RiskBadge.jsx`: pure component; maps score 0→no badge, 1–24→green, 25–49→yellow, 50–74→orange, 75–100→red; meets WCAG 2.1 AA contrast ratio
    - `RecallBanner.jsx`: prominent warning banner shown when `status === "Recalled"`; renders above all drug info
    - `TransferTimeline.jsx`: ordered list of transfer steps with role icon, actor address, timestamp, GPS label
    - `QRGenerator.jsx`: render base64 PNG from API; provide download button for offline label printing
    - `QRScannerModal.jsx`: html5-qrcode overlay; on decode extract drugID from URL and navigate to `/verify/:drugID`
    - _Requirements: 7.3, 7.5, 7.6, 8.6, 13.3, 15.2, 15.3_

  - [ ]* 18.2 Write property test for RiskBadge color mapping (Property 23)
    - **Property 23: RiskScore color mapping is total and correct** — all values 0–100 return correct color
    - **Validates: Requirements 15.2**

  - [~] 18.3 Implement GPSMapView component (Leaflet.js)
    - `GPSMapView.jsx`: render Leaflet map; place marker at each GPS coordinate with popup showing role, timestamp, sequence number; draw polyline in chronological order
    - Accept `gpsPath` array prop; update map when new entry is added (no full page reload)
    - _Requirements: 8.3, 8.4, 8.5_

- [ ] 19. Implement useWebSocket hook and useDrug hook
  - [~] 19.1 Implement useWebSocket.js hook with polling fallback
    - Connect to `REACT_APP_WS_URL`; send `{type:"subscribe", drugID}` on mount; unsubscribe on unmount
    - On message: parse JSON and invoke callback with transfer/recall payload
    - If `WebSocket` unavailable in browser: fall back to `setInterval` polling `GET /api/drugs/:id/history` every 10 seconds
    - Expose `{lastMessage, isConnected}` from hook
    - _Requirements: 8.5, 12.1, 12.5_

  - [~] 19.2 Implement useDrug.js hook — fetch and cache drug data
    - `useDrug(drugID)`: call `GET /api/drugs/:id` on mount; return `{drug, loading, error, refetch}`
    - _Requirements: 4.1_

- [ ] 20. Implement role-based dashboards and public pages
  - [~] 20.1 Implement LoginPage.jsx — MetaMask connect and wallet signature login
    - Connect MetaMask via `window.ethereum`; request accounts; sign message `"Login to PharmaChain at <timestamp>"`
    - POST to `/auth/login` with `{walletAddress, signature, message}`; on success store JWT via `login()` from AuthContext; redirect to role-appropriate dashboard
    - Display human-readable errors from 401/403 responses
    - _Requirements: 10.1, 10.6, 15.5_

  - [~] 20.2 Implement ManufacturerDashboard.jsx
    - List drugs registered by current wallet (call `GET /api/drugs` filtered by manufacturer)
    - Drug registration form: drugID, name, batchNumber, expiryTimestamp, manufacturerName, contactEmail; POST to `/api/drugs`
    - QR generator: call `GET /api/generateQR/:drugID`; render `<QRGenerator>` with download
    - Transfer history view per drug using `<TransferTimeline>`
    - Show `<LoadingSpinner>` during tx wait; show revert error via error toast
    - _Requirements: 1.1, 7.1, 9.1, 15.4, 15.5_

  - [~] 20.3 Implement DistributorDashboard.jsx
    - List drugs currently owned by this Distributor wallet
    - `TransferForm`: inputs for recipient address, lat, lng; POST to `/api/transfer`; show GPS validation errors
    - Transfer history view using `<TransferTimeline>`
    - _Requirements: 9.2_

  - [~] 20.4 Implement PharmacyDashboard.jsx
    - List drugs currently held by this Pharmacy wallet
    - Dispense form: select drug, enter Consumer address; POST to `/api/transfer` to record dispense
    - _Requirements: 9.3_

  - [~] 20.5 Implement AdminDashboard.jsx
    - Role assigner: address input, role selector; POST to `/admin/assignRole`
    - Recall manager: drugID or batchNumber input; POST to `/admin/recall`
    - _Requirements: 2.2, 13.1, 13.4_

  - [~] 20.6 Implement PublicVerifyPage.jsx — no auth required
    - Fetch from `GET /verify/:drugID`; show `<RecallBanner>` prominently if recalled
    - Render `<DrugInfoCard>` (name, batch, manufacturer, expiry, status), `<RiskBadge>`, `<TransferTimeline>`, `<GPSMapView>`
    - Subscribe to WebSocket for live updates using `useWebSocket(drugID)`
    - Handle 404 with clear "Drug not found / may be counterfeit" message
    - _Requirements: 7.3, 7.4, 8.3, 8.4, 8.6, 9.4, 13.3, 15.1, 15.2_

- [~] 21. Checkpoint — Frontend
  - All routes navigable; ProtectedRoute redirects work; dark/light mode persists across routes
  - `cd frontend && npm test -- --watchAll=false`

### Phase 8: Tests

- [ ] 22. Complete smart contract property-based and unit test suite
  - [~] 22.1 Finalize Hardhat fast-check property tests across all contract test files
    - `test/contract/drugRegistration.test.ts`: Properties 1, 2, 3, 4
    - `test/contract/roles.test.ts`: Properties 5, 6
    - `test/contract/transfer.test.ts`: Properties 9, 10, 11, 12
    - `test/contract/status.test.ts`: Property 15
    - `test/contract/recall.test.ts`: Properties 16, 17
    - Tag each test: `// Feature: pharma-blockchain-ai, Property N: <property_text>`; numRuns: 100
    - _Requirements: all smart contract requirements_

  - [ ]* 22.2 Write smart contract integration tests (Hardhat, full lifecycle)
    - Full drug lifecycle: register → transfer ×3 → verify → recall → verify again
    - Verify `getTransferCount` increments, history immutability, status transitions
    - _Requirements: 1.1, 3.1, 4.3, 5.1, 5.2_

- [ ] 23. Complete backend property-based and unit test suite
  - [~] 23.1 Finalize fast-check property tests across all backend test files
    - `test/backend/auth.test.js`: Properties 7, 8, 26, 27
    - `test/backend/validation.test.js`: Property 13
    - `test/backend/cache.test.js`: Properties 24, 25
    - `test/backend/history.test.js`: Property 14
    - `test/backend/qr.test.js`: Properties 21, 22
    - `test/backend/websocket.test.js`: Property 28
    - `test/backend/gps.test.js`: Property 29
    - `test/backend/aiLog.test.js`: Property 30
    - Tag each test with feature/property annotation; numRuns: 100
    - _Requirements: all backend requirements_

  - [ ]* 23.2 Write backend unit tests for routes, middleware, and service layer
    - HTTP status code tests for each endpoint (400, 401, 403, 404, 500 paths)
    - JWT decode/role-guard behavior per role
    - Mock Fabric SDK for fabricService tests
    - WebSocket connection lifecycle and multi-subscriber broadcast isolation
    - Cache invalidation after transfer
    - _Requirements: 2.5, 2.6, 3.7, 10.1–10.5, 12.2, 12.4, 14.3, 14.4_

- [ ] 24. Complete AI Engine test suite (Hypothesis)
  - [~] 24.1 Finalize Hypothesis property tests in test/ai/scorer.test.py
    - Properties 18, 19, 20 with `@settings(max_examples=100)`
    - Tag each test: `# Feature: pharma-blockchain-ai, Property N: <property_text>`
    - _Requirements: 6.2, 6.3, 13.5_

  - [ ]* 24.2 Write AI Engine unit tests for individual scoring rules
    - Test each rule fires independently with correct weight
    - Test boundary conditions: exactly 30 days to expiry, exactly 10 transfers, exactly 60s gap
    - Test geopy location jump threshold at exactly 1000 km/h
    - _Requirements: 6.3_

- [ ] 25. Write frontend component tests
  - [ ]* 25.1 Write React Testing Library tests for all dashboard pages and shared components
    - Snapshot and behavior tests for: `<RiskBadge>`, `<RecallBanner>`, `<TransferTimeline>`, `<GPSMapView>` (mock Leaflet), `<LoginPage>`, all four dashboards, `<PublicVerifyPage>`
    - Verify `<RecallBanner>` only shows when status is Recalled
    - Verify `<LoadingSpinner>` appears during async calls
    - Verify error toast shows smart contract revert strings
    - _Requirements: 9.1–9.4, 13.3, 15.1–15.5_

- [~] 26. Final Checkpoint — Full Test Suite
  - Run all tests: `npx hardhat test && cd backend && npm test && cd ../ai-engine && pytest && cd ../frontend && npm test -- --watchAll=false`
  - All property tests (PBT) must pass with numRuns ≥ 100
  - No failing unit tests

### Phase 9: Documentation

- [ ] 27. Write README and environment variable reference
  - [~] 27.1 Update root README.md with complete setup steps for all services
    - Prerequisites (Node.js, Python, Docker, MetaMask, Polygon Amoy faucet)
    - Step-by-step startup commands for: Hardhat deploy, Fabric network, MongoDB, AI Engine, Backend, Frontend
    - Quick-start one-liner per service; link to individual service READMEs
    - _Requirements: 11.6, 16.2–16.6_

  - [~] 27.2 Add environment variable reference section to README
    - Document every env var: `RPC_URL`, `PRIVATE_KEY`, `CONTRACT_ADDRESS`, `BASE_URL`, `JWT_SECRET`, `MONGO_URI`, `AI_ENGINE_URL`, `PORT`, `REACT_APP_API_URL`, `REACT_APP_WS_URL`, `AI_ENGINE_PORT`, `FABRIC_CONNECTION_PROFILE`, `FABRIC_WALLET_PATH`, `WS_PORT`
    - Include example values and description of what each variable controls
    - _Requirements: 16.1_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP. The implementation agent MUST NOT implement `*`-marked sub-tasks.
- All property-based tests use **fast-check** (Node.js/TypeScript) or **Hypothesis** (Python) with a minimum of 100 iterations.
- Each property test references its design document property number and validates specific requirement clauses.
- GPS coordinates are always stored as `int256` fixed-point ×1e6 on-chain; convert to/from float in the backend.
- The DrugCache TTL is hardcoded to 60 seconds; startup validation must reject any other value.
- Checkpoints (tasks 3, 6, 12, 16, 21, 26) are integration gates — do not proceed to the next phase until the checkpoint passes.
- The Fabric network is a local development network only; do not deploy to mainnet or public testnet.


## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "1.5", "1.6"] },
    { "id": 3, "tasks": ["1.7", "2.1"] },
    { "id": 4, "tasks": ["2.2", "4.1"] },
    { "id": 5, "tasks": ["4.2", "5.1"] },
    { "id": 6, "tasks": ["4.3", "5.2", "5.3"] },
    { "id": 7, "tasks": ["5.4", "5.5"] },
    { "id": 8, "tasks": ["5.6", "7.1"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3", "10.1", "10.2", "11.1"] },
    { "id": 10, "tasks": ["8.4", "8.5", "8.6", "9.1", "11.2", "11.3"] },
    { "id": 11, "tasks": ["8.7", "13.1"] },
    { "id": 12, "tasks": ["13.2", "13.3"] },
    { "id": 13, "tasks": ["13.4"] },
    { "id": 14, "tasks": ["13.5", "14.1"] },
    { "id": 15, "tasks": ["14.2", "14.3"] },
    { "id": 16, "tasks": ["15.1"] },
    { "id": 17, "tasks": ["15.2", "15.3"] },
    { "id": 18, "tasks": ["17.1"] },
    { "id": 19, "tasks": ["17.2", "18.1"] },
    { "id": 20, "tasks": ["18.2", "18.3", "19.1"] },
    { "id": 21, "tasks": ["19.2", "20.1"] },
    { "id": 22, "tasks": ["20.2", "20.3", "20.4", "20.5", "20.6"] },
    { "id": 23, "tasks": ["22.1", "23.1", "24.1"] },
    { "id": 24, "tasks": ["22.2", "23.2", "24.2", "25.1"] },
    { "id": 25, "tasks": ["27.1"] },
    { "id": 26, "tasks": ["27.2"] }
  ]
}
```
