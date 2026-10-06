# Story 0.5: Generation Credit Ledger & Stripe Billing Integration

Status: done

## Story

As a Phase 1 free user,
I want my AI generation usage tracked against a monthly credit limit,
So that I understand my usage and am prompted to upgrade when credits are exhausted — without silent failures or unexpected charges.

## Acceptance Criteria

- [x] Given a Phase 1 user with remaining credits
- [x] When they trigger any AI generation
- [x] Then one credit is debited from the generation_credits ledger before the LLM API call is made
- [x] And if the user has 0 credits remaining, the API returns `{ "error": "CREDITS_EXHAUSTED" }` and the UI shows: "You've used all your credits for this month. Upgrade to keep creating."
- [x] And Phase 2 and Phase 3 users bypass the credit check entirely (unlimited)
- [x] Given a user clicks "Upgrade to Phase 2" and completes Stripe Checkout
- [x] When Stripe webhook fires, user phase updates to phase_2 and credit checks are cleared

## Tasks / Subtasks

- [x] Setup SQL migrations adding `generation_credits` column to PostgreSQL `users` table
- [x] Create credit depletion route `/api/billing/consume-credit`
- [x] Implement Stripe simulated checkout endpoint `/api/billing/stripe-checkout`
- [x] Add webhook simulator `/api/billing/mock-webhook` for sandbox verification
- [x] Create frontend upgrades controller triggering checkout redirections and webhook updates

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### File List

- [services/api/src/routes/billing.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/src/routes/billing.ts)
- [apps/web/src/app/dashboard/page.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/dashboard/page.tsx)
- [infra/migrations/sql/002_add_credits_and_billing.sql](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/infra/migrations/sql/002_add_credits_and_billing.sql)
