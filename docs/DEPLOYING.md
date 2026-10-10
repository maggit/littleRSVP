# Deploying Little RSVP

Little RSVP is one Docker container plus one Postgres database. The container:

- builds from the [`Dockerfile`](../Dockerfile) in the repo root,
- listens on `$PORT` (default **3000**),
- applies any pending database migrations when it starts, and
- keeps no files on disk. Photos are stored in Postgres, so you can redeploy or scale freely.

Every platform below needs the same environment variables:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (each guide shows where to get it) |
| `AUTH_SECRET` | a random secret: `npx auth secret` or `openssl rand -base64 33` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | your Google OAuth client (see below) |
| `AUTH_URL` | your public URL, e.g. `https://rsvp.example.com` (no trailing slash) |
| `ADMIN_EMAILS` | comma-separated Google accounts allowed into `/admin` |

Never set `DEV_LOGIN_EMAIL` in production. It's ignored by production builds anyway.

## Before you start: Google sign-in

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Configure the **OAuth consent screen** (External, app name "Little RSVP"). While it's in
   *Testing* mode, add your admin emails as test users. You can also publish the app, since it
   only asks for basic profile and email.
3. Create an **OAuth client ID** of type *Web application*, with this authorized redirect URI:
   `https://<your-domain>/api/auth/callback/google`
4. Copy the client ID and secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

If you don't know your domain yet, deploy first, then come back and add the platform's URL
(e.g. `https://littlersvp-production.up.railway.app`) as a redirect URI.

## After any deploy

1. Visit `https://<your-domain>/admin` and sign in with an email from `ADMIN_EMAILS`.
2. Open **Settings** and set the landing page name (see [Customizing the landing page](../README.md#customizing-the-landing-page)).
3. Create your first party.
4. Set up database backups. The database holds everything, including photos.

---

## Dokploy

1. **Database.** In your Dokploy project, create a **Postgres** service and copy its
   *Internal Connection URL*.
2. **App.** Create an **Application** from your fork of this repo. Set the build type to
   **Dockerfile** with path `./Dockerfile`.
3. **Environment.** Add the variables above, using the internal URL for `DATABASE_URL`.
4. **Domain.** Under *Domains*, add your domain pointing at container port **3000**, with HTTPS
   (Let's Encrypt) turned on.
5. **Deploy.**
6. **Backups.** Set up scheduled backups in the Postgres service's *Backups* tab.

## Railway

1. Create a new project and choose **Deploy from GitHub repo**, picking your fork. Railway
   finds the `Dockerfile` automatically.
2. In the same project, click **+ New → Database → PostgreSQL**.
3. On the app service, open **Variables** and add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (a reference variable that uses the private network)
   - the rest of the variables above
4. Under **Settings → Networking**, click **Generate Domain** or add a custom domain. Railway
   provides `PORT` and routes to it automatically.
5. Set `AUTH_URL` to that domain, add the Google redirect URI, and redeploy.

## Heroku

Heroku builds the container from [`heroku.yml`](../heroku.yml).

```bash
heroku create my-littlersvp
heroku stack:set container
heroku addons:create heroku-postgresql:essential-0
heroku config:set AUTH_SECRET="$(openssl rand -base64 33)" \
  AUTH_GOOGLE_ID=... AUTH_GOOGLE_SECRET=... \
  AUTH_URL=https://my-littlersvp-xxxx.herokuapp.com \
  ADMIN_EMAILS=you@example.com DATABASE_SSL=require
git push heroku main
```

- The Postgres add-on sets `DATABASE_URL` for you. Heroku Postgres requires TLS but its URL
  doesn't say so, which is why `DATABASE_SSL=require` is set above.
- Heroku sets `PORT` at runtime, and the container respects it.
- Use `heroku apps:info` to find your app URL. Add `/api/auth/callback/google` to it for the Google
  redirect URI.
- For backups, run `heroku pg:backups:schedule DATABASE_URL --at '02:00 America/New_York'`.

## DigitalOcean App Platform

1. **Create App** → choose GitHub and pick your fork. App Platform detects the `Dockerfile`.
2. Set the web service's **HTTP port** to `3000`.
3. Click **Add Resource → Database**. A dev database is fine to start with; use a managed Postgres
   cluster for production.
4. In the web service's **Environment Variables**, add:
   - `DATABASE_URL` = `${db.DATABASE_URL}` (use your database component's name in place of `db`).
     DigitalOcean URLs already include `sslmode=require`.
   - the rest of the variables above
5. Deploy, then add your custom domain under **Settings → Domains**. Set `AUTH_URL` and the
   Google redirect URI to match, and redeploy.
6. Managed databases have daily backups. A dev database does not, so upgrade it before you
   rely on it.

### DigitalOcean Droplet (plain Docker)

On any VM with Docker:

```bash
docker network create littlersvp
docker run -d --name littlersvp-db --network littlersvp --restart unless-stopped \
  -e POSTGRES_USER=littlersvp -e POSTGRES_PASSWORD='<strong-password>' -e POSTGRES_DB=littlersvp \
  -v littlersvp-pgdata:/var/lib/postgresql/data postgres:17-alpine
docker build -t littlersvp .
docker run -d --name littlersvp --network littlersvp --restart unless-stopped -p 127.0.0.1:3000:3000 \
  -e DATABASE_URL='postgres://littlersvp:<strong-password>@littlersvp-db:5432/littlersvp' \
  -e AUTH_SECRET=... -e AUTH_GOOGLE_ID=... -e AUTH_GOOGLE_SECRET=... \
  -e AUTH_URL=https://rsvp.example.com -e ADMIN_EMAILS=you@example.com \
  littlersvp
```

Put a reverse proxy with HTTPS in front of it (Caddy is the easiest:
`rsvp.example.com { reverse_proxy 127.0.0.1:3000 }`). Don't publish Postgres's port, and back
up the `littlersvp-pgdata` volume, for example with a nightly `pg_dump`.

---

## Troubleshooting

- **Redirect loop or "Configuration" error at sign-in.** `AUTH_URL` doesn't match the URL you're
  visiting, or the Google redirect URI is missing. Both must use the exact same `https://` origin.
- **"Not allowed" after Google sign-in.** The email isn't in `ADMIN_EMAILS`. Check for typos and
  restart the app after changing it.
- **Migrations fail on boot.** Check `DATABASE_URL`. If your provider requires TLS, add
  `?sslmode=require` to the URL or set `DATABASE_SSL=require`.
- **Link previews show the wrong domain.** Set `AUTH_URL`. It's used to build absolute URLs for
  share images.
