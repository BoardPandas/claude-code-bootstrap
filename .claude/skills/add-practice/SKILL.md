---
name: add-practice
description: Add a new best practice entry to the BP knowledge base
model: haiku
---

You are adding a new entry to the BP best practices knowledge base.

**Repository:** `wellforce-brandon/BP` on GitHub
**Raw URL base:** `https://raw.githubusercontent.com/wellforce-brandon/BP/main/`

All GitHub operations use the `gh` CLI via the Bash tool. There is no GitHub MCP server -- do not call `mcp__github__*` tools, they do not exist and will hang the skill.

## Step 1: Collect information

Ask the user for the following (you may ask all at once):
1. **Concern** -- which category does this belong in? (claude-config, testing, linting-formatting, error-handling, deployment, monorepo, versioning, safety, documentation, design-systems, environment, knowledge-bases, or a new concern name)
2. **Title** -- short descriptive title (becomes the H1 and the link text in llms.txt)
3. **Pattern** -- what the proven pattern looks like and how it works
4. **Why** -- why this is better than alternatives, what problems it prevents
5. **Example** -- code or config from the source repo (with file paths)
6. **Priority** -- foundational, recommended, or optional (see legend below)
7. **Tech tags** -- comma-separated list of technologies this applies to
8. **Source repo** -- which repo this pattern was extracted from
9. **Applies-to** -- what tech stacks should adopt this (may differ from tech tags)
10. **Check** -- how to verify if a repo already follows this (checklist items)
11. **Implement** -- steps to adopt this in a repo that doesn't have it
12. **Notes** (optional) -- edge cases, caveats, related practices

Priority legend:
- foundational = universal pattern every repo should follow
- recommended = strong pattern for repos with matching tech tags
- optional = nice-to-have improvement

## Step 2: Generate the slug

Convert the title to a slug: lowercase, spaces and punctuation replaced with hyphens, no leading/trailing hyphens.
Example: "Hierarchical CLAUDE.md Structure" -> `hierarchical-claude-md.md`

## Step 3: Fetch current state from GitHub

Confirm `gh` is available and authenticated (run once):
```
gh auth status
```
If `gh` is not installed or not authenticated, stop and tell the user to run `gh auth login` first.

Read the current master index and the relevant concern index so you know the entry count and can avoid duplicates:
```
gh api repos/wellforce-brandon/BP/contents/llms.txt --jq .content | base64 -d
gh api repos/wellforce-brandon/BP/contents/practices/<concern>/llms.txt --jq .content | base64 -d
```
If the concern command fails with a `404`, the concern folder does not exist yet -- you will create it in Step 5.

Capture each file's blob `sha` now -- you need it to update the file later:
```
gh api repos/wellforce-brandon/BP/contents/llms.txt --jq .sha
gh api repos/wellforce-brandon/BP/contents/practices/<concern>/llms.txt --jq .sha
```

## Step 4: Create the entry file via the GitHub API

1. Use the Write tool to save the entry markdown to a scratch file git will not track, e.g. `.git/bp-entry.md` (git never tracks files inside `.git/`).

   Content format:
   ```
   ---
   concern: <concern>
   tech: [tech1, tech2]
   priority: <foundational|recommended|optional>
   source-repo: <repo-name>
   applies-to: [tech1, tech2]
   ---
   # <Title>

   ## PATTERN
   <pattern description>

   ## WHY
   <why this is better>

   ## EXAMPLE
   <code or config examples with file paths>

   ## CHECK
   How to verify if a repo already follows this:
   - [ ] Check condition 1
   - [ ] Check condition 2

   ## IMPLEMENT
   Steps to adopt this in a repo that doesn't have it:
   1. Step one
   2. Step two

   ## NOTES
   <notes, or omit the section if none>
   ```

2. Create the file on `main`. The `content` field must be base64-encoded; `base64 -w0` encodes the scratch file with no line wrapping:
```
gh api repos/wellforce-brandon/BP/contents/practices/<concern>/<slug>.md \
  --method PUT \
  -f message="Add <concern> practice: <title>" \
  -f branch=main \
  -f content="$(base64 -w0 .git/bp-entry.md)"
```
This is a new file, so no `sha` is needed.

3. Delete the scratch file: `rm .git/bp-entry.md`

## Step 5: Update the concern llms.txt

Compute the new content of `practices/<concern>/llms.txt`:
- If the concern folder already exists: take the content from Step 3 and append a new bullet under `## Entries`:
  ```
  - [<Title>](<slug>.md): <one-line description>. <PRIORITY>.
  ```
- If the concern folder does not exist: create the content fresh:
  ```
  # <Concern> Best Practices

  > Proven <concern> patterns.

  ## Entries

  - [<Title>](<slug>.md): <one-line description>. <PRIORITY>.
  ```

Write the full new file content to `.git/bp-index.md` with the Write tool, then push it:
```
gh api repos/wellforce-brandon/BP/contents/practices/<concern>/llms.txt \
  --method PUT \
  -f message="Update <concern> index: add <slug>" \
  -f branch=main \
  -f content="$(base64 -w0 .git/bp-index.md)" \
  -f sha="<sha from Step 3>"
```
Omit the `-f sha=...` line only if the concern `llms.txt` did not exist (404 in Step 3).
Then delete the scratch file: `rm .git/bp-index.md`

## Step 6: Update master llms.txt entry count

Take the master `llms.txt` content from Step 3. Find the bullet for this concern and increment the entry count in parentheses: `(N entries)` -> `(N+1 entries)`.

If this is a new concern, add a new section under `## Concerns`:
```
### <Concern>
- [<Concern> index](practices/<concern>/llms.txt): <description> (1 entry)
```

Write the updated master content to `.git/bp-master.md`, then push it:
```
gh api repos/wellforce-brandon/BP/contents/llms.txt \
  --method PUT \
  -f message="Update master index: <concern> now has N+1 entries" \
  -f branch=main \
  -f content="$(base64 -w0 .git/bp-master.md)" \
  -f sha="<master sha from Step 3>"
```
Then delete the scratch file: `rm .git/bp-master.md`

## Step 7: Confirm

Output:
- The GitHub URL of the created entry file
- Confirmation that both index files were updated
- The entry's priority level
