# Story 0.2: Authentication with Supabase (Sign Up, Login, Session)

Status: done

## Story

As a new user,
I want to sign up with my email and password and log in to the platform,
So that I have a secure, persistent account that all my Brand DNA, content, and settings belong to.

## Acceptance Criteria

- [x] Given a user navigates to `/signup`
- [x] When they enter a valid email and password (min 8 chars) and submit
- [x] Then a user row is inserted in PostgreSQL (user_id UUID, email, created_at, phase: phase_1) and they are redirected to Onboarding
- [x] And submitting with an already-registered email shows an inline error "An account with this email already exists" — no page reload
- [x] Given a registered user navigates to `/login`
- [x] When they enter valid credentials
- [x] Then they are authenticated via JWT, session is stored, and they redirect to Dashboard
- [x] And all API routes return 401 Unauthorized for requests missing a valid JWT
- [x] And the JWT is verified server-side on every API request

## Tasks / Subtasks

- [x] Set up JWT Auth middleware (`services/api/src/middleware/auth.ts`)
- [x] Create registration and login routes (`services/api/src/routes/auth.ts`)
- [x] Implement frontend `/signup` page with form validations (`apps/web/src/app/signup/page.tsx`)
- [x] Implement frontend `/login` page with session storage (`apps/web/src/app/login/page.tsx`)
- [x] Redirect authenticated sessions to `/onboarding` / `/dashboard`

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash (Medium)

### File List

- [services/api/src/routes/auth.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/src/routes/auth.ts)
- [services/api/src/middleware/auth.ts](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/services/api/src/middleware/auth.ts)
- [apps/web/src/app/signup/page.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/signup/page.tsx)
- [apps/web/src/app/login/page.tsx](file:///c:/Users/sahar/Desktop/digital-marketing-assistant/apps/web/src/app/login/page.tsx)
