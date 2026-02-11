---
name: dev-docs
description: Create strategic implementation plan (3 files - plan, context, tasks)
argument-hint: "[task description]"
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Dev Docs - Strategic Planning Command

Create a comprehensive strategic implementation plan for the current task.

## Instructions

Generate three documentation files in `.claude/dev-docs/`:

### 1. `[task-name]-plan.md`
Create a detailed implementation plan with:
- **Executive Summary**: Brief overview of the feature/change
- **Implementation Phases**: Break down into logical phases with dependencies
- **Detailed Task Breakdown**: Specific, actionable tasks with time estimates
- **Risk Assessment**: Potential issues and mitigation strategies
- **Success Metrics**: How to verify the implementation works
- **Rollback Strategy**: How to undo changes if needed

### 2. `[task-name]-context.md`
Document key architectural decisions and references:
- **Key Files**: List all files that will be modified or created
- **Architectural Decisions**: Why this approach over alternatives
- **Dependencies**: External libraries, APIs, or services involved
- **Database Changes**: Schema modifications if any
- **Environment Variables**: New config needed
- **Integration Points**: How this connects with existing systems

### 3. `[task-name]-tasks.md`
Create a checklist for tracking progress:
```markdown
# [Task Name] - Implementation Checklist

## Phase 1: [Phase Name]
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Phase 2: [Phase Name]
- [ ] Task 1
- [ ] Task 2

## Testing
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Manual smoke testing completed

## Deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Documentation updated
- [ ] Deployed to production
```

## Important Notes

- Keep plan concise but comprehensive
- Focus on MVP principles - simplest solution that works
- Break complex tasks into small, verifiable steps
- Include time estimates to prevent scope creep
- Consider edge cases but don't over-engineer
- Document WHY decisions are made, not just WHAT

### For UI/Frontend Tasks
If the task involves UI components:
- [ ] Plan which design tokens and components to use
- [ ] Ensure accessibility requirements are included in tasks
- [ ] Include design system compliance validation in testing phase
- [ ] Reference your project's UI conventions or design system docs

## After Generation

1. Review all three files thoroughly
2. Verify alignment with MVP principles
3. Check for over-engineering or unnecessary complexity
4. Get user approval before proceeding with implementation

Remember: The plan is your roadmap. Update it as you learn, but don't let it become stale.
