import { readdirSync } from "node:fs";
import { join } from "node:path";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Server component: reads live env and the agent/channels/ directory so the
// checklist shows what's actually left to do, not a generic list of steps.
// Rendered from app/page.tsx, which is force-dynamic so this runs per request.
export function SetupChecklist() {
  const hasModelKey = Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim(),
  );
  const channels = findChannels();
  const doneCount = Number(hasModelKey) + Number(channels.length > 0);
  const allDone = doneCount === 2;

  return (
    <div className="w-full rounded-xl border border-border bg-card/60 p-5 text-left">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-medium text-sm">
          {allDone ? "Your agent is ready" : "Get your agent running"}
        </h2>
        <span className="text-muted-foreground text-xs tabular-nums">{doneCount} of 2 done</span>
      </div>

      <ol className="mt-4 flex flex-col gap-3.5">
        <Step done={hasModelKey} index={1} title="Connect a model">
          {hasModelKey ? (
            <>Model credential found. Your agent can think.</>
          ) : (
            <>
              Your agent can&apos;t respond without one. In Ship Studio, press <Keys>⌘K</Keys> or{" "}
              <Keys>Ctrl K</Keys>, search{" "}
              <b className="font-medium text-foreground">Environment Variables</b>, and add your{" "}
              <A href="https://vercel.com/dashboard/ai-gateway">AI Gateway</A> key as:
              <Cmd>AI_GATEWAY_API_KEY</Cmd>
            </>
          )}
        </Step>

        <Step done={channels.length > 0} index={2} title="Put it where you work">
          {channels.length > 0 ? (
            <>
              Reachable from{" "}
              <b className="font-medium text-foreground">{formatList(channels)}</b>. Add more the
              same way.
            </>
          ) : (
            <>
              Right now your agent only lives in this browser tab. Add a connector so it works in
              Slack, GitHub, Discord, Teams, or Linear — just ask your agent for one, or run:
              <Cmd>npx eve channels add slack</Cmd>
            </>
          )}
        </Step>
      </ol>

      {hasModelKey ? (
        <div className="mt-4 border-border/70 border-t pt-4">
          <p className="text-muted-foreground text-xs">
            Try a message that uses both built-in tools:
          </p>
          <Cmd>What&apos;s the weather in Lisbon, and what is Lisbon known for?</Cmd>
        </div>
      ) : null}

      <div className="mt-5 border-border/70 border-t pt-4">
        <p className="font-medium text-xs">Then make it yours</p>
        <ul className="mt-2.5 flex flex-col gap-2 text-muted-foreground text-xs">
          <Next file="agent/instructions.md">Tell it who it is and how to behave.</Next>
          <Next file="agent/tools/">
            Add a file here and it becomes a tool — the filename is the tool name.
          </Next>
          <Next file="agent/channels/eve.ts">
            Replace <code className="font-mono">placeholderAuth()</code> before you deploy. It
            blocks browser requests in production.
          </Next>
        </ul>
      </div>
    </div>
  );
}

// `eve.ts` is the default browser/HTTP channel and ships with the scaffold, so it
// doesn't count as "connected somewhere else". Best-effort: the agent source may not
// be traced into a deployed bundle, in which case we just show the step as pending.
function findChannels(): string[] {
  try {
    return readdirSync(join(process.cwd(), "agent", "channels"))
      .filter((file) => /\.(ts|tsx|js|mjs)$/.test(file))
      .map((file) => file.replace(/\.\w+$/, ""))
      .filter((name) => name !== "eve")
      .sort();
  } catch {
    return [];
  }
}

function formatList(items: string[]): string {
  const labels = items.map((item) => item.charAt(0).toUpperCase() + item.slice(1));
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

function Step({
  children,
  done,
  index,
  title,
}: {
  readonly children: React.ReactNode;
  readonly done: boolean;
  readonly index: number;
  readonly title: string;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums",
          done
            ? "border-transparent bg-foreground text-background"
            : "border-border text-muted-foreground",
        )}
      >
        {done ? <CheckIcon className="size-3" strokeWidth={3} /> : index}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm", done && "text-muted-foreground line-through")}>{title}</p>
        <div className="mt-1 text-muted-foreground text-xs leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

function Next({ children, file }: { readonly children: React.ReactNode; readonly file: string }) {
  return (
    <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <code className="shrink-0 font-mono text-foreground/80">{file}</code>
      <span>{children}</span>
    </li>
  );
}

function Cmd({ children }: { readonly children: React.ReactNode }) {
  return (
    <code className="mt-1.5 block overflow-x-auto rounded-md bg-muted px-2.5 py-1.5 font-mono text-[11px] text-foreground">
      {children}
    </code>
  );
}

function Keys({ children }: { readonly children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-medium font-sans text-[10px] text-foreground">
      {children}
    </kbd>
  );
}

function A({ children, href }: { readonly children: React.ReactNode; readonly href: string }) {
  return (
    <a
      className="text-foreground underline underline-offset-2 hover:no-underline"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}
