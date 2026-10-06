# Story 0.3: Design System Foundation (Tokens, Typography, Responsive Shell)

Status: done

## Story

As a user,
I want a visually consistent, professionally styled application shell,
So that every surface I interact with feels intentional, readable, and premium from the first screen.

## Acceptance Criteria

- [x] Given the application loads in a browser
- [x] When any page renders
- [x] Then the primary color `#7C3AED` and all color tokens from DESIGN.md are applied as CSS properties on `:root`
- [x] And Bricolage Grotesque (display weight 700) and Inter (400/500/600) are loaded and render correctly
- [x] And the sidebar is 240px fixed on viewports >= 1024px, collapses to a 56px icon-only rail at 768-1023px, and becomes a hidden drawer at < 768px
- [x] And the main content area respects a maximum width of 896px and is centered; the right panel is 360px fixed on viewports >= 1280px

## Tasks / Subtasks

- [x] Define global design system properties on `:root` in `globals.css`
- [x] Integrate Bricolage Grotesque and Inter in root `layout.tsx`
- [x] Implement responsive sidebar navigation layout in `dashboard/layout.tsx`
- [x] Add right panel collapsible shell structure

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### File List

- [apps/web/src/app/globals.css](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/globals.css)
- [apps/web/src/app/layout.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/layout.tsx)
- [apps/web/src/app/dashboard/layout.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/dashboard/layout.tsx)
