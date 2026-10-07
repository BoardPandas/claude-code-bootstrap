#!/usr/bin/env node

//
// require-release-authorization.test.mjs -- assert the release gate still fires
// on real deploys, and no longer fires on everything else.
//
// This gate blocks (exit 2), so both directions are dangerous and both are
// silent. Too loose and an unauthorised release ships; too tight and it refuses
// `railway postgres pitr backup list`, at which point somebody deletes the hook.
// The second failure is the one that actually happened: `*railway*up*` matched
// the letters "up" inside "backup", "update", "upgrade" and "upload".
//
// Method: feed the script a PreToolUse payload on stdin and assert the exit
// code. 2 = blocked, 0 = allowed. Every case here is a command someone plausibly
// runs in this repo.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const GATE = join(REPO, ".claude", "scripts", "require-release-authorization.sh");

function runGate(command) {
  const result = spawnSync("bash", [GATE], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }),
    encoding: "utf8",
    cwd: REPO,
  });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

// Commands that really do ship something. A miss here is an unauthorised release.
const BLOCKED = [
  "railway up",
  "railway up --service web",
  "railway redeploy --service worker --yes",
  "doppler run --project myapp --config prd -- railway up",
  "pnpm dlx railway up",
  "wrangler deploy",
  "npx wrangler pages deploy ./dist",
  "wrangler publish",
  "fly deploy",
  "flyctl deploy --app myapp",
  "vercel --prod",
  "vercel deploy --prod",
  "vercel --yes --prod",
  "terraform apply",
  "terraform -chdir=infra apply",
  "kubectl apply -f k8s/prod/web.yaml",
  "helm upgrade myapp ./chart --namespace prod",
  "npm run deploy:prod",
  "pnpm deploy:prod",
];

// Commands that read, inspect or merely mention. A block here is what makes
// people switch the gate off.
const ALLOWED = [
  // The four confirmed false positives, and the same shape in three more verbs.
  "railway postgres pitr backup list --project myapp",
  "railway api --file q.graphql | grep -i backup",
  "railway variable update FOO=bar",
  "railway upgrade --yes",
  "railway volume files upload ./dump.sql /backups/dump.sql",
  // The subcommand has to sit in the tool's own command, not after a pipe.
  "railway logs | grep up",
  "railway status && npm run build",
  "railway service list",
  // Siblings that were unanchored in exactly the same way.
  "helm repo update",
  "helm upgrade myapp ./chart --namespace staging",
  "kubectl get pods -n prod",
  "terraform plan -out=apply.tfplan",
  "vercel env pull",
  "npm run build",
  "fly status --app myapp",
  // Prose and quoted text are not commands.
  'echo "run terraform apply against prod when ready" >> notes.md',
  "cat > docs/runbook.md <<'MD'\nrailway backup restore notes\nMD",
  "git commit -m 'fix: railway backup docs'",
];

test("blocks production deploys with no authorisation", () => {
  for (const command of BLOCKED) {
    const { status, stderr } = runGate(command);
    assert.equal(status, 2, `expected BLOCKED: ${command}`);
    assert.match(stderr, /BLOCKED/, `refusal must reach stderr: ${command}`);
  }
});

test("allows read-only and unrelated commands", () => {
  for (const command of ALLOWED) {
    const { status, stderr } = runGate(command);
    assert.equal(status, 0, `expected ALLOWED: ${command}\n${stderr}`);
  }
});

test("--dry-run is exempt", () => {
  for (const command of [
    "railway up --dry-run",
    "terraform apply --dry-run",
    "railway up --help",
  ]) {
    assert.equal(runGate(command).status, 0, `expected exempt: ${command}`);
  }
});

test("a named authorisation on the command itself lets the deploy through", () => {
  const { status, stdout } = runGate("RELEASE_AUTHORIZED_BY=chaz@wellforceit.com railway up");
  assert.equal(status, 0);
  // As additionalContext JSON: plain PreToolUse stdout goes to the debug log, so
  // the record of who authorised the release would reach no one.
  const out = JSON.parse(stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, "PreToolUse");
  assert.match(out.additionalContext, /Release authorised by: chaz@wellforceit\.com/);
});

test("authorisation set in a previous shell command does not carry", () => {
  // The harness spawns the hook as its own process, so an `export` in an earlier
  // Bash call is not in scope. Only the prefix on the judged command counts.
  // (LL-G kb/claude-code/hook-env-assignment-not-inherited.md)
  const previous = process.env.RELEASE_AUTHORIZED_BY;
  process.env.RELEASE_AUTHORIZED_BY = "chaz";
  try {
    assert.equal(runGate("railway up").status, 2);
  } finally {
    if (previous === undefined) delete process.env.RELEASE_AUTHORIZED_BY;
    else process.env.RELEASE_AUTHORIZED_BY = previous;
  }
});
