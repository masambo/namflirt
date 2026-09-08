# NamFlirt

NamFlirt is a mobile-first dating experience for Namibia, built with React, TanStack Router, Vite, Tailwind CSS and Convex.

## Discovery and international profiles

Discovery only returns profiles matching the member's saved **I'd like to meet** gender preference.
Members can choose a country during onboarding or in **Edit profile**, and save **My country** or
**International** as their default discovery scope. International includes all countries; the
Discover page also offers a temporary scope switch and country filter. Existing profiles without
a country are treated as Namibian, and existing preferences default to local discovery.

After updating this checkout, run `npm run convex:dev` against your development deployment to sync
the new optional schema fields and server filtering. The frontend alone cannot update the backend.
Run `npm test` with Node 22.6 or newer for discovery regression checks.

## Local setup

```bash
npm install
npm run convex:dev
```

The first Convex command signs you in, creates or links a project, generates `convex/_generated`, and writes the local deployment values to `.env.local`.

Create a Clerk application, activate its Convex integration, and copy the publishable key into `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Copy Clerk's Frontend API URL into the `CLERK_JWT_ISSUER_DOMAIN` environment variable for your Convex development deployment, then sync and run the app:

```bash
npx convex dev
npm run dev
```

The browser needs `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY`; both are public client configuration. Keep Clerk secret keys out of every `VITE_*` variable. Convex validates Clerk sessions using the issuer domain configured on the Convex deployment.

## Admin dashboard

Admin access is controlled on the Convex server with a comma-separated allowlist. Prefer email
when Clerk includes email claims, or use Clerk user ids when the Convex identity does not include
an email:

```bash
npx convex env set ADMIN_EMAILS admin@example.com
npx convex env set ADMIN_USER_IDS user_abc123
```

Authorized accounts see **Admin dashboard** in the desktop sidebar and profile settings. The
dashboard is available at `/admin` and includes member activity, plan distribution, moderation,
verification controls, and report triage. Never expose `ADMIN_EMAILS` or `ADMIN_USER_IDS` through a
`VITE_*` variable.

## Production deployment

Before deploying the frontend, deploy or select a hosted Convex deployment and set its server-side
environment variables:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-frontend-api.clerk.accounts.dev
npx convex env set ADMIN_EMAILS admin@example.com
npx convex env set ADMIN_USER_IDS user_abc123
npx convex deploy
```

Set these public frontend variables in your hosting provider:

```env
VITE_CONVEX_URL=https://your-production-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_SITE_URL=https://namflirt.com
```

The app uses client-side routing, so production hosting must route unknown paths to `index.html`.
`vercel.json` covers Vercel and `public/_redirects` covers Netlify-style static hosting.

Run the full local verification before publishing:

```bash
npm run verify
```

## Commands

- `npm run dev` — start the Vite frontend
- `npm run convex:dev` — sync Convex functions and generate types
- `npm run check` — run TypeScript checks
- `npm run lint` — run ESLint
- `npm run build` — create a production frontend build
- `npm run verify` — run lint, TypeScript checks, and a production build
- `npm run convex:deploy` — deploy Convex and build against its production URL
