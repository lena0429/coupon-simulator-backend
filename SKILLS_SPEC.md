# SKILLS_SPEC.md — AI Skills Specification (v0.1)

> This document defines the AI-invocable skills for the Coupon Simulator backend.
> Skills are structured tool definitions that allow an AI agent to interact with
> backend capabilities without reimplementing business logic.

---

## What Is a Skill?

A **skill** is a named, typed, invocable unit of backend capability exposed to an AI agent.

Each skill has:
- A **name** — the identifier the agent uses to call it (snake_case)
- A **description** — plain language explanation for the agent
- An **input schema** — the typed parameters the agent must provide
- An **output shape** — the typed response the agent will receive
- A **backend mapping** — the internal engine function or service it wraps
- **Notes** — side effects, constraints, and assumptions

Skills in v0.1 are **stateless and read-only**. They compute and return results.
They do not write to any database, session, or external system.

---

## Skill Definitions

---

### 1. `get_cart`

**Description:**
Accepts a list of cart items and returns a structured cart summary including
line-item details, item count, and computed subtotal. Does not apply any coupon.

**Input Schema:**
```typescript
interface GetCartInput {
  items: CartItem[];
}

interface CartItem {
  id: string;       // Unique item identifier
  name: string;     // Display name
  price: number;    // Unit price in USD (>= 0)
  qty: number;      // Quantity (positive integer)
}
```

**Output Shape:**
```typescript
interface GetCartOutput {
  items: CartItem[];
  itemCount: number;   // Total number of individual units (sum of qty)
  subtotal: number;    // Sum of (price × qty) for all items, rounded to 2dp
}
```

**Backend Mapping:**
- Computes `subtotal` using `roundMoney()` from `src/engine/pricing/money.ts`
  to avoid a full pricing round-trip for a cart-only view.
- `itemCount` is derived from `items` directly (sum of `qty`).

**Notes:**
- Read-only. No side effects.
- The backend is stateless — there is no server-side stored cart.
  The agent passes the full cart on every call.
- `itemCount` is the sum of all `qty` values, not the count of distinct line items.

---

### 2. `validate_coupon`

**Description:**
Checks whether a given coupon code is recognized and currently supported.
Returns validity status and, if valid, a brief description of the discount.

**Input Schema:**
```typescript
interface ValidateCouponInput {
  couponCode: string;   // The coupon code to validate (case-insensitive)
}
```

**Output Shape:**
```typescript
interface ValidateCouponOutput {
  isValid: boolean;
  couponCode: string;            // Normalized (uppercased, trimmed) code
  discountDescription?: string;  // e.g. "10% off" — only present if valid
}
```

**Backend Mapping:**
- Calls `isSupportedCoupon(normalizedCode)` from
  `src/engine/pricing/rules/percentOff.ts`.
- Normalization (trim + uppercase) mirrors the behavior already in `simulatePricing()`.

**Notes:**
- Read-only. No side effects.
- Coupon codes are normalized before validation. `" save10 "` and `"SAVE10"`
  are treated identically.
- Does not apply a discount or require cart items.
- `discountDescription` is a human-readable string for the agent, not a computed
  monetary value. It is derived from the coupon definition, not from any cart.

---

### 3. `apply_coupon`

**Description:**
Applies a coupon code to a list of cart items and returns the computed discount
and updated totals. Does not modify any stored state.

**Input Schema:**
```typescript
interface ApplyCouponInput {
  items: CartItem[];
  couponCode: string;
}
```

**Output Shape:**
```typescript
interface ApplyCouponOutput {
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: string;   // Normalized coupon code, present only if valid
  warnings?: Warning[];
}

interface Warning {
  code: string;
  message: string;
}
```

**Backend Mapping:**
- Calls `simulatePricing(items, couponCode)` from `src/engine/pricing/index.ts`.
- Returns the full result as-is (subtotal, discount, total, appliedCoupon, warnings).

**Notes:**
- Read-only. No side effects.
- If the coupon code is unrecognized, `warnings` will contain a `COUPON_UNKNOWN` entry
  and `discount` will be `0`.
- If the cart subtotal is `0`, no discount is applied even for a valid coupon.
- This skill differs from `simulate_checkout` in **agent intent** only — both call
  `simulatePricing` under the hood. `apply_coupon` is used when the agent's goal is
  specifically to evaluate a coupon; `simulate_checkout` is used for a full end-to-end
  pricing result.

---

### 4. `simulate_checkout`

**Description:**
Runs a full checkout simulation: computes the cart subtotal, applies an optional coupon,
and returns a complete pricing breakdown. This is the primary end-to-end skill.

**Input Schema:**
```typescript
interface SimulateCheckoutInput {
  items: CartItem[];
  couponCode?: string;   // Optional
}
```

**Output Shape:**
```typescript
interface SimulateCheckoutOutput {
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
  warnings?: Warning[];
}
```

**Backend Mapping:**
- Calls `simulatePricing(items, couponCode?)` from `src/engine/pricing/index.ts`.
- Returns the result directly with no transformation.

**Notes:**
- Read-only. No side effects. No order is created.
- This is a simulation only — it does not trigger payment, inventory, or fulfillment.
- `couponCode` is optional. If omitted, full subtotal is returned as total with no discount.
- This skill is the agent-facing equivalent of `POST /pricing/simulate`.
- Prefer this skill when the agent needs a complete pricing result in one call.

---

## Skill Summary Table

| Skill | Input | Engine Function | Side Effects |
|---|---|---|---|
| `get_cart` | items | `roundMoney` | None |
| `validate_coupon` | couponCode | `isSupportedCoupon` | None |
| `apply_coupon` | items, couponCode | `simulatePricing` | None |
| `simulate_checkout` | items, couponCode? | `simulatePricing` | None |

---

## Assumptions (v0.1)

1. **Stateless cart**: The backend does not store cart state. Skills receive the full cart
   on every invocation.
2. **Single coupon per checkout**: Only one coupon code can be applied at a time,
   matching the current engine capability.
3. **Supported coupons are static**: At v0.1, only `SAVE10` is supported. The
   `discountDescription` in `validate_coupon` is derived from the static coupon definition.
4. **No authentication at the skill layer**: Skills are internal. Authentication is
   enforced at the HTTP route layer, not inside skill handlers.
5. **No checkout persistence**: `simulate_checkout` is a pure computation.
   Order creation is out of scope for v0.1.
