# Security Policy

Please **don't open a public issue** for security problems. Instead, report them privately through
GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
on this repository (Security tab → *Report a vulnerability*).

Include:

- what an attacker could do,
- steps or a proof of concept, and
- the affected version or commit.

We'll acknowledge the report as soon as we can and keep you updated while it's fixed.

## Scope notes for self-hosters

- Admin access is controlled entirely by `ADMIN_EMAILS`. Keep that list short.
- `DEV_LOGIN_EMAIL` only works under `next dev` and only from `localhost`. Never run the dev
  server on a public host.
- Set `AUTH_URL` in production. Without it, absolute links are built from request headers.
- New RSVPs are rate-limited per client IP, using the last `X-Forwarded-For` hop. That assumes
  exactly one reverse proxy in front of the app (the usual setup on Dokploy, Railway, Heroku and
  App Platform). The limiter is in memory, so it resets on restart and isn't shared between
  replicas.
- Keep `AUTH_SECRET` secret. Rotating it signs everyone out.
- The database holds all guest data (names, contact info, notes) and uploaded photos.
  Back it up and restrict who can reach it.
