/**
 * Ticket orchestrator for the port-completion work (#18 / tickets #19–#33).
 *
 * Works the frontier: open `ready-for-agent` issues whose "Blocked by" issues
 * are all closed. Spawns a fresh local Cursor agent per ticket (new context),
 * waits for it to finish, then picks the next unblocked ticket.
 *
 * Usage:
 *   bun run scripts/orchestrate-tickets.ts
 *   bun run scripts/orchestrate-tickets.ts --dry-run
 *   bun run scripts/orchestrate-tickets.ts --list-models
 *   bun run scripts/orchestrate-tickets.ts --once          # one ticket then exit
 *   bun run scripts/orchestrate-tickets.ts --issue 20      # force a specific issue
 *
 * Requires CURSOR_API_KEY in the environment or .env.local.
 * Requires `gh` authenticated against Ananth864/talsek-start-v2.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { Agent, Cursor, CursorAgentError } from "@cursor/sdk";

const REPO = "Ananth864/talsek-start-v2";
const PARENT_SPEC = 18;
const TICKET_RANGE = { min: 19, max: 33 };
const MODEL_ID = "grok-4.5";
const MODEL_PARAMS = [
  { id: "effort", value: "high" },
  { id: "fast", value: "true" },
] as const;
const LABEL = "ready-for-agent";
const CWD = resolve(import.meta.dirname, "..");
const MAX_INIT_RETRIES = 3;

type GhIssue = {
  number: number;
  title: string;
  body: string;
  state: string;
  labels: Array<{ name: string }>;
};

/** Point the SDK at a real rg binary so .gitignore scanning doesn't flake. */
function bootstrapRipgrep() {
  const existing = process.env.CURSOR_RIPGREP_PATH;
  if (existing && existsSync(existing)) return existing;

  const candidates = [
    "/opt/homebrew/bin/rg",
    "/usr/local/bin/rg",
    "/Applications/Cursor.app/Contents/Resources/app/node_modules/@vscode/ripgrep/bin/rg",
  ];
  const which = spawnSync("which", ["rg"], { encoding: "utf8" });
  if (which.status === 0) {
    const p = which.stdout.trim();
    if (p) candidates.unshift(p);
  }
  for (const c of candidates) {
    if (existsSync(c)) {
      process.env.CURSOR_RIPGREP_PATH = c;
      return c;
    }
  }
  return undefined;
}

function isTransientInitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /PREMATURE_CLOSE|premature close|ignore mapping|gitignore|ripgrep|EPIPE|ECONNRESET/i.test(
      msg,
    ) ||
    (err instanceof CursorAgentError && err.isRetryable)
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadEnvLocal() {
  const path = resolve(CWD, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv: string[]) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const issueIdx = argv.indexOf("--issue");
  return {
    dryRun: flags.has("--dry-run"),
    listModels: flags.has("--list-models"),
    once: flags.has("--once"),
    issue: issueIdx >= 0 ? Number(argv[issueIdx + 1]) : undefined,
  };
}

function ghJson<T>(args: string[]): T {
  const result = Bun.spawnSync(["gh", ...args], {
    cwd: CWD,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    throw new Error(
      `gh ${args.join(" ")} failed:\n${result.stderr.toString()}`,
    );
  }
  return JSON.parse(result.stdout.toString()) as T;
}

function parseBlockedBy(body: string): number[] {
  const match = body.match(/##\s*Blocked by\s*\n([\s\S]*?)(?=\n##\s|\n*$)/i);
  if (!match) return [];
  const section = match[1]!;
  if (/none/i.test(section)) return [];
  const nums = [...section.matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
  return [...new Set(nums)];
}

function listCandidateIssues(): GhIssue[] {
  const issues = ghJson<GhIssue[]>([
    "issue",
    "list",
    "--repo",
    REPO,
    "--state",
    "open",
    "--label",
    LABEL,
    "--limit",
    "100",
    "--json",
    "number,title,body,state,labels",
  ]);
  return issues.filter(
    (i) => i.number >= TICKET_RANGE.min && i.number <= TICKET_RANGE.max,
  );
}

function issueState(n: number): "OPEN" | "CLOSED" {
  const info = ghJson<{ state: string }>([
    "issue",
    "view",
    String(n),
    "--repo",
    REPO,
    "--json",
    "state",
  ]);
  return info.state.toUpperCase() === "CLOSED" ? "CLOSED" : "OPEN";
}

function frontier(issues: GhIssue[]): GhIssue[] {
  return issues.filter((issue) => {
    const blockers = parseBlockedBy(issue.body);
    return blockers.every((b) => issueState(b) === "CLOSED");
  });
}

function buildPrompt(issue: GhIssue): string {
  return `You are implementing one tracer-bullet ticket for the Talsek TanStack Start port.

Follow the \`/implement\` skill exactly:
1. Implement the work described by the ticket.
2. Use TDD where practical at the pre-agreed Playwright seam (\`e2e/\`) — you may still *write* or update specs for later, but **do not run Playwright** for now (suite paused).
3. Run typechecking regularly. At the end require green: \`bun run typecheck\`, \`bun run build\`, \`bun run lint\` only.
4. Once done, use \`/code-review\` to review the work (Standards + Spec against this ticket).
5. Commit your work to the current branch.

## Ticket
GitHub issue #${issue.number}: ${issue.title}
Repo: ${REPO}
Parent spec: #${PARENT_SPEC}

Issue body:
${issue.body}

## Mandatory process
1. Read \`AGENTS.md\`, \`CONTEXT.md\`, and any ADRs in \`docs/adr/\` that this ticket touches. Use glossary vocabulary.
2. Read the source app at \`../talsek\` only as the behavioural reference for *what* to build — do not copy framework idioms.
3. Implement the ticket end-to-end (UI + server functions). Prefer extending existing modules over inventing parallel ones.
4. Verify before committing — all must be green:
   - \`bun run typecheck\`
   - \`bun run build\`
   - \`bun run lint\`
   - **Do NOT run Playwright / \`bunx playwright test\`.** E2E is paused for this batch.
5. After implementation, run a \`/code-review\` of your diff against this issue (#${issue.number}): Standards (AGENTS.md, ADRs, CONTEXT.md vocabulary, smell baseline) and Spec (acceptance criteria in the issue). Fix clear Standards/Spec findings before committing.
6. Commit on the current branch with a concise message focused on *why*. Do NOT push. Do NOT amend unless a hook auto-modified files and the commit was yours and unpushed.
7. Close the GitHub issue with \`gh issue close ${issue.number} --repo ${REPO} --comment "…"\` summarizing what landed, that code-review was done, and any follow-ups. That closing comment is the handoff for the next ticket.
8. Do not start any other ticket. Stop when this one is done and closed.

## Constraints
- No database schema / RLS / Supabase project changes.
- Behavioural parity with the source app is mandatory; visual parity is design-system consistency only (amended in the port spec).
- Keep changes scoped to this ticket.
- Playwright suite is paused — do not run it; writing/updating specs is optional.
`;
}

async function listModels(apiKey: string) {
  const models = await Cursor.models.list({ apiKey });
  for (const m of models) {
    const variants =
      m.variants?.map((v) => v.displayName ?? JSON.stringify(v.params)).join(", ") ??
      "";
    const params =
      m.parameters?.map((p) => `${p.id}=[${p.values.map((v) => v.value).join("|")}]`).join(" ") ??
      "";
    console.log(
      `${m.id.padEnd(40)} ${m.displayName ?? ""}${variants ? `  variants: ${variants}` : ""}${params ? `  params: ${params}` : ""}`,
    );
  }
  const match = models.find(
    (m) =>
      m.id === MODEL_ID ||
      m.id.includes("grok-4.5") ||
      (m.displayName ?? "").toLowerCase().includes("grok 4.5"),
  );
  console.log("\nConfigured MODEL_ID:", MODEL_ID);
  console.log(
    "Configured params:",
    MODEL_PARAMS.map((p) => `${p.id}=${p.value}`).join(", "),
  );
  console.log("Closest catalog match:", match?.id ?? "(none)");
}

async function runTicketOnce(issue: GhIssue, apiKey: string) {
  console.log(`\n=== Starting #${issue.number}: ${issue.title} ===`);
  console.log(`cwd: ${CWD}`);
  console.log(`CURSOR_RIPGREP_PATH=${process.env.CURSOR_RIPGREP_PATH ?? "(unset)"}`);

  await using agent = await Agent.create({
    apiKey,
    model: { id: MODEL_ID, params: [...MODEL_PARAMS] },
    local: { cwd: CWD },
  });

  console.log(`agentId: ${agent.agentId}`);
  console.log(
    `model: ${MODEL_ID} (${MODEL_PARAMS.map((p) => `${p.id}=${p.value}`).join(", ")})`,
  );

  const run = await agent.send(buildPrompt(issue));
  console.log(`runId: ${run.id}`);

  for await (const event of run.stream()) {
    if (event.type === "assistant") {
      for (const block of event.message.content) {
        if (block.type === "text") process.stdout.write(block.text);
      }
    } else if (event.type === "status") {
      console.log(`\n[status] ${JSON.stringify(event)}`);
    }
  }

  const result = await run.wait();
  console.log(`\n=== Finished #${issue.number}: status=${result.status} ===`);
  if (result.status === "error") {
    throw new Error(`Agent run failed for #${issue.number} (run ${result.id})`);
  }

  const state = issueState(issue.number);
  if (state !== "CLOSED") {
    throw new Error(
      `Issue #${issue.number} is still ${state} after a successful agent run. Close it manually or re-run.`,
    );
  }
}

async function runTicket(issue: GhIssue, apiKey: string) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_INIT_RETRIES; attempt++) {
    try {
      await runTicketOnce(issue, apiKey);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_INIT_RETRIES && isTransientInitError(err)) {
        const delay = attempt * 2000;
        console.error(
          `\nTransient agent init/run error (attempt ${attempt}/${MAX_INIT_RETRIES}): ${
            err instanceof Error ? err.message : err
          }`,
        );
        console.error(`Retrying in ${delay}ms…`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

async function main() {
  loadEnvLocal();
  const rg = bootstrapRipgrep();
  if (rg) console.log(`Using ripgrep at ${rg}`);
  else console.warn("Warning: no ripgrep found — agent init may flake on .gitignore");

  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.CURSOR_API_KEY;

  if (args.listModels) {
    if (!apiKey) {
      console.error("CURSOR_API_KEY required for --list-models");
      process.exit(1);
    }
    await listModels(apiKey);
    return;
  }

  let issues = listCandidateIssues();
  if (args.issue) {
    const forced = issues.find((i) => i.number === args.issue);
    if (!forced) {
      const one = ghJson<GhIssue>([
        "issue",
        "view",
        String(args.issue),
        "--repo",
        REPO,
        "--json",
        "number,title,body,state,labels",
      ]);
      issues = [one];
    } else {
      issues = [forced];
    }
  }

  console.log(
    `Open ${LABEL} tickets in #${TICKET_RANGE.min}–#${TICKET_RANGE.max}: ${issues.length}`,
  );
  for (const i of issues) {
    const blockers = parseBlockedBy(i.body);
    console.log(
      `  #${i.number} ${i.title}  blockers=[${blockers.map((b) => `#${b}`).join(",") || "none"}]`,
    );
  }

  if (args.dryRun) {
    const ready = args.issue ? issues : frontier(issues);
    ready.sort((a, b) => a.number - b.number);
    console.log(
      "\nFrontier (would run, model=" +
        MODEL_ID +
        " " +
        MODEL_PARAMS.map((p) => `${p.id}=${p.value}`).join(" ") +
        "):",
    );
    for (const i of ready) console.log(`  #${i.number} ${i.title}`);
    if (ready[0]) console.log(`\nNext up: #${ready[0].number}`);
    return;
  }

  if (!apiKey) {
    console.error(
      "CURSOR_API_KEY missing. Add it to .env.local or export it, then re-run.\n" +
        "Mint a key at https://cursor.com/dashboard/integrations",
    );
    process.exit(1);
  }

  let completed = 0;
  while (true) {
    const open = args.issue ? issues : listCandidateIssues();
    if (open.length === 0) {
      console.log("\nNo open tickets left in range. Done.");
      break;
    }
    const ready = args.issue ? open : frontier(open);
    if (ready.length === 0) {
      console.log(
        "\nFrontier empty but open tickets remain — blockers not yet closed. Stopping.",
      );
      for (const i of open) {
        console.log(
          `  blocked: #${i.number} needs [${parseBlockedBy(i.body)
            .map((b) => `#${b}`)
            .join(", ")}]`,
        );
      }
      process.exit(2);
    }

    ready.sort((a, b) => a.number - b.number);
    const next = ready[0]!;

    try {
      await runTicket(next, apiKey);
      completed += 1;
    } catch (err) {
      if (err instanceof CursorAgentError) {
        console.error(
          `Startup failure (retryable=${err.isRetryable}): ${err.message}`,
        );
        process.exit(1);
      }
      console.error(err);
      process.exit(2);
    }

    if (args.once || args.issue) break;
  }

  console.log(`\nCompleted ${completed} ticket(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
