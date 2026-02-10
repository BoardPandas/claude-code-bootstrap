# Stack-Specific Example Packs

These files contain **stack-specific code examples** that complement the universal principles in `../core/`.

## How to Use

1. **Keep** the files matching your project's tech stack
2. **Delete** the files you don't need
3. Claude will reference these examples when generating code for your project

## Available Stacks

### Backend
- `node-express.md` — Node.js + Express + PostgreSQL + TypeScript
- `python-fastapi.md` — Python + FastAPI + PostgreSQL
- `go-gin.md` — Go + Gin + PostgreSQL

### Frontend
- `react-nextjs.md` — React + Next.js + Material UI + TypeScript

### Testing
- `tdd-jest.md` — Jest + Supertest (Node.js)
- `tdd-pytest.md` — pytest (Python)
- `tdd-go.md` — Go testing package

## Adding Your Own Stack

Create a new file following the same pattern: concrete code examples showing how to apply the universal principles from `../core/` in your specific framework. Reference it in `skill-rules.json` to enable auto-activation.
