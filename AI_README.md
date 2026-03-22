# AI_README.md

> This document is written for AI coding agents (Claude, Cursor, etc.) working in this repository.
> Read this before making any changes related to the AI skills layer.

---

## Project Overview

This is the backend for the **Coupon Simulator** — a TypeScript/Express service that computes
cart totals, validates and applies coupon codes, and simulates checkout pricing. The frontend
and backend live in separate repositories.

The backend is intentionally stateless: it receives cart items and an optional coupon code,
computes pricing, and returns the result. No orders are persisted and no payments are processed.

---

## Goal of the AI Skills Layer

We are adding a thin **AI skills layer** so that a future AI agent can invoke backend capabilities
as structured, named tools — without reimplementing any business logic.

The skills layer is the contract between an AI agent and the backend's existing engine.
It is not a new service. It is a structured wrapper.

---

## Architecture Overview

### Before (HTTP-only)

```
Client / Agent
     │
     ▼
POST /pricing/simulate       ← Express route
     │
     ▼
simulatePricing()            ← src/engine/pricing/index.ts
     │
     ▼
applyPercentOff()            ← src/engine/pricing/rules/percentOff.ts
```

### After (Skills layer added)

```
AI Agent
     │
     ▼
SkillRegistry                ← src/agent/registry.ts
     │
     ├── get_cart            ← src/skills/getCart.ts
     ├── validate_coupon     ← src/skills/validateCoupon.ts
     ├── apply_coupon        ← src/skills/applyCoupon.ts
     └── simulate_checkout   ← src/skills/simulateCheckout.ts
          │
          ▼
     Pricing Engine          ← src/engine/pricing/index.ts
     Coupon Rules            ← src/engine/pricing/rules/percentOff.ts
```

The skills layer calls internal engine functions **directly**.
It does NOT make HTTP calls to the Express server.

---

## Key Principles

1. **Thin layer** — Skills contain no business logic. They validate input, call the engine,
   and return a structured result.
2. **No duplication** — All math, coupon logic, and validation lives in `src/engine/`.
   Skills delegate entirely.
3. **Direct engine calls** — Skills import and call engine functions. No internal HTTP round-trips.
4. **Typed contracts** — Every skill has an explicit input type and output type in TypeScript.
5. **Modular** — Each skill is its own file. Adding or removing a skill has no side effects
   on others.
6. **No side effects at v0.1** — All skills are read-only or stateless computations.
   No writes, no persistence.

---

## Current Scope (v0.1)

This is the **foundation release**. The goal is correctness and structure, not intelligence.

**In scope:**
- Four skills: `get_cart`, `validate_coupon`, `apply_coupon`, `simulate_checkout`
- A skill registry that exposes all available tools for an agent
- TypeScript interfaces for skill inputs and outputs
- Thin wrappers around `src/engine/pricing/`

**Out of scope (v0.2+):**
- Agent reasoning or multi-step orchestration
- Best-coupon selection or comparison logic
- Stateful cart sessions or persistence
- Integration with external AI SDKs (OpenAI, Anthropic tool-use APIs)
- Frontend changes of any kind

---

## Folder Structure

```
src/
├── skills/
│   ├── types.ts              # Shared input/output types for all skills
│   ├── getCart.ts            # Skill: get_cart
│   ├── validateCoupon.ts     # Skill: validate_coupon
│   ├── applyCoupon.ts        # Skill: apply_coupon
│   └── simulateCheckout.ts   # Skill: simulate_checkout
│
├── agent/
│   └── registry.ts           # Collects and exports all skills as named tools
│
├── engine/                   # EXISTING — do not modify
│   └── pricing/
│       ├── index.ts
│       ├── money.ts
│       └── rules/
│           └── percentOff.ts
│
├── routes/                   # EXISTING — do not modify
├── middleware/               # EXISTING — do not modify
└── types.ts                  # EXISTING — shared domain types (CartItem, PricingResult, etc.)
```

---

## Layer Responsibilities

### `src/skills/`

Each file exports a single skill object. A skill has:
- A `name` — snake_case string identifier used by the agent
- A `description` — plain-language explanation used as the tool description
- An `inputSchema` — Zod schema for runtime input validation
- A `handler(input) => output` — delegates to the engine, returns a typed result
- Exported TypeScript input/output types

Skills must not:
- Contain pricing math or coupon logic
- Call external APIs or services
- Import from `src/routes/` or `src/middleware/`
- Make HTTP requests to the local server

### `src/agent/`

Contains the **skill registry** — a single module that collects all skills and exposes them
as a unified list of tool definitions. This is the integration point for any future AI SDK
or agent framework.

The registry must not:
- Contain any skill logic
- Make routing or HTTP decisions

---

## Constraints for AI Coding Agents

- **Do not modify** any file under `src/engine/`, `src/routes/`, or `src/middleware/`
  unless there is an explicit, unambiguous bug to fix.
- **Do not add** business logic to `src/skills/`. Delegate to the engine.
- **Do not implement** v0.2 features (orchestration, reasoning, persistence) in this step.
- **Do not change** anything in the frontend repository.
- **Do not make** internal HTTP calls from skill handlers. Import the engine directly.
- If a required engine function does not exist, note the assumption in a comment and
  create a minimal, well-typed stub — do not silently invent logic.

---

## Deliverables Expected from the Agent

When implementing v0.1, produce the following files:

| File | Purpose |
|---|---|
| `src/skills/types.ts` | Shared input/output interfaces for all skills |
| `src/skills/getCart.ts` | `get_cart` skill implementation |
| `src/skills/validateCoupon.ts` | `validate_coupon` skill implementation |
| `src/skills/applyCoupon.ts` | `apply_coupon` skill implementation |
| `src/skills/simulateCheckout.ts` | `simulate_checkout` skill implementation |
| `src/agent/registry.ts` | Skill registry |

Each skill file must include a JSDoc comment describing what it does and which engine
function it delegates to.

---

## Notes for AI Coding Agents

- Existing domain types are in `src/types.ts`. Reuse `CartItem`, `PricingResult`,
  and `Warning` wherever appropriate.
- The main engine entry point is `simulatePricing(items, couponCode?)` in
  `src/engine/pricing/index.ts`.
- Coupon validation lives in `src/engine/pricing/rules/percentOff.ts` →
  `isSupportedCoupon()` and `applyPercentOff()`.
- The backend is stateless — there is no stored cart. `get_cart` should treat input items
  as the cart and return a structured, computed view (subtotal, item count, line items).
- All monetary values are in US dollars, floating-point, rounded to 2 decimal places
  via `roundMoney()` in `src/engine/pricing/money.ts`.
- When in doubt about scope, do less and note the assumption clearly.
