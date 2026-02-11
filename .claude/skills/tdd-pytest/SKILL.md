---
name: tdd-pytest
description: TDD with pytest for Python projects. Use when writing tests with pytest, FastAPI TestClient, or Python test fixtures.
disable-model-invocation: true
---

# TDD with pytest

Stack-specific testing examples for Python projects using pytest.

> These examples implement the universal TDD principles from the `tdd-workflow` skill.

## Test Framework

- **Runner**: pytest
- **HTTP Testing**: httpx (with FastAPI TestClient)
- **Assertions**: Built-in pytest assertions

## API Endpoint Testing

### Step 1: Write Failing Test (RED)
```python
# tests/test_items.py
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_create_item_with_valid_data():
    response = client.post("/api/v1/items", json={
        "name": "Test item",
        "description": "A test item",
        "category": "general"
    })

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == "Test item"
```

### Step 2: Make It Pass (GREEN)
```python
# src/routes/items.py
@router.post("/api/v1/items", status_code=201)
async def create_item(item: CreateItem):
    row = await db.fetchrow(
        "INSERT INTO items (name, description, category) VALUES ($1, $2, $3) RETURNING *",
        item.name, item.description, item.category
    )
    return dict(row)
```

### Step 3: Add Error Tests
```python
def test_create_item_missing_name():
    response = client.post("/api/v1/items", json={
        "description": "No name"
    })

    assert response.status_code == 422  # Pydantic validation error
```

## Unit Tests

```python
# tests/test_validation.py
from src.utils.validation import validate_email

def test_valid_email():
    assert validate_email("user@example.com") is True

def test_invalid_email():
    assert validate_email("invalid") is False

def test_empty_email():
    assert validate_email("") is False
```

## Database Tests (Use Real DB)

```python
# tests/test_db.py
import pytest
from src.database import get_db

@pytest.fixture(autouse=True)
async def cleanup():
    yield
    await db.execute("DELETE FROM items WHERE name = 'Test Item'")

async def test_insert_item():
    row = await db.fetchrow(
        "INSERT INTO items (name) VALUES ($1) RETURNING *",
        "Test Item"
    )
    assert row["name"] == "Test Item"
```

## Test Fixtures

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_item():
    return {"name": "Test", "description": "Test item", "category": "general"}
```

## Test Organization

```
tests/
├── conftest.py              # Shared fixtures
├── test_items.py            # Item endpoint tests
├── test_users.py            # User endpoint tests
├── test_validation.py       # Utility tests
└── integration/
    └── test_item_flow.py    # End-to-end tests
```

## Running Tests

```bash
pytest                        # Run all tests
pytest tests/test_items.py    # Run specific file
pytest -k "test_create"       # Run matching tests
pytest --cov=src              # With coverage
pytest -x                     # Stop on first failure
pytest -v                     # Verbose output
```
