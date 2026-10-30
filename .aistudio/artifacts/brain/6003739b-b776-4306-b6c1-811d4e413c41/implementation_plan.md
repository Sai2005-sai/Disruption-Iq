# DisruptionIQ – From Delivery Delays to Recovery Plans

DisruptionIQ is an intelligent, full-stack logistics and supply chain disruption management platform designed to detect delays across suppliers, carrier tracking, and delivery agents, trace their downstream impact to customer commitments, calculate explainable risk scores, and execute verified recovery plans with backend-enforced role separation.

***

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX choices have been confirmed and will guide the implementation:

- **Confirmed Decision 1 (Database & Backend Persistence)**: Full-Stack Express with persistent SQLite database (`better-sqlite3` / `sqlite3` with automated migration & seeding). Enforces foreign keys, atomic transactions, RBAC permissions, webhook idempotency, and pre-execution inventory locks.
- **Confirmed Decision 2 (Synthetic Dataset & Scenario Profile)**: Preloaded with realistic Industrial Electronics & Automotive Components along the Hosur–Bengaluru–Chennai industrial corridor (Apex Components, SHP-7731, ICM-220 modules, 6 high-stakes customer orders, and secondary carrier webhook events).
- **Confirmed Decision 3 (Beginner-Friendly UX Optimization)**: Includes a persistent **Interactive Guided Tour & Scenario Runner banner** at the top of the interface. Beginners can click 1-click presets ("Scenario 1: Supplier Stoppage" or "Scenario 2: Carrier Webhook Delay") with step-by-step progress checklists that guide them through detection, impact tracing, risk ranking, role switching, approval, and simulation.

***

## 1. Overview & Core Concept

- **What It Does**: Connects fragmented supply chain data—suppliers, shipments, multi-node warehouses, inventory balances, and customer purchase orders. When disruptions occur (e.g. factory oven breakdown or carrier linehaul delay), DisruptionIQ traces the ripple effect across warehouses, flags stock-out risks, calculates deterministic 0–100 risk rankings with complete mathematical breakdowns, presents 5 feasible recovery options, collects multi-role approvals with strict separation of duties, and revalidates inventory availability before simulating execution.
- **Target Audience / Persona**:
  - *Delivery Agents*: View daily route, log GPS/photo delay tickets with automatic minor-issue procedure (MIP-04) clearance.
  - *Operations Analysts*: Monitor incoming signals, classify alerts, and trigger impact traces.
  - *Supply Chain Managers*: Evaluate recovery strategies, modify parameters, and coordinate cross-docking.
  - *Procurement Approvers*: Authorize spot purchase orders, expedite air freight, or approve supplier changes.
  - *Warehouse Operators*: Reconcile on-hand inventory counts and release inter-warehouse transfers.
  - *Parent Company & Customers*: Secure portals with privacy-preserving inventory masking, revised ETAs, verified explanations, and customer care.
- **Key Value**: Eliminates guesswork and manual cross-referencing by turning raw delay notices into actionable, approved, and verified recovery executions in minutes.

***

## 2. User Experience & Visual Design

### Key User Flows
1. **Scenario 1 Walkthrough (Supplier Disruption)**:
   - Alert ALT-3108 arrives from Apex Components (4-day reflow oven breakdown on SHP-7731).
   - Ops Analyst classifies severity as **Major** with an audited justification.
   - User traces the disruption path: Supplier $\to$ Inbound Shipment $\to$ Chennai WH-CHN-01 $\to$ ICM-220 Stock (120 units short) $\to$ 6 Exposed Customer Orders.
   - Order Risk screen ranks affected orders; P1 orders (`ORD-10482` Sundaram Motors & `ORD-10477` Coastal Pharma Equipment) are flagged as **Critical** due to tight SLA countdowns.
   - User navigates to Recovery Options. AI provides pros/cons summaries; system checks verify that *Reallocating from Bengaluru* is the only option passing inventory, deadline, and constraint feasibility.
   - User selects the plan; approval chain requires SCM, Procurement, and Parent Company.
   - User experiences separation of duties (cannot approve if they created the plan). Approvers review and approve.
   - Executor triggers Revalidation: all 5 pre-flight checks pass (or test concurrent stock reservation failure). Simulation executes, updating customer ETAs and emitting audit records.
2. **Scenario 2 Walkthrough (Carrier Webhook & Idempotency)**:
   - BlueDart carrier webhook sends `shipment.delayed` (+9h delay) with idempotency key.
   - System updates shipment ETA, reassesses P3 customer order risks, and logs the event.
   - Replaying the identical webhook safely returns `200 Duplicate Ignored` without corrupting state.
3. **Beginner Guidance Banner**:
   - Fixed header bar with a step indicator (1. Detect Alert $\to$ 2. Trace Impact $\to$ 3. Rank Risk $\to$ 4. Choose Recovery $\to$ 5. Approve & Execute).
   - "Next Step" prompt button guides first-time users straight to the relevant screen and action.

### Visual Identity & Palette
- **Aesthetic Direction**: Professional, clean enterprise logistics command center. High-density data presentation without visual clutter or unnecessary decorative elements.
- **Color Hierarchy**:
  - Primary Base: Deep Navy (`#0F2A4A`) for structural hierarchy and navigation.
  - Canvas & Surface: Crisp light gray canvas (`#F6F8FB`), clean card containers (`#FFFFFF`), with a full dark mode (`#090E18` / `#111827`).
  - Accents: Electric Teal (`#14B8A6`) for primary actions and active states.
  - Risk Spectrum: Deterministic color coding—Low Green (`#16A34A`), Moderate Amber (`#D97706`), High Orange (`#EA580C`), Critical Crimson (`#DC2626`).
- **Typography**: Inter / sans-serif with tabular figures (`font-feature-settings: 'tnum'`) for timestamps, quantities, and monetary values in Indian Rupees (INR `₹`).

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express Server with Persistent SQLite**:
  - *Chosen Approach*: Implement an Express server (`server.ts`) mounting Vite middleware in development and serving SQLite-backed REST API endpoints (`/api/*`).
  - *Why*: SQLite stored in `/data/disruptioniq.db` provides zero-latency, ACID transactional safety, real foreign key cascades, and durable storage across server reboots without needing complex external cloud credentials.
  - *Alternatives Considered*: Pure browser `localStorage` lacks real backend separation-of-duties enforcement and atomic webhook idempotency locking; Cloud SQL requires external GCP provisioning and billing setup.
- **Decision 2: Deterministic Logic for Invariants vs. LLM for Summarization**:
  - *Chosen Approach*: Stock calculations, deadline countdowns, 0–100 risk scoring formula, role separation, and pre-execution feasibility checks are strictly deterministic TypeScript code and SQL constraints. The Gemini API (`gemini-2.5-flash`) is used specifically to synthesize natural-language disruption executive summaries, compare trade-offs, and draft verified customer-facing delay explanations.
  - *Why*: In supply chains, a misplaced unit or wrong deadline causes financial loss. Deterministic rules guarantee precision; AI adds communicative intelligence.
- **Decision 3: Separation of Duties & Prevention of Self-Approval**:
  - *Chosen Approach*: The backend rejects any approval attempt if the authenticated user ID matches the recovery plan creator's user ID. The UI clearly displays an informational callout indicating who created the plan and which distinct manager must authorize it.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DisruptionIQ Web Application                    │
├────────────────────────────────────────────────────────────────────────┤
│  Portals & Roles:                                                      │
│  - Delivery Agent (/agent/*)      - Parent Company (/parent/*)         │
│  - Partner Admin (/dashboard)    - Customer Portal (/customer/*)       │
│  - Ops Analyst / SCM / WH Operator / Procurement Approver / Admin      │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / REST & Webhooks
┌─────────────────────────────────▼──────────────────────────────────────┐
│                       Express 4 Backend (server.ts)                    │
│  ├── Auth & Role-Based Access Control Middleware                       │
│  ├── Webhook Ingestion & Idempotency Engine (HMAC / Key check)         │
│  ├── Deterministic Risk Scoring & Impact Calculation Engine            │
│  ├── Recovery Plan Feasibility Revalidator & Separation-of-Duties      │
│  └── Gemini AI Service (Disruption Summaries & Trade-Off Analysis)     │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ SQLite Driver (better-sqlite3)
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    Persistent Database (disruptioniq.db)               │
│  ├── suppliers (code, name, contact, performance_score)                │
│  ├── shipments (awb, supplier_id, origin, destination, eta, status)    │
│  ├── warehouses (code, name, city, lat, lng, capacity, operator)       │
│  ├── inventory (warehouse_id, sku, on_hand, reserved, safety_stock)   │
│  ├── orders (id, customer, priority, deadline, quantity, status)       │
│  ├── disruption_alerts (id, source, title, severity, status, details) │
│  ├── recovery_plans (id, disruption_id, option_type, cost, state)      │
│  ├── approvals (plan_id, role, approver_name, status, comments)        │
│  ├── audit_trail (timestamp, user, role, action, target, changes)      │
│  ├── carrier_webhooks (idempotency_key, carrier, awb, payload, status) │
│  └── complaints (id, order_id, category, description, status)          │
└────────────────────────────────────────────────────────────────────────┘
```

### Core API Endpoints
- `GET /api/health`: Health status and database connectivity.
- `GET /api/state`: Full consolidated snapshot (active disruptions, affected orders, warehouses, recovery status).
- `POST /api/alerts/classify`: Classify severity with audited justification.
- `POST /api/scenarios/run`: Execute Scenario 1 (supplier delay) or Scenario 2 (carrier webhook).
- `POST /api/webhooks/carrier`: Ingest webhook events with duplicate detection via idempotency keys.
- `POST /api/plans/select`: Create a recovery plan from generated options.
- `POST /api/plans/:id/decide`: Approve, reject, or modify with backend separation-of-duties check.
- `POST /api/plans/:id/execute`: Run pre-flight revalidation (stock, deadlines, locks) and simulate execution.
- `POST /api/agent/tickets`: Submit agent delay ticket with automated MIP-04 checks.
- `POST /api/ai/summary`: Request Gemini-generated disruption analysis and comparison.
- `GET /api/audit`: Query tamper-evident system audit trail.

***

## 5. Verification & Acceptance Criteria
1. **Full-Stack Execution**: Express dev server mounts Vite frontend, and all state changes persist in SQLite.
2. **Two Scenarios Demonstrated**: Both Scenario 1 (supplier stoppage) and Scenario 2 (carrier delay with duplicate webhook replay) can be triggered in 1 click and traced end-to-end.
3. **Deterministic Rules & Explainability**: Order risk score explicitly shows point contributions for deadline, shortage, priority, and disruption severity.
4. **Enforced Separation of Duties**: Attempting to approve a plan as its creator is blocked both in the UI and with a 403 response on the backend.
5. **Revalidation Safety**: Executing a plan re-checks live stock and double allocations before marking the simulation executed.
