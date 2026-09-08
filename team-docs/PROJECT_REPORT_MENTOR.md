# PROJECT REPORT
## Anti-Counterfeit Drug Authentication using Blockchain & AI
### Final Year B.Tech Project Report
### Academic Year: 2024–2025

---

## Project Title
**PharmChain AI: A Dual-Blockchain Anti-Counterfeit Drug Authentication System with GPS Tracking and AI Risk Scoring**

---

## Team Details

| S.No | Name | Role | GitHub Handle |
|------|------|------|---------------|
| 1 | Saksham Gupta | Team Lead / Blockchain Core | saksham0008 |
| 2 | [Member 2 Name] | Hyperledger Fabric Engineer | — |
| 3 | [Member 3 Name] | Frontend Auth & Routing | — |
| 4 | [Member 4 Name] | Frontend Dashboards | — |
| 5 | [Member 5 Name] | Frontend Map & Verification | — |
| 6 | [Member 6 Name] | QA & Documentation | — |

**Mentor:** [Mentor Name]
**Department:** [Department Name]
**Institution:** [Institution Name]

---

## 1. Abstract

Counterfeit pharmaceuticals are a global health crisis, causing thousands of deaths annually. Existing supply chain systems lack real-time transparency, immutable audit trails, and consumer-accessible verification. This project presents PharmChain AI — a full-stack drug authentication platform that uses a dual-blockchain architecture (Polygon public chain + Hyperledger Fabric private chain), an AI-driven counterfeit risk scoring engine, GPS-based live tracking, and QR code verification to secure the pharmaceutical supply chain from manufacturer to consumer.

The system enables every drug unit to carry a tamper-proof digital identity on the blockchain. Supply chain actors (manufacturers, distributors, pharmacies) record custody transfers with GPS coordinates, creating an immutable chain-of-custody. Consumers scan a QR code to instantly verify authenticity, view the drug's full journey on a map, and see an AI-computed risk score. Drug recalls are broadcast in real-time to all stakeholders via WebSocket.

---

## 2. Problem Statement

- WHO estimates 10% of medicines in developing countries are counterfeit
- Existing supply chains lack end-to-end traceability and consumer verification
- Paper-based batch records can be forged
- No real-time alerting mechanism for drug recalls
- Sensitive business data (pricing, invoices) cannot be shared publicly but requires auditability

---

## 3. Proposed Solution

A dual-blockchain architecture:
- **Polygon (Public):** Immutable, tamper-proof drug identity and transfer history accessible by anyone
- **Hyperledger Fabric (Private):** Sensitive business data visible only to authorized organizations
- **AI Engine:** Automatically computes counterfeit risk score after every transfer
- **QR Code:** Any consumer can scan and instantly verify a drug's authenticity

---

## 4. System Architecture

```
[Manufacturer] → [Smart Contract: createDrug] → [Polygon Amoy Testnet]
[Manufacturer/Distributor/Pharmacy] → [transferDrug + GPS] → [On-chain history]
[AI Engine] → [Risk score after every transfer] → [updateRiskScore on-chain]
[Consumer] → [Scan QR] → [Public verify page] → [Full history + GPS map]
[Admin] → [Recall drug] → [WebSocket broadcast to all] → [Status = Recalled]
[Hyperledger Fabric] → [Private data: pricing, invoices] → [Org1+Org2 only]
```

---

## 5. Technology Stack

| Layer | Technology |
|-------|-----------|
| Public Blockchain | Solidity 0.8.20, Hardhat, Polygon Amoy Testnet |
| Private Blockchain | Hyperledger Fabric 2.5, Fabric-CA, CouchDB |
| Backend | Node.js 18, Express 5, ethers.js v6 |
| Database | MongoDB with Mongoose ODM |
| AI Engine | Python 3.10, Flask, Haversine formula |
| Frontend | React 19, React Router v6, Leaflet.js |
| Authentication | JWT (8h expiry), MetaMask wallet signature verification |
| Real-time | WebSocket (ws library), polling fallback |
| QR Code | qrcode (generation), html5-qrcode (scanning) |
| Testing | Hardhat, fast-check (property-based), Hypothesis (Python PBT) |

---

## 6. Features Implemented

### 6.1 Smart Contract Features
- Drug registration with unique ID, batch number, expiry date
- Role-based access control: 6 roles (Admin, Manufacturer, Distributor, Pharmacy, Consumer, None)
- GPS-tracked transfer history — each transfer records lat/lng as fixed-point int256
- Drug status: Active, Recalled, Expired (computed dynamically from block timestamp)
- On-chain risk score updated by AI engine after each transfer
- Drug recall by admin — broadcasts alert to all WebSocket subscribers
- Events: DrugCreated, DrugTransferred, RiskScoreUpdated, DrugRecalled, RoleAssigned

### 6.2 Backend API Features (12 Endpoints)
- `POST /auth/login` — MetaMask signature verification, JWT issuance
- `POST /api/drugs` — Register drug on-chain + store metadata in MongoDB
- `GET /api/drugs/:id` — Cached drug detail (60s TTL)
- `GET /api/drugs/:id/history` — Full transfer history with role labels
- `POST /api/transfer` — GPS-validated transfer + AI trigger + WebSocket broadcast
- `POST /admin/recall` — Recall drug + risk score to 100 + WebSocket alert
- `GET /verify/:drugID` — Public verification (HTML + JSON, no auth)
- `GET /api/generateQR/:drugID` — Generate QR code as base64 PNG
- `POST /admin/assignRole` — Assign on-chain role to wallet

### 6.3 AI Risk Scoring Engine
5 additive rules (capped at 100):
- Expiry proximity: +20 if <30 days, +10 if <90 days
- Transfer count anomaly: +15 if >10 transfers
- Time jump: +20 if any two consecutive transfers <60 seconds apart
- Location jump: +25 if speed >1000 km/h between GPS points (Haversine)
- Batch recall: +30 if batch flagged as recalled

Risk categories: Uncolored (0) / Low (1-24) / Medium (25-49) / High (50-74) / Critical (75-100)

### 6.4 Hyperledger Fabric Features
- 3-organization private network (Manufacturer=Org1, Distributor=Org2, Pharmacy=Org3)
- `PharmaPrivateCollection` — pricing and invoice data visible to Org1+Org2 only
- Pharmacy (Org3) receives ACCESS_DENIED when querying private data
- `SyncToPolygon` event for public/private chain synchronization

### 6.5 Frontend Features
- Role-based dashboards for all 5 supply chain roles
- Manufacturer: drug registration, QR generation, history view
- Distributor: transfer with GPS input, risk score display
- Pharmacy: dispense to consumer
- Admin: role assignment, drug recall
- Public verify page: full drug info, GPS Leaflet.js map, risk badge, transfer timeline
- Live updates via WebSocket — map and risk score update in real-time
- QR scanner using device camera

---

## 7. Individual Contributions

### Saksham Gupta (Team Lead)
Designed the complete system architecture and built the blockchain and backend core. Implemented the extended `PharmaSupplyChain.sol` Solidity smart contract with GPS transfer history, drug lifecycle status management, chain-of-custody immutability, and 6-role access control. Set up Hardhat with Polygon Amoy testnet and wrote 23 unit and property-based tests with full contract coverage. Built the modular Node.js Express backend with JWT wallet authentication, 12 REST API endpoints, GPS coordinate validation middleware, MongoDB models with 60-second TTL caching, and WebSocket real-time service. Developed the Python Flask AI risk scoring microservice with 5 counterfeit detection rules including Haversine-based location jump detection.

### [Member 2 Name] (Hyperledger Fabric Engineer)
Designed and implemented the private blockchain layer. Set up a local Hyperledger Fabric 2.5 network with 3 organizations using Docker Compose, including separate orderer, Certificate Authority, peer, and CouchDB state database services. Wrote the `PharmaContract` chaincode with private data collection access control — sensitive business data (unit cost, batch production notes, supplier invoices) stored in `PharmaPrivateCollection`, accessible only to Manufacturer and Distributor organizations with Pharmacy explicitly denied at chaincode level. Implemented the Polygon synchronization mechanism and integrated the Fabric gateway into the Node.js backend.

### [Member 3 Name] (Frontend Auth & Routing Engineer)
Rebuilt the React frontend from a monolithic App.js into a structured multi-page application with React Router v6. Implemented AuthContext for global JWT session management with localStorage persistence, ThemeContext for dark/light mode, and an Axios API service with automatic authentication header injection. Replaced all hardcoded backend URLs with environment variable configuration. Built the LoginPage with complete MetaMask wallet integration including wallet connection, challenge message signing, backend authentication, and role-aware routing to correct dashboards.

### [Member 4 Name] (Frontend Dashboards Engineer)
Built all four role-based operational dashboards. The Manufacturer Dashboard provides drug registration with blockchain transaction feedback, QR code generation and download, and transfer history per drug. The Distributor Dashboard enables GPS-validated custody transfers with real-time risk score updates. The Pharmacy Dashboard handles final dispensing to consumers. The Admin Dashboard provides role assignment (mapped to on-chain enum values) and drug recall with confirmation dialogs. All dashboards implement consistent loading states, blockchain error handling, and dark/light mode support.

### [Member 5 Name] (Frontend Map & Verification Engineer)
Built the consumer-facing drug verification experience and all shared UI components. Implemented the `PublicVerifyPage` displaying drug info, authenticity status, risk score, transfer timeline, and live GPS journey map — accessible by scanning a QR code without authentication. Built `GPSMapView` using Leaflet.js with markers, polylines, and automatic bounds fitting. Implemented the WebSocket hook with 10-second polling fallback. Built WCAG-compliant components: `RiskBadge`, `RecallBanner`, `TransferTimeline`, `QRGenerator`, and `QRScannerModal`.

### [Member 6 Name] (QA & Documentation Engineer)
Designed and implemented the property-based testing strategy across all system layers. Used fast-check for smart contract properties covering transfer round-trips, history immutability, non-owner access control, and status invariants. Used Hypothesis (Python) for AI engine properties — score bounds, per-rule correctness, and the recalled-drug-always-Critical invariant. Wrote the complete project README with step-by-step setup instructions for all services, environment variable reference, and usage walkthrough.

---

## 8. Testing Summary

| Test Suite | Framework | Tests | Status |
|-----------|-----------|-------|--------|
| Smart Contract Unit | Hardhat + Chai | 19 tests | ✅ All Pass |
| Smart Contract Property | fast-check | 4 properties | ✅ All Pass |
| GPS Validation | fast-check | 100 runs | ✅ All Pass |
| AI Engine Property | Hypothesis | 2 properties × 100 runs | ✅ All Pass |

---

## 9. GitHub Repository

- **Main Repo:** https://github.com/saksham0008/pharma-blockchain-ai
- **Pure Blockchain Repo:** https://github.com/saksham0008/drug-authentication-blockchain

---

## 10. Conclusion

PharmChain AI successfully demonstrates a production-grade approach to pharmaceutical anti-counterfeiting using blockchain technology. The dual-chain architecture provides both public transparency (Polygon) and private data security (Hyperledger Fabric). The AI risk engine provides automated threat detection, while real-time WebSocket updates and QR-based consumer verification create a complete end-to-end solution.

---

**Mentor Signature:** _________________________ Date: _____________

**Team Lead Signature:** ______________________ Date: _____________
