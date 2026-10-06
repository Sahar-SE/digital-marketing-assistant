---
name: 'Digital Marketing Assistant Platform'
type: architecture-spine
purpose: build-substrate
altitude: feature
paradigm: 'Layered Hexagonal — domain core isolated behind ports, infrastructure adapters replaceable'
scope: 'Full platform: Brand DNA engine, Prompt Library, Content Creation with Human-AI Handshake, Ethical Firewall, Campaign Simulator, Segment Personas, Product Design Canvas'
status: draft
created: '2026-08-19'
updated: '2026-08-19'
binds: [brand-dna, prompt-library, content-creation, ethical-firewall, campaign-simulator, segment-personas, canvas]
sources: ['brainstorming/.memlog.md']
companions: []
---

# Architecture Spine — Digital Marketing Assistant Platform

## Design Paradigm

**Layered Hexagonal** — domain core defines ports (interfaces), infrastructure adapters plug in from outside. UI talks only to Application Services; Application Services orchestrate Domain; Domain knows nothing of HTTP, databases, or LLMs.

## Invariants & Rules

### AD-1 — Brand DNA is mandatory context for every LLM call
- **Binds:** content-creation, prompt-library, campaign-simulator, canvas, segment-personas
- **Prevents:** Generic AI output unanchored to the user's brand; hallucination about brand attributes
- **Rule:** Every LLM request must include the user's resolved BrandDNA JSON as a system-prompt prefix. If BrandDNA is incomplete, the call must fail with BRAND_DNA_INCOMPLETE. No LLM call bypasses this prefix.

### AD-2 — Ethical Firewall is a mandatory, visible publish gate
- **Binds:** content-creation, campaign-simulator, canvas
- **Prevents:** Biased, plagiarised, hallucinated, or off-brand content leaving the platform unchecked
- **Rule:** Content may only reach status:approved-for-publish after EthicalFirewallService.evaluate() returns a ContentHealthReport rendered to the user. Each flagged item resolved via EDIT, REMOVE, or HUMAN_VERIFIED (with user name + timestamp logged). Publish button disabled until all items resolved. Gate never bypassed programmatically.

### AD-3 — Human-AI Handshake refines; never regenerates from scratch
- **Binds:** content-creation, canvas text layer
- **Prevents:** API cost explosion; loss of user accumulated edits
- **Rule:** After initial draft, every subsequent LLM call must be a RefinementRequest carrying current content + delta instruction. Full regeneration only on explicit user action ('Start over') and must clear edit history. ContentVersion entity stores every delta; UI renders evolution chain.

### AD-4 — Prompt templates are first-class data entities, not code
- **Binds:** prompt-library, content-creation, campaign-simulator
- **Prevents:** Prompt logic scattered in application code; library cannot evolve without deployment
- **Rule:** All prompt templates live in prompt_templates table: {id, category, subcategory, template_body, variables, performance_score, platform, industry, source}. Application code references templates by ID only. No prompt string hardcoded in application or service code. Self-growing library updates performance_score via scheduled background job.

### AD-5 — Canvas text is always a separate, editable layer
- **Binds:** canvas
- **Prevents:** Uneditable text baked into AI-generated raster images
- **Rule:** ImageGenAdapter produces background/visual layers only — never called with text intended to appear in final design. All text elements rendered as CanvasTextElement objects. On export layers flatten to raster; .canvas-project file format preserves layer structure for re-editing.

### AD-6 — Platform integrations are interchangeable adapters behind a port
- **Binds:** prompt-library (performance scoring), campaign-simulator, all platform publish flows
- **Prevents:** Tight coupling to any single platform API; single deprecation breaking core functionality
- **Rule:** All external platform communication goes through PlatformPort. Each platform (Meta, TikTok, LinkedIn, Google) is a separate adapter. Adapter failure is isolated — logged as PLATFORM_SYNC_PARTIAL, not a hard error.

### AD-7 — Tiered LLM model dispatch
- **Binds:** content-creation, ethical-firewall, campaign-simulator
- **Prevents:** Expensive model calls for tasks a cheaper model handles; API cost overrun at freemium tier
- **Rule:** LLMAdapter exposes DRAFT tier (Gemini Flash / GPT-4o-mini) and POLISH tier (Gemini Pro / GPT-4o). Initial drafts and refinement deltas use DRAFT. Final polish, complex planning, hallucination analysis use POLISH. ImageGenAdapter is separate — never routed through LLMAdapter.

### AD-8 — Three-phase access model enforced by feature flags
- **Binds:** all features
- **Prevents:** Free-tier users accessing subscription-only capabilities
- **Rule:** Feature access governed by FeatureFlagService.userCan(userId, feature). Phase 1 (free trial): CONTENT_ASSISTANT, BRAND_DNA_BASIC, credit-limited. Phase 2 (paid): PROMPT_LIBRARY, CAMPAIGN_SIMULATOR, SEGMENT_PERSONAS, unlimited. Phase 3 (subscription+): PRODUCT_CANVAS. No UI or API route accesses higher-tier capability without passing flag check.

## Consistency Conventions

| Concern | Convention |
| --- | --- |
| Entity IDs | UUID v4; no auto-increment integers in public APIs |
| Dates/timestamps | ISO 8601 UTC strings in API responses; timestamptz in DB |
| API error shape | { error: { code: string, message: string, field?: string } } — code is stable machine-readable constant |
| Event naming | noun.past_tense — e.g. content.drafted, firewall.flagged, template.promoted |
| File/module naming | kebab-case files, PascalCase classes/types, camelCase functions |
| State mutation | Domain state mutated only through named commands/use-cases |
| Auth | JWT via Supabase Auth; service-to-service uses service-role tokens |
| Config | All secrets in environment variables; no config values in source code |
| Logging | Structured JSON; every line includes userId, traceId, feature, severity |
| Credit accounting | AI API calls debit generation_credits ledger before the call; 0-credit users get CREDITS_EXHAUSTED |

## Stack

| Name | Version |
| --- | --- |
| Next.js (App Router) | 14.x |
| React | 18.x |
| Node.js | 20 LTS |
| TypeScript | 5.x |
| PostgreSQL | 16.x |
| Redis | 7.x |
| Supabase Auth + Storage | latest |
| Fabric.js Canvas renderer | 6.x |
| Gemini Flash draft LLM | gemini-1.5-flash [ASSUMPTION] |
| Gemini Pro polish LLM | gemini-1.5-pro [ASSUMPTION] |
| DALL-E image generation | dall-e-3 [ASSUMPTION] |
| Originality.ai plagiarism API | v2 [ASSUMPTION] |
| BullMQ background jobs | 5.x |
| Stripe billing | latest |

## Structural Seed

`
digital-marketing-assistant/
  apps/
    web/                    # Next.js frontend
      app/
        (auth)/             # Login, signup, onboarding
        (dashboard)/        # Main app shell
          content/          # Content creation + Handshake UI
          campaigns/        # Campaign Simulator
          canvas/           # Product Design Canvas
          library/          # Prompt Library browser
          settings/         # Brand DNA, account, billing
      components/           # Shared React components
      canvas/               # Fabric.js canvas engine + layer types
  services/
    api/                    # Node.js/Express REST API
      routes/               # Thin HTTP handlers
      use-cases/            # Application Services (one file per use-case)
      domain/               # Domain Core
        brand-dna/          # BrandDNA entity, BrandDNAService
        prompt-library/     # PromptTemplate entity, PromptLibraryService
        ethical-firewall/   # ContentHealthReport, EthicalFirewallService
        handshake/          # HumanAIHandshake, ContentVersion, RefinementRequest
        personas/           # SegmentPersona entity, PersonaReactionService
        campaign/           # CampaignPlan entity, CampaignSimulatorService
      ports/                # TypeScript interfaces (LLMPort, PlatformPort, etc.)
      adapters/             # Port implementations
        llm/                # GeminiAdapter, OpenAIAdapter
        image-gen/          # DalleAdapter, StableDiffusionAdapter
        platforms/          # MetaAdapter, TikTokAdapter, LinkedInAdapter, GoogleAdapter
        ethics/             # OriginalityAdapter, BiasCheckerAdapter
        storage/            # PostgresAdapter, RedisAdapter, S3Adapter
      jobs/                 # BullMQ background workers
        performance-sync/   # Pulls platform engagement -> updates template scores
        brand-dna-harvest/  # Scrapes user-provided URLs for Brand DNA seeding
  packages/
    shared-types/           # Shared TypeScript types
    feature-flags/          # FeatureFlagService + tier definitions
  infra/
    docker/                 # Compose files for local dev
    migrations/             # PostgreSQL schema migrations
`

## Capability to Architecture Map

| Capability | Lives in | Governed by |
| --- | --- | --- |
| Brand DNA onboarding + harvest | domain/brand-dna/ + jobs/brand-dna-harvest/ | AD-1, AD-7 |
| Content generation draft | use-cases/draft-content/ | AD-1, AD-3, AD-4, AD-7 |
| Human-AI Handshake refine | domain/handshake/ | AD-1, AD-3, AD-7 |
| Ethical Firewall + Content Health Report | domain/ethical-firewall/ + adapters/ethics/ | AD-2, AD-6 |
| Prompt Library CRUD + scoring | domain/prompt-library/ + jobs/performance-sync/ | AD-4, AD-6 |
| Campaign Simulator | domain/campaign/ | AD-1, AD-4, AD-7, AD-8 |
| Segment Personas | domain/personas/ | AD-1, AD-8 |
| Product Design Canvas | apps/web/canvas/ | AD-5, AD-7, AD-8 |
| Platform publish + performance pull | adapters/platforms/ | AD-6 |
| Feature access gating | packages/feature-flags/ | AD-8 |
| Credit accounting | use-cases/credit-ledger/ | AD-7, AD-8 |

## Deferred

| Decision | Reason deferred |
| --- | --- |
| Mobile app iOS/Android | Web-first; mobile is phase 2 after product-market fit |
| LLM vendor lock-in | LLMPort abstraction keeps this open; benchmark at launch |
| Self-hosted vs cloud LLM | Adapter pattern keeps both options open |
| Prompt Marketplace cross-user sharing | Requires community moderation design not yet scoped |
| Autopilot auto-schedule | High-risk; needs user trust baseline before enabling, phase 3+ |
| Zero-step implicit Brand DNA from behavior | Complex ML; explicit onboarding ships first |
| Agency collaboration workspace | Valid extension; out of scope for v1 |
| Hallucination fact-database per industry | v1 mitigation: RAG over user data + HUMAN_VERIFIED override |
| Per-epic story breakdown | Next step via bmad-create-epics-and-stories |
