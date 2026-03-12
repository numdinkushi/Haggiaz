# Haggiaz Roadmap

Project checklist and next steps for Haggiaz (ROSCA/Chama on Celo).

---

## 1. Smart Contracts

- [x] **Full-flow tests** – create → join → start → contribute (all members) → disburse for each round until completion
- [x] **Deploy to Celo mainnet** – Haggiaz + Treasury deployed
- [ ] **Deploy to Celo Alfajores** – testnet deploy (RPC DNS issue; optional)
- [ ] **Integrate real cUSD/USDm** – fork test with real USDm (`FORK_ALFAJORES=1`, `USDM_ALFAJORES_HOLDER`)

---

## 2. AI Agent (required for hackathons)

- [ ] **Agent** – load Synthesis skill (`curl -s https://synthesis.md/skill.md`) and handle tasks
- [x] **Haggiaz integration** – Cursor skill + agent integration guide; agent can create groups, join, contribute, disburse on Celo
- [ ] **AgentScan verification** – register and verify the agent
- [ ] **Self Agent ID** – complete verification steps

---

## 3. Frontend (optional but useful)

- [ ] **Create group flow** – token, amount, max members, round duration
- [ ] **Share link** – `haggiaz.app/join/{groupId}` (or similar)
- [ ] **Join flow** – connect wallet and join from link
- [ ] **Contribute / disburse** – show current round, who must contribute, who receives
- [ ] **Celo wallet support** – Valora, MetaMask, etc.

---

## 4. Hackathon Checklist

- [ ] **Register on Karma Gap**
- [ ] **Join Celo Telegram**
- [ ] **Post on X** with @Celo, @CeloDevs, @CeloPublicGoods

---

## 5. Documentation / DX

- [ ] **Update README** – deployment, env vars, contract addresses
- [x] **Agent integration guide** – `documents/AGENT_INTEGRATION.md`; Cursor skill at `.cursor/skills/haggiaz/`
