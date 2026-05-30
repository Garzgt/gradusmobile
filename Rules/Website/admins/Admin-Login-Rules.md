# GRADUS Admin Login Rules

This document defines the full rules for the Admin Login module used by:
- Super Admin

This is an authenticated admin entry flow and is separate from public landing pages.

## 1. Goals

1. Provide secure and reliable admin authentication.
2. Protect against automated abuse and credential stuffing.
3. Enforce clear role-based redirection after login.
4. Provide a complete forgot-password flow using email verification through Brevo.
5. Keep the experience accessible, responsive, and easy to use.

## 2. Route Scope

Required pages:
1. Login page
2. Forgot password page
3. Reset password page

Suggested app route mapping:
1. app/(auth)/login
2. app/(auth)/forgot-password
3. app/(auth)/reset-password

## 3. Supported Roles

1. Super Admin
- single global account

Non-admin accounts must not be allowed into admin dashboards.

## 4. Login Form Rules

Required fields and controls:
1. School email input
2. Password input
3. Remember Me checkbox
4. Google reCAPTCHA checkbox
5. Login submit button
6. Forgot Password link
7. Show/Hide password toggle

Behavior rules:
1. Email and password are required.
2. Email must use institutional domain policy if enabled by system policy.
3. Login button remains disabled while request is in progress.
4. Show a progress state while authenticating.
5. Show Caps Lock warning while typing password when detected.
6. Error messages must be generic for auth failures.

Generic auth error pattern:
- Invalid credentials or verification failed. Please try again.

Do not expose whether the email exists.

## 5. Google reCAPTCHA Rules

1. Login submission requires a valid reCAPTCHA token.
2. Token must be validated on server side before authentication attempt.
3. Invalid or missing token returns a safe validation error.
4. Client-side captcha success alone is not trusted.

Server verification checklist:
1. Validate captcha token with Google verify endpoint.
2. Check success status and expected score/flags based on captcha mode.
3. Reject request when verification fails.

## 6. Forgot Password Rules (Brevo Required)

Forgot-password process must use Brevo transactional email.

Flow:
1. User submits email on forgot-password page.
2. System creates one-time reset token.
3. System stores only hashed token with expiration timestamp.
4. System sends reset email via Brevo.
5. User opens reset link and submits new password.
6. System validates token, updates password, and invalidates token.

Brevo requirements:
1. Use Brevo API key on server only.
2. Do not expose Brevo secrets to client bundle.
3. Use branded email template and clear expiration notice.
4. Include support contact footer.

Security rules for reset:
1. Token must expire in 15 to 30 minutes.
2. Token is single-use only.
3. Token is invalidated after successful password update.
4. Token must be invalidated if account password changes by other secure flow.
5. Forgot-password endpoint must return generic success response for unknown emails.
6. Rate limit forgot-password and reset endpoints.
7. Add resend cooldown to prevent spam.

## 7. Remember Me Session Rules

1. Remember Me checked:
- use longer session persistence window.

2. Remember Me unchecked:
- use standard shorter admin session window.

3. Session cookies must use secure settings:
- secure in production
- httpOnly
- sameSite policy

4. Session must be invalidated on logout.

## 8. Auth Security Rules

1. Enforce server-side input validation on every auth endpoint.
2. Apply request throttling and rate limiting on login and recovery routes.
3. Add short cooldown or temporary lockout after repeated failed attempts.
4. Use generic error responses for authentication failure paths.
5. Do not log passwords, raw reset tokens, captcha secrets, or API keys.
6. Use audit logs for admin auth events.

Audit log events to capture:
1. Admin login success
2. Admin login failure
3. Forgot-password request submitted
4. Reset token consumed successfully
5. Reset token invalid or expired attempts

## 9. Role Redirect Rules After Login

1. Super Admin redirects to super-admin dashboard.
2. Users with unknown or unauthorized role are denied admin dashboard access.
4. Protected admin routes must verify role on server-side checks.

## 10. UI and Visual Rules

Design intent:
1. Professional and high-trust academic governance look.
2. Clean, non-generic layout.
3. Strong visual hierarchy for form clarity.

Recommended color system:
1. Brand maroon dark: #4A0010
2. Brand maroon main: #6B0017
3. Brand maroon soft: #8B1E2D
4. Accent gold main: #D4A017
5. Accent gold soft: #F3D37A
6. Surface primary: #FFFFFF
7. Surface secondary: #F7F4EF
8. Surface muted: #ECE6DC
9. Text primary: #1F232B
10. Text secondary: #4B5563
11. Border: #D8D2C8
12. Success: #1F8A4D
13. Warning: #B7791F
14. Danger: #C53030

Required UI states:
1. default
2. hover
3. focus-visible
4. disabled
5. loading
6. error
7. success

## 11. Accessibility Rules

1. Use semantic form labels for all inputs.
2. Ensure keyboard-only operability for all controls.
3. Provide visible focus ring on interactive elements.
4. Ensure text and controls meet accessible contrast.
5. Announce validation and error text in accessible manner.
6. Ensure reCAPTCHA container remains reachable and understandable.

## 12. API Rules

Required auth endpoints:
1. Login endpoint
2. Verify captcha endpoint or integrated server-side captcha verification
3. Forgot-password request endpoint
4. Reset-password confirm endpoint

Endpoint rules:
1. Validate request schema server-side.
2. Return safe and consistent response shape.
3. Do not leak account existence details.
4. Return clear field-level validation for malformed input only.

## 13. Environment Configuration Rules

Required environment variables:
1. BREVO_API_KEY
2. BREVO_SENDER_EMAIL
3. BREVO_SENDER_NAME
4. APP_BASE_URL
5. NEXT_PUBLIC_RECAPTCHA_SITE_KEY
6. RECAPTCHA_SECRET_KEY

Configuration rules:
1. Keep secrets in server environment only.
2. Never hardcode secrets in repository.
3. Provide non-production defaults only for local development where safe.

## 14. Testing and Acceptance Checklist

Functional checks:
1. Admin login works with valid credentials and valid captcha.
2. Login fails with invalid credentials using generic message.
3. Login is blocked when captcha is missing or invalid.
4. Remember Me changes session persistence behavior.
5. Forgot-password sends Brevo email when request is accepted.
6. Reset token expires correctly and cannot be reused.
7. Password is updated only with valid, unexpired token.
8. Role redirect works correctly after login.

Security checks:
1. Rate limit triggers on repeated failed login attempts.
2. Unknown email in forgot-password still returns generic success response.
3. Secrets and token values are not exposed in logs or client responses.

UX checks:
1. Mobile layout is usable and visually consistent.
2. Keyboard navigation works through all form controls.
3. Error and loading states are clear.

## 15. Non-Negotiable Rules

1. No TypeScript for this module.
2. No bypass of captcha verification on production login flow.
3. No plaintext reset token storage.
4. No role trust based only on client state.
5. No admin dashboard access without server-side role validation.
