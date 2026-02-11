---
name: test-api
description: Test API endpoints with authentication and validation
argument-hint: "[endpoint path or description]"
disable-model-invocation: true
allowed-tools:
  - Read
  - Bash
  - Glob
---

# Test API - Endpoint Testing Command

Test API endpoints with proper authentication and validation.

## Instructions

Test the specified API endpoint(s) with comprehensive coverage.

### Step 1: Identify Endpoints
List all endpoints to test:
- Endpoint URL
- HTTP method
- Authentication required?
- Request payload structure
- Expected response

### Step 2: Prepare Test Data
Create realistic test data appropriate for the endpoint:
```json
{
  "name": "Test Resource",
  "email": "test@example.com",
  "status": "active",
  "metadata": {
    "source": "api-test",
    "environment": "development"
  }
}
```

### Step 3: Test with curl

#### Basic GET request:
```bash
curl -X GET "http://localhost:PORT/api/v1/health"
```

#### POST with authentication:
```bash
curl -X POST "http://localhost:PORT/api/v1/resources" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -H "X-Tenant-ID: YOUR_TENANT_ID" \
  -d '{
    "name": "Test Resource",
    "email": "test@example.com",
    "status": "active"
  }'
```

#### PUT (update):
```bash
curl -X PUT "http://localhost:PORT/api/v1/resources/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "name": "Updated Resource"
  }'
```

#### DELETE:
```bash
curl -X DELETE "http://localhost:PORT/api/v1/resources/123" \
  -H "Authorization: Bearer $API_KEY"
```

Replace `PORT`, `API_KEY`, and `YOUR_TENANT_ID` with values from your project's configuration or environment variables.

### Step 4: Validate Response
Check:
- Status code (200, 201, 400, 401, etc.)
- Response body structure
- Expected data returned
- Error messages (if applicable)
- Response time

### Step 5: Test Edge Cases
- Missing required fields
- Invalid data types
- Malformed JSON
- Missing authentication
- Invalid credentials or tenant ID
- Rate limiting (if applicable)

## Test Scenarios

### 1. Happy Path
```markdown
**Scenario**: Valid resource creation
**Input**: Complete, valid payload
**Expected**: 201 Created, resource ID returned
**Actual**: [record result]
```

### 2. Missing Required Field
```markdown
**Scenario**: Missing required field
**Input**: Payload without required field
**Expected**: 400 Bad Request, error message identifying missing field
**Actual**: [record result]
```

### 3. Authentication
```markdown
**Scenario**: Missing API key / auth token
**Input**: Request without Authorization header
**Expected**: 401 Unauthorized (or allowed if public endpoint)
**Actual**: [record result]
```

### 4. Invalid Tenant / Scope
```markdown
**Scenario**: Invalid tenant or scope identifier
**Input**: Non-existent or unauthorized tenant ID
**Expected**: 400 or 403, appropriate error
**Actual**: [record result]
```

## Output Format

```markdown
## API Test Results

### Endpoint: [METHOD] [PATH]
**Base URL**: [base URL]
**Authentication**: Required/Not Required
**Rate Limit**: [if applicable]

### Test Cases

#### PASS - Happy Path
- **Status**: 201 Created
- **Response Time**: 234ms
- **Resource ID**: 12345
- **Notes**: [any observations]

#### PASS - Missing Required Field
- **Status**: 400 Bad Request
- **Error**: "name is required"
- **Behavior**: Correct

#### FAIL - Authentication
- **Status**: Expected 401, Got 200
- **Issue**: Endpoint not properly protected
- **Action Required**: Add auth middleware/guard

### Summary
- Total Tests: 5
- Passed: 4
- Failed: 1
- Issues Found: [list critical issues]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
```

## Important Notes

### Testing Production
- Use test accounts and tenant IDs when possible
- Don't spam endpoints (respect rate limits)
- Clean up test data after testing
- Be careful with destructive operations

### Testing Local
```bash
# Start local server using your project's dev command
# Examples: npm run dev, python manage.py runserver, go run ., cargo run

# Test against localhost
curl -X GET "http://localhost:PORT/health"
```

### Common Headers
```
Content-Type: application/json
Authorization: Bearer [API key or token]
X-Tenant-ID: [tenant identifier, if applicable]
User-Agent: API-Test
```

## Integration Testing

For comprehensive endpoint testing, run your project's test suite:

```bash
# Run your project's test command (check CLAUDE.md for specifics)
# Examples:
#   npm test
#   pytest
#   go test ./...
#   cargo test
#   dotnet test

# Run a specific test file (adjust for your test framework)
# Run with coverage (if your framework supports it)
```

Remember: Tests should be fast, focused, and aligned with TDD principles.
