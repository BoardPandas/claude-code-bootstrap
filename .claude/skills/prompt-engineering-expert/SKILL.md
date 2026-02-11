---
name: prompt-engineering-expert
description: Prompt engineering patterns and best practices for GPT-4, GPT-5, Claude, and other AI models
---

# Prompt Engineering Expert

Expert guidance for crafting effective prompts for AI models (GPT-4, GPT-5, Claude, etc.).

## Core Principles

### The Fundamentals
1. **Be Specific**: Vague prompts get vague results
2. **Provide Context**: Give the AI what it needs to understand
3. **Define the Format**: Tell it how to structure responses
4. **Set Constraints**: Boundaries improve quality
5. **Iterate**: First prompt rarely perfect

### The Golden Rule
**"The quality of your output is directly proportional to the clarity of your input"**

## Prompt Structure (Best Practices)

### Basic Template

```
[Role] You are a [specific role with expertise].

[Context] [Background information the AI needs to know]

[Task] [Specific thing you want done]

[Constraints] [Boundaries and requirements]
- Constraint 1
- Constraint 2

[Format] [How to structure the response]
```

### Example: Good vs Bad

#### ❌ BAD Prompt
```
Write something about tickets.
```

#### ✅ GOOD Prompt
```
You are a technical support analyst.

Context: We receive support tickets from users experiencing software issues.
Each ticket contains: description, user details, error messages, and screenshots.

Task: Generate a concise subject line (5-10 words) that captures the main issue.

Constraints:
- Be specific and actionable
- Use technical terms when appropriate
- Keep it professional
- Focus on the problem, not the user

Format: Return only the subject line, no additional text.

Input: "My computer keeps showing a blue screen when I try to open Excel.
Error code: 0x0000007E. It started after the Windows update yesterday."

Output: "Excel crash with 0x0000007E after Windows update"
```

## System Prompts vs User Prompts

### System Prompt (Sets the AI's Role)
```typescript
const systemPrompt = `You are a support ticket analyzer.
Your role is to extract key information and provide actionable insights.
Always be concise, professional, and focus on solving problems.`;
```

**Purpose:**
- Define the AI's role and behavior
- Set consistent tone and style
- Establish boundaries and rules

### User Prompt (The Actual Task)
```typescript
const userPrompt = `Analyze this ticket and suggest 3 self-help steps:

Ticket: "${ticketContent}"

Return as numbered list.`;
```

**Purpose:**
- Provide the specific task
- Include the data to process
- Request the output format

## Prompt Patterns (Proven Templates)

### 1. Few-Shot Learning (Examples Work Magic)

```
Task: Classify ticket priority

Examples:

Input: "Website is completely down, can't access anything"
Output: high

Input: "Can you change my email address in the system?"
Output: low

Input: "Payment processing is failing for all customers"
Output: critical

Now classify this:
Input: "Getting occasional timeout errors on the dashboard"
Output:
```

### 2. Chain of Thought (Better Reasoning)

```
Analyze this technical issue step by step:

1. First, identify the error type
2. Then, determine possible causes
3. Finally, suggest solutions

Issue: "${description}"

Let's work through this:
```

### 3. Structured Output (JSON Format)

```
Extract ticket information and return as JSON.

Format:
{
  "subject": "brief subject line",
  "priority": "low|medium|high",
  "category": "technical|billing|general",
  "sentiment": "frustrated|neutral|polite"
}

Ticket: "${content}"

JSON:
```

### 4. Constraints-First (Define Boundaries)

```
Generate a ticket subject with these STRICT constraints:
- Exactly 5-10 words
- No generic terms like "issue" or "problem"
- Include specific technical terms
- Professional tone
- Start with action verb

Description: "${description}"

Subject:
```

### 5. Role-Playing (Context Setting)

```
You are a senior technical support engineer with 10 years of experience.
You've seen thousands of tickets and can quickly identify patterns.

A new ticket just came in. Read it carefully and provide:
1. Your initial diagnosis
2. Likely root cause
3. Recommended next steps

Ticket: "${content}"
```

## Optimizing for Different AI Models

### GPT-5 Mini (Reasoning Controls)
```typescript
// For quick, concise tasks
{
  reasoning: { effort: 'minimal' },
  text: { verbosity: 'low' }
}
// Prompt: Be direct, clear, specific

// For complex analysis
{
  reasoning: { effort: 'medium' },
  text: { verbosity: 'high' }
}
// Prompt: Can be more detailed, request step-by-step
```

### GPT-4 (Chat Completions)
```typescript
// Use temperature for creativity control
{
  temperature: 0.3  // Low = consistent, factual
  temperature: 0.7  // Medium = balanced
  temperature: 1.0  // High = creative, varied
}
```

## Common Prompt Mistakes (And Fixes)

### ❌ Mistake 1: Too Vague
```
Prompt: "Write about the ticket."

Problem: AI doesn't know what you want.
```

✅ **Fix:**
```
Prompt: "Generate a 2-3 sentence summary of this ticket,
focusing on: the problem, impact, and urgency."
```

### ❌ Mistake 2: No Format Specified
```
Prompt: "Give me self-help steps for this issue."

Problem: Could return paragraphs, bullets, anything.
```

✅ **Fix:**
```
Prompt: "Provide 3-5 self-help steps as a numbered list.
Each step should be one sentence, actionable, and specific."
```

### ❌ Mistake 3: No Constraints
```
Prompt: "Analyze this ticket."

Problem: Could be 10 words or 1000 words.
```

✅ **Fix:**
```
Prompt: "Analyze this ticket in exactly 3 sentences:
1. Main issue
2. Severity assessment
3. Recommended action"
```

### ❌ Mistake 4: Conflicting Instructions
```
Prompt: "Be very detailed but also concise.
Explain everything but keep it brief."

Problem: AI doesn't know which to prioritize.
```

✅ **Fix:**
```
Prompt: "Provide a concise summary (2-3 sentences),
then a detailed breakdown if needed."
```

### ❌ Mistake 5: Asking for Impossible
```
Prompt: "Predict the exact cause of this issue."

Problem: AI can't know without system access.
```

✅ **Fix:**
```
Prompt: "Based on the error message and description,
suggest 3 most likely causes and how to verify each."
```

## Prompt Engineering for Production

### 1. Template Your Prompts

```typescript
// ✅ GOOD - Reusable templates
const PROMPTS = {
  ticketSubject: (content: string) => `
    Generate a concise ticket subject (5-10 words).
    Be specific and professional.

    Description: ${content}

    Subject:
  `,

  priorityClassification: (content: string) => `
    Classify ticket priority as: low, medium, high, or critical.

    Guidelines:
    - critical: System down, data loss, security breach
    - high: Major feature broken, many users affected
    - medium: Feature issue, single user or workaround exists
    - low: Question, enhancement, minor cosmetic issue

    Ticket: ${content}

    Priority:
  `,

  selfHelp: (issue: string) => `
    Provide 3-5 self-help troubleshooting steps.

    Format as numbered list.
    Each step should be actionable and clear.
    Start with simplest steps first.

    Issue: ${issue}

    Steps:
  `
};

// Use it
const subject = await generateAI(PROMPTS.ticketSubject(ticket.description));
```

### 2. Version Your Prompts

```typescript
// Track prompt versions for A/B testing
const PROMPT_VERSIONS = {
  ticketSubject: {
    v1: (content: string) => `Generate subject: ${content}`,
    v2: (content: string) => `Generate concise subject (5-10 words): ${content}`,
    v3: (content: string) => `As a support analyst, create a specific subject (5-10 words) for: ${content}`
  }
};

// Use active version
const activeVersion = 'v3';
const prompt = PROMPT_VERSIONS.ticketSubject[activeVersion](content);
```

### 3. Handle Edge Cases

```typescript
// Validate and clean input before prompting
function sanitizeInput(content: string): string {
  return content
    .trim()
    .slice(0, 5000) // Limit length
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control chars
}

// Validate output
function validateSubject(subject: string): string {
  const cleaned = subject.trim();

  // Too short
  if (cleaned.length < 5) {
    return 'Support Request'; // Fallback
  }

  // Too long
  if (cleaned.length > 100) {
    return cleaned.slice(0, 100) + '...';
  }

  return cleaned;
}
```

## Testing Prompts (Like Code)

### Manual Testing
```typescript
// Create test cases
const testCases = [
  {
    input: 'Website is down, returning 503 errors',
    expected: 'Website returning 503 errors'
  },
  {
    input: 'I forgot my password',
    expected: 'Password reset request'
  }
];

// Test each case
for (const test of testCases) {
  const result = await generateSubject(test.input);
  console.log(`Input: ${test.input}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Got: ${result}`);
  console.log(`Match: ${result.includes(test.expected) ? '✅' : '❌'}\n`);
}
```

### Automated Testing
```typescript
describe('Ticket Subject Generation', () => {
  it('should generate concise subjects', async () => {
    const input = 'My computer keeps crashing with blue screen';
    const subject = await generateSubject(input);

    expect(subject.length).toBeGreaterThan(5);
    expect(subject.length).toBeLessThan(100);
    expect(subject).not.toContain('...');
  });

  it('should handle empty input gracefully', async () => {
    const subject = await generateSubject('');
    expect(subject).toBe('Support Request');
  });
});
```

## Advanced Techniques

### 1. Prompt Chaining (Multi-Step)

```typescript
// Step 1: Extract info
const analysis = await ai.generate({
  prompt: `Extract key details from this ticket as JSON:
  {
    "issue": "brief description",
    "affectedSystem": "system name",
    "errorCode": "code if present"
  }

  Ticket: ${content}`
});

// Step 2: Use extracted info
const solution = await ai.generate({
  prompt: `Given this issue analysis:
  ${analysis}

  Suggest 3 troubleshooting steps specific to this error.`
});
```

### 2. Self-Consistency (Multiple Attempts)

```typescript
// Generate multiple responses and pick best
async function generateWithConsistency(prompt: string, attempts: number = 3) {
  const responses = await Promise.all(
    Array(attempts).fill(null).map(() => ai.generate({ prompt }))
  );

  // Pick most common or highest quality
  return selectBest(responses);
}
```

### 3. Prompt Injection Defense

```typescript
// Protect against prompt injection
function sanitizeForPrompt(userInput: string): string {
  // Remove potential prompt manipulation
  return userInput
    .replace(/system:/gi, 'user mentioned:')
    .replace(/ignore previous/gi, '[filtered]')
    .replace(/new instruction/gi, '[filtered]')
    .trim();
}

// Use in prompts
const safeInput = sanitizeForPrompt(req.body.content);
const prompt = `Analyze this ticket: ${safeInput}`;
```

## Prompt Debugging

### When Results Are Bad

**1. Add Explicit Examples**
```
Before: "Classify priority"
After: "Classify priority. Examples: 'Site down' = critical, 'Change email' = low"
```

**2. Break Into Steps**
```
Before: "Analyze and suggest solution"
After: "Step 1: Identify the problem. Step 2: List possible causes. Step 3: Suggest solutions."
```

**3. Add Negative Examples**
```
"Generate subject. Do NOT use generic terms like 'issue' or 'problem'.
Good: 'Database connection timeout after deployment'
Bad: 'There is a problem with the database'"
```

**4. Increase Specificity**
```
Before: "Summarize ticket"
After: "Summarize in exactly 2 sentences: (1) what broke, (2) user impact"
```

**5. Test With Edge Cases**
```typescript
const edgeCases = [
  '', // Empty
  'a', // Too short
  'x'.repeat(10000), // Too long
  '!!!???', // Only punctuation
  'normal ticket content' // Control
];
```

## Performance Optimization

### Reduce Token Usage
```
❌ Verbose: "I would like you to please analyze this support ticket carefully and provide me with a detailed summary of what the main issue is that the user is experiencing."

✅ Concise: "Analyze this ticket and summarize the main issue in one sentence."

Savings: ~30 tokens
```

### Cache System Prompts
```typescript
// Reuse same system prompt for multiple requests
const systemPrompt = "You are a support ticket analyzer...";

// Don't recreate it each time
const requests = tickets.map(ticket => ({
  model: 'gpt-5-mini',
  messages: [
    { role: 'system', content: systemPrompt }, // Reused
    { role: 'user', content: ticket.content }
  ]
}));
```

### Batch Similar Requests
```typescript
// Instead of individual calls
for (const ticket of tickets) {
  await generateSubject(ticket);
}

// Batch if API supports
const subjects = await Promise.all(
  tickets.map(ticket => generateSubject(ticket))
);
```

## Real-World Examples

### Ticket Subject Generation
```typescript
const TICKET_SUBJECT_PROMPT = (content: string) => `
Generate a concise ticket subject (5-10 words) that captures the main issue.

Guidelines:
- Be specific and actionable
- Include technical terms or error codes if present
- Professional tone
- Focus on the problem, not the user

Description: ${content}

Subject:`;
```

### Technical Analysis
```typescript
const TECHNICAL_ANALYSIS_PROMPT = (content: string) => `
Analyze this technical support ticket and provide:

1. Problem Summary (1 sentence)
2. Severity (low/medium/high/critical)
3. Affected System/Component
4. Recommended Next Steps (3-5 bullet points)

Keep it concise and actionable.

Ticket: ${content}

Analysis:`;
```

### Self-Help Suggestions
```typescript
const SELF_HELP_PROMPT = (issue: string) => `
Provide 3-5 self-help troubleshooting steps for this issue.

Requirements:
- Numbered list
- Start with simplest steps
- Each step is one clear action
- No technical jargon unless necessary

Issue: ${issue}

Steps:`;
```

## Resources & References

- OpenAI Prompt Engineering Guide: https://platform.openai.com/docs/guides/prompt-engineering
- Anthropic Claude Prompting Guide: https://docs.anthropic.com/claude/docs/prompt-engineering
- Best Practices Compilation: https://www.promptingguide.ai/

## Key Takeaways

1. **Specificity wins**: Clear, detailed prompts get better results
2. **Format matters**: Always specify expected output structure
3. **Test everything**: Prompts are code, treat them like it
4. **Iterate rapidly**: First prompt rarely perfect
5. **Use examples**: Few-shot learning is powerful
6. **Set boundaries**: Constraints improve quality
7. **Simplify**: Shorter prompts = lower costs
8. **Version control**: Track what works and what doesn't
