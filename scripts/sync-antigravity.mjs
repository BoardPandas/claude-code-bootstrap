// sync-antigravity.mjs -- generate Google Antigravity's (.agents/) view of .claude/.
//
// Imported by scripts/sync-codex.mjs so one `npm run sync:codex` pass keeps AGENTS.md,
// .agents/{skills,agents,rules,hooks.json,README.md}, and .codex/ in lockstep.
//
// Antigravity surfaces verified against `agy 1.5.5` (`agy plugin validate --strict`,
// `agy agents`) and LL-G `kb/antigravity-cli/`:
//   -AGENTS.md and SKILL.md files cap at 24,000 bytes before truncation / loader warnings.
//   -.agents/agents/<name>.md uses YAML frontmatter (name, description, subagent,
//    mainAgent, model, commandExecutionPolicy, tools).
//   -.agents/rules/<name>.md requires `trigger: always_on | glob | model_decision | manual`.
//    Always-on rules are already inlined into root AGENTS.md, so only path-scoped rules
//    are emitted here (with `trigger: glob`) to avoid loading them twice.
//   -.agents/hooks.json groups hooks under a named top-level key (`enabled: true`), uses
//    flat handler arrays on SessionStart/PreInvocation and `{ matcher, hooks }` blocks on
//    PreToolUse/PostToolUse, runs commands with `.agents/` as cwd, and requires exit 0 +
//    JSON stdout (bridged by `.claude/scripts/_antigravity-hook.sh`).

export const AGY_DOC_CEILING = 24_000;
export const AGY_SKILL_CEILING = 24_000;

export const AGY_MODEL_MAP = { opus: "pro", sonnet: "pro", haiku: "flash" };

const AGY_EVENTS = new Set(["SessionStart", "PreToolUse", "PostToolUse"]);
const AGY_TOOL_EVENTS = new Set(["PreToolUse", "PostToolUse"]);

// Claude tool name -> Antigravity tool names (array for agent `tools:`, joined with `|`
// for hook matchers). `null` = no Antigravity equivalent. An unlisted tool fails sync.
export const AGY_TOOL_MAP = {
  Bash: ["run_command", "manage_task"],
  Edit: ["replace_file_content"],
  Write: ["write_to_file"],
  MultiEdit: ["multi_replace_file_content"],
  Agent: ["invoke_subagent"],
  Task: ["invoke_subagent"],
  Read: ["view_file"],
  Glob: ["find_by_name", "list_dir"],
  Grep: ["grep_search"],
  WebFetch: ["read_url_content"],
  WebSearch: ["search_web"],
  AskUserQuestion: ["ask_question"],
  EnterPlanMode: null,
  ExitPlanMode: null,
  NotebookEdit: null,
  TodoWrite: null,
};

// Hook matchers only target the primary tool call names Antigravity dispatches.
const AGY_HOOK_MATCHER_MAP = {
  Bash: ["run_command"],
  Edit: ["replace_file_content", "multi_replace_file_content"],
  Write: ["write_to_file"],
  MultiEdit: ["multi_replace_file_content"],
  Agent: ["invoke_subagent"],
  Task: ["invoke_subagent"],
  Read: ["view_file"],
  Glob: ["find_by_name", "list_dir"],
  Grep: ["grep_search"],
  WebFetch: ["read_url_content"],
  WebSearch: ["search_web"],
  AskUserQuestion: ["ask_question"],
  EnterPlanMode: null,
  ExitPlanMode: null,
  NotebookEdit: null,
  TodoWrite: null,
};

const SHELL_TOOL_RE = /^Bash(\(|$)|^\*$/;
const code = (s) => `\`${s}\``;

export function mapAntigravityAgentTools(claudeTools, file, generator, failures) {
  if (claudeTools === null || claudeTools.includes("*")) return null;
  const out = [];
  for (const raw of claudeTools) {
    const bare = raw.replace(/\(.*$/, "").trim();
    if (/^mcp__/.test(bare)) continue;
    if (!Object.hasOwn(AGY_TOOL_MAP, bare)) {
      failures.push(`${file}: tool "${bare}" has no Antigravity mapping. Add it to AGY_TOOL_MAP in ${generator}.`);
      continue;
    }
    for (const mapped of AGY_TOOL_MAP[bare] ?? []) {
      if (!out.includes(mapped)) out.push(mapped);
    }
  }
  if (!out.includes("send_message")) out.push("send_message");
  return out;
}

export function generateAntigravityAgents({ agentSources, emit, failures, generator, syncCmd }) {
  for (const src of agentSources) {
    const { file, fileName, data, body, tools } = src;
    const agyTools = mapAntigravityAgentTools(tools, file, generator, failures);
    const canRunShell =
      data.permissionMode !== "plan" && (tools === null || tools.some((t) => SHELL_TOOL_RE.test(t)));

    const fm = [
      "---",
      `name: ${data.name}`,
      `description: ${JSON.stringify(data.description)}`,
      "subagent: true",
      "mainAgent: true",
    ];
    if (AGY_MODEL_MAP[data.model]) fm.push(`model: ${AGY_MODEL_MAP[data.model]}`);
    fm.push(`commandExecutionPolicy: ${canRunShell ? "sandbox" : '"off"'}`);
    if (agyTools) {
      fm.push("tools:");
      for (const t of agyTools) fm.push(`  - ${t}`);
    }
    fm.push("---");

    const notes = [
      "Antigravity notes (generated):",
      `- You are the Antigravity port of ${code(file)}; ${code("AGENTS.md")} and ${code(".agents/rules/")} apply.`,
      `- Tool names above are Claude Code's. Map them as described in ${code("AGENTS.md")} under "Codex & Antigravity runtimes".`,
    ];
    if (tools?.length) {
      notes.push(`- Claude Code limits you to: ${tools.join(", ")}. Stay within that scope (including any command-prefix limits).`);
    }
    if (data.memory === "project") {
      notes.push(
        `- Read ${code(`.claude/agent-memory/${fileName}/MEMORY.md`)} (if it exists) and the shared files in ${code(".claude/agent-memory/")} before starting.`,
      );
    }
    if (data.isolation === "worktree") {
      notes.push(
        `- Claude Code gives you an isolated git worktree. When spawned via ${code("invoke_subagent")}, use ${code('Workspace: "branch"')} when isolated checkout is needed; otherwise edit only the files you were assigned.`,
      );
    }

    const header = `<!-- GENERATED by ${generator} from ${file}. Do not edit; run ${syncCmd}. -->`;
    emit(`.agents/agents/${fileName}.md`, `${fm.join("\n")}\n\n${header}\n\n${body.trim()}\n\n${notes.join("\n")}\n`);
  }
}

export function generateAntigravityRules({ rules, emit, generator, syncCmd }) {
  // Only path-scoped rules are emitted here. Rules without `paths:` are already inlined
  // into root AGENTS.md, which Antigravity loads automatically in every session.
  let count = 0;
  for (const r of rules) {
    if (r.paths.length === 0) continue;
    const fileName = r.path.split("/").pop();
    const fm = [
      "---",
      "trigger: glob",
      `description: ${JSON.stringify(r.description || fileName.replace(/\.md$/, ""))}`,
      `globs: ${JSON.stringify(r.paths.join(", "))}`,
      "---",
    ];
    const header = `<!-- GENERATED by ${generator} from ${r.path}. Do not edit; run ${syncCmd}. -->`;
    emit(`.agents/rules/${fileName}`, `${fm.join("\n")}\n\n${header}\n\n${r.body.trim()}\n`);
    count++;
  }
  return count;
}

export function generateAntigravityHooks({ settings, bellRe, gitRoot, scriptOf, emit, failures, generator }) {
  const group = { enabled: true };
  const agyNotCarried = [];
  let mirrored = 0;
  let needsPreInvocationQueue = false;
  let sawBell = false;

  const adapterCmd = (event, script) =>
    `bash "${gitRoot}"/.claude/scripts/_antigravity-hook.sh ${event}${script ? ` ${script}` : ""}`;

  for (const [event, blocks] of Object.entries(settings.hooks ?? {})) {
    for (const block of blocks) {
      for (const handler of block.hooks ?? []) {
        const label = `${event}${block.matcher ? ` [${block.matcher}]` : ""}: ${handler.command ?? handler.type}`;
        if ((event === "Stop" || event === "Notification") && bellRe.test((handler.command ?? "").trim())) {
          sawBell = true;
          continue;
        }
        if (!AGY_EVENTS.has(event)) {
          agyNotCarried.push(`${label} -- Antigravity has no ${event} hook event.`);
          continue;
        }
        if (handler.type !== "command") {
          agyNotCarried.push(`${label} -- Antigravity runs only command hooks (type "${handler.type}").`);
          continue;
        }

        let matcher = block.matcher;
        if (AGY_TOOL_EVENTS.has(event) && matcher && matcher !== "*") {
          const tokens = matcher.split("|");
          const mapped = [];
          for (const t of tokens) {
            if (/^mcp__[\w.*-]+$/.test(t)) mapped.push(t);
            else if (!Object.hasOwn(AGY_HOOK_MATCHER_MAP, t)) {
              failures.push(
                `.claude/settings.json: ${event} matcher token "${t}" has no Antigravity mapping. Add it to AGY_HOOK_MATCHER_MAP in scripts/sync-antigravity.mjs.`,
              );
            } else if (AGY_HOOK_MATCHER_MAP[t]) {
              mapped.push(...AGY_HOOK_MATCHER_MAP[t]);
            }
          }
          if (mapped.length === 0) {
            agyNotCarried.push(`${label} -- Antigravity has no hookable ${tokens.join("/")} tool.`);
            continue;
          }
          matcher = [...new Set(mapped)].join("|");
        }

        const script = scriptOf(handler.command ?? "");
        if (!script) {
          agyNotCarried.push(`${label} -- inline command without a .claude/ script path is not wrapped for Antigravity.`);
          continue;
        }

        const timeout = typeof handler.timeout === "number" ? handler.timeout : 30;
        const entry = { type: "command", command: adapterCmd(event, script), timeout };

        if (AGY_TOOL_EVENTS.has(event)) {
          needsPreInvocationQueue = true;
          const key = matcher ?? "*";
          const list = (group[event] ??= []);
          let target = list.find((g) => g.matcher === key);
          if (!target) {
            target = { matcher: key, hooks: [] };
            list.push(target);
          }
          target.hooks.push(entry);
        } else {
          (group[event] ??= []).push(entry);
        }
        mirrored++;
      }
    }
  }

  if (needsPreInvocationQueue) {
    // Flush queued advisory messages from PreToolUse / PostToolUse onto the next model step.
    group.PreInvocation = [{ type: "command", command: adapterCmd("PreInvocation", ""), timeout: 10 }];
  }
  if (sawBell) {
    agyNotCarried.push("Stop/Notification terminal bell -- Antigravity hooks require JSON on stdout.");
  }

  // Keep deterministic key order: enabled, SessionStart, PreInvocation, PreToolUse, PostToolUse.
  const ordered = { enabled: true };
  for (const k of ["SessionStart", "PreInvocation", "PreToolUse", "PostToolUse"]) {
    if (group[k]) ordered[k] = group[k];
  }

  emit(".agents/hooks.json", `${JSON.stringify({ "claude-code-bootstrap": ordered }, null, 2)}\n`);
  return { mirrored, agyNotCarried };
}

export function generateAntigravityReadme({ summary, agyNotCarried, emit, generator, syncCmd }) {
  const lines = [
    "# Antigravity configuration (generated)",
    "",
    `Everything under ${code(".agents/")} and the root ${code("AGENTS.md")} is generated from ${code("CLAUDE.md")} and ${code(".claude/")}`,
    `by ${code(generator)}. Edit the Claude source, never these files, then run:`,
    "",
    "```bash",
    syncCmd,
    "npm run check:claude   # fails if any generated file is stale, missing, or unexpected",
    "```",
    "",
    "| Claude Code source | Antigravity output |",
    "|---|---|",
    `| ${code("CLAUDE.md")}, always-on rules, deny list | ${code("AGENTS.md")} (capped at ${AGY_DOC_CEILING} B) |`,
    `| ${code(".claude/skills/<name>/**")} | ${code(".agents/skills/<name>/**")} (${code("SKILL.md")} capped at ${AGY_SKILL_CEILING} B) |`,
    `| ${code(".claude/agents/<name>.md")} | ${code(".agents/agents/<name>.md")} |`,
    `| ${code(".claude/rules/*.md")} (with ${code("paths:")}) | ${code(".agents/rules/*.md")} (${code("trigger: glob")}) |`,
    `| ${code(".claude/settings.json")} hooks | ${code(".agents/hooks.json")} via ${code(".claude/scripts/_antigravity-hook.sh")} |`,
    "",
    `Current output: ${summary.skills} skills, ${summary.agents} agents, ${summary.rules} glob rules, ${summary.agyHooks} hook handlers, AGENTS.md ${summary.agentsMdBytes} B.`,
    "",
    "## How the Antigravity bridge works",
    "",
    `- **Models.** Claude tiers map to Antigravity tiers: ${Object.entries(AGY_MODEL_MAP).map(([k, v]) => `${code(k)} -> ${code(v)}`).join(", ")}.`,
    `- **Command sandbox.** Agents without ${code("Bash")} get ${code('commandExecutionPolicy: "off"')}; agents with ${code("Bash")} get ${code("commandExecutionPolicy: sandbox")}.`,
    `- **Hooks adapter (${code("_antigravity-hook.sh")}).** Antigravity runs hooks with ${code(".agents/")} as cwd, sends camelCase JSON (${code("toolCall.args.CommandLine")}, ${code("TargetFile")}, ${code("Cwd")}), and treats non-zero exits as fail-open errors. The adapter anchors at the git root, converts ${code("exit 2")} + stderr into ${code('{"decision":"deny","reason":"..."}')} (exit 0), emits ${code("SessionStart")} text as ${code("systemMessage")}, and queues ${code("PreToolUse")}/${code("PostToolUse")} ${code("additionalContext")} per ${code("conversationId")} so ${code("PreInvocation")} injects it as ${code("ephemeralMessage")} on the next step.`,
  ];
  if (agyNotCarried.length) {
    lines.push("", "## Not carried over to Antigravity", "");
    for (const n of agyNotCarried) lines.push(`- ${n}`);
  }
  emit(".agents/README.md", `${lines.join("\n")}\n`);
}
