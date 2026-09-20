# Project Progress Diary
## Project Title: PharmChain AI — Anti-Counterfeit Drug Authentication System
## Team: [Team Name] | Mentor: [Mentor Name] | Academic Year: 2024–2025
## Duration: 18 Weeks

---

---

## WEEK 1

### Work Done This Week
- Conducted team kickoff meeting and finalized project topic
- Researched existing pharmaceutical counterfeiting problems and reviewed WHO reports
- Studied blockchain-based supply chain literature and reference papers
- Explored available blockchain frameworks: Ethereum, Polygon, Hyperledger Fabric
- Set up GitHub repository: `saksham0008/pharma-blockchain-ai`
- Created initial project folder structure
- Installed development environment: Node.js, Git, VS Code, MetaMask extension
- Drafted initial project proposal document

### Work To Be Done Next Week
- Finalize system architecture and component diagram
- Begin Solidity smart contract design
- Set up Hardhat development environment
- Study Hyperledger Fabric documentation
- Define roles and responsibilities for each team member

---

## WEEK 2

### Work Done This Week
- Finalized dual-blockchain architecture: Polygon (public) + Hyperledger Fabric (private)
- Designed system architecture diagram showing all components and data flows
- Set up Hardhat with Polygon Amoy testnet configuration in `hardhat.config.ts`
- Created initial `PharmaSupplyChain.sol` smart contract with basic Drug struct
- Defined Role enum: None, Manufacturer, Distributor, Pharmacy
- Implemented `createDrug()` function (Manufacturer only)
- Implemented `assignRole()` function (Admin only)
- Implemented `getDrug()` view function
- Opened Polygon Amoy testnet wallet, obtained test MATIC from faucet

### Work To Be Done Next Week
- Add ownership transfer functionality to smart contract
- Add AI risk score field to Drug struct
- Begin writing Hardhat unit tests
- Set up Node.js Express backend skeleton
- Research QR code generation libraries

---

## WEEK 3

### Work Done This Week
- Extended `PharmaSupplyChain.sol`:
  - Added `transferDrug()` function with ownership change
  - Added `riskScore` field (uint256) to Drug struct
  - Added `updateRiskScore()` function (Admin only)
  - Added events: `DrugCreated`, `DrugTransferred`, `RiskScoreUpdated`
- Set up Node.js Express backend with basic server structure
- Implemented `POST /createDrug`, `GET /getDrug/:id`, `POST /assignRole` endpoints
- Integrated `ethers.js v6` for blockchain communication
- Added QR code generation endpoint `GET /generateQR/:drugID`
- Added public drug verification endpoint `GET /verify/:drugID`
- Deployed initial contract version to Polygon Amoy testnet

### Work To Be Done Next Week
- Extend smart contract with GPS coordinate tracking per transfer
- Add drug status management (Active, Recalled, Expired)
- Add recall functionality
- Begin writing Hardhat tests
- Set up React frontend skeleton

---

## WEEK 4

### Work Done This Week
- Extended `PharmaSupplyChain.sol` with major new features:
  - Added `TransferEvent` struct with GPS coordinates (lat/lng as int256 ×1e6), timestamp, sequence index
  - Added `TransferEvent[]` history array inside Drug struct
  - Added `DrugStatus` enum: Active, Recalled, Expired
  - Added `bool recalled` field to Drug struct
  - Updated `transferDrug()` to accept lat/lng params and append to history
  - Added `recallDrug()` function (Admin only) with `DrugRecalled` event
  - Added `getDrugStatus()` view function (computes Expired dynamically from block timestamp)
  - Added `getTransferHistory()` and `getTransferCount()` view functions
  - Added `Consumer` and `Admin` to Role enum
  - Added `RoleAssigned` event to `assignRole()`
- Updated Hardhat deploy script to auto-copy ABI to backend

### Work To Be Done Next Week
- Write complete Hardhat unit test suite (target: 20+ tests)
- Write property-based tests using fast-check
- Begin modular backend restructure
- Set up MongoDB for off-chain data storage

---

## WEEK 5

### Work Done This Week
- Wrote 19 Hardhat unit tests covering:
  - All revert message strings ("Drug already exists", "Not owner", "Only admin allowed", etc.)
  - Drug status transitions (Active → Recalled, Active → Expired)
  - Transfer history append-only immutability
  - GPS coordinate storage and retrieval
  - Risk score set/get by admin
  - Double recall prevention
  - `RoleAssigned` and `DrugRecalled` event emission
- Wrote 4 property-based tests using `fast-check`:
  - Property 1: Drug registration round-trip
  - Property 2: Duplicate registration always rejected
  - Property 3: Non-manufacturer always reverts
  - Property 4: Past expiry always returns Expired status
- All 23 tests passing

### Work To Be Done Next Week
- Restructure backend into modular architecture (routes/, middleware/, services/, models/)
- Implement MongoDB Mongoose models
- Implement JWT authentication middleware
- Begin contractService.js (ethers.js wrapper)

---

## WEEK 6

### Work Done This Week
- Restructured backend from single `server.js` to modular architecture:
  - `backend/routes/` — auth.js, drugs.js, transfer.js, admin.js, qr.js, fabric.js
  - `backend/middleware/` — auth.js (JWT), validate.js (GPS)
  - `backend/services/` — contractService.js, cacheService.js, aiService.js, wsService.js, fabricService.js
  - `backend/models/` — User.js, GpsLog.js, AiScoreLog.js, DrugCache.js
- Installed and configured MongoDB with Mongoose
- Created all 4 Mongoose models with proper indexes and TTL configuration
- Implemented `contractService.js` — ethers.js v6 wrapper for all on-chain calls including GPS fixed-point conversion
- Implemented `cacheService.js` — 60-second TTL cache with MongoDB TTL index

### Work To Be Done Next Week
- Implement JWT authentication system with MetaMask wallet signature verification
- Implement GPS validation middleware
- Implement all 12 REST API endpoints
- Begin Python AI engine development

---

## WEEK 7

### Work Done This Week
- Implemented JWT authentication middleware:
  - `issueToken()` — signs JWT with 8-hour expiry
  - `requireAuth` middleware — validates Bearer token
  - `roleGuard()` factory — restricts endpoints by role
- Implemented wallet signature verification using `ethers.verifyMessage()`
- Implemented GPS coordinate validation middleware (lat: -90 to 90, lng: -180 to 180)
- Implemented all authentication routes:
  - `POST /auth/login` — MetaMask signature → role check → JWT issuance
  - `GET /auth/me` — returns wallet and role from token
- Implemented all drug routes:
  - `POST /api/drugs` — register on-chain + MongoDB metadata
  - `GET /api/drugs/:id` — cached drug detail (60s TTL)
  - `GET /api/drugs/:id/history` — full transfer history with role labels
  - `GET /api/drugs/:id/status` — current drug status
  - `GET /api/drugs/:id/gps` — ordered GPS log entries

### Work To Be Done Next Week
- Implement transfer, admin, and QR routes
- Build Python Flask AI risk scoring engine
- Implement WebSocket real-time service
- Begin frontend React restructure

---

## WEEK 8

### Work Done This Week
- Implemented remaining backend routes:
  - `POST /api/transfer` — GPS validation, on-chain transfer, GPS log, cache invalidation, AI trigger
  - `POST /admin/recall` — recall drug + set risk to 100 + WebSocket broadcast
  - `POST /admin/assignRole` — assign on-chain role to wallet
  - `GET /api/generateQR/:drugID` — QR code generation (base64 PNG)
  - `GET /verify/:drugID` — public verification (HTML + JSON, no auth)
- Built Python Flask AI risk scoring engine (`ai-engine/scorer.py`):
  - 5 additive rules: expiry proximity, transfer count anomaly, time jump, location jump (Haversine), batch recall
  - Categories: Uncolored/Low/Medium/High/Critical
  - `POST /score` endpoint
  - `GET /health` endpoint
- Implemented `aiService.js` with exponential backoff retry (2s/4s/8s, 3 retries)
- All 12 backend endpoints operational

### Work To Be Done Next Week
- Implement WebSocket real-time service
- Wire WebSocket broadcasts into transfer and recall routes
- Set up React frontend with React Router and authentication
- Implement MetaMask login page

---

## WEEK 9

### Work Done This Week
- Implemented WebSocket service (`wsService.js`):
  - In-memory subscription map (drugID → Set of WebSocket clients)
  - `init()` — attaches WebSocket server to HTTP server
  - `broadcast()` — sends JSON to all subscribers of a drugID
  - Malformed JSON handling (close with code 1008)
  - Dead socket cleanup on disconnect
- Wired WebSocket broadcasts into transfer route (sends transfer + new risk score)
- Wired WebSocket broadcasts into recall route (sends recall alert)
- Backend server updated to share HTTP and WebSocket on same port
- Frontend restructured with React Router v6:
  - `AuthContext.js` — wallet/role/token with localStorage persistence
  - `ThemeContext.js` — dark/light mode with localStorage
  - `api.js` — Axios instance with auto Bearer token header
  - All hardcoded render.com URLs replaced with `REACT_APP_API_URL`

### Work To Be Done Next Week
- Implement LoginPage with full MetaMask integration
- Implement Header, ProtectedRoute, LoadingSpinner components
- Implement public VerifyPage
- Create dashboard placeholder pages for all roles

---

## WEEK 10

### Work Done This Week
- Implemented `LoginPage.jsx`:
  - MetaMask wallet connection via `eth_requestAccounts`
  - Message signing via `personal_sign`
  - Backend authentication with error handling (403 no role, 401 bad signature)
  - Role-based redirect after login
  - Beautiful UI with dark mode support
- Implemented `Header.jsx` — truncated wallet, color-coded role badges, logout, theme toggle
- Implemented `ProtectedRoute.jsx` — role-based redirect to /login
- Implemented `LoadingSpinner.jsx` — 3 sizes, ARIA accessible
- Implemented `VerifyPage.js` — public drug verification page (no auth)
- Created placeholder dashboard pages for all 5 roles:
  - AdminDashboard, ManufacturerDashboard, DistributorDashboard, PharmacyDashboard, ConsumerDashboard
- Created `vercel.json` and `_redirects` for deployment configuration
- Merged frontend auth branch into main (21 files, zero conflicts)

### Work To Be Done Next Week
- Implement full Manufacturer Dashboard (drug registration, QR generation, history)
- Implement full Distributor Dashboard (transfer with GPS)
- Implement full Pharmacy Dashboard (dispense flow)
- Implement full Admin Dashboard (role assignment, recall)

---

## WEEK 11

### Work Done This Week
- Implemented `ManufacturerDashboard.js` (full implementation):
  - Drug registration form with blockchain transaction feedback
  - Date picker with Unix timestamp conversion for expiry
  - QR code generation and download button
  - Transfer history view per drug
  - Loading spinner during blockchain transactions (10-30 seconds)
  - Smart contract revert error display
- Implemented `DistributorDashboard.js`:
  - Drug transfer form with GPS input fields
  - Client-side GPS validation (lat -90 to 90, lng -180 to 180)
  - Real-time risk score and category display after transfer
  - Transfer history view
- Dark mode support across all dashboards

### Work To Be Done Next Week
- Implement Pharmacy Dashboard (dispense to consumer)
- Implement Admin Dashboard (role assignment and recall)
- Implement GPS map component using Leaflet.js
- Begin shared UI components (RiskBadge, RecallBanner, TransferTimeline)

---

## WEEK 12

### Work Done This Week
- Implemented `PharmacyDashboard.js`:
  - Drug lookup by ID
  - Dispense-to-consumer form with consumer wallet address input
  - Transfer submission and success feedback
- Implemented full `AdminDashboard.js`:
  - Role assignment form with dropdown (None/Admin/Manufacturer/Distributor/Pharmacy/Consumer → 0-5)
  - Drug recall with confirmation dialog ("Are you sure?" before submission)
  - Success display with txHash
- Implemented shared UI components:
  - `RiskBadge.jsx` — color-coded (Uncolored/Low/Medium/High/Critical), WCAG 4.5:1 compliant
  - `RecallBanner.jsx` — full-width red banner, ARIA live="assertive", renders before all drug info
  - `TransferTimeline.jsx` — vertical timeline with role icons, timestamps, GPS coordinates

### Work To Be Done Next Week
- Implement GPS Map component using Leaflet.js
- Implement QRGenerator and QRScannerModal components
- Implement useWebSocket and useDrug hooks
- Update public VerifyPage to use new full /verify/:drugID endpoint

---

## WEEK 13

### Work Done This Week
- Implemented `GPSMapView.jsx` using react-leaflet:
  - Interactive Leaflet.js map with OpenStreetMap tiles
  - Markers at each GPS coordinate with popup (role, timestamp, index)
  - Polyline connecting all transfer points in chronological order
  - Auto-fit bounds to all markers
  - Empty state message when no GPS data
  - Fixed Leaflet default marker icon issue (webpack CSS import)
- Implemented `QRGenerator.jsx` — display + programmatic download as PNG
- Implemented `QRScannerModal.jsx` — html5-qrcode scanner with close button
- Implemented `useWebSocket.js` hook:
  - Subscribe/unsubscribe lifecycle management
  - 10-second polling fallback when WebSocket unavailable
  - Returns `{ isConnected, lastMessage }`
- Implemented `useDrug.js` hook — fetch drug data with loading/error states

### Work To Be Done Next Week
- Implement complete PublicVerifyPage using new API endpoint
- Set up Hyperledger Fabric local network
- Write Hyperledger chaincode
- Integrate Fabric with backend

---

## WEEK 14

### Work Done This Week
- Implemented full `PublicVerifyPage.jsx`:
  - Fetches `GET /verify/:drugID` (no auth)
  - `RecallBanner` renders first (before all drug info) when recalled
  - Drug info card with name, batch, manufacturer, expiry, status
  - `RiskBadge` with color-coded risk score
  - `GPSMapView` with full GPS journey path
  - `TransferTimeline` with complete transfer history
  - WebSocket live updates — map and risk score update without page reload
  - Recall alert received via WebSocket triggers banner immediately
  - Drug not found shows "❌ May be counterfeit" message
- Set up Hyperledger Fabric 2.5 local network:
  - `fabric/docker-compose.yaml` — orderer, 3 org peers (Org1=Manufacturer, Org2=Distributor, Org3=Pharmacy), 2 CAs, 2 CouchDB
  - `fabric/collections_config.json` — PharmaPrivateCollection (Org1+Org2 only, Org3 denied)

### Work To Be Done Next Week
- Implement Hyperledger chaincode (PharmaContract)
- Integrate Fabric with Node.js backend
- Write property-based tests for AI engine
- Begin integration testing

---

## WEEK 15

### Work Done This Week
- Implemented `PharmaContract` Hyperledger chaincode:
  - `CreateDrugPrivate()` — stores public record + private data (unitCost, batchNotes, invoiceRef) in PharmaPrivateCollection
  - `StorePrivateData()` — updates private fields, Org1/Org2 only
  - `GetDrugPrivate()` — returns private data, throws ACCESS_DENIED for Org3MSP
  - `SyncToPolygon()` — emits event for backend Polygon relay
  - `GetDrugHistory()` — full CouchDB key history
- Implemented `fabricService.js` — Fabric gateway wrapper with graceful FABRIC_UNAVAILABLE fallback
- Implemented `GET /fabric/drug/:id` endpoint (Manufacturer/Distributor only, 503 if Fabric not running)
- Wrote Hypothesis property-based tests for AI engine:
  - Property 18: Score always bounded [0, 100]
  - Property 20: Recalled drug always returns score=100, category=Critical
- Wrote backend GPS validation property tests using fast-check (Property 13)

### Work To Be Done Next Week
- Complete smart contract property tests
- Full integration testing of all layers
- Write complete README
- Generate team documentation and progress reports

---

## WEEK 16

### Work Done This Week
- Completed all integration testing:
  - Full drug lifecycle tested: Register → Transfer ×3 → Verify → Recall → Verify again
  - JWT auth flow end-to-end: wallet sign → login → protected endpoints
  - AI Engine trigger confirmed after every transfer
  - WebSocket broadcast received by frontend client on transfer and recall
  - Cache invalidation verified — fresh data after transfer
  - Fabric private data: Org1 access OK, Org3 denied as expected
- Fixed GPS coordinate precision bug in contractService.js (float → BigInt conversion)
- Fixed Leaflet map default marker icon issue in GPSMapView
- Fixed recall banner not updating on WebSocket recall message
- Updated VerifyPage to use new `/verify/:drugID` endpoint with full history

### Work To Be Done Next Week
- Complete README documentation
- Generate team progress reports and mentor report
- Final code review and cleanup
- Prepare project demonstration

---

## WEEK 17

### Work Done This Week
- Wrote complete `README.md` with:
  - Project overview and problem statement
  - Full system architecture diagram
  - Tech stack table
  - Step-by-step setup instructions for all 4 services
  - Complete API documentation (all 12 endpoints)
  - Smart contract function reference
  - AI scoring rules explanation
  - How-to-use guide for each role
  - WebSocket protocol documentation
  - Troubleshooting section
  - Environment variable reference
- Created `.env.example` files for backend, frontend, and AI engine
- Created team documentation:
  - `team-docs/TEAM_DIVISION.md` — work breakdown per member
  - `team-docs/GPT_PROMPTS_ALL_MEMBERS.md` — AI-assisted development prompts
  - `team-docs/PROJECT_REPORT_MENTOR.md` — formal mentor report
- Updated `.gitignore` to exclude all `.env` files, Python cache, Fabric crypto material

### Work To Be Done Next Week
- Final testing on all browsers (Chrome, Firefox, Edge)
- Deploy to Polygon Amoy testnet (final contract deployment)
- Prepare presentation slides
- Submit final project report to mentor

---

## WEEK 18

### Work Done This Week
- Final end-to-end testing on Chrome, Firefox, and Edge browsers
- Deployed final version of `PharmaSupplyChain.sol` to Polygon Amoy testnet
- Verified contract on Polygonscan
- All 23 Hardhat tests passing on final contract version
- All Hypothesis (Python) property tests passing
- All fast-check (JavaScript) property tests passing
- Prepared project demonstration flow:
  - Admin assigns roles → Manufacturer registers drug → QR generated → Distributor transfers with GPS → Pharmacy dispenses → Consumer scans QR → Live map shows full journey
- Prepared final presentation slides
- Submitted project report to mentor
- Conducted final team code review
- All branches merged into main

### Work To Be Done Next Week
- Project submission complete ✅
- Viva/demonstration scheduled

---

## Summary

| Week | Key Milestone |
|------|--------------|
| 1 | Project kickoff, research, environment setup |
| 2 | Smart contract v1, basic backend, Hardhat setup |
| 3 | transferDrug, risk score, QR endpoints, testnet deploy |
| 4 | GPS tracking, recall, DrugStatus, TransferHistory |
| 5 | 23 Hardhat tests passing |
| 6 | Modular backend, MongoDB models, cacheService |
| 7 | JWT auth, 7 drug endpoints |
| 8 | 12 endpoints complete, Python AI engine |
| 9 | WebSocket, React Router, AuthContext |
| 10 | LoginPage, Header, ProtectedRoute, dashboard placeholders |
| 11 | Manufacturer + Distributor dashboards |
| 12 | Pharmacy + Admin dashboards, RiskBadge, RecallBanner |
| 13 | GPS map, QR scanner, WebSocket hook |
| 14 | PublicVerifyPage, Hyperledger Fabric network setup |
| 15 | Hyperledger chaincode + backend integration, property tests |
| 16 | Full integration testing, bug fixes |
| 17 | Complete README, documentation, env examples |
| 18 | Final testing, testnet deployment, submission |

---

*Mentor Signature: _________________________ Date: _____________*
