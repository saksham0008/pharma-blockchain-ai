# GPT Prompts for All Team Members
## Pharma Blockchain AI — Anti-Counterfeit Drug Authentication System
### Instructions: Copy the exact prompt below and paste it into ChatGPT or any AI assistant

---

## MEMBER 1 PROMPT — Hyperledger Fabric Setup

```
I am working on a pharma supply chain anti-counterfeit system built with Node.js, Solidity (Polygon Amoy testnet), and Hyperledger Fabric. I need to set up the Hyperledger Fabric private blockchain layer.

PROJECT CONTEXT:
- Backend: Node.js/Express already built, files in backend/ folder
- Existing backend services: contractService.js (Polygon), cacheService.js, aiService.js, wsService.js
- The backend already has backend/services/fabricService.js and backend/routes/fabric.js as empty stubs
- Tech stack: Node.js 18, ethers.js v6, MongoDB, Express 5

TASK 1 - Create fabric/docker-compose.yaml:
Create a local Hyperledger Fabric 2.5 network with:
- 1 orderer: orderer.example.com on port 7050
- 3 org peers: peer0.org1.example.com (Manufacturer, port 7051), peer0.org2.example.com (Distributor, port 8051), peer0.org3.example.com (Pharmacy, port 9051)
- 2 CAs: ca.org1.example.com (port 7054), ca.org2.example.com (port 8054)
- 2 CouchDB state DBs: couchdb0 (port 5984) for org1, couchdb1 (port 6984) for org2
- 1 CLI container for setup commands
- All on Docker network named "pharma-net"
- Use Hyperledger Fabric 2.5 and fabric-ca 1.5 images

TASK 2 - Create fabric/collections_config.json:
Private collection named "PharmaPrivateCollection". Policy: OR('Org1MSP.member', 'Org2MSP.member'). Org3MSP (Pharmacy) is excluded. Set memberOnlyRead: true and memberOnlyWrite: true. requiredPeerCount: 1, maxPeerCount: 3, blockToLive: 0.

TASK 3 - Create fabric/chaincode/pharma/pharmaContract.js:
A Hyperledger Fabric chaincode using fabric-contract-api v2.4.1 with class PharmaContract extending Contract:
- InitLedger(ctx): log initialised
- CreateDrugPrivate(ctx, drugID): Only Org1MSP or Org2MSP allowed (throw ACCESS_DENIED otherwise). Read transient "privateData" containing unitCost, batchProductionNotes, supplierInvoiceRef. Store public record on world state (drugID, syncedToPolygon: false, lastSyncedAt). Store private record in PharmaPrivateCollection.
- StorePrivateData(ctx, drugID): Org1/Org2 only. Update private fields from transient data.
- SyncToPolygon(ctx, drugID, eventType): Mark record syncedToPolygon: false, add pendingSync object, emit SyncToPolygon event via ctx.stub.setEvent
- GetDrug(ctx, drugID): Return public state
- GetDrugPrivate(ctx, drugID): Throw ACCESS_DENIED for Org3MSP. Return private collection data.
- GetDrugHistory(ctx, drugID): Use getHistoryForKey, return array of {txId, timestamp, isDelete, value}

TASK 4 - Create fabric/chaincode/pharma/index.js:
module.exports.contracts = [PharmaContract]

TASK 5 - Create fabric/chaincode/pharma/package.json:
name: pharma-chaincode, version: 1.0.0, main: index.js, dependencies: fabric-contract-api@2.4.1, fabric-shim@2.4.1

TASK 6 - Replace backend/services/fabricService.js stub:
Check if FABRIC_CONNECTION_PROFILE and FABRIC_WALLET_PATH env vars are set. If not, all functions throw "FABRIC_UNAVAILABLE: Fabric not configured". If set, connect using fabric-network (dynamic require with try/catch). Export: getDrugPrivate(drugID), createDrugPrivate(drugID, privateData), syncToPolygon(drugID, eventType), getDrugHistory(drugID), and constant FABRIC_ENABLED (boolean).

TASK 7 - Replace backend/routes/fabric.js stub:
GET /fabric/drug/:id — requireAuth middleware + roleGuard("Manufacturer", "Distributor"). If FABRIC_ENABLED is false, return HTTP 503 with helpful hint message. Call fabricService.getDrugPrivate. Handle ACCESS_DENIED → 403, not found → 404, FABRIC_UNAVAILABLE → 503.

TASK 8 - Create fabric/scripts/startNetwork.sh and deployChaincode.sh bash scripts

After each JS file, verify with: node --check <filename>
Use Hyperledger Fabric 2.5 Docker images.
```

---

## MEMBER 2 PROMPT — React Frontend Auth + Routing

```
I am building the React frontend authentication and routing layer for a pharma supply chain blockchain system.

PROJECT CONTEXT:
- Existing frontend: single App.js file using Create React App (React 19), located in frontend/ folder
- Backend API runs at http://localhost:4000 (Express/Node.js, already built)
- Auth flow: MetaMask wallet connects → signs message → POST /auth/login → backend returns JWT with role
- Roles: Admin, Manufacturer, Distributor, Pharmacy, Consumer
- The existing App.js has hardcoded "https://pharma-backend-foox.onrender.com" — ALL occurrences must be replaced
- Dark mode toggle already exists in App.js — preserve it

SETUP - Install dependencies first:
cd frontend && npm install react-router-dom@6

TASK 1 - Create frontend/.env:
REACT_APP_API_URL=http://localhost:4000
REACT_APP_WS_URL=ws://localhost:4000

TASK 2 - Create src/contexts/AuthContext.js:
React context with state: { wallet (string), role (string), token (string) }
Actions:
- login(token, role, wallet): save all three to state AND localStorage (keys: pharma_token, pharma_role, pharma_wallet)
- logout(): clear state and localStorage
On init: read from localStorage to restore session
Export: AuthProvider component AND useAuth() hook

TASK 3 - Create src/contexts/ThemeContext.js:
State: { darkMode (bool) }
Action: toggleDarkMode()
Init: read from localStorage key "pharma_dark_mode"
On toggle: update state and localStorage
Export: ThemeProvider AND useTheme() hook

TASK 4 - Create src/services/api.js:
Axios instance, baseURL = process.env.REACT_APP_API_URL
Request interceptor: read token from localStorage ("pharma_token"), if exists add header Authorization: Bearer <token>
Export as default

TASK 5 - Rewrite src/App.js:
- Wrap entire app in <ThemeProvider><AuthProvider><BrowserRouter>
- Apply darkMode class to root div using useTheme()
- Define Routes:
  /login → <LoginPage>
  /manufacturer → <ProtectedRoute role="Manufacturer"><ManufacturerDashboard>
  /distributor → <ProtectedRoute role="Distributor"><DistributorDashboard>
  /pharmacy → <ProtectedRoute role="Pharmacy"><PharmacyDashboard>
  /admin → <ProtectedRoute role="Admin"><AdminDashboard>
  /verify/:drugID → <PublicVerifyPage> (no auth)
  * → <Navigate to="/login">
- Remove ALL hardcoded render.com URLs (replaced by api.js)
- Import all pages (they may not exist yet — use lazy imports with Suspense)

TASK 6 - Create src/components/ProtectedRoute.jsx:
Props: role (optional string), children
Read token and role from useAuth()
If no token → <Navigate to="/login" replace>
If role prop provided and user role does not match → <Navigate to="/login" replace>
Otherwise → render children

TASK 7 - Create src/components/Header.jsx:
Props: none (reads from AuthContext and ThemeContext)
Display: wallet address truncated (first 6 chars + "..." + last 4 chars)
Role badge: colored span (Admin=purple, Manufacturer=blue, Distributor=orange, Pharmacy=green)
Logout button: calls logout() from useAuth(), navigates to /login
Theme toggle: button calls toggleDarkMode(), shows "☀️ Light" or "🌙 Dark"
Use semantic HTML header element with proper ARIA labels

TASK 8 - Create src/components/LoadingSpinner.jsx:
CSS spinner using border-radius animation
Props: size (default "medium"), message (optional string below spinner)
ARIA: role="status", aria-label="Loading"

TASK 9 - Create src/pages/LoginPage.jsx:
State: loading, error, walletAddress
Step 1: "Connect MetaMask" button → window.ethereum.request({method: 'eth_requestAccounts'}) → setWalletAddress
Step 2 (auto after connect): sign message → window.ethereum.request({method: 'personal_sign', params: [message, account]}) where message = "Login to PharmaChain at " + Date.now()
Step 3: POST to /auth/login with {walletAddress, signature, message} using api.js (no auth header for this call)
On success: call login(token, role, wallet), navigate to "/"+role.toLowerCase()
On 403: show "This wallet has no role assigned. Contact admin."
On 401: show "Signature verification failed. Try again."
Show LoadingSpinner during signing and API call
Handle MetaMask not installed: show "Please install MetaMask"
```

---

## MEMBER 3 PROMPT — Role-Based Dashboards

```
I am building role-based dashboard pages for a pharma supply chain blockchain React app. Auth is already set up (AuthContext with wallet/role/token). The Axios API service is at src/services/api.js with auth headers auto-attached.

BACKEND APIs AVAILABLE:
- POST /api/drugs → body: {drugID, name, batchNumber, expiryTimestamp (unix seconds), manufacturerName, contactEmail} → returns {success, txHash, drugID}
- GET /api/drugs/:id → returns {drugID, name, batchNumber, expiryDate, currentOwner, riskScore, status, riskCategory, recalled}
- GET /api/drugs/:id/history → returns {transferHistory: [{index, from, fromRole, to, toRole, timestamp, lat, lng, locationName}], status, riskScore, riskCategory, recallNotice}
- GET /api/generateQR/:drugID → returns {qr: "data:image/png;base64,...", verifyURL}
- POST /api/transfer → body: {drugID, toAddress, lat, lng} → returns {success, txHash, newRiskScore, riskCategory}
- POST /admin/assignRole → body: {address, role (integer 0-5)} → returns {success, txHash, roleName}
  Role mapping: 0=None, 1=Admin, 2=Manufacturer, 3=Distributor, 4=Pharmacy, 5=Consumer
- POST /admin/recall → body: {drugID} → returns {success, txHash}

COMPONENTS AVAILABLE (already built by teammate):
- <LoadingSpinner> — shows during loading
- <Header> — navigation header
- RiskBadge, RecallBanner, TransferTimeline (being built by another teammate — import but can use fallback div if not ready)

TASK 1 - Create src/pages/ManufacturerDashboard.jsx:
Section A — Register Drug:
- Form with fields: Drug ID (text), Name (text), Batch Number (text), Expiry Date (date picker — convert to Unix timestamp), Manufacturer Name (text), Contact Email (email)
- Submit: POST /api/drugs, show success message with txHash on green background
- Show blockchain error (err.response.data.error) in red if failed
- Show LoadingSpinner during transaction (blockchain can take 10-30 seconds)

Section B — My Drugs Table:
- For now, user can enter a Drug ID to look up their drugs (GET /api/drugs/:id)
- Show table: Drug ID, Name, Status, Risk Score, Expiry

Section C — QR Code:
- Input drug ID, click Generate → GET /api/generateQR/:id
- Show QR image in a modal/card
- Download button: create <a> with href=qrDataURL, download="drugQR.png", click it

Section D — Transfer History:
- Input drug ID, click View → GET /api/drugs/:id/history
- Show simple list: Transfer #N: from → to at timestamp

TASK 2 - Create src/pages/DistributorDashboard.jsx:
Section A — My Drugs (drugs I currently own):
- Input wallet address (pre-filled from useAuth()), show message to look up drugs by ID for now

Section B — Transfer Drug:
- Form: Drug ID, Recipient Address (0x...), Latitude (number), Longitude (number)
- CLIENT-SIDE VALIDATION: lat must be between -90 and 90, lng between -180 and 180. Show error immediately if invalid (do NOT call API).
- Submit: POST /api/transfer
- Show result: success with new risk score and risk category badge
- Show LoadingSpinner during transfer

TASK 3 - Create src/pages/PharmacyDashboard.jsx:
Section A — Drugs I Hold: Same as Distributor — show lookup by drug ID
Section B — Dispense to Consumer:
- Form: Drug ID, Consumer Wallet Address (0x...)
- Submit: POST /api/transfer (lat: 0, lng: 0 as placeholder)
- Show success message

TASK 4 - Create src/pages/AdminDashboard.jsx:
Section A — Assign Role:
- Form: Wallet Address (text), Role dropdown (None/Admin/Manufacturer/Distributor/Pharmacy/Consumer)
- Map role name to integer: None=0, Admin=1, Manufacturer=2, Distributor=3, Pharmacy=4, Consumer=5
- Submit: POST /admin/assignRole
- Show result with txHash

Section B — Recall Drug:
- Form: Drug ID (text)
- Before submit: show confirm dialog "Are you sure you want to recall drug [ID]? This cannot be undone."
- Submit: POST /admin/recall
- Show success with txHash and warning message

ALL DASHBOARDS MUST:
- Import and use Header component at top
- Show LoadingSpinner during any API call
- Display blockchain revert error: err?.response?.data?.error || "Transaction failed"
- Support dark mode: read darkMode from useTheme(), apply className={darkMode ? "container dark" : "container"}
- Use the existing App.css styles (card, container, dark classes already exist)
- All form inputs must have associated labels (accessibility)
```

---

## MEMBER 4 PROMPT — Public Verify Page + Map + Shared Components

```
I am building the public drug verification page and shared UI components for a pharma blockchain React app.

PROJECT CONTEXT:
- Backend GET /verify/:drugID returns JSON: {drugID, name, batchNumber, manufacturer, expiryDate (DD-MMM-YYYY), status ("Active"/"Recalled"/"Expired"), riskScore (0-100), riskCategory ("Uncolored"/"Low"/"Medium"/"High"/"Critical"), recalled (bool), recallNotice (null or {recalled:true}), transferHistory [{index, from, fromRole, to, toRole, timestamp, lat, lng, locationName}], gpsPath [{lat, lng, actorRole, timestamp, transferIndex}]}
- WebSocket server at REACT_APP_WS_URL broadcasts messages:
  Transfer: {type:"transfer", drugID, newOwner, lat, lng, timestamp, riskScore, riskCategory}
  Recall: {type:"recall", drugID, timestamp}
- GPS coordinates are decimal lat/lng floats (e.g. 28.6139, 77.2090)
- This page is PUBLIC — no authentication required

SETUP - Install dependencies:
cd frontend
npm install leaflet react-leaflet@4 html5-qrcode

TASK 1 - Create src/components/RiskBadge.jsx:
Props: score (number 0-100)
Render a colored span badge with label and score:
- score === 0: background #888, label "Uncolored", text white
- 1-24: background #22c55e (green), label "Low ✓"
- 25-49: background #eab308 (yellow), label "Medium ⚠", text black
- 50-74: background #f97316 (orange), label "High ⚠", text white
- 75-100: background #ef4444 (red), label "Critical ✗", text white
All combos must meet WCAG 4.5:1 contrast ratio.
Add aria-label="Risk level: {label}, score {score}"

TASK 2 - Create src/components/RecallBanner.jsx:
Props: recalled (bool), drugID (string)
When recalled=true render: full-width div, red background (#dc2626), white text, padding 16px, border-radius 8px
Content: "⚠️ RECALL NOTICE" in large bold text, then "This drug (ID: {drugID}) has been recalled. Do not use or dispense this medication."
When recalled=false: render nothing (return null)
This component must be rendered FIRST, before any other drug information.
Add role="alert" and aria-live="assertive" for accessibility.

TASK 3 - Create src/components/TransferTimeline.jsx:
Props: history (array of transfer objects)
Render a vertical timeline. Each item shows:
- Icon based on role: 🏭 Manufacturer, 🚚 Distributor, 🏪 Pharmacy, 👤 Consumer, ❓ Unknown
- "From: {from.slice(0,6)}...{from.slice(-4)} ({fromRole})"
- "To: {to.slice(0,6)}...{to.slice(-4)} ({toRole})"
- Timestamp formatted as readable date
- GPS: "📍 {lat.toFixed(4)}, {lng.toFixed(4)}" or locationName if available
- Transfer index badge (#0, #1, #2...)
If history is empty: show "No transfers recorded yet."

TASK 4 - Create src/components/QRGenerator.jsx:
Props: qrDataURL (string), drugID (string)
Show QR image: <img src={qrDataURL} alt="QR Code for drug {drugID}">
Download button: creates temporary <a> element, sets href=qrDataURL, sets download="drug-{drugID}-QR.png", programmatically clicks it, then removes element.
If qrDataURL is null/empty: show placeholder "No QR code generated yet"

TASK 5 - Create src/components/QRScannerModal.jsx:
Props: onScan (callback), onClose (callback)
Use Html5QrcodeScanner from html5-qrcode library
Config: { fps: 10, qrbox: 250 }
On successful scan: extract drugID from decoded URL (split by "/" and take last element), call onScan(drugID), then call scanner.clear()
Show close button that calls onClose()
Render scanner in div with id="qr-reader"
Clean up scanner on component unmount

TASK 6 - Create src/components/GPSMapView.jsx:
Import from react-leaflet: MapContainer, TileLayer, Marker, Popup, Polyline
Import L from leaflet, import leaflet CSS
Props: gpsPath (array of {lat, lng, actorRole, timestamp, transferIndex})
If gpsPath length === 0: show div with message "No GPS data available yet"
Otherwise:
- Calculate center as average of all lat/lng points
- Render MapContainer with style height:400px
- TileLayer with OpenStreetMap URL
- For each point: Marker at [lat, lng] with Popup showing role, timestamp, index
- Polyline through all points in order with blue color
- When gpsPath prop changes (new entry added): map should re-render automatically (use key prop based on gpsPath.length or useEffect to fit bounds)
Note: Add "import 'leaflet/dist/leaflet.css'" at top. Fix default marker icon (known Leaflet+webpack issue): import L and set default icon URLs manually.

TASK 7 - Create src/hooks/useWebSocket.js:
Parameters: drugID (string), onMessage (callback function)
On mount:
- Check if window.WebSocket exists
- If yes: create new WebSocket(process.env.REACT_APP_WS_URL)
- On open: send JSON.stringify({type:"subscribe", drugID})
- On message: parse JSON, call onMessage(data)
- On error: log error
- On unmount: send {type:"unsubscribe", drugID}, then close()
If WebSocket not available (fallback):
- Set up setInterval to poll GET /verify/:drugID every 10 seconds using axios
- Call onMessage with polled data on each interval
- Clear interval on unmount
Return { isConnected (bool) }

TASK 8 - Create src/hooks/useDrug.js:
Parameter: drugID (string)
State: { drug: null, loading: true, error: null }
On mount and when drugID changes: fetch GET /verify/{drugID} using axios (NO auth header — public endpoint)
Set drug on success, error on failure
Return { drug, loading, error, refetch: () => refetch the data }

TASK 9 - Create src/pages/PublicVerifyPage.jsx:
Route: /verify/:drugID — NO authentication required
Read drugID from useParams()
Use useDrug(drugID) to fetch data
Use useWebSocket(drugID, handleWSMessage) for live updates
State: gpsPath (array, updated from WebSocket), currentRiskScore, isRecalled

Render order (IMPORTANT):
1. FIRST: <RecallBanner recalled={isRecalled} drugID={drugID}>
2. Page title "💊 Drug Verification"
3. Drug info card: name, batchNumber, manufacturer, expiryDate, status (colored)
4. <RiskBadge score={currentRiskScore}>
5. <GPSMapView gpsPath={gpsPath}>
6. <TransferTimeline history={drug.transferHistory}>
7. QR scanner button that opens <QRScannerModal> (on scan: navigate to /verify/:newDrugID)

When WebSocket sends "transfer" for this drugID: append new GPS point to gpsPath, update currentRiskScore
When WebSocket sends "recall": set isRecalled to true

If drug not found (404 or drug.found===false): show large red message "❌ Drug Not Found — This product ID does not exist on the blockchain. It may be counterfeit. Do not use."

Show LoadingSpinner while fetching.
```

---

## MEMBER 5 PROMPT — Tests + Documentation

```
I am writing property-based tests and documentation for a pharma blockchain system.

PROJECT STACK:
- Smart contract: Solidity 0.8.20, Hardhat, @nomiclabs/hardhat-ethers v2 (ethers v5 — use BigNumber, NOT BigInt)
- Backend: Node.js/Express, middleware at backend/middleware/validate.js
- AI Engine: Python Flask, scorer logic in ai-engine/scorer.py
- Testing libs: fast-check (already installed), Hypothesis (pip install hypothesis)
- IMPORTANT: NO @nomicfoundation/hardhat-chai-matchers available. Use try/catch for revert testing.

EXISTING TEST PATTERN (follow this exactly for revert tests):
async function expectRevert(txPromise, messageSubstring) {
  let reverted = false, errorMsg = "";
  try { await txPromise; } catch(err) {
    reverted = true;
    errorMsg = err?.reason ?? err?.data?.message ?? err?.message ?? String(err);
  }
  expect(reverted).to.equal(true);
  expect(errorMsg.includes(messageSubstring)).to.equal(true);
}

TASK 1 - Create test/contract/transferProperties.test.ts:
Deploy contract, assign manufacturer=role 2, distributor=role 3 in beforeEach.
Feature tag: // Feature: pharma-blockchain-ai, Property N: <description>

Property 9 (numRuns:5): Transfer round-trip
- Generate random drugID (unique each run), lat (integer -90000000 to 90000000), lng (integer -180000000 to 180000000)
- createDrug with that ID, then transferDrug(id, distributor.address, lat, lng)
- Assert: currentOwner === distributor.address AND getTransferCount === 1 AND history[0].lat.toNumber() === lat

Property 10 (numRuns:5): Non-owner cannot transfer
- Create drug as manufacturer
- Generate non-owner address from signers[4]
- Assert: transferDrug called from signers[4] reverts with "Not owner"

Property 12 (numRuns:3): Transfer history append-only
- Create drug, do 2 transfers
- Record first entry's lat/lng/from/to/index
- After second transfer, assert history[0] still has exact same values

TASK 2 - Create test/contract/recallStatus.test.ts:
Property 15: Drug with expiryDate=1 always returns status 2 (Expired)
Property 16: After recallDrug, getDrugStatus returns 1 (Recalled)  
Property 17: Non-admin calling recallDrug reverts with "Only admin allowed"

TASK 3 - Create test/backend/gpsValidation.test.js:
const { validateGPS } = require("../../backend/middleware/validate");
const fc = require("fast-check");

Use fast-check to test validateGPS middleware directly by creating mock req/res objects.

Property 13: Out-of-range GPS always returns 400:
fc.assert(fc.property(
  fc.oneof(
    fc.record({lat: fc.float({min:-200, max:-90.001}), lng: fc.float({min:-180,max:180})}),
    fc.record({lat: fc.float({min:90.001, max:200}), lng: fc.float({min:-180,max:180})}),
    fc.record({lat: fc.float({min:-90,max:90}), lng: fc.float({min:-200,max:-180.001})}),
    fc.record({lat: fc.float({min:-90,max:90}), lng: fc.float({min:180.001,max:200})})
  ),
  (coords) => {
    let statusCode = null;
    const req = { body: { lat: coords.lat, lng: coords.lng } };
    const res = { status: (code) => { statusCode = code; return { json: () => {} }; } };
    const next = () => {};
    validateGPS(req, res, next);
    return statusCode === 400;
  }
), { numRuns: 100 });

Valid GPS property: lat in [-90,90] and lng in [-180,180] should call next() not return 400.

TASK 4 - Create ai-engine/test_scorer.py:
from hypothesis import given, settings
from hypothesis import strategies as st
from scorer import compute_risk_score

# Feature: pharma-blockchain-ai, Property 18: score always in [0,100]
@given(st.fixed_dictionaries({
  "expiryTimestamp": st.integers(min_value=0, max_value=9999999999),
  "transferCount": st.integers(min_value=0, max_value=100),
  "transferTimestamps": st.lists(st.integers(min_value=0)),
  "gpsCoordinates": st.lists(st.fixed_dictionaries({"lat": st.floats(-90,90), "lng": st.floats(-180,180)})),
  "batchRecalled": st.booleans(),
  "manufacturerReputation": st.floats(0,1)
}))
@settings(max_examples=100)
def test_score_always_bounded(inputs):
    result = compute_risk_score(inputs)
    assert 0 <= result["score"] <= 100, f"Score {result['score']} out of bounds"
    assert result["category"] in ["Uncolored","Low","Medium","High","Critical"]

# Feature: pharma-blockchain-ai, Property 20: recalled drug always Critical
@given(st.fixed_dictionaries({
  "expiryTimestamp": st.integers(min_value=0),
  "transferCount": st.integers(min_value=0),
  "transferTimestamps": st.lists(st.integers()),
  "gpsCoordinates": st.lists(st.fixed_dictionaries({"lat": st.floats(-90,90), "lng": st.floats(-180,180)})),
  "batchRecalled": st.just(True),
  "manufacturerReputation": st.floats(0,1)
}))
@settings(max_examples=50)
def test_recalled_always_critical(inputs):
    result = compute_risk_score(inputs)
    assert result["score"] == 100
    assert result["category"] == "Critical"

TASK 5 - Create README.md (root level, replace existing):
# Pharma Blockchain AI — Anti-Counterfeit Drug Authentication

## Overview
Full-stack pharma supply chain system using Polygon blockchain (public), Hyperledger Fabric (private), AI risk scoring, QR verification, and GPS live tracking.

## Prerequisites
- Node.js 18+
- Python 3.10+
- Docker Desktop (for Hyperledger)
- MongoDB (local or Atlas)
- MetaMask browser extension
- Polygon Amoy testnet wallet with test MATIC

## Quick Start (4 terminals)

Terminal 1 — AI Engine:
cd ai-engine && pip install flask && python app.py

Terminal 2 — Backend:
cd backend && npm install && npm start

Terminal 3 — Frontend:
cd frontend && npm install && npm start

Terminal 4 (optional) — Hyperledger:
cd fabric && docker-compose up

## Deploy Smart Contract
npx hardhat run scripts/deploy.ts --network amoy
(Copy CONTRACT_ADDRESS from output into backend/.env)

## Environment Variables Table
(Include table with all env vars for backend and frontend)

## Run Tests
npx hardhat test
cd ai-engine && python -m pytest test_scorer.py

TASK 6 - Create backend/.env.example and frontend/.env.example with placeholder values and comments explaining each variable.

Run all tests after completing:
npx hardhat test
cd ai-engine && python -m pytest test_scorer.py -v
```

---

## Notes for All Members
- Always work on your own branch, never commit directly to main
- Run `node --check <filename>` after every JS file you create
- Ask for help if you get a blockchain error — it usually means the contract function signature changed
- The backend runs on port 4000, frontend on port 3000
- Test everything locally before creating a Pull Request
