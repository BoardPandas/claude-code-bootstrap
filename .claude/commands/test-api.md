---
description: Test API endpoints with authentication and validation
argument-hint: [endpoint path or description]
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
Create realistic test data:
```typescript
// Example: Testing ticket creation
const testPayload = {
  agentId: "org_35849015040147-agent-test",
  subject: "Test ticket",
  userEmail: "test@wellforceit.com",
  priority: "medium",
  systemInfo: {
    hostname: "TEST-MACHINE",
    platform: "windows",
    osVersion: "10.0.19045"
  },
  screenshots: []
};
```

### Step 3: Test with curl or Node.js

#### Using curl:
```bash
# Basic GET request
curl -X GET "https://api.wellforceit.com/api/v1/health"

# POST with authentication
curl -X POST "https://api.wellforceit.com/api/v1/agents/tickets" \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: org_35849015040147" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "agentId": "test-agent",
    "subject": "Test ticket",
    "userEmail": "test@example.com"
  }'
```

#### Using Node.js:
```typescript
// Create test script
const axios = require('axios');

async function testEndpoint() {
  try {
    const response = await axios.post(
      'https://api.wellforceit.com/api/v1/agents/tickets',
      {
        agentId: "test-agent",
        subject: "Test ticket",
        userEmail: "test@example.com",
        priority: "medium"
      },
      {
        headers: {
          'X-Client-ID': 'org_35849015040147',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testEndpoint();
```

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
- Wrong client ID
- Rate limiting (if applicable)

## Test Scenarios

### 1. Happy Path
```markdown
**Scenario**: Valid ticket creation
**Input**: Complete, valid payload
**Expected**: 201 Created, ticket ID returned
**Actual**: [record result]
```

### 2. Missing Required Field
```markdown
**Scenario**: Missing subject field
**Input**: Payload without subject
**Expected**: 400 Bad Request, error message
**Actual**: [record result]
```

### 3. Authentication
```markdown
**Scenario**: Missing API key
**Input**: Request without Authorization header
**Expected**: 401 Unauthorized (or allowed if public endpoint)
**Actual**: [record result]
```

### 4. Wrong Client ID
```markdown
**Scenario**: Invalid X-Client-ID
**Input**: Non-existent organization ID
**Expected**: 400 or 404, appropriate error
**Actual**: [record result]
```

## Output Format

```markdown
## API Test Results

### Endpoint: POST /api/v1/agents/tickets
**Base URL**: https://api.wellforceit.com
**Authentication**: Required/Not Required
**Rate Limit**: [if applicable]

### Test Cases

#### ✅ Happy Path
- **Status**: 201 Created
- **Response Time**: 234ms
- **Ticket ID**: 12345
- **AI Summary**: Generated successfully
- **Zendesk ID**: 98765432

#### ⚠️ Missing Subject
- **Status**: 400 Bad Request
- **Error**: "Subject is required"
- **Behavior**: Correct

#### ❌ Authentication Failure
- **Status**: Expected 401, Got 200
- **Issue**: Endpoint not properly protected
- **Action Required**: Add auth middleware

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
- Use test organization IDs when possible
- Don't spam endpoints (respect rate limits)
- Clean up test data after testing
- Be careful with destructive operations

### Testing Local
```bash
# Start local server
npm run dev:simple

# Test against localhost
curl -X GET "http://localhost:3002/health"
```

### Common Headers
```
Content-Type: application/json
X-Client-ID: [organization ID]
Authorization: Bearer [API key]
User-Agent: Claude-Code-Test
```

## Integration Testing

For comprehensive endpoint testing:

```bash
# Run existing test suite
npm test

# Run specific test file
npm test -- routes/agents.test.ts

# Run with coverage
npm run test:coverage
```

Remember: Tests should be fast, focused, and aligned with TDD principles.
