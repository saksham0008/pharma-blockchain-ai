# Drug Authentication & Anti-Counterfeiting System (Blockchain)

A full-stack blockchain-based system to verify the authenticity of pharmaceutical drugs and prevent counterfeiting using QR verification and smart contracts.

---

## Latest Update (v2.0 – March 2026)

* QR Code Generation & Mobile Scan Verification
* Blockchain-based Drug Tracking
* Dashboard (Safe / Expired Drug Monitoring)
* Dark Mode UI
* Improved User Interface & Experience
* Real-time Drug Status Detection

---

## Problem Statement

Counterfeit medicines are a serious global issue that cause health risks, financial losses, and loss of trust in healthcare systems.

Traditional supply chains lack transparency and are prone to tampering and data manipulation.

---

## Proposed Solution

This project uses blockchain technology to:

* Provide **immutable drug records**
* Enable **transparent supply chain tracking**
* Allow **public verification using QR codes**
* Detect **expired or high-risk drugs using rule-based logic**

---

## Features

### Blockchain Layer

* Manufacturer registration
* Drug batch creation
* Ownership transfer
* Immutable on-chain records
* Role-based access control

### Backend (Node.js)

* API for drug creation & retrieval
* QR code generation
* Drug verification endpoint
* AI-like rule-based risk detection

### Frontend (React)

* Create & fetch drug records
* Generate QR codes
* Scan QR using camera
* Dashboard (Safe / Expired stats)
* Dark mode UI
* Status badges (Authentic / Expired / High Risk)

---

## Tech Stack

* **Blockchain:** Solidity, Foundry
* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **QR System:** QR Code + Scanner (html5-qrcode)
* **Network:** Local Anvil / Testnet / Polygon

---

## How It Works

1. Create drug on blockchain
2. Generate QR code
3. Attach QR to drug
4. Scan QR using mobile
5. Verify drug authenticity

---

## Project Structure

```
drug-authentication-blockchain/
│
├── contracts/        # Smart contracts
├── backend/          # Node.js API
├── frontend/         # React UI
├── scripts/          # Deployment scripts
├── test/             # Contract tests
├── README.md
```

---

## Setup & Run (Local)

### Backend

```
cd backend
npm install
node server.js
```

### Frontend

```
cd frontend
npm install
npm start
```

### Blockchain (Foundry)

```
forge install
forge build
forge test
```

---

## Use Cases

* Pharmaceutical manufacturers
* Distributors & logistics partners
* Pharmacies
* Consumers verifying drug authenticity
* Government regulators & auditors

---

## AI Component

The system uses a **rule-based decision mechanism** to determine:

* Expired drugs
* High-risk drugs
* Authentic drugs

Future scope includes integrating machine learning models for predictive risk analysis.

---

## Future Improvements

* Machine Learning-based risk prediction
* IPFS storage for drug metadata
* Polygon mainnet deployment
* Advanced analytics dashboard
* Role management UI

---

## Author

**Saksham Gupta**
GitHub: https://github.com/saksham0008

---

## License

MIT License
