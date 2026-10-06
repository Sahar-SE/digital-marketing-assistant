---
stepsCompleted: [step-01, step-02, step-03]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-digital-marketing-assistant-2026-08-19/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-digital-marketing-assistant-2026-08-19/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/architecture/architecture-digital-marketing-assistant-2026-08-19/SOLUTION-DESIGN.md
---

# Digital Marketing Assistant Platform - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Digital Marketing Assistant Platform, decomposing the requirements from the PRD, Architecture Spine, and Solution Design into implementable stories.

---

## Requirements Inventory

### Functional Requirements

FR-1: The system presents 5-7 guided Brand DNA questionnaire questions in sequence. Mandatory questions (product type, primary audience, tone) block progression with a clear inline explanation if skipped. Optional questions do not block.

FR-2: The user may provide a website URL, up to 5 social media profile URLs, uploaded documents (PDF, DOCX, TXT, image), up to 3 competitor links, and an analytics CSV export. Processing runs asynchronously via the brand-dna-harvest job. The user proceeds to the dashboard and sees a progress indicator.

FR-3: After the questionnaire and harvest, the system presents the Brand DNA Card for review and inline editing. Changes are saved as a new Brand DNA version (non-destructive). Incomplete Brand DNA blocks generation with BRAND_DNA_INCOMPLETE error.

FR-4: The user selects a content goal via structured picker: platform (Instagram, TikTok, LinkedIn, Facebook, Email, Blog), content type (product launch, engagement, educational, promotional, story, carousel), and target Segment Persona if defined.

FR-5: The system generates an initial content draft using the matched Prompt Template with Brand DNA JSON as the mandatory system-prompt prefix using the DRAFT-tier LLM model. Completes within 10 seconds under normal load.

FR-6: The user selects any text in the draft and adds an annotation (free text, max 200 chars). The system sends a RefinementRequest (current ContentVersion + delta instruction). Result saved as a new ContentVersion. Start Over requires confirmation and clears all ContentVersions.

FR-7: The user may associate a Segment Persona with a content piece before or after generation. When associated, persona preferences are incorporated into the Brand DNA prefix for generation and refinement.

FR-8: All five Ethical Firewall checks (Originality, Bias, Hallucination, Brand Tone, Data Cleansing) run in a single batched call after the user signals completion. Results returned as a ContentHealthReport within 15 seconds. A failed check returns CHECK_UNAVAILABLE, never defaults to pass.

FR-9: The ContentHealthReport is rendered as a non-dismissable dashboard card above the Publish/Export button. Shows each check status (green/yellow/red), a one-line explanation of flags, and resolution actions. Publish/Export disabled until all flags resolved.

FR-10: Each resolution action (EDIT, REMOVE, HUMAN_VERIFIED) is logged immutably with user ID, content piece ID, check type, action, and timestamp. HUMAN_VERIFIED may not be applied to plagiarism flags.

FR-11: Prompt Template entity: id (UUID), category, subcategory, template_body, variables[], performance_score (float 0-100), platform, industry, source (user-created/system/marketplace), created_at, updated_at. Users may create, edit, duplicate, and archive their own templates. System templates are read-only.

FR-12: The performance-sync background job runs weekly, pulling engagement metrics from connected platform adapters for content generated using each template. Normalizes metrics into a performance_score delta. Platform adapter failure logs PLATFORM_SYNC_PARTIAL and continues without failing the entire job.

FR-13: Content creation returns the top 3 matching Prompt Templates ranked by: (1) exact platform + industry match, (2) performance_score descending, (3) recency. Falls back to top 3 system templates when no match exists. All 3 options visible before user commits.

FR-14: During Marketing Mind Meld, the brand-dna-harvest job analyzes user-provided URLs and uploads, extracting content patterns, tone signals, and structural templates. Saved as user-created Prompt Templates with source: harvest and performance_score: null. Appears within 10 minutes of onboarding submission.

FR-15: User provides campaign name, product/topic, launch date, duration (7/14/30 days), platforms, primary Segment Persona. System generates a full content calendar using the POLISH-tier LLM and matching Prompt Templates within 30 seconds. Every post references a Prompt Template by ID.

FR-16: User may reorder posts (change date/time), move a post to a different platform slot, or reassign to a different Segment Persona. Moving to a different platform triggers a warning with Accept Adaptation or Keep as-is options. Editing opens the Handshake refinement loop.

FR-17: Before campaign approval, the Ethical Firewall runs across every post in the campaign. Posts with unresolved flags are highlighted in the calendar. Approve Campaign is disabled (not warned) until all posts pass or are resolved.

FR-18: User provides segment name, 1-sentence description, 2-3 key values or motivations, optional demographic signals. System generates a named Persona and profile card. Maximum 5 Segment Personas per Phase 2 user.

FR-19: User may request a Segment Persona reaction on any draft content piece. System generates a first-person reaction grounded in Persona values and Brand DNA context. Always labeled with Persona name and disclaimer. Includes at least one specific actionable suggestion. Does not create a ContentVersion.

FR-20: User selects a canvas format (Instagram post, story, Facebook ad, LinkedIn banner). System generates 3-4 layout options using ImageGenAdapter, incorporating brand colors and top-performing headline copy as CanvasTextElement within 20 seconds. AI image prompt must not include text intended to appear in the final design.

FR-21: Canvas supports independent layers: AI-generated visual layer, CanvasTextElement layers (headline, body, CTA), shape/overlay layers. Double-clicking a CanvasTextElement opens inline text editing. Font, size, color, and alignment are user-controlled. Layer panel allows reordering.

FR-22: On export, all layers flatten to raster (PNG or JPG at 1080x1080, 1920x1080, or 1080x1920). The .canvas-project file saves the full layer structure for future re-editing. Reopening restores all layers, text, and positions exactly.

### Non-Functional Requirements

NFR-1: Performance - Draft generation completes within 10 seconds under normal load (FR-5).
NFR-2: Performance - Ethical Firewall five-check evaluation completes within 15 seconds (FR-8).
NFR-3: Performance - Canvas layout generation completes within 20 seconds (FR-20).
NFR-4: Performance - Campaign generation completes within 30 seconds (FR-15).
NFR-5: Performance - Brand DNA harvest from 3 URLs completes within 5 minutes (FR-2).
NFR-6: Reliability - Platform adapter failure during performance-sync does not fail the entire job; logs PLATFORM_SYNC_PARTIAL (FR-12).
NFR-7: Security - All API routes authenticated via JWT (Supabase Auth). Service-to-service calls use service-role tokens.
NFR-8: Security - All secrets and env-specific values stored in environment variables; no config values in source code.
NFR-9: Security - Audit log entries (Ethical Firewall resolutions) are immutable after creation (FR-10).
NFR-10: Cost control - All AI API calls debit a generation_credits ledger entry before the call; 0-credit users receive CREDITS_EXHAUSTED error, not a failed API call (AD-8).
NFR-11: Observability - Structured JSON logs; every log line includes userId, traceId, feature, severity.
NFR-12: Data integrity - Entity IDs use UUID v4 everywhere; no auto-increment integers in public APIs.
NFR-13: Access control - Feature access governed by FeatureFlagService.userCan(userId, feature). No UI or API route accesses a higher-tier capability without a passing flag check (AD-8).
NFR-14: LLM cost control - DRAFT-tier LLM (Gemini Flash / GPT-4o-mini) used for all initial drafts and refinement deltas. POLISH-tier LLM (Gemini Pro / GPT-4o) used only for final polish, complex planning, hallucination analysis (AD-7).
NFR-15: Data integrity - Plagiarism HUMAN_VERIFIED action must be blocked at API level, not only UI level (FR-10).

### Additional Requirements (from Architecture Spine)

- Project uses monorepo structure: apps/web (Next.js 14), services/api (Node.js/Express), packages/shared-types, packages/feature-flags, infra/docker, infra/migrations.
- Epic 1 Story 1 must scaffold the full monorepo skeleton before any feature work begins (no starter template; greenfield).
- Domain core (brand-dna, prompt-library, ethical-firewall, handshake, personas, campaign) has zero outward dependencies - domain entities must not import from routes, adapters, or infrastructure packages.
- All prompt template logic referenced by ID from the prompt_templates table; no prompt strings hardcoded in application or service code (AD-4).
- Canvas text rendered as CanvasTextElement (separate DOM/canvas nodes); ImageGenAdapter must never receive text intended to appear in the final design (AD-5).
- PlatformPort interface wraps all external social/ad platform APIs; each platform (Meta, LinkedIn) is a separate adapter; failure isolated and logged as PLATFORM_SYNC_PARTIAL (AD-6).
- LLMPort interface wraps LLM calls; GeminiAdapter and OpenAIAdapter implement it; tiered dispatch enforced at adapter level (AD-7).
- BullMQ background workers: performance-sync (weekly engagement pull), brand-dna-harvest (async URL scraping).
- Supabase Auth for authentication; PostgreSQL 16 for relational data; Redis 7 for caching and job queues.
- Stripe for subscription billing and Phase 1/2 tier gating.

### UX Design Requirements

No UX design document found in planning-artifacts. UX design work is a recommended next step (bmad-ux) before story-level implementation begins. Stories in this document will include UX acceptance criteria derived from PRD user journeys and FR testable consequences; visual/interaction specifications should be added when UX is available.

### FR Coverage Map

| FR | Epic | Story |
|---|---|---|
| FR-1 | Epic 1 | Story 1.3 |
| FR-2 | Epic 1 | Story 1.4 |
| FR-3 | Epic 1 | Story 1.5 |
| FR-4 | Epic 2 | Story 2.1 |
| FR-5 | Epic 2 | Story 2.2 |
| FR-6 | Epic 2 | Story 2.3 |
| FR-7 | Epic 2 | Story 2.4 |
| FR-8 | Epic 3 | Story 3.1 |
| FR-9 | Epic 3 | Story 3.2 |
| FR-10 | Epic 3 | Story 3.3 |
| FR-11 | Epic 4 | Story 4.1 |
| FR-12 | Epic 4 | Story 4.3 |
| FR-13 | Epic 4 | Story 4.2 |
| FR-14 | Epic 4 | Story 4.4 |
| FR-15 | Epic 5 | Story 5.1 |
| FR-16 | Epic 5 | Story 5.2 |
| FR-17 | Epic 5 | Story 5.3 |
| FR-18 | Epic 6 | Story 6.1 |
| FR-19 | Epic 6 | Story 6.2 |
| FR-20 | Epic 7 | Story 7.1 |
| FR-21 | Epic 7 | Story 7.2 |
| FR-22 | Epic 7 | Story 7.3 |
| NFR-7,8,10,11,12,13 | Epic 0 | Story 0.2 |
| AD-1,4,6,7 | Epic 0 | Story 0.1 |



---

## Epic 0: Project Foundation & Infrastructure

Users can sign up, authenticate, and access a working web application shell with all shared infrastructure in place — auth, database, API server, feature flag gating, credit accounting, Stripe billing, monorepo skeleton, design system tokens, and typography.

### Story 0.1: Monorepo Scaffold & Development Environment

As a **developer**,
I want a fully configured monorepo with apps/web, services/api, packages/shared-types, packages/feature-flags, infra/docker, and infra/migrations workspaces,
So that all future stories have a consistent, runnable foundation with no conflicting tooling.

**Acceptance Criteria:**

**Given** the repository is cloned and npm install is run
**When** a developer runs npm run dev from the root
**Then** both the Next.js 14 web app and Node.js/Express API server start without errors, and localhost:3000 returns a working response

**And** the shared-types package is importable in both apps/web and services/api without circular dependency errors

**And** all environment variables are loaded from .env.local (web) and .env (api); no secrets exist in source files; a .env.example documents every required variable

**And** infra/docker/docker-compose.yml starts PostgreSQL 16 and Redis 7 locally with a single command

**And** infra/migrations contains an initial migration that creates the schema_migrations tracking table and runs successfully via the migration CLI

---

### Story 0.2: Authentication with Supabase (Sign Up, Login, Session)

As a **new user**,
I want to sign up with my email and password and log in to the platform,
So that I have a secure, persistent account that all my Brand DNA, content, and settings belong to.

**Acceptance Criteria:**

**Given** a user navigates to /signup
**When** they enter a valid email and password (min 8 chars) and submit
**Then** a Supabase Auth user is created, a corresponding users row is inserted in PostgreSQL (user_id UUID, email, created_at, phase: phase_1), and the user is redirected to the Onboarding flow

**And** submitting with an already-registered email shows an inline error "An account with this email already exists" — not a page reload

**Given** a registered user navigates to /login
**When** they enter valid credentials
**Then** they are authenticated via Supabase JWT, the session is stored, and they are redirected to the Dashboard

**And** all API routes return 401 Unauthorized for requests missing a valid JWT — no route is accessible without authentication

**And** the JWT is verified server-side on every API request using the Supabase service-role secret stored in an environment variable — never in source code

---

### Story 0.3: Design System Foundation (Tokens, Typography, Responsive Shell)

As a **user**,
I want a visually consistent, professionally styled application shell,
So that every surface I interact with feels intentional, readable, and premium from the first screen.

**Acceptance Criteria:**

**Given** the application loads in a browser
**When** any page renders
**Then** the primary color #7C3AED and all color tokens from DESIGN.md are applied as CSS custom properties on :root; no hardcoded hex values appear in component styles

**And** Bricolage Grotesque (display weight 700) and Inter (400/500/600) are loaded and render correctly — Bricolage Grotesque on display headings, Inter on all body and UI text

**And** the sidebar is 240px fixed on viewports >=1024px, collapses to a 56px icon-only rail at 768-1023px, and becomes a hidden sheet triggered from a top-bar menu button at <768px

**And** the main content area respects a maximum width of 896px and is centered; the right panel is 360px fixed on viewports >=1280px

---

### Story 0.4: Feature Flag Service & Tier Gating

As a **platform operator**,
I want every feature access decision routed through a single FeatureFlagService.userCan(userId, feature) function,
So that Phase 1, Phase 2, and Phase 3 boundaries are enforced consistently at both the API and UI layers.

**Acceptance Criteria:**

**Given** a Phase 1 (free) user
**When** their JWT is validated on any API route that requires Phase 2 (e.g., Prompt Library)
**Then** the API returns 403 Forbidden with body { "error": "FEATURE_REQUIRES_PHASE_2" } — not a 404 or silent failure

**And** the same Phase 2-locked surface in the UI shows a visible "Upgrade to unlock" label — the feature is visible but disabled; it is never hidden entirely

**And** FeatureFlagService reads the user's phase from the users table; upgrading a user's phase in the database immediately reflects on the next request without a cache TTL longer than 60 seconds

**And** no UI component or API route directly reads the users.phase field — all checks go through FeatureFlagService

---

### Story 0.5: Generation Credit Ledger & Stripe Billing Integration

As a **Phase 1 free user**,
I want my AI generation usage tracked against a monthly credit limit,
So that I understand my usage and am prompted to upgrade when credits are exhausted — without silent failures or unexpected charges.

**Acceptance Criteria:**

**Given** a Phase 1 user with remaining credits
**When** they trigger any AI generation (draft, refinement, persona reaction, firewall evaluation)
**Then** one credit is debited from the generation_credits ledger before the LLM API call is made; the call only fires if credit deduction succeeds

**And** if the user has 0 credits remaining, the API returns { "error": "CREDITS_EXHAUSTED" } and the UI shows: "You've used all your credits for this month. Upgrade to keep creating." — no LLM call is made

**And** Phase 2 and Phase 3 users bypass the credit check entirely (unlimited generation)

**Given** a user clicks "Upgrade to Phase 2" and completes the Stripe Checkout flow
**When** the Stripe webhook fires
**Then** the webhook updates users.phase to phase_2, clears the credit limit, and the user can immediately generate without restrictions

**And** all Stripe webhook handlers verify the event signature using the Stripe webhook secret stored in an environment variable

---

## Epic 1: Brand DNA & Marketing Mind Meld

Users can complete the guided onboarding questionnaire, provide resource URLs and uploads for async harvest, review and confirm their Brand DNA Card, and edit it at any time in Settings. Brand DNA becomes the locked foundation for all AI generation.

### Story 1.1: Marketing Mind Meld — Guided Questionnaire (FR-1)

As a **new user**,
I want to answer a guided sequence of brand questions with clear examples and inline validation,
So that the platform understands my brand before I create my first piece of content.

**Acceptance Criteria:**

**Given** a newly authenticated user with no Brand DNA record
**When** they land on the app for the first time
**Then** they are redirected to /onboarding and the Mind Meld questionnaire begins — not the Dashboard

**And** the questionnaire presents exactly 5 mandatory questions (product type, primary audience, tone, brand admiration, biggest challenge) in sequence; each has a contextual pre-filled example based on the stated product type

**And** a linear progress bar at the top shows "Step N of 6 — [Step label]" in Bricolage Grotesque; Back is always available

**And** skipping a mandatory question shows an inline explanation of why it is required; the Next button stays disabled — no generic red error banner

**And** completing all mandatory questions creates a brand_dna record in PostgreSQL with status: incomplete and questionnaire_complete: true

---

### Story 1.2: Marketing Mind Meld — Resource Harvest (FR-2)

As a **new user**,
I want to share my existing website, social profiles, and past content during onboarding,
So that the platform can learn my brand from real examples instead of starting from zero.

**Acceptance Criteria:**

**Given** the user is on the resource harvest step (step 6 of 6)
**When** they submit the form with website URL, up to 5 social media URLs, up to 3 competitor links, and/or document uploads (PDF, DOCX, TXT, image)
**Then** the brand-dna-harvest BullMQ job is enqueued and the user is immediately redirected to the Dashboard — they are not blocked waiting for processing

**And** the Dashboard shows a progress indicator below the Brand DNA Card: "Still learning from your content — check back in a few minutes" — it auto-dismisses when the harvest job completes

**And** a URL that returns a non-200 HTTP response during harvest is logged as HARVEST_URL_FAILED and skipped — the rest of the harvest continues

**And** the harvest job completes within 5 minutes for a standard submission of 3 URLs

**And** file uploads are validated for type (PDF, DOCX, TXT, image only) and size (max 10MB per file) before the job is enqueued; invalid files show an inline error and are not submitted

---

### Story 1.3: Brand DNA Card — Confirmation & Editing (FR-3)

As a **user**,
I want to review my Brand DNA Card after onboarding and edit any field at any time,
So that my brand profile stays accurate as my brand evolves.

**Acceptance Criteria:**

**Given** the harvest job has completed (or the user skipped resource input)
**When** the user opens Settings > Brand DNA
**Then** the Brand DNA Card displays: brand name, product category, tone descriptors, audience description, style references, and ethical positioning — all fields populated from questionnaire and harvest results

**And** each field has a pencil icon on hover; clicking opens inline editing for that field; saving on blur updates the active Brand DNA immediately and creates a new brand_dna_version row (non-destructive)

**And** the card uses the Brand DNA Card DESIGN.md spec: left purple accent bar, gradient background from primary-subtle to surface

**And** "Brand DNA history" link opens a modal listing all previous versions (read-only) with timestamps

**And** if a user attempts to generate content while brand_dna.status is incomplete, the API returns { "error": "BRAND_DNA_INCOMPLETE" } and the UI shows an inline banner: "Finish your Brand DNA to start creating" with a link to Settings — not a silent failure and not a modal

---

## Epic 2: Content Creation with Human-AI Handshake

Users can select a content goal, be matched to a Prompt Template, generate a Brand DNA-grounded draft, annotate inline to trigger delta refinements, view their full ContentVersion history, and target a Segment Persona — all within the Content Editor.

### Story 2.1: Goal-Based Content Intent Selection (FR-4)

As a **user**,
I want to declare my content goal by choosing a platform and content type before generating anything,
So that the AI has the right context to match the best template and produce relevant output.

**Acceptance Criteria:**

**Given** a user with a complete Brand DNA clicks "New Content"
**When** the Content Editor opens
**Then** a structured goal picker is shown first: platform selector (Instagram, TikTok, LinkedIn, Facebook, Email, Blog) and content type selector (product launch, engagement, educational, promotional, story, carousel)

**And** an optional Segment Persona selector is shown if the user has defined any personas; it defaults to "Primary audience (Brand DNA)"

**And** selecting a platform + content type immediately returns the top 3 matching Prompt Templates ranked by (1) exact platform + industry match, (2) performance_score descending, (3) recency — displayed as template picker cards before generation begins

**And** each template card shows: template name, category breadcrumb, platform icon, and performance score bar using the DESIGN.md prompt-template-chip component spec

**And** if no matching templates exist, 3 system-default templates for that platform are shown as fallback — this fallback is never shown as an error

---

### Story 2.2: Brand DNA-Grounded AI Draft Generation (FR-5)

As a **user**,
I want the platform to generate a first content draft that sounds like my brand and respects my chosen platform and content type,
So that I start from something useful instead of a blank page.

**Acceptance Criteria:**

**Given** a user has selected a goal and chosen a Prompt Template
**When** they click "Generate with this template"
**Then** the LLM call is made using the DRAFT-tier model (Gemini Flash / GPT-4o-mini), with the user's Brand DNA JSON as the mandatory system-prompt prefix and the selected Prompt Template body as the user-prompt structure

**And** the draft appears in the Content Editor within 10 seconds under normal load; during generation the editor shows a skeleton animation — read-only, no spinner overlay

**And** if brand_dna.status is incomplete, the generation API returns { "error": "BRAND_DNA_INCOMPLETE" } and the UI shows an inline banner — no partial or generic draft is produced

**And** the generated draft is stored as ContentVersion 1 with: content_piece_id (UUID), version_number (1), content_body, template_id (ref), created_at, annotation_used (null for first version)

**And** the draft respects the platform character/word limit for the selected content type (limits stored as config, not hardcoded inline)

---

### Story 2.3: Inline Annotation & Delta Refinement (Human-AI Handshake) (FR-6)

As a **user**,
I want to select any text in my draft, add a note for the AI, and receive a refined version that incorporates only my instruction — not a full regeneration,
So that I feel in control of the output and my edit history is preserved.

**Acceptance Criteria:**

**Given** a ContentVersion exists in the editor
**When** the user selects any text, types an annotation (max 200 chars) in the popover, and clicks Refine
**Then** the editor locks (read-only); the annotation point is highlighted; a spinner appears at the annotation anchor

**And** the API sends a RefinementRequest containing only: current ContentVersion body + delta instruction — NOT a full re-prompt from scratch

**And** a new ContentVersion is created (version_number incremented, annotation_used set) and the editor unlocks with the refined content loaded

**And** the ContentVersion timeline in the right panel adds a new node: truncated preview, timestamp, annotation used; nodes connected by a dashed vertical line; active node has primary-colored border per DESIGN.md content-version-node spec

**And** clicking any prior ContentVersion node opens a read-only slide-in preview with a "Restore this version" option requiring an inline confirmation banner — not a modal

**And** the "Start Over" button triggers an inline confirmation banner: "This will clear your edit history. Start fresh?" — on confirm, the ContentVersion chain is cleared and fresh generation begins; never clears silently

**And** Cmd+Shift+A / Ctrl+Shift+A opens the annotation popover on the current text selection; Escape dismisses it

---

### Story 2.4: Segment Persona Targeting in Content Generation (FR-7)

As a **user**,
I want to associate a Segment Persona with a content piece during or after generation,
So that the AI incorporates that persona's preferences into the draft and refinements.

**Acceptance Criteria:**

**Given** a user has at least one Segment Persona defined
**When** they associate a persona with a content piece via the goal picker or right panel
**Then** subsequent generation and refinement calls include the persona's values, motivations, and demographic signals appended to the Brand DNA system-prompt prefix

**And** changing the associated persona on an existing draft shows an inline prompt: "Regenerate for [Persona Name] or refine manually?" — with two explicit action buttons; neither fires automatically

**And** a content piece with no persona generates for the primary Brand DNA audience — no warning shown for this default state

**And** the currently associated persona is shown as an avatar chip (DESIGN.md segment-persona-avatar spec) in the right panel header; clicking it opens the persona profile panel

---

## Epic 3: Ethical Firewall (Content Health Report)

Users can run the five-check Ethical Firewall on any content piece, view the ContentHealthReport as a persistent panel, resolve flags via EDIT / REMOVE / HUMAN VERIFIED, and publish or export only when all flags are cleared.

### Story 3.1: Automated Five-Check Content Evaluation (FR-8)

As a **user**,
I want the platform to automatically evaluate my content across five ethical dimensions when I signal I am done editing,
So that I catch plagiarism, bias, hallucinations, brand drift, and fabricated data before anything goes public.

**Acceptance Criteria:**

**Given** a user has a ContentVersion in the editor and clicks "Check content"
**When** the Ethical Firewall evaluation is triggered
**Then** EthicalFirewallService.evaluate() runs all five checks — Originality, Bias Scan, Hallucination Flag, Brand Tone Audit, Data Cleansing — as a single batched API composition and returns a ContentHealthReport within 15 seconds

**And** each check returns one of: pass, warn, flag, or CHECK_UNAVAILABLE — a check that fails due to an external API error always returns CHECK_UNAVAILABLE, never defaults to pass

**And** CHECK_UNAVAILABLE is treated as an unresolved state; the Publish button remains disabled unless the user takes a HUMAN_VERIFIED action on that specific check

**And** the Firewall evaluation deducts one generation credit from the Phase 1 credit ledger before calling external APIs; a Phase 1 user with 0 credits receives CREDITS_EXHAUSTED and no evaluation runs

**And** the right panel shows 5 skeleton check rows with a pulse animation during evaluation; if evaluation exceeds 15 seconds a "Still checking..." label appears

---

### Story 3.2: Visible ContentHealthReport UI & Publish Gate (FR-9)

As a **user**,
I want to see exactly what the Ethical Firewall found, understand what each flag means, and know precisely what I need to do before I can publish,
So that I never publish content that could embarrass me or my brand.

**Acceptance Criteria:**

**Given** a ContentHealthReport has been generated
**When** results are returned
**Then** the Firewall Card renders in the right panel above the Publish button — non-dismissable, non-minimizable — showing all five checks with their status (colored indicator dot + text label)

**And** the Publish/Export button is in a visually distinct disabled state (DESIGN.md publish-button-disabled spec) when any check is flag or CHECK_UNAVAILABLE

**And** when all checks are pass or each non-pass check is resolved, the Firewall Card background transitions to firewall-pass-subtle, border to firewall-pass (200ms ease), and the Publish button simultaneously activates (DESIGN.md publish-button-active spec)

**And** exactly one flag reads: "One thing to review before publishing"; two or more reads "N things to review before publishing" — never "Error" or "Failed"

**And** all checks passing reads: "Looks good — ready to publish"

**And** the Publish button is never hidden — only disabled or active; aria-disabled and aria-describedby pointing to the Firewall Card ID are set on the disabled state

---

### Story 3.3: Flag Resolution with Audit Log (FR-10)

As a **user**,
I want to resolve each Ethical Firewall flag by editing, removing, or verifying the flagged content,
So that I can clear the gate and publish with full accountability for every decision I made.

**Acceptance Criteria:**

**Given** a flagged check row exists in the Firewall Card
**When** the user expands the row
**Then** the full flagged text is highlighted in a read-only preview and three resolution buttons appear: EDIT, REMOVE, and HUMAN VERIFIED

**And** EDIT scrolls the user to the flagged text in the Content Editor (which unlocks); the Firewall Card re-evaluates the affected check automatically when the user returns focus to the panel

**And** REMOVE removes the flagged sentence or phrase from the current ContentVersion, creates a new ContentVersion, and re-evaluates the affected check

**And** HUMAN VERIFIED opens a confirmation popover: "You're asserting you can verify this claim. Your name and the time will be logged." — on confirm, a firewall_resolution_log row is created with: user_id, content_piece_id, check_type, action (HUMAN_VERIFIED), timestamp — the row is immutable (no UPDATE or DELETE permitted by the API)

**And** HUMAN VERIFIED on a plagiarism (originality) flag is blocked at the API level (returns { "error": "HUMAN_VERIFIED_NOT_PERMITTED_FOR_PLAGIARISM" }) and the UI level (button disabled with tooltip: "Plagiarism flags must be edited or removed — you can't self-verify this one")

**And** after every resolution action the Firewall Card re-renders with updated check statuses; when all are resolved the Publish button activates

---

## Epic 4: Self-Growing Prompt Library

Users can browse, search, create, edit, duplicate, and archive Prompt Templates — seeded during onboarding, matched during content creation, and auto-scored weekly from connected platform engagement data.

### Story 4.1: Prompt Template Data Model & CRUD (FR-11)

As a **user**,
I want to create, edit, duplicate, and archive my own Prompt Templates — and browse system templates — so that I can build a personal library of content structures that work for my brand.

**Acceptance Criteria:**

**Given** a Phase 2 user navigates to the Prompt Library
**When** the page loads
**Then** all their Prompt Templates are listed with: name, category breadcrumb, platform icon, performance score bar (4px, color-coded by tier per DESIGN.md), source label (user-created / system / harvest / marketplace), and a "Not yet rated" label when performance_score is null

**And** the user can create a new template by providing: name, category, subcategory, template_body, variables[], platform, industry — the template is saved with a UUID id, source: user-created, performance_score: null, status: active

**And** the user can edit, duplicate, or archive any user-created template; archived templates are removed from the default browse view but accessible via "Show archived" filter with status: archived

**And** attempting to edit or delete a system template returns { "error": "TEMPLATE_SYSTEM_READONLY" } from the API and shows an inline message: "System templates can't be edited — duplicate it to make your own version"

**And** all template entity IDs are UUID v4; no auto-increment integers are exposed in any API response or URL

---

### Story 4.2: Template Matching for Content Generation (FR-13)

As a **user**,
I want the platform to surface the three most relevant Prompt Templates for my chosen goal automatically,
So that I always start from a high-quality, contextually appropriate template without manual searching.

**Acceptance Criteria:**

**Given** a user selects a platform + content type in the Content Editor goal picker
**When** the template matching API is called
**Then** it returns the top 3 templates ranked by: (1) exact platform + industry match, (2) performance_score descending, (3) created_at descending (most recent first as tiebreaker)

**And** all 3 ranked templates are presented as cards in the template picker before generation begins — the user commits to one before any LLM call fires

**And** if no user templates match the goal, the system falls back to the top 3 system templates for that platform — the fallback is transparent (cards are labeled "System template") and never shown as an error or empty state

**And** clicking "Browse more" from the template picker opens a full-screen overlay with: keyword search, category tree filter, platform filter, industry filter, and sort by performance score or recency — all filters are combinable

**And** switching templates after generation has started shows: "Switching templates will clear your current draft. Continue?" with explicit Confirm and Cancel buttons — neither fires automatically

---

### Story 4.3: Automated Performance Scoring via Platform Data (FR-12)

As a **user**,
I want my Prompt Templates to automatically get smarter over time as the platform learns which ones produce content that actually engages my audience,
So that the templates the platform recommends improve the longer I use it.

**Acceptance Criteria:**

**Given** a user has at least one published content piece linked to a Prompt Template and at least one connected platform (Meta or LinkedIn)
**When** the weekly performance-sync BullMQ job runs
**Then** the job pulls engagement metrics (likes, comments, shares, saves, click-through rate) from the connected platform adapter for all content pieces published in the last 7 days

**And** metrics are normalized into a performance_score delta (0–100 float) and applied to the originating template's performance_score via a weighted rolling average — the template's last_scored_at timestamp is updated

**And** if a platform adapter call fails during the sync job, the failure is logged as PLATFORM_SYNC_PARTIAL with the affected platform name, and the job continues syncing remaining adapters — the entire job does not fail

**And** a template's performance_score is only updated if at least one content piece using it has been published to a connected platform; templates with no published usage retain their current score (or null)

**And** each template card in the Prompt Library shows a "Last updated [relative time]" label below the performance score bar; if last_scored_at is null the label reads "Not yet rated"

---

### Story 4.4: Onboarding Library Seeding from User Resources (FR-14)

As a **new user**,
I want the platform to extract reusable content structures from my existing website and social profiles during onboarding,
So that my Prompt Library has relevant starting templates the first time I open the content editor — not a generic empty state.

**Acceptance Criteria:**

**Given** the brand-dna-harvest job has completed processing the user's submitted URLs and uploads
**When** the job identifies recurring content patterns, structural templates, or tone-consistent copy blocks in the harvested material
**Then** each identified pattern is saved as a Prompt Template with: source: harvest, performance_score: null, status: active, and a name auto-generated from the pattern

**And** harvested templates appear in the Prompt Library within 10 minutes of onboarding submission; they are labeled "Imported from your content" in a distinct badge to distinguish them from system templates

**And** if the harvest job finds no usable patterns, the Library is populated with the top 5 system templates for the user's stated platform and industry — an empty library state is never presented to a new user

**And** harvested templates are fully editable, duplicatable, and archivable by the user — they are not read-only

---

## Epic 5: Segment Personas

Users can define up to 5 Segment Personas with values and demographics, view their profile cards, and request simulated first-person draft reactions — grounded in Brand DNA, always labeled as simulated.

### Story 5.1: Segment Persona Definition (FR-18)

As a **user**,
I want to define target audience segment personas with clear motivations and demographics,
So that I can tailor my marketing content to specific customer profiles.

**Acceptance Criteria:**

**Given** a Phase 2 user is on the Segment Personas configuration dashboard
**When** they click "Create Persona"
**Then** the UI presents a form with fields: Segment Name (mandatory), 1-sentence Description (mandatory), Motivating Values (comma-separated, max 3), and optional demographics (Age Range, Platform Preference)

**And** saving creates a Segment Persona record in PostgreSQL (id UUID, user_id UUID, name, description, values[], age_range, platform_preference, created_at)

**And** the persona is assigned a unique name (avatar display name, e.g., "Eco Emma") automatically generated by the LLM based on the segment name and motivations

**And** a Phase 2 user can define a maximum of 5 Segment Personas; attempting to create a 6th persona is blocked in the UI with a disabled button and shows an informative tooltip explaining the 5-persona limit

**And** editing or deleting custom personas updates the persistent database state immediately and is reflected across the application

---

### Story 5.2: Draft Content Reaction from Segment Persona (FR-19)

As a **user**,
I want to request a simulated reaction from any of my defined Segment Personas on my draft content,
So that I get immediate qualitative feedback on whether my copy resonates with their values before publishing.

**Acceptance Criteria:**

**Given** a user is editing a content draft in the editor
**When** they select the "Personas" tab in the right panel and click "Get Reaction" on a persona avatar card
**Then** the UI shows a loading state: "Asking [Persona Name]..." using a skeleton text block

**And** the API triggers the DRAFT-tier LLM to simulate a first-person feedback paragraph grounded in the target persona's motivate values/demographics, the Brand DNA JSON context, and the current draft content

**And** the reaction is returned and displayed in the panel within 5 seconds under normal load

**And** the reaction text is always preceded by a distinct disclaimer label: "How [Persona Name] might react — simulated, not real audience data" to avoid misleading the user

**And** requesting a reaction does not create a new ContentVersion or modify the current draft content — it is a read-only qualitative evaluation

**And** the response must contain at least one specific, actionable critique or suggestion (e.g., "This reads too formal; add details about the lab-grown process") rather than generic praise

---

## Epic 6: Campaign Simulator (v1.1)

Users can declare a multi-platform campaign, generate a full 30-day content calendar, drag-and-drop posts, and approve the campaign only after the Ethical Firewall passes across every post.

### Story 6.1: Campaign Declaration and Calendar Generation (FR-15)

As a **user**,
I want to declare my campaign goal and have the platform generate a full coordinated campaign calendar across multiple platforms in one shot,
So that I can see the full campaign narrative arc visually mapped out.

**Acceptance Criteria:**

**Given** a Phase 2 user is on the Campaign Simulator surface
**When** they click "New Campaign" and provide Campaign Name, product/topic description, launch date, duration (7, 14, or 30 days), target platforms, and primary Segment Persona
**Then** the system triggers the POLISH-tier LLM to generate a full campaign calendar containing platform icons, post type, and Segment Persona for each slot

**And** campaign generation completes and renders the visual calendar within 30 seconds under normal load

**And** every generated post in the calendar references a specific PromptTemplate by its UUID in the database; no generated posts contain raw inline prompt strings

**And** the campaign is stored in PostgreSQL as a campaign entity containing multiple related content pieces associated by campaign_id (UUID)

---

### Story 6.2: Drag-and-Drop Calendar Editing (FR-16)

As a **user**,
I want to rearrange my campaign calendar by moving posts around, changing platforms, or updating their targeted personas,
So that I can easily tweak and optimize the campaign schedule.

**Acceptance Criteria:**

**Given** the campaign calendar is generated and displayed on a screen of width >=1024px
**When** the user drags a post to a different date slot
**Then** the post's scheduled date is updated in the database immediately, preserving all content and metadata

**And** dragging a post to a different platform slot triggers a warning dialog: "This post was written for [Platform A]. Do you want to adapt it for [Platform B]?" with two actions: "Accept Adaptation" (fires a RefinementRequest to translate platform format) or "Keep As-Is"

**And** changing a post's targeted Segment Persona in the calendar cell dropdown prompts: "Regenerate for [New Persona] or refine manually?"

**And** accessing the calendar on a viewport <1024px renders the calendar as read-only and displays an informational banner: "Rearrange posts on desktop." Drag-and-drop is disabled

---

### Story 6.3: Batch Ethical Firewall for Campaigns (FR-17)

As a **user**,
I want to run the Ethical Firewall across my entire campaign at once and see which posts need attention,
So that I can resolve all issues before approving the campaign for scheduling.

**Acceptance Criteria:**

**Given** a generated campaign contains multiple posts
**When** the user clicks "Approve Campaign"
**Then** the Ethical Firewall executes across all posts in the campaign as a batch request

**And** posts containing unresolved flags (red checks or unresolved warnings) are highlighted with a distinct red outline in the calendar cell

**And** the "Approve Campaign" action is disabled; the user cannot proceed to schedule the campaign until all individual posts have passed the Firewall or their flags have been resolved

**And** clicking a highlighted cell opens that post in the Content Editor side sheet to allow the user to run the Handshake refinement loop or resolve flags directly

---

## Epic 7: Product Design Canvas (Phase 3)

Users can open a brand-intelligent canvas, choose from AI-generated layout options pre-loaded with Brand DNA, edit text as independent layers, adjust visual elements, and export as PNG or JPG — with project file preserved for re-editing.

### Story 7.1: Brand-Intelligent Layout Generation (FR-20)

As a **Phase 3 user**,
I want to open a new canvas project, select my layout size, and have the platform generate brand-consistent design layouts preloaded with my colors and typography,
So that I start with structured, professional layouts instead of a blank canvas.

**Acceptance Criteria:**

**Given** a Phase 3 user opens the Canvas tool on a viewport width >=1024px
**When** they select a canvas format (Instagram Post, Instagram Story, Facebook Ad, or LinkedIn Banner)
**Then** the ImageGenAdapter generates 3–4 visual layouts pre-populated with the user's Brand DNA colors, visual styling, and suggested headline copy from the Prompt Library rendered as editable CanvasTextElement instances

**And** layout generation completes and displays layout options within 20 seconds under normal load

**And** the prompt sent to the image generation API (DALL-E 3) explicitly instructs it to generate abstract backgrounds and visuals without any text, letters, or words; all readable text is parsed and handled separately as CanvasTextElement layers in the application

**And** if the user attempts to type words into the background image prompt field, the UI shows an inline tooltip: "Text in images is handled as a separate layer for accuracy — type it directly on the canvas." The field is cleared and no generation fires

---

### Story 7.2: Layered Canvas Editing (FR-21)

As a **Phase 3 user**,
I want to edit design layers independently, modify and position text layers, adjust colors, and reorder layers in a list,
So that I can customize layouts precisely to match my content needs.

**Acceptance Criteria:**

**Given** a design template is loaded on the Canvas editor
**When** the user double-clicks on a text block on the canvas
**Then** inline editing is activated directly on the canvas surface — no modal popup appears for text modification

**And** selecting a text layer reveals formatting controls in the right properties panel: Font Family (inheriting Inter or Bricolage Grotesque display), Font Size, Text Color, and Alignment

**And** the left panel displays a Layer List showing all layers: Background, Text Elements, Shapes, and Overlays; dragging layers in the list updates their z-index rendering order immediately

**And** deleting the visual background layer preserves all text layers and overlays intact on the canvas surface

---

### Story 7.3: Project Export and Layer-Preserving Save (FR-22)

As a **Phase 3 user**,
I want to export my design to standard image formats and save the project file,
So that I can publish the visuals and return to edit the layers at any time.

**Acceptance Criteria:**

**Given** a user is editing on the Canvas
**When** they click "Export" and choose PNG or JPG and a standard resolution (1080x1080, 1920x1080, or 1080x1920)
**Then** a flattened raster image is downloaded instantly with no visible layer metadata or editor artifacts

**And** the project is saved to the database as a .canvas-project payload containing the JSON-serialized canvas state (including layer configurations, text values, layout coordinates, and font settings)

**And** reopening the .canvas-project file loads the Canvas editor, restoring all layers, text values, and elements to their exact previous positions and values for further editing

