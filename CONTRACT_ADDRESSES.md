# Deployed Contract Addresses

## PharmaSupplyChain.sol â€” Polygon Amoy Testnet

| Version | Contract Address | Network | Features |
|---------|-----------------|---------|----------|
| v2.0 | 0xBA9FD3EAafB01208704a028e488a995CC332e0Fb | Polygon Amoy Testnet | GPS tracking, Recall, AI Risk Score, 6 Roles |

## Explorer Links
- Contract: https://amoy.polygonscan.com/address/0xBA9FD3EAafB01208704a028e488a995CC332e0Fb

## Contract Functions
- createDrug(drugID, name, batchNumber, expiryDate)
- transferDrug(drugID, newOwner, lat, lng) â€” GPS coordinates as int256 * 1e6
- recallDrug(drugID)
- updateRiskScore(drugID, riskScore)
- assignRole(address, role) â€” roles: 0=None,1=Admin,2=Manufacturer,3=Distributor,4=Pharmacy,5=Consumer
- getDrug(drugID)
- getDrugStatus(drugID) â€” returns 0=Active,1=Recalled,2=Expired
- getTransferHistory(drugID)
- getTransferCount(drugID)

## Role Enum Values
| Role | Value |
|------|-------|
| None | 0 |
| Admin | 1 |
| Manufacturer | 2 |
| Distributor | 3 |
| Pharmacy | 4 |
| Consumer | 5 |

## Blockchain Events

The contract emits the following events, captured by the event listener service and stored in MongoDB:

| Event | Parameters | Notes |
|-------|-----------|-------|
| DrugCreated | drugID, manufacturer | Emitted on drug registration |
| DrugTransferred | drugID, from, to, lat, lng, timestamp | GPS as int256 * 1e6 |
| RiskScoreUpdated | drugID, riskScore | AI risk score 0-100 |
| DrugRecalled | drugID, timestamp | Admin recall action |
| RoleAssigned | user (indexed), role | Role assignment |

## Event Listener

The backend service (`services/eventListenerService.js`) listens to all 5 events and persists them to MongoDB.

- **Start**: Auto-triggered after MongoDB connects in `server.js`
- **Storage**: MongoDB `eventlogs` collection (EventLog model)
- **API**: `GET /api/events` with optional `?limit=&eventName=&drugID=` filters
- **Alerts**: POST to `ALERT_WEBHOOK_URL` on failures (optional, set in `.env`)
