---
name: Digital Marketing Assistant Platform
status: draft
sources:
  - _bmad-output/planning-artifacts/prds/prd-digital-marketing-assistant-2026-08-19/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-digital-marketing-assistant-2026-08-19/ARCHITECTURE-SPINE.md
updated: 2026-08-19
colors:
  primary: '#7C3AED'
  primary-foreground: '#FFFFFF'
  primary-hover: '#6D28D9'
  primary-subtle: '#EDE9FE'
  primary-subtle-foreground: '#5B21B6'
  accent: '#F59E0B'
  accent-foreground: '#1C1407'
  accent-subtle: '#FEF3C7'
  success: '#10B981'
  success-subtle: '#D1FAE5'
  warning: '#F59E0B'
  warning-subtle: '#FEF3C7'
  danger: '#EF4444'
  danger-subtle: '#FEE2E2'
  firewall-pass: '#10B981'
  firewall-pass-subtle: '#D1FAE5'
  firewall-warn: '#F59E0B'
  firewall-warn-subtle: '#FEF3C7'
  firewall-flag: '#EF4444'
  firewall-flag-subtle: '#FEE2E2'
  firewall-unavailable: '#9CA3AF'
  background: '#FFFFFF'
  surface: '#F9FAFB'
  surface-raised: '#FFFFFF'
  border: '#E5E7EB'
  border-subtle: '#F3F4F6'
  foreground: '#111827'
  foreground-muted: '#6B7280'
  foreground-subtle: '#9CA3AF'
typography:
  display:
    fontFamily: "'Bricolage Grotesque', 'Inter', sans-serif"
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: '-0.02em'
  display-sm:
    fontFamily: "'Bricolage Grotesque', 'Inter', sans-serif"
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: '-0.01em'
  heading:
    fontFamily: "'Inter', sans-serif"
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: "'Inter', sans-serif"
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: "'Inter', sans-serif"
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: "'Inter', sans-serif"
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: '0.02em'
  mono:
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.6'
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
    hover-background: '{colors.primary-hover}'
    font: '{typography.label}'
    padding: '10px 18px'
  button-secondary:
    background: '{colors.primary-subtle}'
    foreground: '{colors.primary-subtle-foreground}'
    radius: '{rounded.md}'
    font: '{typography.label}'
  button-ghost:
    background: 'transparent'
    foreground: '{colors.foreground-muted}'
    radius: '{rounded.md}'
    hover-background: '{colors.surface}'
  firewall-card:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    radius: '{rounded.lg}'
    padding: '{spacing.lg}'
    position: 'above publish button — always visible, never dismissable'
  firewall-check-pass:
    indicator: '{colors.firewall-pass}'
    background: '{colors.firewall-pass-subtle}'
    radius: '{rounded.sm}'
  firewall-check-warn:
    indicator: '{colors.firewall-warn}'
    background: '{colors.firewall-warn-subtle}'
    radius: '{rounded.sm}'
  firewall-check-flag:
    indicator: '{colors.firewall-flag}'
    background: '{colors.firewall-flag-subtle}'
    radius: '{rounded.sm}'
  brand-dna-card:
    background: 'linear-gradient(135deg, {colors.primary-subtle} 0%, {colors.surface} 100%)'
    border: '1px solid {colors.primary-subtle}'
    radius: '{rounded.xl}'
    accent-bar: '3px solid {colors.primary} left edge'
  prompt-template-chip:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    radius: '{rounded.full}'
    selected-background: '{colors.primary-subtle}'
    selected-border: '{colors.primary}'
    selected-foreground: '{colors.primary-subtle-foreground}'
  content-version-node:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
    active-border: '{colors.primary}'
    connector: '1px dashed {colors.border-subtle}'
  publish-button-active:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  publish-button-disabled:
    background: '{colors.border}'
    foreground: '{colors.foreground-subtle}'
    radius: '{rounded.md}'
    cursor: 'not-allowed'
  segment-persona-avatar:
    background: '{colors.primary-subtle}'
    foreground: '{colors.primary}'
    radius: '{rounded.full}'
    size: '40px'
  performance-score-bar:
    track: '{colors.border}'
    fill: '{colors.primary}'
    high-fill: '{colors.success}'
    low-fill: '{colors.danger}'
    radius: '{rounded.full}'
    height: '4px'
---

The Digital Marketing Assistant Platform is an AI-powered marketing co-pilot. Its visual identity must communicate two things simultaneously: **creative capability** (it can produce professional content) and **trustworthy restraint** (it will never publish something embarrassing or harmful). These are normally in tension. The brand resolves it through a clean, open light-mode canvas — the creativity lives in the content being produced, not in visual noise — anchored by a vivid purple that signals intelligence and craft without aggression.

Purple is the brand color because it sits at the intersection of creativity and authority. It is not a corporate blue (too safe), not a red (too alarming), not a green (too environmental). It is the color of design tools, creative software, and premium AI products. The platform earns the right to be in that company.

**Brand voice in microcopy:** Confident and direct, never jargon-heavy. Talks to the user as a smart co-worker, not a service portal. The Ethical Firewall especially must feel like a knowledgeable colleague flagging something before it goes out — never a red-tape bureaucrat blocking progress.

**Anti-patterns:**
- No gradient backgrounds on the main surface — gradients live in the Brand DNA card and illustrations only
- No dark mode in v1 — the light canvas is the product; the user's brand content is the color
- No celebratory confetti or gamification animations — this is a professional tool
- No generic stock-photo illustrations — if illustration is needed, use abstract geometric or icon-based art only.

## Colors

The palette is structured in layers: brand purple, publish/success amber, semantic states, and a clean neutral surface.

- **Primary Purple (#7C3AED)** — the brand color. Primary buttons, active nav, selected states, focus rings, progress indicators. Hover: #6D28D9. On hover, the button darkens — never lightens.
- **Primary Subtle (#EDE9FE)** — tinted purple surface. Used for the Brand DNA Card background, selected template chips, active list items. Communicates "this is yours / this is active" without full purple weight.
- **Accent Amber (#F59E0B)** — reserved exclusively for the publish-ready state and performance scores in the top tier. "This content is ready to go" or "This template is performing." Never used for decorative purposes.
- **Semantic states:** Success #10B981, Warning #F59E0B, Danger #EF4444. Each has a -subtle background variant for panel/badge use.
- **Ethical Firewall states:** Named separately from generic semantic colors — irewall-pass, irewall-warn, irewall-flag — because their meaning is domain-specific. irewall-unavailable (#9CA3AF) for a check that could not run. All four carry a -subtle background for the check row background.
- **Neutral surface:** #FFFFFF main background, #F9FAFB secondary surface (sidebar, panels), #E5E7EB borders.

## Typography

Two fonts: **Bricolage Grotesque** for display headings (the creative, editorial voice) and **Inter** for all body, label, and UI text (the precise, readable workhorse). A monospace stack (JetBrains Mono) for prompt template bodies and any code-adjacent content.

Bricolage Grotesque appears in: the onboarding headline ("Let's build your brand voice"), the Brand DNA Card primary label, Marketing Mind Meld question headings, and empty-state hero text. It does not appear in navigation, buttons, data tables, or content editor UI. The display type is a punctuation mark — a moment of brand personality — not the default voice.

Inter governs everything else. No compromise.

## Layout & Spacing

4px base grid. Primary content max-width: 896px (content creation, Prompt Library). Sidebar fixed at 240px on lg+. Top navigation bar: 56px fixed. Right panel (Ethical Firewall, Persona reactions): 360px fixed on xl+, collapses to bottom sheet on smaller viewports.

**Whitespace is a feature.** The editor surface and canvas are deliberately spacious. Do not compress the content creation area to fit more chrome. Users spend most of their time in the editor — it must feel uncluttered.

## Elevation & Depth

Three levels only:
- **Level 0** — flat surface cards (border only, no shadow)
- **Level 1** — interactive panels, right-side panels, dropdowns: ox-shadow: 0 2px 8px rgba(0,0,0,0.08)
- **Level 2** — modals, dialogs: ox-shadow: 0 8px 32px rgba(0,0,0,0.12)

No decorative shadows. No layered shadow stacks.

## Shapes

The product is creative but professional — rounded but not playful. Use {rounded.md} (8px) as the default for cards and buttons. {rounded.lg} (12px) for panels and right drawers. {rounded.full} only for pill badges, persona avatars, and performance score bars.

Never use {rounded.xl} on interactive elements — only on the Brand DNA Card and onboarding illustration containers.

## Components

**Firewall Card (irewall-card):** The most critical component. Always rendered above the publish button. Never dismissable. Background {colors.surface}, border 1px solid {colors.border}, {rounded.lg}. Each check row is a separate item with: colored left indicator dot, check name, one-line explanation (if flagged), and resolution actions (EDIT / REMOVE / HUMAN VERIFIED). When all checks pass, the card transforms: background shifts to {colors.firewall-pass-subtle}, border to {colors.firewall-pass}. This is the visual unlock — the publish button activates simultaneously.

**Brand DNA Card (rand-dna-card):** Left accent bar in {colors.primary}, gradient background from {colors.primary-subtle} to {colors.surface}. Communicates "this is your brand — it is the foundation of everything." Used in onboarding confirmation and the Settings Brand DNA view.

**Content Version Node (content-version-node):** Timeline of refinement steps. Each node: content preview (truncated), timestamp, annotation summary. Nodes connected by a dashed vertical line {colors.border-subtle}. The active node has border {colors.primary}. Tapping a past node shows it read-only with a "restore" option.

**Prompt Template Chip (prompt-template-chip):** Pill-shaped selection element. Unselected: neutral border and background. Selected: {colors.primary-subtle} background, {colors.primary} border. Shows template name, platform icon, and performance score badge.

**Segment Persona Avatar (segment-persona-avatar):** 40px circle, {colors.primary-subtle} background, initials in {colors.primary}. On hover, shows persona name tooltip. Clicking opens the persona profile panel.

**Performance Score Bar (performance-score-bar):** Thin 4px bar below the template name. Track {colors.border}. Fill color: {colors.primary} for mid-range, {colors.success} for top quartile (≥75), {colors.danger} for bottom quartile (≤25). Label: numeric score right-aligned.

**Publish Button states:** Disabled — {colors.border} background, {colors.foreground-subtle} text, cursor 
ot-allowed. Active — {colors.primary} background, white text. Transition between states: 200ms ease.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use {colors.primary-subtle} for selected/active states in lists and chips | Use full {colors.primary} for backgrounds — it overwhelms |
| Reserve {colors.accent} for publish-ready and top-performing states only | Use amber for warnings, hover states, or generic highlights |
| Keep the editor surface white with maximum breathing room | Add sidebars, banners, or persistent panels that compress the editor |
| Show the Ethical Firewall card as a collaborative colleague — "One thing to review" | Frame the Firewall as a blocker or a bureaucratic stop sign |
| Use Bricolage Grotesque only for headline/display moments | Set body text or buttons in the display font |
| Use {rounded.md} (8px) as the default corner radius | Use {rounded.xl} on interactive elements — it reads too soft |
| Fade/disable the publish button with a clear visual distinction | Hide or remove the publish button when content is not yet ready |
| Surface the ContentVersion timeline as a visible evolution — users should feel progress | Bury version history in a modal or settings screen |
