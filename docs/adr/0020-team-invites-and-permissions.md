# Team invites & Member permissions

Ticket #15 ports admin Team management: invite a Member (Resend email),
resend a pending invite, and update `Profile.permissions` capability flags.

## Decisions

### 1. Admin gate via user-scoped `user_is_company_admin`, then service-role

Invite, resend, and permission updates call
`context.supabase.rpc('user_is_company_admin', …)` on the Member session
client first. Profile writes and Auth Admin API
(`createUser` / `generateLink` / `updateUserById`) then use
`getAdminClient()`.

`profiles` UPDATE RLS is self-only — there is no admin-UPDATE policy — so
permission and invite profile writes cannot run user-scoped without a DB
migration. This matches the source edge functions and the billing precedent
of mixing service-role after an application authz check (ADR-0004).

### 2. Reads stay user-scoped

`fetchTeamMembers` / `fetchTeamMember`, company-name lookup, and the
existence checks before invite writes use the cookie-backed client.
Company admins already have SELECT via RLS
(`"Company admins can view company profiles"`). Cross-company email
lookups and Auth Admin API remain service-role.

### 3. Small Resend seam in `src/server/lib/email.ts`

Invite HTML/text + `sendInviteEmail` live in one module so #17 can deepen
notifications without a second outbound path. Env:
`RESEND_API_KEY`, optional `RESEND_INVITE_FROM` / `REPLY_TO` / `SUBJECT`.

### 4. Stub when key absent or `EMAIL_STUB`

When `EMAIL_STUB` is `"1"`/`"true"` **or** `RESEND_API_KEY` is unset,
`sendInviteEmail` logs and returns success. Playwright sets `EMAIL_STUB=1`
so invite create/resend stay exercisable without live Resend (mirrors
`BILLING_STUB` / `AI_PIPELINE_STUB`).

### 5. Recovery link redirect uses request origin

Invite links use `getRequestOrigin() + '/reset-password'` instead of a
hard-coded `PUBLIC_SITE_URL`, matching auth password-reset (ADR-0008).

## Consequences

- Non-admin Members hitting `/users` redirect to `/dashboard`.
- Invite email failure after auth user creation surfaces as an error without
  rolling back the user/profile (source parity).
- Production needs `RESEND_API_KEY` (and optionally invite from/reply/subject).
