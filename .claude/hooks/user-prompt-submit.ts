/**
 * User Prompt Submit Hook
 *
 * Analyzes user prompts and injects skill activation reminders before Claude processes them.
 * This is the breakthrough feature from the Reddit post - forces skills to activate automatically.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface SkillRule {
  type: string;
  enforcement: string;
  priority: string;
  description: string;
  promptTriggers: {
    keywords: string[];
    intentPatterns: string[];
  };
}

interface SkillRules {
  [skillName: string]: SkillRule;
}

/**
 * Load skill rules from configuration
 */
function loadSkillRules(): SkillRules {
  const skillRulesPath = join(process.cwd(), '.claude', 'skill-rules.json');

  if (!existsSync(skillRulesPath)) {
    return {};
  }

  try {
    const content = readFileSync(skillRulesPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Remove JSON schema property
    const { $schema, ...rules } = parsed;
    return rules as SkillRules;
  } catch (error) {
    console.error('Failed to load skill rules:', error);
    return {};
  }
}

/**
 * Analyze prompt for keyword matches
 */
function matchesKeywords(prompt: string, keywords: string[]): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return keywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()));
}

/**
 * Analyze prompt for intent pattern matches
 */
function matchesIntentPatterns(prompt: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(prompt);
    } catch (error) {
      return false;
    }
  });
}

/**
 * Analyze prompt and return triggered skills
 */
function analyzePrompt(prompt: string, skillRules: SkillRules): string[] {
  const triggeredSkills: string[] = [];

  for (const [skillName, config] of Object.entries(skillRules)) {
    const { promptTriggers } = config;

    if (!promptTriggers) continue;

    // Check keyword matches
    if (promptTriggers.keywords && matchesKeywords(prompt, promptTriggers.keywords)) {
      triggeredSkills.push(skillName);
      continue;
    }

    // Check intent pattern matches
    if (promptTriggers.intentPatterns && matchesIntentPatterns(prompt, promptTriggers.intentPatterns)) {
      triggeredSkills.push(skillName);
    }
  }

  return triggeredSkills;
}

/**
 * Prioritize skills (critical > high > medium > low)
 */
function prioritizeSkills(skills: string[], skillRules: SkillRules): string[] {
  const priorityOrder: { [key: string]: number } = {
    'critical': 1,
    'high': 2,
    'medium': 3,
    'low': 4,
  };

  return skills.sort((a, b) => {
    const priorityA = priorityOrder[skillRules[a]?.priority] || 99;
    const priorityB = priorityOrder[skillRules[b]?.priority] || 99;
    return priorityA - priorityB;
  });
}

/**
 * Create skill activation reminder
 */
function createReminder(skills: string[], skillRules: SkillRules): string {
  const skillList = skills
    .map(skill => {
      const description = skillRules[skill]?.description || '';
      return `  - **${skill}**: ${description}`;
    })
    .join('\n');

  return `

<skill-activation-reminder>
The following skills may be relevant to this task:

${skillList}

Consider using these skills to ensure best practices are followed.
</skill-activation-reminder>`;
}

/**
 * Main hook function
 * @param prompt - The user's prompt
 * @returns Modified prompt with skill activation reminders
 */
export default function onUserPromptSubmit(prompt: string): string {
  try {
    // Load skill rules
    const skillRules = loadSkillRules();

    if (Object.keys(skillRules).length === 0) {
      return prompt;
    }

    // Analyze prompt for triggered skills
    const triggeredSkills = analyzePrompt(prompt, skillRules);

    if (triggeredSkills.length === 0) {
      return prompt;
    }

    // Prioritize skills
    const prioritizedSkills = prioritizeSkills(triggeredSkills, skillRules);

    // Limit to top 3 skills (don't overwhelm)
    const topSkills = prioritizedSkills.slice(0, 3);

    // Create reminder and append to prompt
    const reminder = createReminder(topSkills, skillRules);
    return prompt + reminder;

  } catch (error) {
    console.error('Error in user-prompt-submit hook:', error);
    return prompt;
  }
}

// For testing
if (require.main === module) {
  const testPrompts = [
    'Create a new API endpoint for ticket creation',
    'Add a React component to display user profile',
    'Let\'s refactor this using a service layer',
    'Write tests for the ticket creation flow',
    'Build a new Windows installer for the desktop agent',
  ];

  console.log('Testing user-prompt-submit hook:\n');

  testPrompts.forEach((prompt, i) => {
    console.log(`Test ${i + 1}: "${prompt}"`);
    const result = onUserPromptSubmit(prompt);
    console.log(result.substring(prompt.length)); // Show only the added part
    console.log('---\n');
  });
}
