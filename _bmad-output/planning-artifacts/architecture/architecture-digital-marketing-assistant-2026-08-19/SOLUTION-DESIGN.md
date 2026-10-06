# Digital Marketing Assistant Platform — Solution Design

> **Purpose:** Human-readable companion to the Architecture Spine, intended for developers, stakeholders, and investors. This document explains *what* the platform does, *why* it's built the way it is, and *how* the major pieces fit together.

---

## 1. What We're Building

A **AI-powered digital marketing assistant** that merges human creativity with AI to help brands create content, plan social media campaigns, and design marketing assets — without hallucinations, plagiarism, bias, or generic output.

Unlike every existing tool (Jasper, Hootsuite, Canva, Writesonic), this platform is not a single-purpose tool. It is the **missing glue layer** that:

- Learns your brand from the moment you arrive (Brand DNA)
- Generates content grounded in YOUR data, not AI imagination
- Forces every piece of content through a visible ethics checkpoint before publishing
- Grows smarter with every campaign you run (Self-Growing Prompt Library)
- Graduates you to a brand-intelligent design canvas

**Target users:** Solo entrepreneurs, overwhelmed small marketing teams, AI skeptics burned by hallucinations, marketing managers who need scale, and brand builders who want consistency across every touchpoint.

---

## 2. The Three Phases Users Move Through

### Phase 1 — Marketing Assistant (Free Trial)
The user arrives and immediately enters the **Marketing Mind Meld** — a structured dialogue where the app asks sharper and sharper questions to build their Brand DNA profile:
- What do you sell?
- Describe your ideal customer in one sentence
- Pick 3 brands you admire
- What is your biggest marketing struggle?
- Share existing resources: website URL, social profiles, past content, competitor links

The app scrapes and analyzes these inputs to pre-seed the Brand DNA and Prompt Library from day one — solving the cold-start problem. The framing to the user: *"Give us 5 minutes now, save yourself 5 hours later."*

**Free tier limits:** Credit-limited AI generations (20/month), basic Brand DNA, content assistant only.

### Phase 2 — Content Creation + Prompt Library (Paid Subscription)
The core product loop:
1. User picks a goal (e.g. "Instagram post for engagement ring launch")
2. App matches the best prompt template from the Prompt Library
3. AI generates a draft — grounded in Brand DNA, never generic
4. User annotates inline ("too formal here", "add urgency") — the **Human-AI Handshake**
5. AI refines with those constraints locked in — never regenerates from scratch
6. The **Ethical Firewall** (Content Health Report) runs before publish:
   - Originality check (plagiarism scan)
   - Bias scan (gender, cultural, racial)
   - Hallucination flag (unsupported factual claims)
   - Brand tone audit (does this match your DNA?)
   - Data cleansing check (no synthesized statistics)
7. User resolves each flag: EDIT, REMOVE, or "I can verify this" (human-verified, timestamped)
8. Publish button activates only when all checks pass or are human-verified

**The Prompt Library** is the engine: templates are structured data objects with performance scores. A background job pulls engagement data from connected platforms (Meta, TikTok, etc.) weekly, promotes winning templates, and demotes underperformers. The library grows smarter from the entire user base's results — without exposing private data.

### Phase 3 — Product Design Canvas (Subscription Unlock)
After proving their strategy through the assistant, the user graduates to the **Product Design Canvas**. This is not Canva — it is a **marketing launch pad** pre-loaded with brand intelligence:
- AI generates visual/background layers (product mockups, compositions)
- Text is always a separate, human-editable layer — AI cannot reliably render text in images
- Smart placeholders pre-filled from prompt library wins: "This headline style got 3x engagement for your eco-conscious segment"
- User chooses and refines — not designs from scratch
- Canvas project files preserve layers for re-editing; export flattens to raster

---

## 3. Key Architectural Decisions Explained

### Why Layered Hexagonal architecture?
The platform integrates with 10+ external APIs (LLMs, image gen, 4 social platforms, ethics checkers, billing). A hexagonal structure means the domain core — BrandDNA, PromptLibrary, EthicalFirewall — never has a direct dependency on any external vendor. When Meta changes their API, only the MetaAdapter changes. When we want to switch from OpenAI to Gemini, only the LLMAdapter changes. The business logic stays untouched.

### Why Brand DNA as mandatory system-prompt prefix?
Every existing AI tool gives you a blank slate. Hallucination happens when the AI fills gaps with imagination. Brand DNA fills those gaps with verified user data — the AI cannot invent things it has been told explicitly. This is the primary anti-hallucination mechanism.

### Why refine instead of regenerate?
Every full regeneration is a full API call. At scale, that cost is unsustainable. The refinement approach sends only a delta instruction — far cheaper in tokens. It also preserves the user's editing history, which matters: the user can see how the content evolved, not just the latest version.

### Why are prompt templates stored as data, not code?
The self-growing library only works if prompts can be scored, compared, and promoted without a code deployment. Hardcoded prompts in source code cannot be updated by a background job. Structured database rows can be updated by anything with DB access — including the performance scoring job.

### Why tiered LLM dispatch?
A single premium model for all calls would make freemium economically impossible. Drafts use a cheap model; only final polish and complex analysis use an expensive model. The user gets a great experience; the cost stays manageable.

---

## 4. System Context Diagram

`
User
  |
  v
Digital Marketing Assistant Platform
  |── LLM APIs (Gemini / OpenAI)          <- content generation + refinement
  |── Image Gen APIs (DALL-E / SD)         <- canvas visual layers
  |── Social Platforms (Meta/TikTok/etc.) <- publish + performance data pull
  |── Ethics APIs (Originality.ai)         <- plagiarism + bias checks
  |── Stripe                               <- subscription management
  |__ Canva (optional export)              <- brand template handoff
`

---

## 5. What Makes This Defensible (The Moat)

| Moat layer | How it compounds over time |
| --- | --- |
| Brand DNA | Gets richer with every interaction; competitor would have to start from zero |
| Prompt Library | Trained on THIS user's performance data — cannot be replicated by a generic tool |
| Ethical Firewall | Trust earned over months; users who trust the gate will not switch |
| Edit history / Handshake | Shows users how their content evolved; creates emotional attachment to the process |
| Segment Personas | Built from the user's actual audience data; gets more accurate over time |

---

## 6. Competitive Position

| Capability | This platform | Jasper | Hootsuite | Canva | Writesonic |
| --- | --- | --- | --- | --- | --- |
| Brand DNA as persistent LLM context | YES | partial | NO | NO | NO |
| Self-growing prompt library from own performance | YES | NO | NO | NO | NO |
| Visible ethical firewall (bias + plagiarism + hallucination) | YES | NO | NO | NO | NO |
| Human-AI refinement loop (not regeneration) | YES | NO | NO | NO | NO |
| Segment personas that react to content | YES | NO | NO | NO | NO |
| Brand-intelligent design canvas | YES | NO | NO | partial | NO |
| Free trial -> subscription -> canvas graduation | YES | NO | NO | NO | NO |

---

## 7. Assumptions to Confirm

- [ ] LLM provider: Gemini (preferred) or OpenAI — or both with switching?
- [ ] Image generation: DALL-E 3 or Stable Diffusion or both?
- [ ] Plagiarism/ethics API: Originality.ai confirmed, or alternative?
- [ ] Deployment target: Vercel + managed Postgres, or self-hosted?
- [ ] Canvas export formats needed: PNG, JPG, PDF, all?

---

## 8. What is Not In Scope for v1

- Mobile app (iOS/Android)
- Prompt Marketplace (cross-user sharing)
- Autopilot (auto-scheduling without human review)
- Agency collaboration workspace
- Hallucination fact-databases per industry (v1 uses RAG + human verification)
- Zero-step implicit Brand DNA learning from behavior

---

## 9. Recommended Next Steps

1. **bmad-prd** — Create the Product Requirements Document from this architecture
2. **bmad-create-epics-and-stories** — Break into buildable epics, starting with Phase 1 (Brand DNA + onboarding)
3. **Confirm the [ASSUMPTION] items** in the Stack section of the Architecture Spine
4. **bmad-ux** — Design the Mind Meld onboarding flow and Content Health Report UI
