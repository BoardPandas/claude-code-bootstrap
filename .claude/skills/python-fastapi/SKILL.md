---
name: python-fastapi
description: Python + FastAPI + PostgreSQL stack examples. Use when building backend APIs with FastAPI, Python routes, Pydantic models, or asyncpg database queries.
disable-model-invocation: true
---

# Python + FastAPI Stack Examples

Stack-specific examples for backend development with Python, FastAPI, and PostgreSQL.

> These examples implement the universal principles from the `backend-dev-guidelines` skill.

## Tech Stack

- **Language**: Python 3.11+
- **Framework**: FastAPI
- **Database**: PostgreSQL with psycopg2/asyncpg (direct queries, no ORM)
- **Validation**: Pydantic models (built into FastAPI)

## File Structure

```
src/
├── main.py               # FastAPI app entry point
├── routes/               # Route handlers
│   ├── items.py
│   └── users.py
├── database.py           # Connection pool setup
└── config.py             # Environment config
```

## Database Queries (Direct SQL)

### Simple Parameterized Query
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncpg

app = FastAPI()

class CreateItem(BaseModel):
    name: str
    description: str = ""
    category: str = "general"

@app.post("/api/v1/items", status_code=201)
async def create_item(item: CreateItem):
    try:
        row = await db.fetchrow(
            """INSERT INTO items (name, description, category, status, created_at)
               VALUES ($1, $2, $3, 'active', NOW())
               RETURNING *""",
            item.name, item.description, item.category
        )
        return {"success": True, "item": dict(row)}
    except Exception as e:
        print(f"Item creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create item")
```

### Anti-Pattern: ORM or Repository
```python
# DON'T DO THIS - Too complex for MVP
class ItemRepository:
    def __init__(self, session: Session):
        self.session = session
    async def create(self, data: CreateItemDTO) -> Item:
        # ... abstraction we don't need
```

## Route Structure

### Simple Route Handlers
```python
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")

@router.get("/items")
async def list_items():
    try:
        rows = await db.fetch(
            "SELECT * FROM items ORDER BY created_at DESC LIMIT 100"
        )
        return [dict(row) for row in rows]
    except Exception as e:
        print(f"Error fetching items: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch items")

@router.post("/items", status_code=201)
async def create_item(item: CreateItem):
    if not item.name:
        raise HTTPException(status_code=400, detail="Name required")

    row = await db.fetchrow(
        "INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *",
        item.name, item.description
    )
    return dict(row)
```

## Error Handling

```python
@app.post("/endpoint")
async def handler(data: RequestModel):
    try:
        result = await do_something(data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error description: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong")
```

## Input Validation (Pydantic)

```python
from pydantic import BaseModel, EmailStr, field_validator

class CreateItem(BaseModel):
    name: str
    email: EmailStr
    priority: str = "medium"

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v):
        if v not in ["low", "medium", "high", "urgent"]:
            raise ValueError("Invalid priority")
        return v
```

## Multi-Tenancy

```python
from fastapi import Request

def get_client_id(request: Request) -> str:
    # 1. Check header
    client_id = request.headers.get("x-client-id")
    if client_id:
        return client_id
    # 2. Check query param
    client_id = request.query_params.get("client_id")
    if client_id:
        return client_id
    # 3. Default
    return "default"
```

## Common Patterns

### Pagination
```python
@router.get("/items")
async def list_items(limit: int = 20, offset: int = 0):
    rows = await db.fetch(
        "SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        limit, offset
    )
    return {"items": [dict(r) for r in rows], "limit": limit, "offset": offset}
```

### Auth Middleware
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt, os

security = HTTPBearer()

async def require_auth(credentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, os.environ["JWT_SECRET"], algorithms=["HS256"])
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/admin/users")
async def list_users(user = Depends(require_auth)):
    # ... admin logic
```

## Build & Run Commands

```bash
uvicorn src.main:app --reload    # Start development server
mypy src/                        # Type check
pytest                           # Run tests
black src/                       # Format code
ruff check src/                  # Lint
```

## Anti-Patterns to Avoid

```python
# DON'T: Service layers
class ItemService:
    def __init__(self, repo: ItemRepository): ...

# DON'T: ORMs for MVP
from sqlalchemy.orm import Session
class Item(Base): ...

# DO: Direct queries with parameterization
row = await db.fetchrow("INSERT INTO items (name) VALUES ($1) RETURNING *", name)
```
