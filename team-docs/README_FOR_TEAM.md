# 👋 Team Instructions — Pharma Blockchain AI
## How to Get Started with Your Assigned Work

---

## Step 1 — Clone the Repo

```bash
git clone https://github.com/saksham0008/pharma-blockchain-ai
cd pharma-blockchain-ai
```

---

## Step 2 — Create Your Branch

| Member | Your Branch Name |
|--------|-----------------|
| Member 1 (Hyperledger) | `feature/hyperledger-fabric` |
| Member 2 (Frontend Auth) | `feature/frontend-auth` |
| Member 3 (Dashboards) | `feature/frontend-dashboards` |
| Member 4 (Map + Verify) | `feature/frontend-verify-map` |
| Member 5 (Tests + Docs) | `feature/tests-and-docs` |

```bash
git checkout -b feature/your-branch-name
```

---

## Step 3 — Understand the Project Structure

```
pharma-blockchain-ai/
├── contracts/              ← Solidity smart contract (DONE)
├── scripts/                ← Hardhat deploy script (DONE)
├── test/contract/          ← Hardhat tests (DONE — you can add more)
├── backend/
│   ├── routes/             ← All API routes (DONE)
│   ├── middleware/         ← JWT auth + GPS validation (DONE)
│   ├── services/           ← contractService, aiService, wsService (DONE)
│   ├── models/             ← MongoDB schemas (DONE)
│   ├── abi/                ← Contract ABI (DONE)
│   └── server.js           ← Main server (DONE)
├── frontend/
│   ├── src/
│   │   ├── App.js          ← Main app (NEEDS REBUILD — Member 2)
│   │   ├── contexts/       ← AuthContext, ThemeContext (Member 2)
│   │   ├── services/       ← api.js Axios (Member 2)
│   │   ├── components/     ← Shared components (Members 2+4)
│   │   ├── pages/          ← All page components (Members 2+3+4)
│   │   └── hooks/          ← useWebSocket, useDrug (Member 4)
│   └── .env                ← Frontend config (Member 2)
├── ai-engine/              ← Python Flask AI (DONE)
│   ├── scorer.py           ← Risk scoring logic (DONE)
│   └── app.py              ← Flask endpoints (DONE)
├── fabric/                 ← Hyperledger Fabric (Member 1)
│   ├── docker-compose.yaml
│   ├── chaincode/
│   └── scripts/
└── team-docs/              ← This folder — instructions for team
```

---

## Step 4 — Use the GPT Prompts

Open `team-docs/GPT_PROMPTS_ALL_MEMBERS.md`

Find your member number and copy the entire prompt block. Paste it into ChatGPT (or any AI assistant). The prompt contains:
- Full project context
- Exact file names and locations
- Exact code patterns to follow
- Backend API formats

The AI will generate all the code you need. Copy each file into your local project.

---

## Step 5 — Run Locally to Test

### Start Backend
```bash
cd backend
# Create .env file with these values:
# PORT=4000
# BASE_URL=http://localhost:4000
# (other values from Saksham)
npm install
npm start
```

### Start AI Engine
```bash
cd ai-engine
pip install flask
python app.py
```

### Start Frontend
```bash
cd frontend
npm install
npm start
```

Backend runs on http://localhost:4000
Frontend runs on http://localhost:3000

---

## Step 6 — Commit Your Work

Make commits regularly (every day ideally, minimum every 2-3 days):

```bash
git add .
git commit -m "feat: describe what you did today"
git push origin feature/your-branch-name
```

### Good Commit Messages
- `feat: add GPS map component with leaflet`
- `feat: implement manufacturer dashboard drug registration`
- `fix: GPS validation boundary check`
- `test: add property tests for AI scorer`
- `docs: update README prerequisites`

### Bad Commit Messages (avoid these)
- `update`
- `fix stuff`
- `done`
- `asdf`

---

## Step 7 — Create Pull Request

When your feature is complete:
1. Go to https://github.com/saksham0008/pharma-blockchain-ai
2. Click "Pull Requests" → "New Pull Request"
3. Set base: `main`, compare: `feature/your-branch`
4. Write a description of what you built
5. Tag Saksham for review

---

## Important Notes

### For ALL members
- Always work on your branch, NEVER commit directly to main
- If you get a blockchain error, the error message from the contract will be in `err.response.data.error`
- The backend port is 4000 (not 3000 — that's the frontend)
- Ask Saksham for the `.env` values (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS)

### For Frontend Members (2, 3, 4)
- Use `src/services/api.js` for ALL API calls — it handles auth headers automatically
- Use `useAuth()` to get the current user's wallet and role
- Use `useTheme()` to get darkMode state
- LoadingSpinner must show during ALL blockchain transactions (they take 10-30 seconds)

### For Member 1 (Hyperledger)
- You need Docker Desktop installed and running
- The Fabric setup is complex — use the GPT prompt carefully
- The fabricService.js must gracefully fail if Fabric is not running (return 503, not crash)

### For Member 5 (Tests)
- Existing tests are in `test/contract/` — look at them before writing new ones
- Use the `expectRevert` helper pattern (no `.revertedWith()` — that package isn't installed)
- Python tests go in `ai-engine/test_scorer.py`

---

## Contact
Ping Saksham on WhatsApp/Discord if you're stuck.
Check the `team-docs/` folder for detailed prompts and instructions.
