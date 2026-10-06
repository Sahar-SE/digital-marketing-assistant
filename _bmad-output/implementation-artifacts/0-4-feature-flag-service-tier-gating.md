# Story 0.4: Feature Flag Service & Tier Gating

Status: done

## Story

As a platform operator,
I want every feature access decision routed through a single FeatureFlagService.userCan(userId, feature) function,
So that Phase 1, Phase 2, and Phase 3 boundaries are enforced consistently at both the API and UI layers.

## Acceptance Criteria

- [x] Given a Phase 1 (free) user
- [x] When their JWT is validated on any API route that requires Phase 2 (e.g., Prompt Library)
- [x] Then the API returns 403 Forbidden with body `{ "error": "FEATURE_REQUIRES_PHASE_2" }`
- [x] And the same Phase 2-locked surface in the UI shows a visible "Upgrade to unlock" label
- [x] And FeatureFlagService reads the user's phase from the users table; caching does not exceed 60 seconds
- [x] And no UI component or API route directly reads the users.phase field — all checks go through FeatureFlagService

## Tasks / Subtasks

- [x] Implement memory caching (60s TTL) in `FeatureFlagService`
- [x] Create feature tiers mapping array in `@dma/feature-flags`
- [x] Integrate `FeatureFlagService.userCan` checks inside API endpoints
- [x] Render upgrade CTA gates on frontend dashboard view

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### File List

- [packages/feature-flags/src/index.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/packages/feature-flags/src/index.ts)
- [services/api/src/index.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/src/index.ts)
- [apps/web/src/app/dashboard/page.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/dashboard/page.tsx)
