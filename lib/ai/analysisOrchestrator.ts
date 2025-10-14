/**
 * AI Analysis Orchestrator
 * Multi-step workflow system designed for future AI agent compatibility
 */

export interface AnalysisStep {
  id: string;
  name: string;
  prompt: string;
  dependencies: string[]; // Which steps must complete first
  tools?: string[]; // Future: web_search, read_pdf, etc
  output: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

export interface AnalysisWorkflow {
  id: string;
  jobId: string;
  workflowType: 'company_intelligence' | 'people_analysis' | 'match_analysis';
  steps: AnalysisStep[];
  currentStepIndex: number;
  results: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
}

/**
 * Company Intelligence Workflow (3-step process)
 */
export function createCompanyIntelligenceWorkflow(
  jobId: string,
  companyName: string,
  companyUrls: string[]
): AnalysisWorkflow {
  return {
    id: `company_${jobId}_${Date.now()}`,
    jobId,
    workflowType: 'company_intelligence',
    currentStepIndex: 0,
    results: {},
    status: 'pending',
    createdAt: Date.now(),
    steps: [
      {
        id: 'fetch_reports',
        name: 'Fetch Financial Reports',
        prompt: `Search for financial reports and public filings for ${companyName}`,
        dependencies: [],
        tools: ['web_search', 'read_pdf'],
        output: null,
        status: 'pending',
      },
      {
        id: 'analyze_trends',
        name: 'Analyze Trends',
        prompt: `Analyze financial trends and spending patterns from the fetched reports`,
        dependencies: ['fetch_reports'],
        tools: [],
        output: null,
        status: 'pending',
      },
      {
        id: 'generate_insights',
        name: 'Generate Insights',
        prompt: `Synthesize all data into actionable insights and recommendations`,
        dependencies: ['fetch_reports', 'analyze_trends'],
        tools: [],
        output: null,
        status: 'pending',
      },
    ],
  };
}

/**
 * Execute a single step in the workflow
 */
export async function executeWorkflowStep(
  workflow: AnalysisWorkflow,
  stepId: string,
  executeFunction: (step: AnalysisStep, previousResults: Record<string, any>) => Promise<any>
): Promise<AnalysisWorkflow> {
  const step = workflow.steps.find((s) => s.id === stepId);
  if (!step) {
    throw new Error(`Step ${stepId} not found in workflow`);
  }

  // Check dependencies
  const incompleteDeps = step.dependencies.filter(
    (depId) => !workflow.results[depId]
  );
  if (incompleteDeps.length > 0) {
    throw new Error(
      `Step ${stepId} has incomplete dependencies: ${incompleteDeps.join(', ')}`
    );
  }

  // Update step status
  step.status = 'running';
  workflow.status = 'running';

  try {
    // Execute the step
    const result = await executeFunction(step, workflow.results);
    
    // Update step and workflow
    step.output = result;
    step.status = 'completed';
    workflow.results[stepId] = result;

    // Check if all steps are complete
    const allComplete = workflow.steps.every((s) => s.status === 'completed');
    if (allComplete) {
      workflow.status = 'completed';
      workflow.completedAt = Date.now();
    }

    return workflow;
  } catch (error: any) {
    step.status = 'failed';
    step.error = error.message;
    workflow.status = 'failed';
    throw error;
  }
}

/**
 * Get next executable step (dependencies satisfied, not yet completed)
 */
export function getNextStep(workflow: AnalysisWorkflow): AnalysisStep | null {
  for (const step of workflow.steps) {
    if (step.status === 'completed' || step.status === 'failed') {
      continue;
    }

    // Check if all dependencies are satisfied
    const allDepsSatisfied = step.dependencies.every(
      (depId) => workflow.results[depId] !== undefined
    );

    if (allDepsSatisfied) {
      return step;
    }
  }

  return null;
}

/**
 * Store workflow in database
 * For now, this is a placeholder - would need to add DB table for workflows
 */
export async function saveWorkflow(workflow: AnalysisWorkflow): Promise<void> {
  // TODO: Save to database
  // For now, store in sessionStorage as temporary solution
  if (typeof window !== 'undefined') {
    const key = `workflow_${workflow.id}`;
    sessionStorage.setItem(key, JSON.stringify(workflow));
  }
}

/**
 * Load workflow from database
 */
export async function loadWorkflow(workflowId: string): Promise<AnalysisWorkflow | null> {
  // TODO: Load from database
  // For now, load from sessionStorage as temporary solution
  if (typeof window !== 'undefined') {
    const key = `workflow_${workflowId}`;
    const data = sessionStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  }
  return null;
}

/**
 * Migration path for future AI agents:
 * 
 * 1. Replace executeWorkflowStep with agent.run(step)
 * 2. Add tool integrations (web_search, read_pdf, etc.)
 * 3. Update workflow definition to include tool configurations
 * 4. No UI changes required - steps and progress tracking remain the same
 * 
 * Example with OpenAI Assistants API (future):
 * 
 * const agent = new OpenAI.Assistant({
 *   tools: step.tools.map(toolName => getToolDefinition(toolName)),
 *   instructions: step.prompt
 * });
 * 
 * const result = await agent.run();
 */

