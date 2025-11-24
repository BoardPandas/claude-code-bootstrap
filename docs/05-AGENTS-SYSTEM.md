# Agents System - Specialized AI Workers

How to create and use specialized agents for complex tasks like planning, error fixing, and code review.

## What Are Agents?

Agents are specialized AI personas with specific roles and expertise. Unlike skills (passive guidelines), agents are active workers that:
- Execute complex multi-step tasks
- Have specific processes and workflows
- Produce structured outputs
- Can be invoked for specialized work

Think of them as "hiring experts" for specific jobs.

## Skills vs Agents

| Skills | Agents |
|--------|--------|
| Passive guidelines | Active execution |
| Always considered | Invoked when needed |
| Influence behavior | Complete tasks |
| Example: "Follow MVP principles" | Example: "Create implementation plan" |

## Core Agents Library

These 4 universal agents work with any stack or framework. They help with planning, error resolution, code review, and avoiding over-engineering.

### 1. strategic-plan-architect

**Role**: Creates detailed yet pragmatic implementation plans

**When to Use**:
- Starting complex features (3+ steps)
- Before major refactoring
- When approach is unclear
- Planning multi-phase work

**Process**:
1. Analyzes requirements and context
2. Breaks into simple, MVP-aligned phases
3. Identifies risks and dependencies
4. Creates rollback strategies
5. Provides realistic estimates

**Output Format**:
```markdown
# [Feature] Implementation Plan

## Overview
- Objective: [Clear goal]
- Approach: [High-level strategy]
- Estimated Effort: [Time estimate]

## Phase 1: [Name]
### Steps
1. [Specific action]
2. [Specific action]

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Risks
- Risk: [Description] | Mitigation: [Strategy]

## Phase 2: [Name]
[Repeat structure]

## Rollback Strategy
If issues arise: [Steps to revert]

## MVP Checklist
- [ ] Can be done in one file?
- [ ] Hardcoded values first?
- [ ] Simplest approach chosen?
```

**Example Invocation**:
```
"Use the strategic-plan-architect agent to plan the new user registration system"
```

### 2. build-error-resolver

**Role**: Systematically fixes TypeScript and build errors

**When to Use**:
- Multiple build errors
- Type errors across files
- After major changes
- Before committing

**Process**:
1. Runs build to collect all errors
2. Categorizes by type and severity
3. Prioritizes critical errors first
4. Applies MVP-aligned fixes
5. Verifies fixes don't break functionality
6. Re-runs build to confirm

**Output Format**:
```markdown
# Build Error Resolution

## Summary
- Total Errors: 23
- Critical: 5
- Warnings: 18

## Resolution Plan

### Priority 1: Critical Type Errors (5)
1. [File:Line] - [Error] → [Fix approach]
2. [File:Line] - [Error] → [Fix approach]

### Priority 2: Warnings (18)
[List with fixes]

## Fixes Applied
- ✅ Fixed [error type] in [file]
- ✅ Added types to [function]
- ⚠️ Used `any` for [complex type] (MVP shortcut)

## Build Status
✅ All errors resolved
✅ Build passes
```

**Example Invocation**:
```
"Use the build-error-resolver agent to fix all TypeScript errors"
```

### 3. code-architecture-reviewer

**Role**: Reviews code for production principles compliance and quality

**When to Use**:
- After implementing features
- Before major releases
- During code review
- Periodic quality checks

**Process**:
1. Scans codebase for patterns
2. Checks against production principles (YAGNI, Rule of Three, etc.)
3. Identifies over-engineering
4. Finds premature abstractions and banned patterns
5. Verifies TDD adherence
6. Suggests simplifications

**Output Format**:
```markdown
# Code Architecture Review

## Executive Summary
Overall assessment and key findings

## Findings

### 🚨 Critical Issues
1. **Over-engineered [Component]**
   - Location: [file:line]
   - Issue: Using factory pattern
   - Fix: Replace with simple function
   - Impact: High (complexity)

### ⚠️ Warnings
1. **Missing Tests**
   - Location: [file]
   - Issue: No tests for [feature]
   - Fix: Add tests following TDD workflow

### ✅ Good Practices
1. **Simple API handlers**
   - Location: routes-simple.ts
   - Direct SQL, inline validation

## Recommendations

### Immediate
- [ ] Remove service layer in [file]
- [ ] Add tests for [feature]

### Future
- [ ] Consider consolidating [files]

## Production Principles Compliance Score: 85/100
```

**Example Invocation**:
```
"Use the code-architecture-reviewer agent to review the ticket system"
```

### 4. production-principles-enforcer

**Role**: Prevents over-engineering before it starts, enforces production-ready simplicity

**When to Use**:
- Planning new features
- Reviewing designs
- Before starting implementation
- When someone suggests "flexible architecture"
- When detecting premature abstraction

**Process**:
1. Reviews proposed approach
2. Questions every abstraction
3. Challenges complexity
4. Applies Rule of Three (3 duplicates before extracting)
5. Suggests simpler, production-ready alternatives
6. Checks for YAGNI violations

**Output Format**:
```markdown
# Production Principles Review

## Proposed Approach
[Summary of what was proposed]

## Reality Check

### 🚨 Over-Engineering Detected

**Issue**: Creating [complex pattern]
**Why**: "For future flexibility"

**Production Reality**:
- You need this working TODAY
- Future requirements are unknown
- This adds days to ship time
- Hypothetical future may never come
- More code = more bugs

**Simpler Alternative**:
[Simple approach that works today]

**Estimated Savings**:
- Time: 2 days → 2 hours
- Complexity: High → Low
- Maintainability: Better (less code)
- Bugs: Fewer (simpler code)

## Recommended Approach

### Phase 1: Simple + Reliable (Ship Now)
[Simplest production-ready solution]

### Phase 2: IF Needed (When patterns emerge)
[Improvements to make AFTER 3rd duplicate]

## Decision Framework Applied
1. ✅ Will this work for production? Yes
2. ✅ Is this the simplest reliable approach? Yes
3. ✅ Can another dev maintain this? Yes
4. ✅ Does abstraction meet criteria? No → Skip it

## Recommendation: APPROVE SIMPLE VERSION
```

**Example Invocation**:
```
"Use the production-principles-enforcer agent to review this architecture design"
```

## Creating Custom Agents

### Agent Structure

File: `.claude/agents/your-agent-name.md`

```markdown
# Your Agent Name

You are a [specialist role with specific expertise]. Your mission is to [clear objective].

## Your Capabilities

What you can do:
- Capability 1
- Capability 2
- Capability 3

## Your Process

Your systematic approach:

### Step 1: [Action]
What you do and why

### Step 2: [Action]
Next step in process

### Step 3: [Action]
Final step

## Guidelines

### Always Do
- Guideline 1
- Guideline 2
- Guideline 3

### Never Do
- Anti-pattern 1
- Anti-pattern 2
- Anti-pattern 3

## Output Format

The structure of your deliverable:

\`\`\`markdown
# [Title]

## Section 1
[What goes here]

## Section 2
[What goes here]
\`\`\`

## Decision Framework

How you make choices:
1. Question 1 to ask
2. Question 2 to ask
3. Question 3 to ask

## Examples

### Example Input
[What you receive]

### Example Output
[What you produce]

## Context You Need

To work effectively, you need:
- Context item 1
- Context item 2

## Success Criteria

You've done your job when:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### Example: Error Pattern Detector Agent

```markdown
# Error Pattern Detector

You are a code quality specialist focused on finding common error patterns. Your mission is to scan code and identify missing error handling, validation gaps, and potential runtime issues.

## Your Capabilities

- Detect missing try-catch blocks
- Find unvalidated inputs
- Identify missing null checks
- Spot potential race conditions
- Find resource leaks (unclosed connections)

## Your Process

### Step 1: Scan Files
Read through provided files looking for patterns

### Step 2: Categorize Issues
Group findings by severity (critical, warning, info)

### Step 3: Suggest Fixes
Provide specific code fixes for each issue

## Guidelines

### Always Do
- Report file and line number
- Explain why it's a problem
- Provide specific fix
- Prioritize by risk

### Never Do
- Report style issues (that's for linters)
- Suggest complex solutions
- Create false positives
- Miss critical issues

## Output Format

\`\`\`markdown
# Error Pattern Analysis

## Critical Issues (will cause crashes)
1. **Missing error handling in [file:line]**
   - Pattern: Database query without try-catch
   - Risk: App crashes on DB error
   - Fix: Wrap in try-catch, return 500

## Warnings (could cause issues)
1. **Unvalidated input in [file:line]**
   - Pattern: No email validation
   - Risk: Bad data in database
   - Fix: Add email regex check

## Info (best practice)
[Lower priority items]
\`\`\`

## Success Criteria

- [ ] All files scanned
- [ ] Issues categorized by severity
- [ ] Specific fixes provided
- [ ] No false positives
```

## Agent Invocation

### Direct Invocation

```
"Use the [agent-name] agent to [task]"
```

Example:
```
"Use the strategic-plan-architect agent to plan the payment integration"
```

### Via Slash Commands

Create a command that invokes the agent:

File: `.claude/commands/plan.md`

```markdown
# Plan Command

Invoke the strategic-plan-architect agent to create an implementation plan.

## Instructions

Use the strategic-plan-architect agent to:
1. Analyze the feature requirements
2. Create a phased implementation plan
3. Identify risks and dependencies
4. Provide MVP-aligned approach

Output the plan to dev-docs/ directory.
```

Usage: `/plan`

### Automatic Invocation

Configure in `CLAUDE.md`:

```markdown
## When to Use Agents

Claude should proactively suggest agents:

- **Before complex features (3+ steps)**: "Should I use strategic-plan-architect to plan this?"
- **On build errors**: "I can use build-error-resolver to fix these systematically"
- **On over-engineering detected**: "Let me invoke production-principles-enforcer to review this approach"
```

## Agent Best Practices

### Do

- Give agents clear, specific missions
- Define structured output formats
- Include decision frameworks
- Provide examples
- Make process explicit

### Don't

- Create too many agents (4-6 is plenty)
- Make agents too generic
- Overlap with skills (use skills for guidelines)
- Forget to document when to use them

## Agent Workflows

### Workflow 1: Feature Development

```
1. User: "Add user profile editing"
2. Claude: "Should I use strategic-plan-architect to plan this?"
3. User: "Yes"
4. Agent creates plan
5. User approves
6. Claude implements following plan
7. Claude: "Should I use build-error-resolver for errors?"
8. User: "Yes"
9. Agent fixes errors
10. User: "Run code review"
11. code-architecture-reviewer agent reviews
12. Ship!
```

### Workflow 2: Preventing Over-Engineering

```
1. User: "Let's create a plugin system for extensibility"
2. Claude: "Let me invoke production-principles-enforcer to review this"
3. production-principles-enforcer: "This is premature abstraction..."
4. Claude: "Based on enforcer feedback, simpler approach is..."
5. User: "Good point, let's do the simple version"
```

### Workflow 3: Systematic Error Fixing

```
1. Build fails with 23 errors
2. Claude: "I'll use build-error-resolver to fix these systematically"
3. Agent analyzes, prioritizes, fixes
4. Build passes
5. Continue development
```

## Integration with Dev Docs

Agents can create dev-docs:

```markdown
# Strategic Plan Architect

## Your Process

### Step 3: Document Plan

Create three files in .claude/dev-docs/:

1. **[task]-plan.md**: Implementation plan
2. **[task]-context.md**: Architectural decisions
3. **[task]-tasks.md**: Checklist for tracking

This ensures plans persist across context windows.
```

## Measuring Success

You'll know agents are working when:
- Complex features are planned before coding
- Build errors fixed systematically
- Over-engineering caught early
- Code review happens proactively
- Team velocity increases

## Common Use Cases

### Use Case 1: Junior Developer

**Scenario**: Junior dev wants to add a feature

**Without Agent**:
- Jumps straight to coding
- Over-engineers solution
- Creates 10 files
- Build fails
- PR gets rejected

**With Agent**:
```
Junior: "Add feature X"
Claude: "Let me plan this with strategic-plan-architect"
[Creates simple, MVP plan]
Junior: Follows plan
Result: Ships in 1 day, code is clean
```

### Use Case 2: Refactoring

**Scenario**: Need to refactor complex code

**Without Agent**:
- Start refactoring
- Break things
- Spend days fixing
- Give up, revert

**With Agent**:
```
Dev: "Refactor auth system"
Claude: "Let me create a plan with rollback strategy"
[strategic-plan-architect creates phased approach]
Dev: Executes phase by phase
Result: Successful refactor with safety net
```

### Use Case 3: Code Quality

**Scenario**: Codebase growing messy

**Without Agent**:
- Notice code quality degrading
- Unsure what to fix first
- Ad-hoc cleanup
- Problems persist

**With Agent**:
```
Dev: "Review code quality"
Claude: "Using code-architecture-reviewer"
[Produces prioritized list of issues]
Dev: Fixes systematically
Result: Measurable quality improvement
```

## Advanced Techniques

### Agent Chaining

Use multiple agents in sequence:

```
1. strategic-plan-architect → Creates plan
2. [Implementation happens]
3. build-error-resolver → Fixes errors
4. code-architecture-reviewer → Reviews quality
5. Ship!
```

### Agent Specialization

Create highly specialized agents for your domain:

```markdown
# Database Migration Agent

Specialized in creating safe database migrations with rollback.

## Your Process
1. Analyze schema change
2. Generate migration SQL
3. Create rollback SQL
4. Test on backup
5. Provide deployment steps
```

### Conditional Agent Activation

In `CLAUDE.md`:

```markdown
## Auto-Invoke Agents

- If build has >5 errors: Use build-error-resolver
- If feature is >3 steps: Use strategic-plan-architect
- If "refactor" mentioned: Use production-principles-enforcer first
```

## Troubleshooting

### Agent Not Following Process

- Make process steps more explicit
- Add "You MUST" for critical steps
- Provide more examples
- Make output format stricter

### Agent Too Slow

- Reduce scope (make more specialized)
- Simplify output format
- Remove optional steps

### Agent Output Inconsistent

- Define strict output template
- Add validation criteria
- Provide more examples

## Agent Templates

The 4 core universal agents are ready to use:
- **strategic-plan-architect.md** - Universal (use as-is)
- **build-error-resolver.md** - Adapt for your build tools
- **code-architecture-reviewer.md** - Adapt for your stack/patterns
- **production-principles-enforcer.md** - Universal (use as-is)

Download these from the template repository and customize as needed.

## Next Steps

1. Start with strategic-plan-architect (highest value)
2. Add build-error-resolver (immediate pain relief)
3. Add production-principles-enforcer (prevent over-engineering)
4. Add code-architecture-reviewer (maintain quality)
5. Create custom agents as needs emerge

---

**Time investment**: 2 hours per agent
**Payoff**: Days saved on complex tasks
**ROI**: 20x for planning and error resolution

Start with the 4 core agents, then create custom ones for your specific pain points.
