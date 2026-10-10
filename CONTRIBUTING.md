# Contributing to Little RSVP

Thanks for helping out! Little RSVP is meant to stay small and easy to self-host, so please keep
changes focused.

## Getting set up

Follow the [Quick start](README.md#quick-start-local) in the README. Setting `DEV_LOGIN_EMAIL`
lets you use the admin without configuring Google OAuth.

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm run build
```

- **Schema changes:** edit `src/db/schema.ts`, run `npm run db:generate`, and commit the new
  file in `drizzle/`. Never edit a migration that has already been released.
- **Landing page:** don't hard-code a name. It comes from **Settings** (see
  [Adding a setting](#adding-a-setting)).
- **UI changes:** check both the public party page (`/e/<slug>`) and the admin editor, on a
  phone-sized viewport as well as desktop. Include a screenshot in the PR if you can.
- **Next.js 16:** APIs differ from older versions. Check `node_modules/next/dist/docs/`
  before relying on something you remember from Next 13–15.
- Match the style of the surrounding code, and keep PRs to one change each.

## Adding a setting

Site-wide options that hosts change from the admin (like the landing page name) live in the
single-row `site_settings` table, **not** in environment variables. That way, non-technical
hosts can change them without redeploying. To add one:

1. Add a column with a sensible default to `siteSettings` in `src/db/schema.ts`, then run
   `npm run db:generate`.
2. Add it to `defaultSiteSettings` and the `select` in `src/lib/settings.ts`.
3. Validate it in `src/app/admin/settings-actions.ts`. Trim it and cap the length.
4. Add a field to `src/app/admin/(dash)/settings/page.tsx`, with a placeholder and a short hint.
5. Read it with `getSiteSettings()` wherever it's used. Pages that read settings must call
   `await connection()` so they render per request and never touch the database at build time.
6. Document it under *Customizing the landing page* in the README.

Keep secrets and infrastructure config (database, OAuth, admin allowlist) in environment
variables.

## Reporting bugs and ideas

Open an issue with what you expected, what happened, and steps to reproduce. For a feature idea,
describe the party-hosting problem it solves. That makes it easier to keep the app small.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
