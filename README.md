# Eve Agent Starter

A starter for [**Eve**](https://vercel.com/eve), Vercel's agent framework — plus a
Next.js web chat UI to talk to the agent in the browser.

Eve is to agents what Next.js is to web apps: the **filesystem is the API**. You
write Markdown for instructions and TypeScript for tools, and Eve wires up the
model loop, streaming, durability, and channels for you.

```bash
npm install
cp .env.example .env.local     # add your AI Gateway key
npm run dev                    # http://localhost:3000
```

## What's inside

A working research assistant with two real tools (no API keys needed for either):

- **`get_weather`** — current conditions for any city, via [Open-Meteo](https://open-meteo.com).
  Shows `inputSchema` + `outputSchema` + `toModelOutput`.
- **`search_wikipedia`** — article search with titles, blurbs, and URLs. Shows the
  simplest possible tool: schema in, JSON out.

Ask it *"what's the weather in Lisbon, and what is Lisbon known for?"* and watch it
call both.

## Project structure

```
agent/                     Everything Eve discovers by walking the filesystem
├── agent.ts               Runtime config — model, compaction, build options
├── instructions.md        The always-on system prompt
├── tools/                 One file per tool; the FILENAME is the tool name
│   ├── get_weather.ts     → the model sees a tool called `get_weather`
│   └── search_wikipedia.ts
└── channels/
    └── eve.ts             HTTP entrypoint + auth for the deployed agent

app/                       Next.js web chat (the "channel" you see in the browser)
├── page.tsx               Renders <AgentChat />
└── _components/           Chat surface built on eve/react + ai-elements
components/                shadcn/ui + AI Elements primitives
next.config.ts             withEve() mounts the agent into the Next server
```

The rule to internalize: **identity comes from the path**. You never write a `name`
field on a `define*` call. `agent/tools/get_weather.ts` *is* the tool `get_weather`.

## Adding a tool

Drop a file in `agent/tools/`. That's the whole step.

```ts
// agent/tools/create_ticket.ts
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Create a support ticket.",     // written for the model
  inputSchema: z.object({ title: z.string(), body: z.string() }),
  async execute({ title, body }, ctx) {
    // Runs in YOUR app runtime — process.env, your DB, your SDKs.
    return await ticketing.create({ title, body });
  },
});
```

Tools run in the app runtime, not the sandbox, so they can read `process.env` and
import shared code from `agent/lib/`.

### Gating a tool on human approval

Eve pauses durably mid-run and resumes when a human signs off:

```ts
import { always } from "eve/tools/approval";

export default defineTool({
  description: "Refund a charge.",
  inputSchema: z.object({ chargeId: z.string(), amount: z.number() }),
  approval: always(),          // or once() / never() / an input-dependent policy
  async execute(input) { return refund(input); },
});
```

## Other slots you can author

Each is a directory under `agent/` that Eve discovers automatically:

| Slot | What it holds |
| --- | --- |
| `skills/` | On-demand procedures the model loads only when relevant |
| `connections/` | External services via MCP or OpenAPI |
| `subagents/` | Specialist child agents, each its own mini-package |
| `schedules/` | Recurring jobs (cron in frontmatter, or `defineSchedule`) |
| `hooks/` | Lifecycle and stream-event subscribers |
| `sandbox/` | The isolated exec environment + files seeded into `/workspace` |
| `lib/` | Shared helper code (import-only, never mounted) |
| `evals/` | Test cases — lives at the repo root, a sibling of `agent/` |

Run `npx eve info` to print everything Eve actually discovered — the fastest way to
debug a file that isn't being picked up.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Next.js + the agent together, at `localhost:3000` |
| `npm run dev:eve` | Eve's terminal REPL — chat with the agent in your shell |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npx eve info` | Print the discovered agent surface |

`npm run dev:eve` is the tighter loop when you're iterating on tools and prompts —
no browser needed.

## Configuration

**Model** — set in `agent/agent.ts`. Defaults to `anthropic/claude-sonnet-5` routed
through the Vercel AI Gateway. Swap in any Gateway model string, or install a direct
AI SDK provider package and use that.

**Credentials** — set `AI_GATEWAY_API_KEY` in `.env.local`. If you `vercel link` the
project instead, `VERCEL_OIDC_TOKEN` is supplied for you and no key is needed.

**Auth** — `agent/channels/eve.ts` ships with `placeholderAuth()`, which **blocks
browser requests in production**. Before deploying, replace it with your real auth
provider (Auth.js, Clerk, [Vercel Connect](https://vercel.com/docs/connect)) or with
`none()` for a public demo.

## Docs

The full Eve docs are bundled with the installed package and match its version
exactly — read `node_modules/eve/docs/` (start with `README.md`). Online:
[eve.dev/docs](https://eve.dev/docs).

Built for [Ship Studio](https://github.com/ship-studio/ship-studio).
