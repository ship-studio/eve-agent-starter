@AGENTS.md

# Ship Studio Project — Eve Agent

This project builds an **AI agent** with [Eve](https://vercel.com/eve), Vercel's agent
framework. The user may not be a developer — keep explanations simple and jargon-free,
and explain what an agent *does* before explaining how it's wired.

---

## Environment: Ship Studio App

You are running inside the **Ship Studio app**, which manages the dev environment.

- A preview server is **already running** — don't start one.
- The user sees the chat UI live at the preview (`localhost:3000`).
- Changes to files are reflected when the user clicks Refresh in the preview.

**If the user says the preview isn't working:**
> "Try clicking the **Projects** button in the top right corner to go back to the
> project list, then reopen your project. This restarts the preview."

Two things Ship Studio does *not* handle automatically:
- **Model credentials.** The agent can't think without `AI_GATEWAY_API_KEY` in
  `.env.local`. If the chat returns an auth error, that's the first thing to check.
- **Eve's REPL** (`npm run dev:eve`). It's a terminal UI — never launch it as a
  background process. Use `npm exec -- eve dev --no-ui` if you need to verify the
  agent programmatically, then stop it.

---

## FIRST: Read the bundled docs

The complete Eve docs ship inside the installed package and **match its version
exactly** — always prefer them over memory, since Eve is young and moving fast.

```
node_modules/eve/docs/README.md          ← start here
node_modules/eve/docs/tools/overview.mdx
node_modules/eve/docs/reference/project-layout.md
```

Fall back to https://eve.dev/docs only if the package docs are unavailable.

---

## The one big idea: the filesystem is the API

Eve builds the agent by walking `agent/`. **Identity comes from the path** — you never
write a `name` or `id` field on a `define*` call.

| Path | Becomes |
| --- | --- |
| `agent/tools/get_weather.ts` | tool `get_weather` |
| `agent/skills/summarize.md` | skill `summarize` |
| `agent/connections/linear.ts` | connection `linear` |
| `agent/subagents/researcher/agent.ts` | subagent `researcher` |

Renaming the file renames the capability. To add a tool, you add a file — there is no
registry to update.

**When something isn't picked up, run `npx eve info`.** It prints the discovered
surface and diagnostics. That's the debugging tool, not guesswork.

---

## Project structure

```
agent/
├── agent.ts            Model + runtime config
├── instructions.md     The always-on system prompt
├── tools/              One file per tool — filename IS the tool name
└── channels/eve.ts     HTTP entrypoint + auth

app/                    Next.js chat UI (page.tsx → <AgentChat />)
components/             shadcn/ui + AI Elements primitives
next.config.ts          withEve() mounts the agent into the Next server
```

`npm run dev` runs the agent and the web UI together on one port.

---

## Rules for building

### Tools

- One file per tool in `agent/tools/`. Export `defineTool` as **default**.
- `description` is written **for the model** — say when to use it, not just what it is.
- `inputSchema` is required. Use Zod. For no input, `z.object({})`.
- Tools run in **your app runtime**, not the sandbox — `process.env`, your DB, and your
  SDKs are all available. Shared helpers go in `agent/lib/`.
- Outputs must be JSON-serializable. Convert `Date`/`Map`/`Set` before returning.
- Use `toModelOutput` when a tool returns rich data the UI needs but the model doesn't —
  it keeps the context window small.
- **Never return secrets, credentials, or unnecessary personal data from a tool.**

### Side effects

A step interrupted mid-execution **re-runs**. Completed steps never re-run. So anything
non-idempotent — charges, emails, deletes — must either be made idempotent or gated:

```ts
import { always } from "eve/tools/approval";
approval: always(),   // or once() / never() / an input-dependent policy
```

### Instructions vs. skills

`agent/instructions.md` is sent on **every single turn** — keep it tight. When you're
tempted to add a long procedure ("how to run the monthly report"), make it a **skill**
in `agent/skills/` instead. Skills load only when relevant, so they cost nothing until
they're needed.

### Before you call it done

1. `npm run typecheck` — must pass.
2. `npx eve info` — 0 errors, and your new capability appears in the counts.
3. Actually exercise the agent: ask it something that forces the new tool to fire.

---

## DO / DON'T

**DO:**
- Read `node_modules/eve/docs/` before using an Eve API you haven't used in this session
- Keep `instructions.md` short and behavioral; push procedures into skills
- Give tools model-facing descriptions that say *when* to use them
- Use `agent/lib/` for code shared between tools
- Explain to the user in plain English what their agent can now do

**DON'T:**
- Don't add a `name` field to a `define*` call — the path is the name
- Don't run `npm run dev:eve` as a background process (it's an interactive TUI)
- Don't commit `.env.local` or hardcode API keys — use `.env.example` for the template
- Don't ship `placeholderAuth()` to production — it blocks browser requests by design.
  Replace it in `agent/channels/eve.ts` with real auth, or `none()` for a public demo
- Don't put long procedures in `instructions.md` — that tax is paid on every turn

---

## After every task

1. Make the change.
2. Run `npm run typecheck` and `npx eve info`.
3. Tell the user in plain English what their agent can do now, and give them a sample
   message to try in the preview.
