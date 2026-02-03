---
name: openai-api-expert
description: OpenAI API integration patterns for GPT-5 Mini Responses API, reasoning controls, and proper parameter usage
---

# OpenAI API Expert

Expert guidance for developing with OpenAI APIs (GPT-4, GPT-5, ChatGPT, Embeddings, Assistants).

## Current OpenAI Models & Capabilities

### GPT-5 Mini (Responses API) - RECOMMENDED
- **Model**: `gpt-5-mini`
- **API**: Responses API (not Chat Completions)
- **Key Feature**: Reasoning controls + verbosity controls
- **Best For**: Production apps requiring cost-effectiveness + reasoning

### GPT-4 Turbo
- **Model**: `gpt-4-turbo`
- **API**: Chat Completions
- **Best For**: Complex reasoning, legacy compatibility

### GPT-4o
- **Model**: `gpt-4o`
- **API**: Chat Completions
- **Best For**: Multimodal tasks (text + vision)

## GPT-5 Mini Responses API (CRITICAL)

### Key Differences from Chat Completions

**GPT-5 Mini ONLY supports Responses API with different parameters:**

```typescript
// ✅ CORRECT - GPT-5 Mini Responses API
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  // NEW: Reasoning controls
  reasoning: {
    effort: 'minimal' | 'low' | 'medium' | 'high'
  },
  // NEW: Verbosity controls
  text: {
    verbosity: 'low' | 'medium' | 'high'
  },
  // NEW: Max output tokens (replaces max_tokens)
  max_output_tokens: 2000,

  // ❌ REMOVED: These parameters are NOT supported
  // temperature: 0.7,  // ❌ Will cause API error
  // top_p: 1.0,       // ❌ Will cause API error
  // logprobs: true    // ❌ Will cause API error
});
```

### Reasoning Effort Levels

**Use this to control reasoning depth:**

- `minimal` - Fast, simple responses (ticket subjects, summaries)
- `low` - Basic reasoning (categorization, simple analysis)
- `medium` - Moderate reasoning (technical analysis, recommendations)
- `high` - Deep reasoning (complex problem-solving, strategic planning)

### Text Verbosity Levels

**Use this to control response length:**

- `low` - Concise, brief responses (subjects, summaries)
- `medium` - Balanced responses (explanations, standard analysis)
- `high` - Detailed, comprehensive responses (documentation, deep analysis)

### Common Use Cases

```typescript
// 1. TICKET SUBJECT GENERATION
// Goal: Fast, concise subject line
const subjectResponse = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [
    { role: 'system', content: 'Generate concise ticket subjects' },
    { role: 'user', content: ticketDetails }
  ],
  reasoning: { effort: 'minimal' },     // Fast
  text: { verbosity: 'low' },           // Brief
  max_output_tokens: 50
});

// 2. TECHNICAL ANALYSIS
// Goal: Detailed analysis with reasoning
const analysisResponse = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [
    { role: 'system', content: 'Analyze technical issues' },
    { role: 'user', content: problemDescription }
  ],
  reasoning: { effort: 'medium' },      // Think it through
  text: { verbosity: 'high' },          // Detailed
  max_output_tokens: 2000
});

// 3. SELF-HELP SUGGESTIONS
// Goal: Quick, actionable suggestions
const selfHelpResponse = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [
    { role: 'system', content: 'Provide self-help suggestions' },
    { role: 'user', content: userQuestion }
  ],
  reasoning: { effort: 'minimal' },     // Quick
  text: { verbosity: 'medium' },        // Balanced
  max_output_tokens: 500
});
```

## OpenAI SDK Setup (Node.js/TypeScript)

### Installation
```bash
npm install openai
```

### Initialization Pattern (MVP Way)
```typescript
// Simple, direct initialization
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Load from .env
});

// That's it! No factory, no DI, no abstraction
```

### ❌ DON'T Over-engineer
```typescript
// ❌ WRONG - Too complex for MVP
class OpenAIService {
  private client: OpenAI;
  constructor(private config: OpenAIConfig) {
    this.client = new OpenAI(config);
  }
  async chat(params: ChatParams): Promise<ChatResponse> {
    // ... unnecessary abstraction
  }
}
```

## Error Handling Patterns

### Simple and Effective
```typescript
// ✅ CORRECT - Simple try-catch
async function generateSubject(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: 'Generate brief ticket subject' },
        { role: 'user', content }
      ],
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' },
      max_output_tokens: 50
    });

    return response.choices[0]?.message?.content || 'Untitled Ticket';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Support Request'; // Fallback
  }
}
```

### Handle Common Errors
```typescript
try {
  const response = await openai.chat.completions.create({...});
} catch (error: any) {
  // Rate limits
  if (error.status === 429) {
    console.error('Rate limit exceeded, retry later');
    return fallbackValue;
  }

  // Invalid request (bad parameters)
  if (error.status === 400) {
    console.error('Invalid OpenAI request:', error.message);
    return fallbackValue;
  }

  // API key issues
  if (error.status === 401) {
    console.error('OpenAI authentication failed');
    return fallbackValue;
  }

  // Generic error
  console.error('OpenAI error:', error);
  return fallbackValue;
}
```

## Streaming Responses (When Needed)

```typescript
// Use streaming for long responses (like AI chat)
async function streamCompletion(prompt: string) {
  const stream = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
    reasoning: { effort: 'medium' },
    text: { verbosity: 'high' },
    max_output_tokens: 2000,
    stream: true // Enable streaming
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    process.stdout.write(content); // Or send to client
  }
}
```

## Token Management

### Estimate Tokens (Rough)
- **1 token ≈ 4 characters** (English text)
- **1 token ≈ 0.75 words** (English text)

### Control Costs
```typescript
// Short responses (cheap)
max_output_tokens: 50      // ~$0.001 per request

// Medium responses (moderate)
max_output_tokens: 500     // ~$0.01 per request

// Long responses (expensive)
max_output_tokens: 2000    // ~$0.04 per request
```

### Count Tokens Accurately (Optional)
```bash
npm install tiktoken
```

```typescript
import { encoding_for_model } from 'tiktoken';

function countTokens(text: string, model: string = 'gpt-5-mini'): number {
  const encoder = encoding_for_model(model);
  const tokens = encoder.encode(text);
  encoder.free();
  return tokens.length;
}
```

## System Prompts Best Practices

### Keep It Simple and Direct
```typescript
// ✅ GOOD - Clear, concise, actionable
const systemPrompt = `You are a support ticket analyzer.
Generate a concise subject line (5-10 words) that captures the main issue.
Be specific and professional.`;

// ❌ BAD - Too verbose, too many rules
const systemPrompt = `You are an advanced AI assistant...
[500 lines of instructions]`;
```

### Use Role-Specific Prompts
```typescript
// Ticket subject generation
const SUBJECT_SYSTEM_PROMPT = `Generate concise ticket subjects (5-10 words).
Focus on the main issue. Be professional and specific.`;

// Technical analysis
const ANALYSIS_SYSTEM_PROMPT = `Analyze technical support tickets.
Identify: problem, severity, suggested solution, and next steps.
Be thorough but concise.`;

// Self-help suggestions
const SELFHELP_SYSTEM_PROMPT = `Provide 3-5 actionable self-help steps.
Use numbered lists. Be clear and user-friendly.`;
```

## Response Parsing

### Extract Content Safely
```typescript
// ✅ CORRECT - Safe extraction with fallback
function extractContent(response: any): string {
  return response?.choices?.[0]?.message?.content?.trim() || '';
}

// Use it
const content = extractContent(response);
if (!content) {
  console.error('Empty response from OpenAI');
  return fallbackValue;
}
```

### Parse JSON Responses (When Needed)
```typescript
// Sometimes you want structured output
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [
    {
      role: 'system',
      content: 'Return JSON with: subject, priority, category'
    },
    { role: 'user', content: ticketContent }
  ],
  reasoning: { effort: 'low' },
  text: { verbosity: 'low' },
  max_output_tokens: 200,
  response_format: { type: 'json_object' } // Request JSON
});

// Parse safely
try {
  const data = JSON.parse(response.choices[0].message.content);
  return data;
} catch (error) {
  console.error('Failed to parse JSON response:', error);
  return fallbackData;
}
```

## Environment Variables

### Required Configuration
```bash
# .env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Optional: Organization ID
OPENAI_ORG_ID=org-xxxxxxxxxxxxx
```

### Load in Code
```typescript
// Simple dotenv setup
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID // Optional
});
```

## Testing OpenAI Integration

### Simple Manual Test
```typescript
// test-openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testConnection() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'user', content: 'Say "Hello from OpenAI!"' }
      ],
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' },
      max_output_tokens: 50
    });

    console.log('✅ OpenAI connection successful!');
    console.log('Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ OpenAI connection failed:', error);
  }
}

testConnection();
```

Run: `ts-node test-openai.ts`

### TDD Pattern for OpenAI Features
```typescript
// Follow TDD even with external APIs
describe('Ticket Subject Generation', () => {
  it('should generate subject from ticket content', async () => {
    const content = 'My computer won\'t turn on';
    const subject = await generateTicketSubject(content);

    expect(subject).toBeTruthy();
    expect(subject.length).toBeGreaterThan(5);
    expect(subject.length).toBeLessThan(100);
  });

  it('should handle API errors gracefully', async () => {
    // Mock API failure
    jest.spyOn(openai.chat.completions, 'create')
      .mockRejectedValue(new Error('API error'));

    const subject = await generateTicketSubject('test');

    expect(subject).toBe('Support Request'); // Fallback
  });
});
```

## Common Mistakes to Avoid

### ❌ Don't Use Legacy Parameters with GPT-5
```typescript
// ❌ WRONG - These don't work with GPT-5 Mini
await openai.chat.completions.create({
  model: 'gpt-5-mini',
  temperature: 0.7,  // ❌ Not supported
  top_p: 1.0,       // ❌ Not supported
  logprobs: true    // ❌ Not supported
});
```

### ❌ Don't Over-engineer Response Handling
```typescript
// ❌ WRONG - Too complex
class ResponseParser {
  parse(response: OpenAIResponse): ParsedResponse {
    // ... 100 lines of abstraction
  }
}

// ✅ CORRECT - Direct and simple
const content = response.choices[0]?.message?.content || '';
```

### ❌ Don't Ignore Error Handling
```typescript
// ❌ WRONG - No error handling
const response = await openai.chat.completions.create({...});
return response.choices[0].message.content;

// ✅ CORRECT - Handle errors with fallback
try {
  const response = await openai.chat.completions.create({...});
  return response.choices[0]?.message?.content || fallback;
} catch (error) {
  console.error('OpenAI error:', error);
  return fallback;
}
```

## Performance Tips

### Batch When Possible
```typescript
// Instead of sequential calls, batch if you can
async function analyzeMultipleTickets(tickets: Ticket[]) {
  const promises = tickets.map(ticket =>
    generateSubject(ticket.content)
  );

  return Promise.all(promises); // Parallel processing
}
```

### Cache Expensive Calls
```typescript
// Use Redis or in-memory cache for repeated queries
import { redis } from './redis';

async function getCachedAnalysis(ticketId: string) {
  const cacheKey = `analysis:${ticketId}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Generate and cache
  const analysis = await generateAnalysis(ticketId);
  await redis.setex(cacheKey, 3600, JSON.stringify(analysis)); // 1 hour

  return analysis;
}
```

## References

- OpenAI API Docs: https://platform.openai.com/docs
- GPT-5 Mini Responses API: https://platform.openai.com/docs/guides/responses
- OpenAI Node SDK: https://github.com/openai/openai-node
- Rate Limits: https://platform.openai.com/docs/guides/rate-limits

## MVP Reminder

- **Start simple**: One API call, one purpose
- **Hard-code prompts**: Extract to config later if needed
- **Use fallbacks**: Always have a backup value
- **Log everything**: Debug AI issues easily
- **Don't over-engineer**: Direct API calls are fine for MVP
