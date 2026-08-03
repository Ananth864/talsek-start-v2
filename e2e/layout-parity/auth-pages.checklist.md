# Side-by-side checklist — Auth pages

Manual companion to `auth-pages.spec.ts` (ADR-0030 §5). Compare the port
(`localhost:3000`) against source `talsek` (`localhost:5173`) at ~1280px desktop.

## Sign-in

- [ ] Two-column AuthLayout: form left, brand/features right (lg+)
- [ ] Title “Welcome back” + subtitle “Sign in to your Talsek account”
- [ ] Google OAuth above separator “or continue with email”, then email form
- [ ] Email + Password (visibility toggle) + “Forgot your password?” right-aligned
- [ ] Primary CTA “Sign in”; footer “Don't have an account? Sign up”

## Sign-up

- [ ] Same AuthLayout chrome; title “Create your account” + join subtitle
- [ ] Google first + “or continue with email”
- [ ] First/Last name grid → Email → Password → Confirm password (toggles)
- [ ] Primary “Create account”; footer “Already have an account? Sign in”

## Forgot password

- [ ] Top “Back to sign in”; title “Forgot your password?” + email field
- [ ] Primary “Send reset link”; footer “Remember your password? Sign in”
- [ ] Success: “Check your email”, masked address, numbered next steps,
      “Send to different email” + “Back to sign in”

## Reset password

- [ ] No `?code` → `/forgot-password`
- [ ] Invalid/expired code: clear invalid chrome + request/back CTA
- [ ] Valid session: “Create New Password”, New + Confirm fields with toggles,
      “Update password” (checklist / live recovery link)

## Confirm email

- [ ] No code: “Check your email” + Resend confirmation + Back to sign in
- [ ] Confirmed / error states keep primary CTA and secondary path visible
