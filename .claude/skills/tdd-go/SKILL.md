---
name: tdd-go
description: TDD with Go standard testing package. Use when writing tests with go test, httptest, testify, or Go table-driven tests.
disable-model-invocation: true
---

# TDD with Go Testing

Stack-specific testing examples for Go projects using the standard `testing` package.

> These examples implement the universal TDD principles from the `tdd-workflow` skill.

## Test Framework

- **Runner**: `go test` (standard library)
- **HTTP Testing**: `net/http/httptest`
- **Assertions**: Standard `if` checks or `testify/assert`

## API Endpoint Testing

### Step 1: Write Failing Test (RED)
```go
// internal/handlers/items_test.go
package handlers_test

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestCreateItem(t *testing.T) {
    body, _ := json.Marshal(map[string]string{
        "name":        "Test item",
        "description": "A test item",
        "category":    "general",
    })

    req := httptest.NewRequest("POST", "/api/v1/items", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    router.ServeHTTP(w, req)

    if w.Code != http.StatusCreated {
        t.Errorf("expected status 201, got %d", w.Code)
    }

    var result map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &result)

    if result["name"] != "Test item" {
        t.Errorf("expected name 'Test item', got %v", result["name"])
    }
}
```

### Step 2: Make It Pass (GREEN)
```go
// internal/handlers/items.go
func CreateItem(db *pgx.Pool) gin.HandlerFunc {
    return func(c *gin.Context) {
        var input CreateItemInput
        if err := c.ShouldBindJSON(&input); err != nil {
            c.JSON(400, gin.H{"error": err.Error()})
            return
        }
        row := db.QueryRow(c.Request.Context(),
            "INSERT INTO items (name, description, category) VALUES ($1, $2, $3) RETURNING *",
            input.Name, input.Description, input.Category)
        // ... scan and return
    }
}
```

### Step 3: Add Error Tests
```go
func TestCreateItem_MissingName(t *testing.T) {
    body, _ := json.Marshal(map[string]string{
        "description": "No name",
    })

    req := httptest.NewRequest("POST", "/api/v1/items", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    router.ServeHTTP(w, req)

    if w.Code != http.StatusBadRequest {
        t.Errorf("expected status 400, got %d", w.Code)
    }
}
```

## Unit Tests

```go
// internal/validation/email_test.go
package validation

import "testing"

func TestValidateEmail(t *testing.T) {
    tests := []struct {
        email string
        valid bool
    }{
        {"user@example.com", true},
        {"invalid", false},
        {"", false},
    }

    for _, tt := range tests {
        t.Run(tt.email, func(t *testing.T) {
            if got := ValidateEmail(tt.email); got != tt.valid {
                t.Errorf("ValidateEmail(%q) = %v, want %v", tt.email, got, tt.valid)
            }
        })
    }
}
```

## Database Tests

```go
func TestInsertItem(t *testing.T) {
    // Use test database
    ctx := context.Background()

    // Cleanup
    t.Cleanup(func() {
        db.Exec(ctx, "DELETE FROM items WHERE name = 'Test Item'")
    })

    var name string
    err := db.QueryRow(ctx,
        "INSERT INTO items (name) VALUES ($1) RETURNING name",
        "Test Item",
    ).Scan(&name)

    if err != nil {
        t.Fatalf("insert failed: %v", err)
    }
    if name != "Test Item" {
        t.Errorf("expected 'Test Item', got %q", name)
    }
}
```

## Test Helpers

```go
// internal/testutil/helpers.go
package testutil

func SetupTestDB(t *testing.T) *pgx.Pool {
    t.Helper()
    pool, err := pgx.NewPool(context.Background(), os.Getenv("TEST_DATABASE_URL"))
    if err != nil {
        t.Fatalf("failed to connect: %v", err)
    }
    t.Cleanup(func() { pool.Close() })
    return pool
}
```

## Test Organization

```
internal/
├── handlers/
│   ├── items.go
│   └── items_test.go        # Tests next to code
├── validation/
│   ├── email.go
│   └── email_test.go
└── testutil/
    └── helpers.go            # Shared test utilities
```

## Running Tests

```bash
go test ./...                 # Run all tests
go test ./internal/handlers/  # Run specific package
go test -run TestCreateItem   # Run matching tests
go test -cover ./...          # With coverage
go test -v ./...              # Verbose output
go test -race ./...           # Race condition detection
```
