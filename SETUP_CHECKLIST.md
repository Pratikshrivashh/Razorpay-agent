# Setup Checklist — Do This Before Antigravity Starts Coding

## Accounts to create (all free, ~15 min total)

- [ ] Razorpay account → switch to **Test Mode** → dashboard.razorpay.com
- [ ] Razorpay Test API keys → Settings → API Keys → generate → save `KEY_ID` + `KEY_SECRET`
- [ ] Razorpay Test Webhook → Settings → Webhooks → add endpoint (use a placeholder URL now, update once deployed) → save `WEBHOOK_SECRET`
- [ ] Anthropic Console account → console.anthropic.com → generate `ANTHROPIC_API_KEY`
- [ ] Railway account (or Render) → railway.app → connect GitHub
- [ ] Local Docker installed (for local Postgres during dev) — or use Railway's managed Postgres from day one to skip local setup

## What you do NOT need

- ❌ Real Razorpay production/live account
- ❌ Real merchant data
- ❌ NPCI / bank-level API access
- ❌ Firebase project
- ❌ Blockchain / crypto anything
- ❌ Paid CopilotKit tier (open-source self-hosted runtime is enough for a demo)

## Environment file (.env.example — give this to the coding agent as-is)

```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=
DATABASE_URL=postgresql://user:password@localhost:5432/mule_agent
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Documents to hand to Antigravity, in this order

1. `PRD.md` — what we're building and why
2. `TRD.md` — how to build it, tech stack, schema, endpoints, phases
3. This checklist — confirms all keys/accounts are ready
4. Instruct it explicitly: **"Inspect repo first, propose structure, wait for approval before generating code — follow the Phase order in TRD Section 9, do not skip to frontend before Phases 1-5 are working."**
