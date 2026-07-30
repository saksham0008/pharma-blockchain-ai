# Weekly Progress Reports — Pharma Blockchain AI Project
## Duration: 6 Weeks | Team: 6 Members
## Project: Anti-Counterfeit Drug Authentication using Blockchain & AI

---

# MEMBER 1 — SAKSHAM GUPTA (Team Lead / Blockchain Core Developer)

## Week 1 (Research & Architecture)
**Tasks Completed:**
- Conducted literature review on blockchain-based pharmaceutical supply chain systems
- Studied Hyperledger Fabric vs Polygon architecture for dual-chain design
- Set up development environment: Node.js, Hardhat, MetaMask, Polygon Amoy testnet
- Created GitHub repository structure with branching strategy
- Wrote initial project proposal and architecture diagram
- Attended team kickoff meeting, assigned roles to members

**Commits:** Initial repo setup, README draft, architecture diagram

---

## Week 2 (Smart Contract Development)
**Tasks Completed:**
- Designed the `PharmaSupplyChain.sol` Solidity smart contract
- Implemented base Role enum (Manufacturer, Distributor, Pharmacy) and Drug struct
- Wrote `createDrug()`, `transferDrug()`, `getDrug()` functions
- Set up Hardhat configuration for Polygon Amoy testnet
- Configured `hardhat.config.ts` with network settings and Polygonscan verification
- Deployed initial version to Amoy testnet, verified on Polygonscan

**Commits:** feat: initial smart contract, feat: hardhat config amoy testnet

---

## Week 3 (Smart Contract Extension + Backend Foundation)
**Tasks Completed:**
- Extended smart contract: added GPS coordinates to `transferDrug()` (lat/lng as int256 ×1e6)
- Added `TransferEvent` struct with full chain-of-custody history
- Added `DrugStatus` enum (Active/Recalled/Expired) and `getDrugStatus()` view function
- Implemented `recallDrug()` and `RoleAssigned` event
- Added `getTransferHistory()` and `getTransferCount()` view functions
- Wrote 23 Hardhat tests (unit + property-based using fast-check)
- All tests passing — contract fully covered

**Commits:** feat: GPS transfer history, feat: recall and status functions, test: hardhat unit tests 23 passing

---

## Week 4 (Backend API Development)
**Tasks Completed:**
- Restructured backend from single server.js to modular architecture (routes/, middleware/, services/, models/)
- Built JWT authentication middleware using MetaMask wallet signature verification (ethers.js v6)
- Implemented `contractService.js` — ethers.js wrapper for all on-chain calls
- Implemented `cacheService.js` — 60-second TTL MongoDB cache with invalidation
- Built all 12 REST API endpoints: auth login/me, drug CRUD, transfer, admin recall/assignRole, QR generation, public verify
- Wrote MongoDB Mongoose models: User, GpsLog, AiScoreLog, DrugCache

**Commits:** feat: modular backend structure, feat: JWT auth middleware, feat: all 12 API routes

---

## Week 5 (AI Engine + WebSocket)
**Tasks Completed:**
- Built Python Flask AI risk scoring engine (`ai-engine/scorer.py`)
- Implemented 5 additive scoring rules: expiry proximity, transfer count anomaly, time jump, location jump (Haversine distance), batch recall
- Wired `aiService.js` into transfer route with exponential backoff retry (2s/4s/8s, 3 retries)
- Built WebSocket service (`wsService.js`) with subscription map for real-time drug tracking updates
- Wired WebSocket broadcasts into transfer and recall routes
- Updated `server.js` to share HTTP/WebSocket on same port

**Commits:** feat: python AI risk engine, feat: websocket real-time service, feat: wire AI and WS into transfer route

---

## Week 6 (Integration, Testing, Review)
**Tasks Completed:**
- End-to-end integration testing of full stack: contract → backend → AI engine → WebSocket
- Fixed GPS coordinate precision issues (float to BigInt conversion)
- Updated deploy script to auto-copy ABI to backend
- Code review of team members' pull requests
- Final documentation review and sign-off on architecture
- Project demonstration preparation

**Commits:** fix: GPS precision in contractService, feat: auto ABI copy in deploy script, chore: final integration review

---
---

# MEMBER 2 — [Name] (Hyperledger Fabric Engineer)

## Week 1 (Research & Setup)
**Tasks Completed:**
- Studied Hyperledger Fabric 2.5 architecture (orderers, peers, channels, MSPs, CouchDB)
- Reviewed existing project codebase and blockchain layer requirements
- Set up Docker Desktop and Hyperledger Fabric prerequisites
- Created GitHub branch `feature/hyperledger-fabric`
- Read Hyperledger Fabric documentation on private data collections
- Attended team meeting, reviewed architecture diagram with Saksham

**Commits:** chore: setup branch, docs: hyperledger research notes

---

## Week 2 (Network Configuration)
**Tasks Completed:**
- Designed 3-organization network topology (Manufacturer=Org1, Distributor=Org2, Pharmacy=Org3)
- Created `fabric/docker-compose.yaml` with orderer, 3 org peers, 2 CAs, 2 CouchDB instances
- Configured Docker network `pharma-net` for container communication
- Created `fabric/collections_config.json` with `PharmaPrivateCollection` policy (Org1+Org2 only, Org3 denied)
- Created network startup script `fabric/scripts/startNetwork.sh`
- Tested docker-compose up — all containers start successfully

**Commits:** feat: docker-compose hyperledger network, feat: private collection config

---

## Week 3 (Chaincode Development)
**Tasks Completed:**
- Implemented `PharmaContract` chaincode using `fabric-contract-api` v2.4.1
- Wrote `CreateDrugPrivate()` — stores public record + private data (unitCost, batch notes, invoice ref) from transient map
- Wrote `StorePrivateData()` — update private fields, restricted to Org1/Org2
- Wrote `GetDrugPrivate()` — returns private data, throws ACCESS_DENIED for Org3MSP
- Implemented `SyncToPolygon()` — emits event for backend Polygon relay
- Implemented `GetDrugHistory()` — full CouchDB key history
- Created chaincode `package.json` and `index.js`

**Commits:** feat: pharma chaincode private data, feat: sync to polygon event

---

## Week 4 (Backend Integration)
**Tasks Completed:**
- Implemented `fabricService.js` — Fabric gateway wrapper using `fabric-network` SDK
- Added graceful fallback: if FABRIC_CONNECTION_PROFILE not set, all functions throw FABRIC_UNAVAILABLE
- Updated `fabric/routes/fabric.js` with full GET `/fabric/drug/:id` endpoint
- Added JWT protection with role guard (Manufacturer or Distributor only)
- Tested Pharmacy role returns 403 ACCESS_DENIED as expected
- Created `deployChaincode.sh` script

**Commits:** feat: fabricService.js backend integration, feat: fabric route with role guard

---

## Week 5 (Testing & Debug)
**Tasks Completed:**
- Tested full Fabric network startup and chaincode instantiation
- Verified private data collection access control (Org3 denied as expected)
- Fixed MSP identity check in chaincode (case-sensitive comparison)
- Tested SyncToPolygon event emission and backend relay mechanism
- Integrated with Saksham's backend — fabric route tested end-to-end
- Documented Fabric setup in README section

**Commits:** fix: MSP case sensitive check, test: private collection access verified

---

## Week 6 (Documentation & Final)
**Tasks Completed:**
- Wrote complete Hyperledger setup documentation in README
- Added Docker Compose troubleshooting section
- Created connection profile template for Fabric gateway
- Reviewed and merged pull request
- Demonstrated Fabric private data to team

**Commits:** docs: hyperledger setup guide, chore: final PR cleanup

---
---

# MEMBER 3 — [Name] (Frontend Auth & Routing Engineer)

## Week 1 (Research & Setup)
**Tasks Completed:**
- Studied MetaMask wallet connection and message signing flow
- Reviewed existing React frontend (single App.js file)
- Studied React Router v6 documentation
- Set up local development environment, ran existing frontend
- Created GitHub branch `feature/frontend-auth`
- Identified all hardcoded render.com URLs that need replacement

**Commits:** chore: branch setup, docs: frontend research notes

---

## Week 2 (Context & Routing Setup)
**Tasks Completed:**
- Created `AuthContext.js` with wallet/role/token state and localStorage persistence
- Created `ThemeContext.js` with dark/light mode toggle
- Installed React Router v6: `npm install react-router-dom@6`
- Created `api.js` Axios instance with `REACT_APP_API_URL` base URL and auto-auth headers
- Created `frontend/.env` with API URL configuration
- Replaced all hardcoded render.com URLs in App.js

**Commits:** feat: AuthContext and ThemeContext, feat: api.js axios instance, fix: remove hardcoded URLs

---

## Week 3 (Routing & Protection)
**Tasks Completed:**
- Rewrote `App.js` with full React Router setup — 7 routes covering all roles
- Created `ProtectedRoute.jsx` — redirects to /login if no JWT or wrong role
- Created `Header.jsx` — truncated wallet address, role badge, logout, theme toggle
- Created `LoadingSpinner.jsx` with ARIA accessibility attributes
- All routes protected by role matching, fallback to /login

**Commits:** feat: react router with all routes, feat: protected route component, feat: header component

---

## Week 4 (Login Page)
**Tasks Completed:**
- Built `LoginPage.jsx` with full MetaMask integration
- Implemented wallet connection using `window.ethereum.request`
- Implemented message signing: "Login to PharmaChain at {timestamp}"
- POST to `/auth/login`, handle 403 (no role) and 401 (bad signature) errors
- Implemented role-aware redirect: Manufacturer → /manufacturer, etc.
- Added loading spinner during signing and API call
- Handled MetaMask not installed edge case

**Commits:** feat: login page metamask integration, feat: role-based redirect after login

---

## Week 5 (Integration Testing)
**Tasks Completed:**
- Integrated login flow with live backend
- Tested all 5 role logins (Admin, Manufacturer, Distributor, Pharmacy)
- Fixed JWT token expiry handling — redirect to /login when token expires
- Tested dark/light mode persistence across page refreshes
- Fixed wallet address truncation edge cases
- Code review of teammates' dashboard PRs

**Commits:** fix: JWT expiry redirect, fix: wallet address edge cases, fix: dark mode persistence

---

## Week 6 (Final Polish)
**Tasks Completed:**
- WCAG accessibility audit — added ARIA labels to all interactive elements
- Tested on Chrome, Firefox, Edge
- Final PR review and merge
- Wrote frontend setup section in README

**Commits:** fix: WCAG aria labels, docs: frontend setup in README, chore: final merge

---
---

# MEMBER 4 — [Name] (Frontend Dashboards Engineer)

## Week 1 (Research & Setup)
**Tasks Completed:**
- Reviewed all backend API endpoints and their request/response formats
- Studied React patterns for form validation and async state management
- Created GitHub branch `feature/frontend-dashboards`
- Set up local environment with backend running locally
- Made initial test API calls using Postman

**Commits:** chore: branch setup, docs: API endpoint notes

---

## Week 2 (Manufacturer Dashboard)
**Tasks Completed:**
- Built `ManufacturerDashboard.jsx` — drug registration form with blockchain tx feedback
- Implemented date picker to Unix timestamp conversion for expiry field
- Built QR code generation and download functionality
- Added transfer history display per drug ID
- Integrated LoadingSpinner for 10-30 second blockchain transactions
- Handled contract revert errors with human-readable messages

**Commits:** feat: manufacturer dashboard, feat: QR generation and download

---

## Week 3 (Distributor & Pharmacy Dashboards)
**Tasks Completed:**
- Built `DistributorDashboard.jsx` with transfer form
- Implemented client-side GPS validation: lat -90 to 90, lng -180 to 180
- Shows risk score update after successful transfer
- Built `PharmacyDashboard.jsx` with dispense-to-consumer flow
- Both dashboards show transfer history per drug
- Tested full transfer flow: Manufacturer → Distributor → Pharmacy

**Commits:** feat: distributor dashboard with GPS validation, feat: pharmacy dashboard

---

## Week 4 (Admin Dashboard)
**Tasks Completed:**
- Built `AdminDashboard.jsx` with role assignment section
- Implemented role dropdown mapped to contract enum integers (0-5)
- Implemented drug recall with confirmation dialog
- Showed txHash on all successful operations
- Tested role assignment → login with new role → verify correct dashboard shown

**Commits:** feat: admin dashboard role assignment, feat: recall with confirmation dialog

---

## Week 5 (Polish & Accessibility)
**Tasks Completed:**
- Added form validation messages for all required fields
- Improved error handling — show specific blockchain revert reason
- Added loading states for every async operation
- All form inputs have associated labels (accessibility compliance)
- Dark mode applied consistently across all 4 dashboards
- Fixed GPS validation bug — was not rejecting exactly -90.001

**Commits:** fix: GPS boundary validation, fix: dark mode consistency, feat: form validation messages

---

## Week 6 (Final Review)
**Tasks Completed:**
- Cross-browser testing of all dashboards
- Integration testing with live blockchain (Polygon Amoy)
- Fixed BigInt display issues in transaction hash display
- Final PR review and merge
- Demonstrated all 4 dashboards to team

**Commits:** fix: txHash display formatting, chore: final dashboard PR merge

---
---

# MEMBER 5 — [Name] (Frontend Map & Verification Engineer)

## Week 1 (Research & Setup)
**Tasks Completed:**
- Studied Leaflet.js and react-leaflet for GPS map integration
- Studied html5-qrcode library for QR scanning
- Reviewed WebSocket protocol and subscription patterns
- Created GitHub branch `feature/frontend-verify-map`
- Set up local environment, tested WebSocket connection to backend

**Commits:** chore: branch setup, docs: leaflet and websocket research

---

## Week 2 (Shared UI Components)
**Tasks Completed:**
- Built `RiskBadge.jsx` with 5 color-coded categories — WCAG 4.5:1 compliant
- Built `RecallBanner.jsx` — full-width red alert with ARIA live region
- Built `TransferTimeline.jsx` — vertical timeline with role icons
- Built `QRGenerator.jsx` with download functionality
- Built `QRScannerModal.jsx` using html5-qrcode library

**Commits:** feat: RiskBadge WCAG compliant, feat: RecallBanner alert, feat: TransferTimeline, feat: QR components

---

## Week 3 (GPS Map Component)
**Tasks Completed:**
- Built `GPSMapView.jsx` using react-leaflet MapContainer
- Implemented markers with popups for each GPS coordinate
- Added polyline connecting all transfer points
- Fixed Leaflet default marker icon issue (webpack CSS import problem)
- Implemented auto-bounds fitting when new GPS points added
- Tested with real GPS coordinates from Polygon Amoy test transactions

**Commits:** feat: GPSMapView leaflet component, fix: leaflet default marker icon

---

## Week 4 (Hooks & WebSocket)
**Tasks Completed:**
- Built `useWebSocket.js` hook with subscribe/unsubscribe lifecycle
- Implemented 10-second polling fallback when WebSocket unavailable
- Built `useDrug.js` hook for fetching drug verification data
- Tested live map update when new transfer broadcasted via WebSocket
- Map updates in real-time without page reload — confirmed working

**Commits:** feat: useWebSocket hook with polling fallback, feat: useDrug hook

---

## Week 5 (Public Verify Page)
**Tasks Completed:**
- Built `PublicVerifyPage.jsx` — full consumer verification page
- RecallBanner renders FIRST before all other content
- GPS map, risk badge, transfer timeline all integrated
- QR scanner opens modal for scanning another drug's QR code
- Live WebSocket updates — map and risk score update on new transfer
- Drug not found shows counterfeit warning message
- Tested by scanning real QR code from ManufacturerDashboard

**Commits:** feat: PublicVerifyPage complete, feat: live map updates via websocket

---

## Week 6 (Final Polish)
**Tasks Completed:**
- Tested full consumer journey: scan QR → verify page → live tracking
- Accessibility audit: added ARIA labels to map and timeline
- Fixed recall banner not updating on WebSocket recall message
- Final integration test with full team
- Created component usage guide for README

**Commits:** fix: recall banner live update, docs: component usage guide, chore: final merge

---
---

# MEMBER 6 — [Name] (QA & Documentation Engineer)

## Week 1 (Research & Setup)
**Tasks Completed:**
- Studied property-based testing with fast-check (JavaScript) and Hypothesis (Python)
- Reviewed all 30 correctness properties defined in the design document
- Set up local environment with all 4 services running
- Created GitHub branch `feature/tests-and-docs`
- Ran existing 23 Hardhat tests — all passing — established baseline

**Commits:** chore: branch setup, docs: testing strategy research

---

## Week 2 (Smart Contract Property Tests)
**Tasks Completed:**
- Installed fast-check in root project: `npm install --save-dev fast-check@3.22.0`
- Wrote `test/contract/transferProperties.test.ts` — Properties 9, 10, 12
- Property 9: Transfer round-trip verified (owner, count, history entry)
- Property 10: Non-owner transfer always reverts with "Not owner"
- Property 12: Transfer history append-only — first entry unchanged after second transfer
- All 3 property tests passing (5 runs each)

**Commits:** test: transfer property tests P9 P10 P12

---

## Week 3 (Recall + Status Tests + Backend Tests)
**Tasks Completed:**
- Wrote `test/contract/recallStatus.test.ts` — Properties 15, 16, 17
- Property 15: Expired drug (expiryDate=1) always returns status 2
- Property 16: recallDrug sets status to 1 (Recalled)
- Property 17: Non-admin recall always reverts
- Wrote `test/backend/gpsValidation.test.js` — Property 13
- GPS out-of-range coordinates always return HTTP 400 with INVALID_GPS code
- Valid GPS coordinates always pass middleware (100 fast-check runs)

**Commits:** test: recall status property tests, test: GPS validation property tests P13

---

## Week 4 (Python AI Tests)
**Tasks Completed:**
- Installed Hypothesis: `pip install hypothesis`
- Wrote `ai-engine/test_scorer.py` with Hypothesis property tests
- Property 18: Score always in [0, 100] — tested with 100 random inputs
- Property 20: batchRecalled=True always returns score=100, category="Critical"
- Additional test: Each individual rule fires at correct weight when isolated
- All Hypothesis tests passing

**Commits:** test: hypothesis property tests AI scorer P18 P20

---

## Week 5 (README & Documentation)
**Tasks Completed:**
- Wrote complete `README.md` — prerequisites, step-by-step setup for all 4 services
- Created environment variables reference table
- Wrote "How to Use" section: role assignment → drug registration → QR scan flow
- Created `backend/.env.example` with all 9 env vars and descriptions
- Created `frontend/.env.example` with 2 env vars and descriptions
- Wrote Hyperledger Fabric optional setup section
- Wrote troubleshooting section for common errors

**Commits:** docs: complete README setup guide, docs: env.example files

---

## Week 6 (Final Test Run & Review)
**Tasks Completed:**
- Ran full test suite: `npx hardhat test` — 23 tests pass
- Ran Python tests: `python -m pytest test_scorer.py -v` — all pass
- Ran GPS validation tests: `node test/backend/gpsValidation.test.js`
- Identified and fixed one flaky test (timing issue in transfer count test)
- Final README review with Saksham
- Project submission checklist completed

**Commits:** fix: flaky test timing issue, docs: final README review, chore: submission checklist

---

# Summary Table

| Member | Role | Main Contribution |
|--------|------|-------------------|
| Saksham Gupta | Team Lead | Smart contract, backend, auth, AI engine, WebSocket |
| Member 1 | Hyperledger Engineer | Private blockchain, chaincode, Fabric integration |
| Member 2 | Frontend Auth | React Router, AuthContext, LoginPage, Header |
| Member 3 | Frontend Dashboards | 4 role-based operational dashboards |
| Member 4 | Frontend Map | GPS map, verification page, QR scanner, WebSocket hook |
| Member 5 | QA & Docs | Property tests, README, env templates |
