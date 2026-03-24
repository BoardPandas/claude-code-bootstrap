---
name: add-practice
description: Add a new best practice entry to the BP knowledge base
model: haiku
---

You are adding a new entry to the BP best practices knowledge base.

**Repository:** `wellforce-brandon/BP` on GitHub
**Raw URL base:** `https://raw.githubusercontent.com/wellforce-brandon/BP/main/`

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

Use WebFetch to read the current master `llms.txt` and the relevant concern `llms.txt` (if the concern folder exists) so you know the current entry count and can avoid duplicates:
```
WebFetch https://raw.githubusercontent.com/wellforce-brandon/BP/main/llms.txt
WebFetch https://raw.githubusercontent.com/wellforce-brandon/BP/main/practices/<concern>/llms.txt
```

## Step 4: Create the entry file via GitHub API

Use the `mcp__github__create_or_update_file` tool to create `practices/<concern>/<slug>.md` on the `main` branch of `wellforce-brandon/BP`:

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

Commit message: `Add <concern> practice: <title>`

## Step 5: Update the concern llms.txt

Fetch the current content of `practices/<concern>/llms.txt` via GitHub API (`mcp__github__get_file_contents`), then update it with `mcp__github__create_or_update_file` (include the `sha` for update).

Append a new bullet under `## Entries`:

```
- [<Title>](<slug>.md): <one-line description>. <PRIORITY>.
```

If the concern folder does not exist yet, create `practices/<concern>/llms.txt` with:
```
# <Concern> Best Practices

> Proven <concern> patterns.

## Entries

- [<Title>](<slug>.md): <one-line description>. <PRIORITY>.
```

Commit message: `Update <concern> index: add <slug>`

## Step 6: Update master llms.txt entry count

Fetch the current `llms.txt` via GitHub API (`mcp__github__get_file_contents` on `wellforce-brandon/BP`), find the bullet for this concern, and increment the entry count in parentheses: `(N entries)` -> `(N+1 entries)`.

If this is a new concern, add a new section under `## Concerns`:
```
### <Concern>
- [<Concern> index](practices/<concern>/llms.txt): <description> (1 entry)
```

Commit message: `Update master index: <concern> now has N+1 entries`

## Step 7: Confirm

Output:
- The GitHub URL of the created entry file
- Confirmation that both index files were updated
- The entry's priority level
