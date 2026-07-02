# Σ SIGMA Protocol

**The Sum of Secure Finance.**

Sigma Protocol is a next-generation digital treasury management system designed for on-chain organizations. It replaces the chaos of shared private keys with a structured, **Weighted Governance** layer, ensuring funds only move when the right people—holding the right amount of stake—agree.

---

## 📖 Executive Summary

Think of Sigma as a corporate bank account that lives on the blockchain, but with much smarter, programmable rules. unlike a personal crypto wallet where one person holds the key, Sigma is a **Multi-Signature (Multisig) Vault**.

Most existing blockchain tools operate on a "1-Person-1-Vote" basis. If you have 3 partners, everyone has equal power, regardless of ownership. **Sigma changes this.** It aligns your on-chain financial controls with your real-world equity structure.

### The "Weighted Governance" Solution

**Scenario:** If the CEO owns 60% of the company and two junior partners own 20% each, the CEO’s digital signature carries more weight.
**The Result:** You can set a "Threshold" (e.g., 51% approval) to move funds. The CEO could approve it alone, or the two junior partners combined could fail to approve it without a third vote. This mirrors how actual corporate boards operate.

---

## 🚀 Key Features

### 1. Weighted Equity Voting

Assign voting power based on actual stake (e.g., Lead Developer 30%, Seed Investor 15%) rather than a flat count. The protocol calculates the *sum of equity* to validate transactions.

### 2. High-Efficiency Batch Operations (Payroll)

Sending 50 separate transactions to pay employees or distribute dividends is slow and expensive.

* **The Solution:** Upload a simple CSV spreadsheet (`address, amount`).
* **The Benefit:** Sigma bundles these into a single on-chain transaction. One approval signature pays the entire company instantly.

### 3. Safety Guardrails

To prevent mistakes or malicious acts, Sigma includes "financial brakes":

* **Timelocks:** Force a delay (e.g., 12 hours) after approval before money moves. This gives the team time to cancel a transaction if a mistake is spotted or a key is compromised.
* **Expiry:** Proposals don't sit around forever. If a request isn't approved within a set time (e.g., 7 days), it automatically expires.

### 4. Treasury Intelligence

* **Real-time Valuation:** Track the total USD net worth of your treasury across native CELO and ERC20 tokens (cUSD, cEUR, WETH).
* **DeFi Ready:** Simplified interface for generating swap calldata for Uniswap or Ubeswap.

---

## 🏗️ Architecture

Sigma utilizes a modular "Factory" pattern to ensure individual treasuries are isolated and secure. The system separates **Custody** (holding money) from **Governance** (deciding how to spend it).

| Component | Contract Name | Role | Description |
| --- | --- | --- | --- |
| **The Registry** | `MultiSigFactory` | **Deployer** | Deploys Controller/Wallet pairs and maps them to user addresses. |
| **The Brain** | `MultiSigController` | **Governance** | The logic layer. It tracks owners, weights, counts votes, and enforces timelocks. |
| **The Vault** | `CompanyWallet` | **Custody** | The secure box. It holds the assets. It is "dumb" and only executes calls authorized by its specific Controller. |

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14 (App Router), TypeScript
* **Styling:** Tailwind CSS, Shadcn/UI (Neo-Brutalist Design System)
* **Web3:** Ethers.js v6, Privy Auth (Safe, seamless wallet connection)
* **Smart Contracts:** Solidity 0.8.20 (OpenZeppelin standards)
* **Network:** Celo Sepolia (Testnet) / Celo Mainnet

---

## 🏁 Getting Started

### Prerequisites

* Node.js v18+
* MetaMask or a Privy-supported wallet
* Celo Sepolia Testnet funds ([Get Faucet Funds]())

## 📖 Usage Guide

### Creating a Treasury

1. Navigate to **Create Treasury**.
2. Input Owner addresses and their respective % weights (Total must be ≤ 100%).
3. Define the **Required Percentage** to pass any proposal.
4. Set the **Timelock** (Seconds) and **Expiry** (Seconds).

### Executing a Batch Transfer

1. Open your Treasury Dashboard.
2. Click **New Proposal** → **Send to Many**.
3. Upload a CSV formatted as `address, amount`.
4. Once the required owners sign (meeting the % threshold), click **Execute** to process all payments in one go.

---

## 🤝 Contributing

We welcome contributions from the community to help make decentralized finance safer for organizations.

Create Issue(s)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with Σ by the Sigma Team.**