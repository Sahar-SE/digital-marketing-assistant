---
title: Digital Marketing Assistant Platform
created: 2026-08-19
updated: 2026-08-19
status: draft
---

# PRD: Digital Marketing Assistant Platform

## 0. Document Purpose

This PRD is for Sahar (founder/PM), the development team, downstream workflow owners (UX, architecture, epics), and investors. It defines what the platform does, for whom, and what success looks like - grounded in the brainstorming session (2026-08-18) and Architecture Spine (2026-08-19). Technical implementation choices live in the Architecture Spine and Solution Design; this PRD captures capabilities and requirements only. Assumptions are tagged inline as [ASSUMPTION] and indexed in Section 9.

---

## 1. Vision

The Digital Marketing Assistant Platform is an AI-powered marketing co-pilot that helps brands create content, plan campaigns, and design marketing assets without hallucinations, plagiarism, bias, or generic output. It is the first platform to combine a persistent Brand DNA engine, a self-growing Prompt Library, a visible Ethical Firewall, and a brand-intelligent Product Design Canvas in a single integrated workflow.

Every existing tool solves one piece of the problem. Jasper writes copy. Hootsuite schedules posts. Canva designs graphics. Originality.ai checks plagiarism. Users currently stitch these together manually, buying four subscriptions, copying and pasting between tabs, and losing brand consistency every time. This platform closes that gap by being the intelligent layer that remembers your brand, learns from your results, and ensures everything that leaves your account is accurate, ethical, and unmistakably yours.

The platform serves five distinct user jobs: solo entrepreneurs who want to look professional without a marketing team, overwhelmed small teams who need a coherent plan they can actually execute, AI skeptics burned by hallucinations, marketing managers who need to scale content across multiple audience segments, and brand builders who want consistency across every touchpoint. A three-phase model (free trial to core subscription to canvas) means the platform grows with the user as trust and capability build.

---

## 2. Target User

### 2.1 Jobs To Be Done

- Make me look professional without being a professional. Solo entrepreneur spending 4 hours on one caption that still sounds amateur.
- Turn my chaos into a coherent plan I can actually execute. Small team spread across 3+ platforms with no unified strategy.
- Give me AI I can actually trust. Burned by ChatGPT hallucinating product specs or generating content that sounds like every other brand.
- Multiply me across segments. Marketing manager with great content for one audience who cannot afford to manually tailor it for four more segments.
- Be the glue that holds my brand together. Brand builder whose ads, social, packaging, and web presence feel like they come from different companies.

### 2.2 Non-Users (v1)

- Large enterprise marketing departments with dedicated agency relationships (target: v2 agency collaboration workspace)
- Users seeking a general-purpose design tool (Canva alternative) - the Canvas is a brand-intelligent launch pad, not a blank design tool
- Developers or technical users looking for a marketing API - no public API surface in v1
- Non-English-language markets [ASSUMPTION: v1 is English-only; localization deferred]

### 2.3 Key User Journeys

**UJ-1. Layla launches her lab-grown ring line on Instagram.**
- Persona + context: Layla, solo e-commerce founder, sells custom lab-grown engagement rings; handles all marketing herself.
- Entry state: New user, just signed up; email verified.
- Path: (1) Completes Marketing Mind Meld - answers 5 guided questions, pastes her website URL and Instagram handle; app scrapes and presents Brand DNA Card for confirmation. (2) Navigates to Content > New Post > Instagram. (3) App matches a high-performing jewelry-launch prompt template; AI generates a draft grounded in Brand DNA. (4) Layla annotates: "too formal, add the ethical angle." AI refines without regenerating. (5) Content Health Report: all green except one hallucination flag. (6) Layla clicks Remove; Publish button activates. (7) Post exported or scheduled.
- Climax: Layla hits publish knowing the content sounds like her brand and has been checked for accuracy and bias.
- Resolution: Post in queue; template performance score begins updating when engagement data arrives.
- Edge case: If Brand DNA onboarding is incomplete, draft generation fails with a visible prompt to complete it - not a silent error.

**UJ-2. Marcus plans a 30-day product launch campaign.**
- Persona + context: Marcus, marketing manager at a mid-size D2C brand, manages 3 product lines across Instagram, TikTok, and LinkedIn.
- Entry state: Existing paid subscriber; Brand DNA complete; Prompt Library seeded from 6 months of usage.
- Path: (1) Opens Campaign Simulator > New Campaign. (2) Enters product name, launch date, target platforms, primary segment. (3) App generates a 30-day content calendar across all three platforms with a narrative arc. (4) Marcus drags two posts to different dates; swaps LinkedIn post to a different segment tone. (5) Ethical Firewall runs across the batch. (6) Marcus approves the full campaign.
- Climax: Marcus approves a full coordinated campaign in 20 minutes - work that previously took a full day.
- Resolution: Campaign scheduled; engagement data flows back to update Prompt Library scores.

**UJ-3. Sofia designs a product launch visual on the Canvas.**
- Persona + context: Sofia, brand builder for a sustainable skincare line; wants professional ad creatives without hiring a designer.
- Entry state: Phase 3 subscriber; Brand DNA and Prompt Library mature.
- Path: (1) Opens Canvas > New Design > Instagram Story. (2) App presents 4 AI-generated layout options pre-loaded with brand colors and top-performing headline copy. (3) Sofia picks layout 2. (4) She clicks the headline text element - it is a separate, editable text layer. She types her own headline. (5) She adjusts the CTA button color. (6) Exports as PNG.
- Climax: Sofia produces a branded, professional ad creative in under 10 minutes with no design skills.
- Resolution: Canvas project saved with layers intact; exported PNG ready for ads.
- Edge case: If Sofia tries to include text in the AI image generation prompt, the app explains: "Text in images is handled as a separate layer for accuracy - type it directly on the canvas."

---

## 3. Glossary

- Brand DNA: A structured profile encoding a user's brand identity - product category, tone, visual style, target audience, competitor references, and ethical positioning. Stored as JSON; used as the mandatory system-prompt prefix for every LLM call.
- Brand DNA Card: The user-facing representation of the Brand DNA profile; presented during onboarding and editable at any time in Settings.
- Marketing Mind Meld: The structured onboarding dialogue that builds the initial Brand DNA through guided questions and resource harvesting (website URL, social profiles, past content, competitor links).
- Prompt Library: The platform collection of Prompt Templates, organized by Category and Subcategory, ranked by performance score. Grows automatically as platform engagement data updates template scores.
- Prompt Template: A structured data entity: id, category, subcategory, template_body, variables, performance_score, platform, industry, source. Referenced by ID only; no prompt strings hardcoded in application code.
- Human-AI Handshake: The refinement loop - user annotates a draft inline; AI refines using delta instructions without regenerating from scratch. Each refinement is saved as a ContentVersion.
- ContentVersion: One immutable record of a content piece at a point in the refinement loop. The UI renders the full evolution chain.
- Ethical Firewall: The mandatory publish gate. Runs EthicalFirewallService.evaluate() and produces a ContentHealthReport before any content may be exported or published.
- ContentHealthReport: The visible output of the Ethical Firewall - a dashboard card showing originality, bias, hallucination, brand-tone, and data-cleansing check results.
- HUMAN_VERIFIED: A resolution action on a ContentHealthReport flag. Logs the user name and timestamp. Cannot be used to dismiss a plagiarism flag.
- Segment Persona: A named, interactive audience persona derived from the user Brand DNA and segment definition. Reacts to draft content with simulated feedback grounded in market patterns.
- Campaign Simulator: The visual 30-day campaign planner with drag-and-drop content calendar, coordinated narrative arc, and batch Ethical Firewall gate.
- Product Design Canvas: The Phase 3 brand-intelligent design tool. Presents AI-generated visual layouts pre-loaded with Brand DNA. Text is always a separate CanvasTextElement layer.
- CanvasTextElement: An independent text layer on the Product Design Canvas. Fully editable by the user; never rendered by the ImageGenAdapter.
- Generation Credit: A unit of AI usage consumed per LLM or image generation API call. Free-tier users have a monthly credit limit.
- Phase 1 / Phase 2 / Phase 3: The three access tiers. Phase 1: free trial (Marketing Assistant + Brand DNA Basic, credit-limited). Phase 2: paid subscription (Prompt Library, Campaign Simulator, Segment Personas, unlimited generation). Phase 3: subscription+ (Product Design Canvas).

---

## 4. Features

### 4.1 Marketing Mind Meld (Brand DNA Onboarding)

**Description:** The first experience every new user has. A structured dialogue of 5-7 guided questions that builds the Brand DNA Card without requiring the user to understand what a brand brief is. The app asks what they sell, who their dream customer is, which brands they admire, and what their biggest marketing challenge is. It invites the user to share existing resources with the framing: "Share these now and the app will get smarter about your brand from day one - saving you hours later." The app harvests and analyzes inputs asynchronously to seed the Brand DNA and pre-populate the Prompt Library before the user creates their first content piece. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Guided Brand DNA questionnaire
The system presents 5-7 guided questions in sequence. Mandatory questions (product type, primary audience, tone) block progression with a clear explanation if skipped. Optional questions do not block.

Consequences (testable):
- Skipping a mandatory question shows an inline explanation, not a generic error.
- Completing all mandatory questions produces a Brand DNA JSON record with status: complete.

#### FR-2: Resource harvest from user-provided URLs and uploads
The user may provide: website URL, up to 5 social media profile URLs, uploaded documents (PDF, DOCX, TXT, image), up to 3 competitor links, and an analytics CSV export. Processing runs asynchronously via the brand-dna-harvest job. The user proceeds to the dashboard and sees a "Brand DNA is still learning..." progress indicator.

Consequences (testable):
- A URL returning a non-200 response shows an inline warning; does not block completion.
- Processing completes within 5 minutes for a standard set of 3 URLs [ASSUMPTION].
- Processed data visibly enriches the Brand DNA Card in Settings.

#### FR-3: Brand DNA Card confirmation and editing
After the questionnaire and harvest, the system presents the Brand DNA Card for review and inline editing. Changes are saved as a new Brand DNA version (non-destructive).

Consequences (testable):
- Editing a Brand DNA field and saving updates the active Brand DNA immediately.
- A content generation attempt while Brand DNA status is incomplete returns BRAND_DNA_INCOMPLETE with a link to complete onboarding.

---

### 4.2 Content Creation with Human-AI Handshake

**Description:** The core creation workflow. The user selects a goal; the app matches the best-fit Prompt Template from the Prompt Library; AI generates a first draft grounded in Brand DNA. The user annotates inline and the AI refines using delta instructions - never regenerating from scratch. Each refinement step is saved as a ContentVersion and the user can view the evolution chain. Before any publish or export, the Ethical Firewall runs automatically. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-4: Goal-based content intent selection
The user selects: platform (Instagram, TikTok, LinkedIn, Facebook, Email, Blog), content type (product launch, engagement, educational, promotional, story, carousel), and target Segment Persona if defined. [ASSUMPTION: v1 supports the listed platforms; others deferred.]

Consequences (testable):
- Selecting a platform + content type always returns at least one matching Prompt Template or falls back to a curated default.
- The matched template category, subcategory, and performance score are visible before generation begins.

#### FR-5: Brand DNA-grounded AI draft generation
The system generates an initial draft using the matched Prompt Template with Brand DNA JSON as the mandatory system-prompt prefix. The DRAFT-tier LLM model is used.

Consequences (testable):
- If Brand DNA status is incomplete, generation fails with BRAND_DNA_INCOMPLETE - not a partial or generic draft.
- Draft generation completes within 10 seconds under normal load [ASSUMPTION].

#### FR-6: Inline annotation and delta refinement (Human-AI Handshake)
The user selects any text in the draft and adds an annotation (free text, max 200 characters). The system sends a RefinementRequest: current ContentVersion + delta instruction. The result is saved as a new ContentVersion. "Start Over" requires confirmation and clears all ContentVersions.

Consequences (testable):
- A refinement call sends only current content plus delta instruction - not a full re-prompt.
- "Start Over" confirmation dialog explicitly states "This will clear your edit history."
- The UI renders the full ContentVersion evolution chain; prior versions are viewable (read-only).

#### FR-7: Segment Persona targeting in content generation
The user may associate a Segment Persona with a content piece. When associated, persona preferences are incorporated into the Brand DNA prefix for generation and refinement.

Consequences (testable):
- Changing the Segment Persona on an existing draft prompts: "Regenerate for this segment or refine manually?"

---

### 4.3 Ethical Firewall (Content Health Report)

**Description:** A mandatory, visible checkpoint before any content can be published or exported. Five independent checks: Originality (plagiarism), Bias Scan (gender/cultural/racial), Hallucination Flag (unsupported factual claims), Brand Tone Audit (Brand DNA consistency), Data Cleansing (no synthesized statistics). Each check returns green/yellow/red. Each flag resolved via EDIT, REMOVE, or HUMAN_VERIFIED (logged with name + timestamp; disabled for plagiarism). Publish/Export disabled until all flags resolved. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-8: Automated five-check content evaluation
All five checks run in a single batched call [ASSUMPTION] after the user signals completion of the Handshake loop. Results returned as a ContentHealthReport.

Consequences (testable):
- All five checks return results within 15 seconds [ASSUMPTION].
- A check that fails due to API error returns status: CHECK_UNAVAILABLE - does not default to pass.
- CHECK_UNAVAILABLE prevents publish unless HUMAN_VERIFIED is applied to that specific check.

#### FR-9: Visible ContentHealthReport UI
Rendered as a dashboard card above the Publish/Export button. Shows each check status with color indicator, one-line explanation of any flag, and available resolution actions. The card cannot be dismissed or minimized.

Consequences (testable):
- Publish/Export button is in a disabled, visually distinct state when any check is red or CHECK_UNAVAILABLE.
- Publish/Export activates only when all checks are green or each non-green check is resolved.

#### FR-10: Flag resolution with audit log
Each resolution action (EDIT, REMOVE, HUMAN_VERIFIED) is logged with: user ID, content piece ID, check type, action, timestamp. HUMAN_VERIFIED may not be applied to plagiarism flags.

Consequences (testable):
- Attempting HUMAN_VERIFIED on a plagiarism flag returns: "Plagiarism flags must be corrected or removed."
- The audit log entry is immutable after creation.

---

### 4.4 Self-Growing Prompt Library

**Description:** The platform central intelligence engine. A curated-then-learned collection of Prompt Templates organized by Category and Subcategory (e.g., Social Media > Instagram > Product Launch > Jewelry). Templates are structured data entities, not hardcoded strings. The library is seeded during onboarding from the user existing content and competitor analysis, then grows as a background job pulls engagement data from connected platforms weekly and updates performance scores. High-scoring templates surface first; underperformers decay. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-11: Prompt Template data model and CRUD
A Prompt Template contains: id (UUID), category, subcategory, template_body, variables[], performance_score (float 0-100), platform, industry, source (user-created/system/marketplace), created_at, updated_at. Users may create, edit, duplicate, and archive their own templates. System templates are read-only.

Consequences (testable):
- Attempting to delete a system template returns TEMPLATE_SYSTEM_READONLY.
- Archiving removes a template from default browse but preserves it with status: archived.
- A template with performance_score: null is labeled "Not yet rated."

#### FR-12: Automated performance scoring via platform data
The performance-sync background job runs weekly [ASSUMPTION] and pulls engagement metrics from connected platform adapters for content generated using each template. Metrics are normalized into a performance_score delta.

Consequences (testable):
- A template score is only updated when at least one content piece using it has been published to a connected platform.
- A platform adapter failure during sync logs PLATFORM_SYNC_PARTIAL and continues - does not fail the whole job.
- The user sees a "Last updated" timestamp on each template performance score.

#### FR-13: Template matching for content generation
When the user initiates content creation, the system returns the top 3 matching templates ranked by: (1) exact platform + industry match, (2) performance_score descending, (3) recency. The user may accept the top match or browse alternatives.

Consequences (testable):
- A goal with no matching templates falls back to the top 3 system templates for that platform.
- All 3 matched templates are visible before the user commits to one.

#### FR-14: Onboarding library seeding from user resources
During Marketing Mind Meld, the brand-dna-harvest job analyzes user-provided URLs and uploads, extracting content patterns, tone signals, and structural templates. Saved as user-created Prompt Templates with source: harvest and performance_score: null.

Consequences (testable):
- Harvested templates appear in the Prompt Library within 10 minutes of onboarding submission [ASSUMPTION].
- Harvested templates are clearly labeled "Imported from your content."

---

### 4.5 Campaign Simulator

**Description:** A visual 30-day campaign planning tool. The user declares a campaign (product/topic, launch date, target platforms, primary Segment Persona) and the app generates a full content calendar with a coordinated narrative arc across all selected platforms in one shot. The user can drag and drop posts, swap segments, and edit any individual piece via the Handshake loop. The Ethical Firewall runs across the full batch before campaign approval. Realizes UJ-2.

**Functional Requirements:**

#### FR-15: Campaign declaration and calendar generation
User provides: campaign name, product/topic, launch date, duration (7/14/30 days), platforms, primary Segment Persona. System generates a full content calendar using the POLISH-tier LLM [ASSUMPTION] and matching Prompt Templates.

Consequences (testable):
- Campaign generation completes within 30 seconds [ASSUMPTION].
- Every generated post references a specific Prompt Template by ID - no inline prompt strings.
- The calendar shows platform icons, post type, and Segment Persona for each post at a glance.

#### FR-16: Drag-and-drop calendar editing
The user may reorder posts (change date/time), move a post to a different platform slot, or reassign to a different Segment Persona. Editing a post opens the Handshake refinement loop.

Consequences (testable):
- Reordering a post does not change its content, only its scheduled position.
- Moving a post to a different platform triggers a warning with Accept Adaptation or Keep as-is options.

#### FR-17: Batch Ethical Firewall for campaigns
Before the user can approve a campaign for scheduling, the Ethical Firewall runs across every post. Posts with unresolved flags are highlighted in the calendar. "Approve Campaign" is disabled until all posts pass or are resolved.

Consequences (testable):
- A campaign with 20 posts that has 3 flagged posts shows exactly those 3 highlighted.
- Approving a campaign with unresolved flags is blocked, not warned.

---

### 4.6 Segment Personas

**Description:** Interactive audience avatars built from the user Brand DNA and segment definitions. The user defines a segment and the system generates a named, interactive Segment Persona that reacts to draft content with simulated feedback grounded in real market patterns - not hallucinated responses. [ASSUMPTION: Persona reactions are generated by the LLM constrained to segment definition and Brand DNA.] Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-18: Segment Persona definition
User provides: segment name, 1-sentence description, 2-3 key values or motivations, optional demographic signals. System generates a named Persona and a brief profile card. A user may define up to 5 Segment Personas in Phase 2 [ASSUMPTION].

Consequences (testable):
- A Persona can be created with only segment name and 1-sentence description.
- Each Persona has a unique name generated by the system based on the segment definition.

#### FR-19: Draft content reaction from Segment Persona
The user requests a Segment Persona reaction on any draft content piece. The system generates a first-person reaction grounded in the Persona values and Brand DNA context, always labeled "Simulated reaction - based on [Persona name] profile."

Consequences (testable):
- The simulated reaction always carries the Persona name and disclaimer label.
- Requesting a reaction does not create a ContentVersion.
- The reaction includes at least one specific, actionable suggestion - not generic positive feedback.

---

### 4.7 Product Design Canvas

**Description:** A brand-intelligent design tool unlocked at Phase 3. Not a blank canvas - a pre-loaded launch pad. When the user opens a new design, the app presents AI-generated layout options pre-populated with brand colors, imagery style from Brand DNA, and top-performing headline copy from the Prompt Library. Text is always a separate, fully editable CanvasTextElement layer - never baked into AI-generated raster images. The user selects a layout, customizes text inline, adjusts visual elements, and exports as PNG or JPG. The canvas project file preserves all layers for re-editing. Realizes UJ-3.

**Functional Requirements:**

#### FR-20: Brand-intelligent layout generation
User selects a format (Instagram post, story, Facebook ad, LinkedIn banner [ASSUMPTION: v1 formats]). System generates 3-4 layout options using the ImageGenAdapter, incorporating brand color palette, style signals from Brand DNA, and suggested headline copy from the Prompt Library as CanvasTextElement.

Consequences (testable):
- Layout generation completes within 20 seconds [ASSUMPTION].
- The AI image generation prompt must not include any text intended to appear in the final design.
- Each layout option has at least one editable CanvasTextElement pre-populated with a Prompt Library suggestion.

#### FR-21: Layered canvas editing
The canvas supports independent layers: AI-generated visual layer, CanvasTextElement layers (headline, body, CTA), and shape/overlay layers. Text layers are selected, moved, resized, and edited directly. Font, size, color, and alignment are user-controlled. A layer panel shows all layers and allows reordering.

Consequences (testable):
- Double-clicking a CanvasTextElement opens inline text editing - no modal.
- Deleting the visual layer does not delete text layers.
- The user can add a new blank CanvasTextElement at any time.

#### FR-22: Export and project save
On export, all layers flatten to raster (PNG or JPG at selected resolution [ASSUMPTION: 1080x1080, 1920x1080, 1080x1920 for v1]). The .canvas-project file saves the full layer structure for future re-editing.

Consequences (testable):
- Exported PNG/JPG contains no visible layer metadata.
- Reopening a .canvas-project file restores all layers, text content, and positions exactly.

---

## 5. Non-Goals (Explicit)

- Not a general-purpose design tool. The Canvas is not Canva - it does not support arbitrary SVG import, font library browsing, or multi-page documents in v1.
- Not a marketing agency replacement. The platform is a co-pilot; it does not autonomously run campaigns without human review and approval.
- Not a social listening tool. No brand monitoring, sentiment tracking, or competitor social listening in v1.
- Not a CRM. No customer data storage, email list management, or contact segmentation.
- Not a public API. No developer-facing API surface in v1.
- Not a mobile app. Web-only in v1; mobile is Phase 2 roadmap.
- Not autonomous. No autopilot or auto-publish without human approval. Every piece of content requires explicit user action to publish, regardless of Ethical Firewall status.

---

## 6. MVP Scope

### 6.1 In Scope (Phase 1 + Phase 2 at launch)

- Marketing Mind Meld onboarding with resource harvest (FR-1, FR-2, FR-3)
- Content creation with Human-AI Handshake (FR-4, FR-5, FR-6, FR-7)
- Ethical Firewall with ContentHealthReport (FR-8, FR-9, FR-10)
- Prompt Library: seeded + manual templates, performance scoring, template matching (FR-11, FR-12, FR-13, FR-14)
- Segment Personas: definition + draft reactions (FR-18, FR-19)
- Platform connections: Meta (Instagram/Facebook) and LinkedIn for publish + data pull [ASSUMPTION: TikTok and Google deferred to v1.1 due to API approval timelines]
- Credit accounting and freemium gating (Phase 1 credit limits)
- Subscription billing via Stripe (Phase 2 unlock)

### 6.2 Out of Scope for MVP

- Campaign Simulator (FR-15, FR-16, FR-17) - deferred to v1.1 [NOTE FOR PM: emotionally load-bearing for the overwhelmed team persona (UJ-2); revisit if timeline permits]
- Product Design Canvas (FR-20, FR-21, FR-22) - Phase 3, post-launch
- TikTok and Google platform adapters - v1.1 (API approval required)
- Prompt Marketplace (cross-user template sharing) - requires moderation design, v2
- Autopilot / auto-scheduling - v3+
- Agency collaboration workspace - v2
- Mobile app - v2
- Non-English language support - v2

---

## 7. Success Metrics

**Primary**

- SM-1: Activation rate. % of new users who complete the Marketing Mind Meld (Brand DNA Card confirmed) within 7 days of signup. Target: >= 70%. Validates FR-1, FR-2, FR-3.
- SM-2: Content creation completion rate. % of initiated content pieces that reach status: approved-for-publish (pass the Ethical Firewall). Target: >= 60%. Validates FR-4 through FR-10.
- SM-3: Free-to-paid conversion rate. % of Phase 1 free users who upgrade to Phase 2 within 30 days. Target: >= 15% [ASSUMPTION]. Validates FR-11 through FR-14 as the primary upgrade driver.
- SM-4: Weekly active users at 90 days. % of paying subscribers still active at 90-day mark. Target: >= 55% [ASSUMPTION]. Validates overall retention and prompt library value loop.

**Secondary**

- SM-5: Ethical Firewall resolution rate. % of flagged content pieces where the user resolves all flags (vs. abandoning). Target: >= 80%. Validates FR-9, FR-10.
- SM-6: Prompt Library engagement. % of content pieces that use a Library template (vs. triggering fallback default). Target: >= 85% at 60 days. Validates FR-13, FR-14.
- SM-7: Brand DNA enrichment. % of users who provide at least one URL or upload during onboarding. Target: >= 50%. Validates FR-2 cold-start fix.

**Counter-metrics (do not optimize)**

- SM-C1: HUMAN_VERIFIED abuse rate. % of Ethical Firewall resolutions that use HUMAN_VERIFIED (vs. EDIT or REMOVE). Target: <= 20% of resolved flags. Counterbalances SM-2 - a high rate signals users are bypassing the gate, not passing it.
- SM-C2: Start Over rate. % of content sessions that use "Start Over." Target: <= 15%. Counterbalances SM-2 - a high rate signals the Handshake loop is not working and users are falling back to regeneration.

---

## 8. Open Questions

1. LLM provider strategy - Gemini-only, OpenAI-only, or both via abstracted adapter at launch? Cost, rate limits, and content policy differences apply.
2. Image generation provider - DALL-E 3 confirmed? Or Stable Diffusion (self-hosted for cost control)?
3. Plagiarism/ethics API - Originality.ai confirmed? Need to evaluate API rate limits and cost per check at scale.
4. Deployment target - Vercel + managed Postgres (Supabase)? Or self-hosted? Affects cost modeling and data residency.
5. TikTok API approval timeline - TikTok developer API requires formal application and approval. Does it block v1 launch or v1.1?
6. Canvas export formats - PNG and JPG confirmed for v1. PDF needed for print/ads?
7. Prompt Marketplace moderation - Who reviews shared templates before they are publicly visible?
8. GDPR / data residency - Does the platform store user-generated content? For how long? [NOTE FOR PM: Data governance section may be needed before launch.]
9. Hallucination detection reliability - What is the acceptable false-positive rate for the Ethical Firewall? Too many false flags drives SM-C1 abuse.
10. Credit pricing - How many Generation Credits per Phase 1 free user per month? What defines one credit?

---

## 9. Assumptions Index

- Section 2.2: v1 is English-only; localization deferred.
- Section 4.1 / FR-2: URL processing completes within 5 minutes for a standard set of 3 URLs.
- Section 4.2 / FR-5: Draft generation completes within 10 seconds under normal load.
- Section 4.2 / FR-5: Character/word limits sourced from platform documentation at build time.
- Section 4.3 / FR-8: Five Ethical Firewall checks can be composed into one batched API call.
- Section 4.3 / FR-8: All five checks return results within 15 seconds.
- Section 4.4 / FR-12: Performance-sync job runs weekly.
- Section 4.4 / FR-14: Harvested templates appear within 10 minutes of onboarding submission.
- Section 4.5 / FR-15: Campaign-level planning warrants the POLISH-tier LLM model.
- Section 4.5 / FR-15: Campaign generation completes within 30 seconds.
- Section 4.6 / FR-18: Persona reactions generated by LLM constrained to segment + Brand DNA.
- Section 4.6 / FR-18: Phase 2 users may define up to 5 Segment Personas.
- Section 4.7 / FR-20: Canvas layout generation completes within 20 seconds.
- Section 4.7 / FR-20: v1 canvas formats: Instagram post, story, Facebook ad, LinkedIn banner.
- Section 4.7 / FR-22: Export resolutions: 1080x1080, 1920x1080, 1080x1920 for v1.
- Section 6.1: TikTok and Google platform adapters deferred to v1.1 due to API approval timelines.
- Section 7 / SM-3: 15% free-to-paid conversion target is an initial benchmark; needs validation after first 90 days.
- Section 7 / SM-4: 55% 90-day retention target is an initial benchmark; needs validation.
- Stack: Gemini Flash (gemini-1.5-flash) for DRAFT tier; Gemini Pro (gemini-1.5-pro) for POLISH tier; DALL-E 3 for image generation; Originality.ai v2 for plagiarism.
