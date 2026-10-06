---
name: Digital Marketing Assistant Platform
status: draft
sources:
  - _bmad-output/planning-artifacts/prds/prd-digital-marketing-assistant-2026-08-19/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-digital-marketing-assistant-2026-08-19/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-digital-marketing-assistant-2026-08-19/DESIGN.md
updated: 2026-08-19
---

# Digital Marketing Assistant Platform — Experience Spine

## Foundation

Single-surface responsive web application. Next.js 14 App Router with React 18. Primary surface: desktop and laptop browsers (1280px+ optimal). Tablet (768px+): fully functional, layout adapts. Mobile (<768px): read, review, and approve flows only — content creation deferred to desktop.

No UI component library inherited — custom design system from DESIGN.md. All visual specs (colors, typography, radii, shadows) reference DESIGN.md tokens by {path.to.token} syntax.

Three-phase access model (Phase 1 free / Phase 2 paid / Phase 3 subscription+) gates features via FeatureFlagService. The UX must communicate tier boundaries without shaming — locked features are visible but clearly labeled "Upgrade to unlock," never hidden.

## Information Architecture

| Surface | Reached from | Phase | Purpose |
|---|---|---|---|
| Onboarding / Mind Meld | Signup | All | 5-7 step Brand DNA questionnaire + resource harvest |
| Dashboard | Sidebar nav / app open | All | Overview of recent content, Brand DNA health, Prompt Library top templates |
| Content Editor | Dashboard / New Content | 1+ | Create and refine content via Human-AI Handshake |
| Prompt Library | Sidebar nav | 2+ | Browse, search, manage, and create Prompt Templates |
| Campaign Simulator | Sidebar nav | 2+ (v1.1) | 30-day campaign calendar; drag-drop editing |
| Segment Personas | Sidebar nav | 2+ | Define and view audience personas; request content reactions |
| Product Design Canvas | Sidebar nav | 3 | Brand-intelligent visual design tool |
| Settings / Brand DNA | Sidebar nav → Settings | All | View and edit Brand DNA Card, platform connections, billing, account |

**Sidebar:** Fixed 240px on lg+ (1024px+). Collapses to icon-only rail at md (768–1023px). Hidden (sheet trigger from top bar) on sm (<768px).

**Right Panel:** 360px fixed panel on xl+ (1280px+) — houses the Ethical Firewall / ContentHealthReport, Segment Persona reactions, and ContentVersion timeline during active content editing. Collapses to a bottom drawer on md and below.

**Modal stack:** Maximum 1 level deep. No modal-on-modal. Confirmations use inline banners or popovers, not a second dialog.

## Voice and Tone

Microcopy. Brand voice and aesthetic posture live in DESIGN.md.Brand & Style.

The platform talks like a smart, knowledgeable colleague — direct, specific, never condescending. It never says "successfully" or uses exclamation marks. It names what happened, not what the user should feel about it.

| Situation | Do | Don't |
|---|---|---|
| Brand DNA incomplete | "Finish your Brand DNA to start creating" | "Please complete the required onboarding steps to proceed." |
| Generation running | "Writing your draft..." | "Generating content. Please wait." |
| Ethical Firewall — all pass | "Looks good — ready to publish" | "All checks passed successfully!" |
| Ethical Firewall — flagged | "One thing to review before publishing" | "Error: Content failed ethical validation." |
| HUMAN_VERIFIED on plagiarism blocked | "Plagiarism flags need to be edited or removed — you can't self-verify this one." | "Action not permitted. HUMAN_VERIFIED is not available for originality flags." |
| Draft saved | "Saved" (inline, subtle) | "Your content has been saved to the system." |
| Start Over confirm | "This will clear your edit history. Start fresh?" | "Warning: This action cannot be undone." |
| Credit exhausted | "You've used all your credits for this month. Upgrade to keep creating." | "CREDITS_EXHAUSTED: Generation limit reached." |
| Upgrade prompt | "Unlock the Prompt Library — it gets smarter every week" | "This feature requires a paid subscription." |

**Persona reaction label:** Always: "How [Persona Name] might react — simulated, not real audience data."
**Onboarding framing for resource harvest:** "Share your existing content now — the app gets smarter from day one, saving you hours later."

## Component Patterns

Behavioral. Visual specs live in DESIGN.md.Components.

| Component | Use | Behavioral rules |
|---|---|---|
| Firewall Card | Right panel, above Publish button | Always visible when content exists. Never dismissable or minimizable. Check rows expand on click to show full flag detail + resolution actions. When all checks pass, the card changes visual state (see DESIGN.md) and the Publish button activates. CHECK_UNAVAILABLE rows show a "Could not check this" message + HUMAN_VERIFIED option. |
| Content Editor | Content Editor surface | Rich-text inline editor. Text selection reveals an annotation popover ("Add a note for the AI"). Annotation submitted = RefinementRequest fired. Editor is read-only during generation or refinement (loading state). No floating toolbar — annotation action is the only AI-facing control. |
| ContentVersion Timeline | Right panel, below Firewall Card | Vertical timeline of all versions for the current content piece. Each node: truncated preview, timestamp, annotation used. Click any node → read-only preview of that version slides in. "Restore this version" promotes it to current (requires confirmation). Active node has purple border (DESIGN.md {components.content-version-node.active-border}). |
| Prompt Template Picker | Content Editor — before generation | 3 template cards shown ranked by match score. Each card: template name, category breadcrumb, platform icon, performance score bar. "Browse more" opens a full-screen template browser. Selecting a card highlights it; "Generate with this template" fires generation. |
| Segment Persona Panel | Right panel, tab alongside Firewall | Lists user-defined Segment Personas. Clicking one shows their profile card. "Get their reaction" fires a PersonaReaction request. Reaction renders in the panel as a first-person paragraph with the disclaimer label. Reaction does not block the Firewall Card. |
| Brand DNA Card | Onboarding confirmation, Settings | Shows all Brand DNA fields. Each field is inline-editable on click (pencil icon on hover). Save on blur. "Brand DNA history" link opens a modal with previous versions (read-only). |
| Campaign Calendar | Campaign Simulator | Monthly grid view. Each cell: platform icon, content type badge, Segment Persona chip, post status. Drag-and-drop to reorder. Clicking a post opens the Content Editor in a side sheet. Platform change warning appears inline on drop (see FR-16). |
| Mind Meld Step Indicator | Onboarding | Linear progress bar at top of screen. Step number and label ("2 of 6 — Your audience"). Back button always available. Skip available on optional steps (labeled "Optional"). |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Brand DNA incomplete | Content Editor | Generation blocked. Full-width inline banner: "Finish your Brand DNA to start creating" with a link to Onboarding. Not a modal. |
| Generating draft | Content Editor | Editor is read-only. Animated skeleton text (3–4 lines, progressively revealing). Duration: up to 10 seconds. If >10 seconds, show a subtle "Still writing..." label. |
| Refining draft | Content Editor | Editor locked. Annotation that triggered refinement is highlighted. Spinner at the annotation point. |
| Firewall running | Right Panel | Firewall Card shows 5 skeleton check rows with a subtle pulse animation. Duration: up to 15 seconds. |
| Firewall: all pass | Right Panel | Card background transitions to {colors.firewall-pass-subtle}. Border to {colors.firewall-pass}. Headline: "Looks good — ready to publish." Publish button activates. Transition: 200ms ease. |
| Firewall: flagged | Right Panel | Flagged rows show {colors.firewall-flag} indicator and flag summary. Other rows show {colors.firewall-pass} or {colors.firewall-warn}. Headline: "One thing to review before publishing" (singular) or "N things to review" (plural). |
| Credit limit reached | Content Editor | Generation blocked. Inline banner above the Generate button: "You've used all your credits this month." Link to upgrade. Not a modal. |
| Platform adapter unavailable | Prompt Library scoring | Affected templates show "Score data unavailable" label in place of performance bar. Not an error — a gray state. |
| Empty Prompt Library | Prompt Library | display-sm: "Your library is empty." Body: "Create your first template or connect a platform to start scoring." Single primary button "Create template." |
| Brand DNA harvest in progress | Dashboard, Settings | Subtle progress bar below the Brand DNA Card: "Still learning from your content — check back in a few minutes." Auto-dismisses when harvest completes. |
| Onboarding — resource harvest submitted | Onboarding final step | Confirmation screen: "Your brand DNA is taking shape." Shows which resources were submitted. Proceeds to Dashboard immediately — harvest runs in background. |
| Canvas — text in image prompt attempt | Canvas | Inline tooltip on the image generation field: "Text in images is handled as a separate layer for accuracy — type it directly on the canvas." Field highlights briefly. User input is not submitted. |

## Interaction Primitives

**Primary input modality:** Mouse + keyboard. Touch supported on tablet for all flows. Mobile: touch for review and approval only.

**Annotation interaction (Human-AI Handshake):**
1. User selects text in the Content Editor.
2. A small popover appears anchored to the selection: text input field + "Refine" button.
3. User types instruction (max 200 chars — character count visible at 150+).
4. Submit: popover closes, editor locks, refinement fires.
5. New ContentVersion appears in the timeline when complete. Editor unlocks.

**Ethical Firewall resolution:**
1. Each flagged check row is expandable.
2. Expanded: full flagged text highlighted inline in a read-only preview, + three action buttons: EDIT / REMOVE / HUMAN VERIFIED.
3. EDIT: scrolls user to flagged text in the editor, which unlocks for editing. Firewall re-evaluates after user returns focus to the panel.
4. REMOVE: removes the flagged sentence/phrase from the current ContentVersion. Creates a new ContentVersion.
5. HUMAN VERIFIED: opens a confirmation popover — "You're asserting you can verify this claim. It will be logged with your name and the time." Confirm button. Blocked for plagiarism flags with inline message.

**Template selection:**
- Default: top 3 templates shown as cards, pre-selected is the highest-ranked.
- "Browse more": full-screen overlay with search, category tree, and filter by platform/industry/score.
- Changing template after generation is started: warning inline — "Switching templates will clear your current draft. Continue?"

**Start Over:**
- Button visible below the ContentVersion timeline.
- Click: inline confirmation banner (not modal) — "This will clear your edit history. Start fresh?" with Confirm and Cancel.
- On Confirm: ContentVersion chain clears, new draft generation begins.

**Keyboard:**
- ⌘Enter / Ctrl+Enter — Submit annotation / confirm generation
- Escape — Close annotation popover, close expanded Firewall row
- Tab — Move between Firewall check rows
- No vim-style shortcuts in v1 — this is a consumer-adjacent product, not a developer tool

**Banned interactions:**
- Infinite scroll — all lists are paginated (25 items/page)
- Drag-and-drop outside the Campaign Simulator (v1.1)
- Auto-save confirmation toasts — save is silent and immediate; only errors surface
- Regenerating from scratch without an explicit "Start Over" user action

## Accessibility Floor

Behavioral. Visual contrast lives in DESIGN.md (purple #7C3AED verified at 4.54:1 against white — WCAG AA compliant).

- WCAG 2.2 AA across all surfaces.
- Screen reader announces surface on navigation: "Content Editor — draft mode" / "Prompt Library — 24 templates."
- Ethical Firewall check rows announce state change: "Originality check — passed" / "Bias check — one flag to review."
- All interactive elements have visible focus rings using {colors.primary} at 2px offset.
- Annotation popover: fully keyboard-operable. Opens on text selection + keyboard shortcut ⌘Shift+A. Escape dismisses.
- Publish button disabled state communicates reason via ria-disabled + ria-describedby pointing to the Firewall Card.
- ContentVersion timeline: each node is a focusable element with ole="button" and a descriptive aria-label: "Version 3 — Annotated: too formal, add urgency. Created 2 minutes ago."
- Color is never the only signal — every state (pass/flag/warn) uses both color and a text label.

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| xl+ (1280px+) | Sidebar 240px. Right panel 360px fixed. Content editor in center column (max 896px). |
| lg (1024–1279px) | Sidebar 240px. Right panel collapses — accessed via tab bar below editor. |
| md (768–1023px) | Sidebar collapses to 56px icon rail. Right panel becomes bottom sheet (swipe up to expand). |
| sm (<768px) | Sidebar hidden — sheet trigger from top bar. Content creation disabled with upgrade prompt to use desktop. Review, approve, and export flows available. |

Campaign Simulator: minimum lg — drag-and-drop requires mouse. On md and below, calendar is read-only with a banner: "Rearrange posts on desktop."

Product Design Canvas: minimum lg. Canvas editing requires mouse for precise placement. On smaller viewports, show a "Canvas is best on desktop" screen with option to preview saved designs.

## Inspiration & Anti-patterns

**Lifted from Linear:** The discipline of never surfacing system internals to the user. Error messages name what happened, not what code failed. State transitions are fast and animated; loading states are skeleton-first, not spinners.

**Lifted from Notion:** The inline editing model — click to edit, blur to save. No edit/view mode toggle. The ContentVersion timeline borrows from Notion's page history panel.

**Lifted from Figma:** The layered canvas model for the Product Design Canvas. Layer panel on the left of the canvas. Text layers are always distinct from image layers. Export is a deliberate action, not auto-save.

**Lifted from Superhuman:** The annotation interaction model — text selection triggers a contextual action. The Handshake annotation popover is this pattern applied to AI refinement.

**Rejected — Chat interface for content creation:** The product is not a chatbot. The Human-AI Handshake is an annotation model, not a conversation thread. No chat bubbles, no message history UI.

**Rejected — Dashboard-first layout:** Users come to create content. Dashboard is a lightweight overview, not the main event. The primary nav action is "New Content" — always visible and always primary.

**Rejected — Notification-driven engagement:** No push notifications, no "Your template went up 15 points!" badges. The product earns return visits through value, not distraction.

**Rejected — Visible LLM model names in UI:** Users should not see "Gemini Flash" or "GPT-4o-mini" in the UI. These are implementation details. The surface says "Writing your draft..." not "Calling Gemini Flash API..."

## Key Flows

### Flow 1 — Layla's first post (Onboarding → Content → Publish)

Layla, solo jewellery founder, opens the app after signing up. Email verified.

1. Mind Meld opens full-screen. Step indicator: "1 of 6 — What do you sell?" Bricolage Grotesque headline. Input field below. She types "custom lab-grown engagement rings."
2. Steps 2–5: her audience, tone words, brand admiration, and challenge. Step 6: resource harvest — she pastes her website URL and Instagram handle. "Share these now — the app gets smarter from day one." She submits.
3. Brand DNA Card confirmation: the app presents what it learned. She sees her tone ("warm, ethical, romantic"), her audience ("eco-conscious couples 25–35"), and a visual style note. She edits "romantic" to "quietly luxurious" — inline. Saves. Proceeds.
4. Dashboard. Brand DNA health bar shows "Learning from your content..." progress. She ignores it and clicks "New Content."
5. Content Editor opens. Goal picker: she selects Instagram → Product Launch. Three template chips appear, ranked. Top chip: "Jewellery Launch — Ethical Focus" (score 87). She accepts.
6. "Writing your draft..." skeleton animation. 8 seconds. Draft appears — a 3-paragraph Instagram caption in her brand voice.
7. She reads it. First paragraph sounds too formal. She selects the opening sentence and annotates: "too formal — make it personal, like I'm talking to a friend." Refinement fires. 6 seconds. New version appears in the timeline.
8. **Climax:** The refined draft reads like her voice. She moves focus to the right panel. Firewall Card: 5 checks running (pulse animation). 12 seconds. Four green, one flag — "award-winning quality" (hallucination: no award citation found). Card headline: "One thing to review before publishing."
9. She expands the flag. Sees the phrase highlighted in the preview. Clicks REMOVE. The phrase disappears from the draft (new ContentVersion created). Firewall Card transitions to all-green state. Card background shifts to soft green. Publish button activates.
10. She clicks Publish. Post is queued. Template performance score will update when engagement data arrives.

**Resolution:** Layla returns to the Dashboard. The Brand DNA harvest progress bar is gone — it has finished learning. Her Prompt Library now shows 4 harvested templates from her past Instagram content.

---

### Flow 2 — Segment Persona reaction (Content Editor → Persona Panel)

Marcus, marketing manager, has a draft LinkedIn post. He wants to know if it will resonate with his "enterprise procurement manager" persona before running the Firewall.

1. In the right panel, he clicks the Personas tab (alongside the Firewall tab).
2. His persona "Corporate Carl" (enterprise procurement, 42, values ROI and risk reduction) is listed. He clicks "Get his reaction."
3. Panel shows a loading state: "Asking Corporate Carl..." (4 seconds).
4. **Climax:** Carl's reaction appears: "I'd skim past the headline — 'game-changing' is noise. But the third paragraph — the cost-per-qualified-lead stat — that would make me stop. Lead with that." Disclaimer below: "How Corporate Carl might react — simulated, not real audience data."
5. Marcus returns to the editor. He moves the third paragraph to the top. Annotates the headline: "rewrite this — less hype, lead with the cost stat." Refinement fires.

---

### Flow 3 — Canvas design (Product Design Canvas — Phase 3)

Sofia, skincare brand builder, opens the Canvas for the first time.

1. Canvas surface opens. Center: "What are we designing today?" She selects Instagram Story from the format picker.
2. "Generating 4 layout options based on your brand..." (18 seconds). Four layout cards appear — each a full-preview thumbnail showing her brand purple and her top-performing headline copy pre-placed as a CanvasTextElement.
3. She picks Layout 2. The canvas loads. Left panel: layer list — "Background (AI)", "Headline text", "Product tagline", "CTA button." Right panel: element properties.
4. She clicks the Headline text layer. It activates inline editing — no modal. Cursor appears. She types her own headline: "Skin that tells your story."
5. She adjusts the CTA button color from purple to a warm off-white. Layer panel shows the change immediately.
6. **Climax:** She clicks Export. Resolution picker: 1080x1080 / 1920x1080 / 1080x1920. She picks 1080x1920. PNG downloads in 3 seconds.
7. The canvas project auto-saves with all layers preserved. She closes the Canvas and returns to the Dashboard.

**Edge case (FR-20):** If Sofia types text into the background image generation prompt trying to add text to the visual, an inline tooltip appears: "Text in images is handled as a separate layer for accuracy — type it directly on the canvas." The field input is cleared. No generation fires.
