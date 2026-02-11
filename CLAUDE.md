# Claude Code Bootstrap

A template project for configuring Claude Code with skills, agents, hooks, and commands following v2.1.38 best practices.

## Quick Reference

- See [README.md](README.md) for project overview
- Skills in [.claude/skills/](.claude/skills/)
- Agents in [.claude/agents/](.claude/agents/)

## Key Commands

- `/setup-stack` - Configure bootstrap for your tech stack (one-time)
- `/dev-docs [task]` - Create strategic implementation plan
- `/build-and-fix` - Run build and fix all errors
- `/code-review` - Architecture review focused on production principles
- `/test-api` - Test API endpoints with auth and validation

## Development Principles

1. **Simple > Complex** - Always favor the simpler approach
2. **YAGNI** - Don't build for hypothetical futures
3. **TDD Required** - Write tests first, always
4. **Ship Fast** - Working MVP beats perfect vaporware
5. **Production Quality** - Error handling, logging, validation are non-negotiable
6. **Rule of Three** - Don't extract until 3rd duplicate
7. **200 Lines** - Consider extracting functions at 200+ lines
