# raddai-lms (main portal frontend)

Next.js app (app router, shadcn UI, pnpm) on Vercel, laazeereacademy.com. Talks to raddai-backend.

## Deploy
- Merge to `master` and Vercel deploys. Frontend-only changes need nothing on cPanel.
- Project: `prj_GQ9puMVANyfoIMvLWX2LVAsuKC1g`, team `team_dgPnpufxVtZ1y7Z20ntW0wrT`.

## Run and test locally
- Typecheck: `npx tsc --noEmit -p .`.
- For browser tests run the backend on :8000 and `next dev -p 3000` with `NEXT_PUBLIC_API_URL=http://localhost:8000/api` in `.env.local`. Delete `.env.local` and `.next/dev` afterwards.

## Things to know
- Printing uses `window.print` pages (see `app/management/staff/print`), management/admin only via ProtectedRoute.
- Score limits per class: `lib/score-scheme.ts`. Staff bank details: `lib/staff-bank-details.ts`. Fee status per class: `lib/class-payment-status.ts`.
- Management finance page: `app/management/finance` (By Class tab).

## How to work with me
- Short, plain answers. No long recaps.
- Test before reporting (run the tests; for UI changes check it in a browser). Say plainly if something failed or was skipped.
- Never merge until I say "merge". Then create the PR, merge it, check the deploy is READY and report in a line or two.
- Say whether a change is frontend-only, needs a migration, or needs a cPanel pull + Restart.
- Do not touch the other portal when a change is for one portal only.
- Never decrypt Vercel env values. No destructive Neon/database actions without asking first.
- Commit trailer: `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Keep token use low: read only the files needed, no huge outputs, screenshots only for UI changes.

