---
name: go-gin
description: Go + Gin + PostgreSQL stack examples. Use when building backend APIs with Go, Gin framework, pgx database driver, or Go HTTP handlers.
disable-model-invocation: true
---

# Go + Gin Stack Examples

Stack-specific examples for backend development with Go, Gin, and PostgreSQL.

> These examples implement the universal principles from the `backend-dev-guidelines` skill.

## Tech Stack

- **Language**: Go 1.22+
- **Framework**: Gin (or stdlib `net/http`)
- **Database**: PostgreSQL with `pgx` (direct queries, no ORM)

## File Structure

```
cmd/
└── server/
    └── main.go           # Entry point
internal/
├── handlers/             # HTTP handlers
│   ├── items.go
│   └── users.go
├── db/
│   └── connection.go     # Connection pool
└── config/
    └── config.go         # Environment config
```

## Database Queries (Direct SQL)

### Simple Parameterized Query
```go
func CreateItem(c *gin.Context) {
    var input struct {
        Name        string `json:"name" binding:"required"`
        Description string `json:"description"`
        Category    string `json:"category"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(400, gin.H{"error": "Name required"})
        return
    }

    if input.Category == "" {
        input.Category = "general"
    }

    var item Item
    err := db.QueryRow(context.Background(),
        `INSERT INTO items (name, description, category, status, created_at)
         VALUES ($1, $2, $3, 'active', NOW())
         RETURNING id, name, description, category, status, created_at`,
        input.Name, input.Description, input.Category,
    ).Scan(&item.ID, &item.Name, &item.Description, &item.Category, &item.Status, &item.CreatedAt)

    if err != nil {
        log.Printf("Item creation error: %v", err)
        c.JSON(500, gin.H{"error": "Failed to create item"})
        return
    }

    c.JSON(201, gin.H{"success": true, "item": item})
}
```

### Anti-Pattern: ORM or Repository
```go
// DON'T DO THIS - Too complex for MVP
type ItemRepository struct {
    db *pgx.Pool
}
func (r *ItemRepository) Create(ctx context.Context, dto CreateItemDTO) (*Item, error) {
    // ... abstraction we don't need
}
```

## Route Structure

### Simple Handler Pattern
```go
func SetupRoutes(r *gin.Engine, db *pgx.Pool) {
    api := r.Group("/api/v1")
    {
        api.GET("/items", ListItems(db))
        api.POST("/items", CreateItem(db))
        api.GET("/items/:id", GetItem(db))
    }
}

func ListItems(db *pgx.Pool) gin.HandlerFunc {
    return func(c *gin.Context) {
        rows, err := db.Query(context.Background(),
            "SELECT id, name, status FROM items ORDER BY created_at DESC LIMIT 100")
        if err != nil {
            log.Printf("Error fetching items: %v", err)
            c.JSON(500, gin.H{"error": "Failed to fetch items"})
            return
        }
        defer rows.Close()

        var items []Item
        for rows.Next() {
            var item Item
            if err := rows.Scan(&item.ID, &item.Name, &item.Status); err != nil {
                continue
            }
            items = append(items, item)
        }
        c.JSON(200, items)
    }
}
```

## Error Handling

```go
func Handler(db *pgx.Pool) gin.HandlerFunc {
    return func(c *gin.Context) {
        result, err := doSomething(c.Request.Context(), db)
        if err != nil {
            log.Printf("Error description: %v", err)
            c.JSON(500, gin.H{"error": "Something went wrong"})
            return
        }
        c.JSON(200, result)
    }
}
```

## Input Validation

```go
// Use Gin's built-in binding tags
type CreateItemInput struct {
    Name     string `json:"name" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Priority string `json:"priority" binding:"omitempty,oneof=low medium high urgent"`
}

func CreateItem(c *gin.Context) {
    var input CreateItemInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    // Continue with validated input...
}
```

## Multi-Tenancy

```go
func getClientID(c *gin.Context) string {
    // 1. Check header
    if id := c.GetHeader("X-Client-ID"); id != "" {
        return id
    }
    // 2. Check query param
    if id := c.Query("client_id"); id != "" {
        return id
    }
    // 3. Default
    return "default"
}
```

## Common Patterns

### Pagination
```go
func ListItems(db *pgx.Pool) gin.HandlerFunc {
    return func(c *gin.Context) {
        limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
        offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

        rows, err := db.Query(context.Background(),
            "SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            limit, offset)
        // ... scan rows
        c.JSON(200, gin.H{"items": items, "limit": limit, "offset": offset})
    }
}
```

### Auth Middleware
```go
func RequireAuth(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenStr := strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer ")
        if tokenStr == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
            return
        }

        claims := &jwt.StandardClaims{}
        token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
            return []byte(jwtSecret), nil
        })
        if err != nil || !token.Valid {
            c.AbortWithStatusJSON(401, gin.H{"error": "Invalid token"})
            return
        }

        c.Set("user_id", claims.Subject)
        c.Next()
    }
}
```

## Build & Run Commands

```bash
go run cmd/server/main.go    # Run development server
go build ./...               # Build all packages
go vet ./...                 # Check for issues
go test ./...                # Run tests
gofmt -w .                   # Format code
golangci-lint run            # Lint
```

## Anti-Patterns to Avoid

```go
// DON'T: Repository/service layers
type ItemService struct { repo ItemRepository }

// DON'T: ORMs for MVP
import "gorm.io/gorm"
db.Create(&item)

// DO: Direct queries with parameterization
db.QueryRow(ctx, "INSERT INTO items (name) VALUES ($1) RETURNING *", name)
```
