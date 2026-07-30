# Pharma Blockchain AI — Team Work Division
## Project: Anti-Counterfeit Drug Authentication System
### GitHub Repos
- **Main (AI Integrated):** https://github.com/saksham0008/pharma-blockchain-ai
- **Pure Blockchain:** https://github.com/saksham0008/drug-authentication-blockchain

---

## ✅ COMPLETED WORK (Done by Saksham — Team Lead)

| Layer | What Was Built |
|-------|---------------|
| Smart Contract | PharmaSupplyChain.sol — GPS tracking, recall, status, transfer history, 6 roles |
| Hardhat Tests | 23 unit + property-based tests, all passing |
| Backend Structure | Modular Express — routes/, middleware/, services/, models/ |
| Auth System | JWT + MetaMask wallet signature verification |
| REST API | 12 endpoints — auth, drugs, transfer, admin, QR, verify |
| MongoDB Models | User, GpsLog, AiScoreLog, DrugCache (60s TTL) |
| AI Engine | Python Flask, 5-rule risk scoring, /score endpoint |
| WebSocket | Real-time broadcast on transfer and recall |
| Deploy Script | Hardhat deploy to Polygon Amoy testnet |

---

## 🔲 REMAINING WORK — Divided Across 5 Members

---

## MEMBER 1 — Hyperledger Fabric (Private Blockchain)
**GitHub Branch:** `feature/hyperledger-fabric`

### Files to Create
| File | Description |
|------|-------------|
| `fabric/docker-compose.yaml` | Local Hyperledger network (orderer, 3 peers, CAs, CouchDB) |
| `fabric/collections_config.json` | Private collection policy — Org1+Org2 only |
| `fabric/chaincode/pharma/pharmaContract.js` | Chaincode with private data collection |
| `fabric/chaincode/pharma/index.js` | Chaincode entry point |
| `fabric/chaincode/pharma/package.json` | Chaincode dependencies |
| `fabric/scripts/startNetwork.sh` | Network startup script |
| `fabric/scripts/deployChaincode.sh` | Chaincode deployment script |
| `backend/services/fabricService.js` | Node.js Fabric SDK wrapper |
| `backend/routes/fabric.js` | GET /fabric/drug/:id endpoint |

### Chaincode Functions Required
- `CreateDrugPrivate(ctx, drugID)` — Org1/Org2 only
- `StorePrivateData(ctx, drugID)` — Update private fields
- `SyncToPolygon(ctx, drugID, eventType)` — Emit sync event
- `GetDrug(ctx, drugID)` — Public ledger
- `GetDrugPrivate(ctx, drugID)` — ACCESS_DENIED for Org3
- `GetDrugHistory(ctx, drugID)` — Full key history

---

## MEMBER 2 — React Frontend Foundation + Authentication
**GitHub Branch:** `feature/frontend-auth`

### Files to Create
| File | Description |
|------|-------------|
| `frontend/src/contexts/AuthContext.js` | wallet/role/token state, login/logout |
| `frontend/src/contexts/ThemeContext.js` | dark/light mode toggle |
| `frontend/src/services/api.js` | Axios with REACT_APP_API_URL |
| `frontend/src/App.js` | React Router + context providers (replace existing) |
| `frontend/src/components/ProtectedRoute.jsx` | Redirect to /login if no JWT |
| `frontend/src/components/Header.jsx` | Wallet, role badge, logout, theme toggle |
| `frontend/src/components/LoadingSpinner.jsx` | Spinner component |
| `frontend/src/pages/LoginPage.jsx` | MetaMask connect + sign + login |
| `frontend/.env` | REACT_APP_API_URL=http://localhost:4000 |

### Install Required
```
cd frontend
npm install react-router-dom@6
```

---

## MEMBER 3 — Role-Based Dashboards
**GitHub Branch:** `feature/frontend-dashboards`

### Files to Create
| File | Description |
|------|-------------|
| `frontend/src/pages/ManufacturerDashboard.jsx` | Register drugs, QR generation, history |
| `frontend/src/pages/DistributorDashboard.jsx` | Owned drugs, transfer with GPS |
| `frontend/src/pages/PharmacyDashboard.jsx` | Held drugs, dispense to consumer |
| `frontend/src/pages/AdminDashboard.jsx` | Role assignment, drug recall |

### Backend APIs Used
- `POST /api/drugs` — register drug
- `GET /api/drugs/:id` — drug details
- `GET /api/drugs/:id/history` — transfer history
- `GET /api/generateQR/:drugID` — QR code
- `POST /api/transfer` — transfer drug with GPS
- `POST /admin/assignRole` — assign wallet role
- `POST /admin/recall` — recall drug

---

## MEMBER 4 — Public Verify Page + GPS Map + Shared Components
**GitHub Branch:** `feature/frontend-verify-map`

### Files to Create
| File | Description |
|------|-------------|
| `frontend/src/components/RiskBadge.jsx` | Color-coded risk score (WCAG compliant) |
| `frontend/src/components/RecallBanner.jsx` | Red recall warning banner |
| `frontend/src/components/TransferTimeline.jsx` | Ordered transfer steps |
| `frontend/src/components/QRGenerator.jsx` | Display + download QR |
| `frontend/src/components/QRScannerModal.jsx` | html5-qrcode scanner |
| `frontend/src/components/GPSMapView.jsx` | Leaflet.js map with markers + polyline |
| `frontend/src/hooks/useWebSocket.js` | WS subscribe with polling fallback |
| `frontend/src/hooks/useDrug.js` | Fetch drug data hook |
| `frontend/src/pages/PublicVerifyPage.jsx` | Full public verification page |

### Install Required
```
cd frontend
npm install leaflet react-leaflet html5-qrcode
```

### RiskBadge Color Rules
| Score | Color | Category |
|-------|-------|----------|
| 0 | Gray | Uncolored |
| 1–24 | Green | Low |
| 25–49 | Yellow | Medium |
| 50–74 | Orange | High |
| 75–100 | Red | Critical |

---

## MEMBER 5 — Tests + README + Documentation
**GitHub Branch:** `feature/tests-and-docs`

### Files to Create
| File | Description |
|------|-------------|
| `test/contract/transferProperties.test.ts` | Smart contract property tests |
| `test/contract/recallStatus.test.ts` | Recall + status property tests |
| `test/backend/gpsValidation.test.js` | GPS validation property tests |
| `ai-engine/test_scorer.py` | Python Hypothesis property tests |
| `README.md` | Complete setup guide |
| `backend/.env.example` | Backend env template |
| `frontend/.env.example` | Frontend env template |

### Tests Required
- Property 9: Transfer round-trip (fast-check)
- Property 12: Transfer history append-only (fast-check)
- Property 13: GPS validation bounds (fast-check)
- Property 18: Risk score bounded [0,100] (Hypothesis)
- Property 20: Recalled drug always Critical (Hypothesis)

---

## GitHub Workflow for All Members

```bash
# Clone the repo
git clone https://github.com/saksham0008/pharma-blockchain-ai
cd pharma-blockchain-ai

# Create your branch
git checkout -b feature/<your-feature-name>

# Make changes
git add .
git commit -m "feat: describe what you did"
git push -u origin feature/<your-feature-name>

# Create Pull Request on GitHub → merge into main
```

### Commit Message Format
- `feat: add GPS map component`
- `fix: correct drug status for expired drugs`
- `test: add property tests for transfer history`
- `docs: update README with setup steps`
- `refactor: modularize fabric service`
