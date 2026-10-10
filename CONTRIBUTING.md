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
- **Text:** don't hard-code user-facing strings. See [Adding or changing text](#adding-or-changing-text).
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

## Adding or changing text

The site runs in one language at a time (English or Spanish, chosen in Settings). Every string a
guest or host can see lives in a dictionary in `src/lib/i18n/`, never inline in a component,
action, or route. That includes labels, placeholders, `aria-label`s, page titles, error messages,
CSV headers, and the sample copy new parties start with.

- Add the key to **both** `en.ts` and `es.ts`. `es` is typed against `en`, so a missing or extra
  key is a type error (`npm run typecheck`).
- Strings with a number or a name are functions, e.g. `spotsLeft: (left, total) => ...`, so each
  language can handle its own plurals and word order.
- **Server code** (pages, layouts, `generateMetadata`, actions, route handlers) reads the language
  with `const { lang, t } = await getI18n()` from `@/lib/i18n/server`. It calls `connection()`
  for you, so the page renders per request and never touches the database at build time.
- **Client components** get `lang` as a prop and call `getDict(lang)` from `@/lib/i18n`.
  Dictionaries hold functions, which can't be passed from server to client components, and the
  server helper can't be imported on the client.
- Dates and times go through `formatEventDate(..., t.locale)` in `src/lib/time.ts`.
- Zod's built-in messages follow the language too: pass `zodErrors(lang)` to `safeParse`.
- Text saved into a party (titles, sections, RSVP labels) belongs to the host. Don't migrate or
  translate existing rows.

Spanish copy should be warm and neutral, readable in Latin America and Spain, and use "tú".

To add a language:

1. Add `src/lib/i18n/<code>.ts`, typed as `Dict` (copy `es.ts` as a starting point), with its
   date `locale`.
2. Add the code to `LANGS`, `LANG_NAMES` and `DICTS` in `src/lib/i18n/index.ts`, and to
   `ZOD_LOCALES` in `src/lib/i18n/server.ts`.
3. Extend the `site_settings_language` CHECK in `src/db/schema.ts`, then run
   `npm run db:generate` for a new migration (never edit an old one).
4. The Settings picker lists everything in `LANGS`, so the new option shows up there.

## Reporting bugs and ideas

Open an issue with what you expected, what happened, and steps to reproduce. For a feature idea,
describe the party-hosting problem it solves. That makes it easier to keep the app small.

## Review process

All changes go through pull requests into `main`. CI (lint, type-check, build, and a Docker
build) must pass, and a [maintainer](MAINTAINERS.md) must approve the PR before it can merge.
PRs are squash-merged, so write a clear PR title. Please follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
