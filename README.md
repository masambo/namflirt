# NamFlirt

NamFlirt is a mobile-first dating experience for Namibia, built with React, TanStack Router, Vite, Tailwind CSS and Convex.

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

## Commands

- `npm run dev` — start the Vite frontend
- `npm run convex:dev` — sync Convex functions and generate types
- `npm run check` — run TypeScript checks
- `npm run lint` — run ESLint
- `npm run build` — create a production frontend build
- `npm run convex:deploy` — deploy Convex and build against its production URL
