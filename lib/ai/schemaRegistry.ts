/**
 * Schema Registry
 * Central source of truth for AI output schemas with dependency tracking
 */

import { 
  MatchScoreOutput,
  CompanyIntelligenceOutput,
  PeopleProfilesOutput,
  CompanyEcosystemOutput,
  SkillsMatchOutput
} from './outputSchemas';

export interface SchemaDefinition {
  sectionId: string;
  version: string;
  schema: any;
  dependents: string[]; // Sections that consume this output
  changelog: string[];
  description: string;
}

/**
 * Central Schema Registry
 * When a schema changes, we can identify which other sections are affected
 */
export const SCHEMA_REGISTRY: Record<string, SchemaDefinition> = {
  matchScore: {
    sectionId: 'matchScore',
    version: 'v3',
    schema: {
      type: 'object',
      required: ['overallScore', 'categoryScores', 'signals', 'highlights', 'gaps', 'recommendations', 'sources'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 1 },
        categoryScores: {
          type: 'object',
          properties: {
            technical: { type: 'number' },
            experience: { type: 'number' },
            domain: { type: 'number' }
          }
        },
        signals: { type: 'array' },
        highlights: { type: 'array' },
        gaps: { type: 'array' },
        recommendations: { type: 'array' },
        sources: { type: 'array' }
      }
    },
    dependents: ['skillMatch', 'fitMatrix'],
    changelog: [
      'v3: Added categoryScores for 3-level grouping',
      'v2: Expanded signals from 25 to 50',
      'v1: Initial 25-signal version'
    ],
    description: 'Overall job fit with 50 signals (20 ATS + 30 dynamic)'
  },

  skillMatch: {
    sectionId: 'skillMatch',
    version: 'v2',
    schema: {
      type: 'object',
      required: ['skills', 'categoryScores', 'sources'],
      properties: {
        skills: { type: 'array' },
        categoryScores: { type: 'array' },
        sources: { type: 'array' }
      }
    },
    dependents: [],
    changelog: [
      'v2: Added categoryScores for unified visualization',
      'v1: Basic skill list with counts'
    ],
    description: 'Keyword-level skill analysis with category aggregation'
  },

  companyIntel: {
    sectionId: 'companyIntel',
    version: 'v2',
    schema: {
      type: 'object',
      required: ['name', 'tldr', 'description', 'financials', 'principles', 'culture', 'news', 'leadership', 'competitors', 'sources'],
      properties: {
        name: { type: 'string' },
        tldr: { type: 'string' },
        description: { type: 'string' },
        financials: { type: 'object' },
        principles: { type: 'array' },
        culture: { type: 'object' },
        news: { type: 'array' },
        leadership: { type: 'array' },
        competitors: { type: 'array' },
        sources: { type: 'array' }
      }
    },
    dependents: ['companyEcosystem', 'peopleProfiles'],
    changelog: [
      'v2: Added principles, news, culture keywords sections',
      'v1: Basic company overview'
    ],
    description: 'Comprehensive company intelligence and culture analysis'
  },

  companyEcosystem: {
    sectionId: 'companyEcosystem',
    version: 'v1',
    schema: {
      type: 'object',
      required: ['companies', 'sources'],
      properties: {
        companies: { type: 'array' },
        sources: { type: 'array' }
      }
    },
    dependents: [],
    changelog: ['v1: Initial version'],
    description: 'Competitor and adjacent company matrix'
  },

  peopleProfiles: {
    sectionId: 'peopleProfiles',
    version: 'v1',
    schema: {
      type: 'object',
      required: ['profiles', 'overallInsights', 'sources'],
      properties: {
        profiles: { type: 'array' },
        overallInsights: { type: 'object' },
        sources: { type: 'array' }
      }
    },
    dependents: [],
    changelog: ['v1: Initial version'],
    description: 'Interviewer background and communication style'
  },

  fitMatrix: {
    sectionId: 'fitMatrix',
    version: 'v1',
    schema: {
      type: 'object',
      required: ['overall', 'threshold', 'breakdown', 'sources'],
      properties: {
        overall: { type: 'number' },
        threshold: { type: 'number' },
        breakdown: { type: 'array' },
        sources: { type: 'array' }
      }
    },
    dependents: [],
    changelog: ['v1: Initial 50-signal version'],
    description: 'Detailed parameter-level fit analysis'
  }
};

/**
 * Get schema for a section
 */
export function getSchema(sectionId: string): any | null {
  const def = SCHEMA_REGISTRY[sectionId];
  return def ? def.schema : null;
}

/**
 * Get schema as formatted JSON string for prompts
 */
export function getSchemaString(sectionId: string, pretty: boolean = true): string {
  const schema = getSchema(sectionId);
  if (!schema) return '{}';
  
  return pretty ? JSON.stringify(schema, null, 2) : JSON.stringify(schema);
}

/**
 * Validate schema change and identify affected sections
 */
export function validateSchemaChange(
  sectionId: string,
  newSchema: any
): {
  valid: boolean;
  breakingChanges: string[];
  affectedSections: string[];
  warnings: string[];
} {
  const current = SCHEMA_REGISTRY[sectionId];
  
  if (!current) {
    return {
      valid: false,
      breakingChanges: ['Schema not found in registry'],
      affectedSections: [],
      warnings: []
    };
  }

  const breakingChanges: string[] = [];
  const warnings: string[] = [];

  // Check for removed required fields
  const oldRequired = current.schema.required || [];
  const newRequired = newSchema.required || [];
  
  oldRequired.forEach((field: string) => {
    if (!newRequired.includes(field)) {
      breakingChanges.push(`Removed required field: ${field}`);
    }
  });

  // Check for property type changes
  const oldProps = current.schema.properties || {};
  const newProps = newSchema.properties || {};
  
  Object.keys(oldProps).forEach(key => {
    if (newProps[key]) {
      if (oldProps[key].type !== newProps[key].type) {
        breakingChanges.push(`Changed type of ${key}: ${oldProps[key].type} → ${newProps[key].type}`);
      }
    } else {
      warnings.push(`Removed property: ${key}`);
    }
  });

  // Identify affected sections
  const affectedSections = current.dependents || [];

  return {
    valid: breakingChanges.length === 0,
    breakingChanges,
    affectedSections,
    warnings
  };
}

/**
 * Get all sections that depend on a given section
 */
export function getDependents(sectionId: string): string[] {
  const def = SCHEMA_REGISTRY[sectionId];
  return def ? def.dependents : [];
}

/**
 * Get changelog for a section
 */
export function getChangelog(sectionId: string): string[] {
  const def = SCHEMA_REGISTRY[sectionId];
  return def ? def.changelog : [];
}

/**
 * List all registered sections
 */
export function getAllRegisteredSections(): string[] {
  return Object.keys(SCHEMA_REGISTRY);
}

/**
 * Get schema definition with metadata
 */
export function getSchemaDefinition(sectionId: string): SchemaDefinition | null {
  return SCHEMA_REGISTRY[sectionId] || null;
}

/**
 * Generate prompt output format section from schema
 */
export function generateOutputFormatSection(sectionId: string): string {
  const def = SCHEMA_REGISTRY[sectionId];
  if (!def) return '';

  return `## 4. OUTPUT FORMAT

**CRITICAL**: You MUST return valid JSON matching this exact schema:

\`\`\`json
${getSchemaString(sectionId, true)}
\`\`\`

**Version**: ${def.version}
**Description**: ${def.description}

Do not deviate from this format. If data is unavailable, use null or empty arrays.

### Validation Rules:
- All fields in \`required\` array must be present
- Field types must match exactly (string, number, array, object)
- Arrays must contain items of consistent type
- Numbers must be within specified ranges (if defined)

### Example Output:
[Provide specific example based on ${sectionId} requirements]
`;
}

