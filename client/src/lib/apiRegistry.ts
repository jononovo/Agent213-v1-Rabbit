/**
 * API Registry
 * 
 * This file contains metadata about the available API endpoints in the system.
 * It is used to generate documentation and provide information to client components.
 */

export interface ApiEndpoint {
  /** The path of the endpoint, including parameters (e.g., /api/agents/:id) */
  path: string;
  
  /** The HTTP method for this endpoint (GET, POST, PUT, DELETE, etc.) */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ALL';
  
  /** A short description of what the endpoint does */
  description: string;
  
  /** The category the endpoint belongs to for organization */
  category: 'agents' | 'workflows' | 'nodes' | 'logs' | 'config' | 'proxy' | 'debug' | 'internal';
  
  /** Sample request format (for endpoints that accept request bodies) */
  requestFormat?: string;
  
  /** Sample response format */
  responseFormat?: string;
  
  /** Query parameters accepted by the endpoint */
  queryParams?: {
    name: string;
    description: string;
    type: string;
    required: boolean;
  }[];
  
  /** Path parameters in the endpoint */
  pathParams?: {
    name: string;
    description: string;
    type: string;
  }[];
  
  /** Authorization required for the endpoint */
  requiresAuth?: boolean;
  
  /** Whether this endpoint is intended for internal use only */
  internal?: boolean;
}

/**
 * Registry of API endpoints
 */
export const apiEndpoints: ApiEndpoint[] = [
  // Agents endpoints
  {
    path: '/api/agents',
    method: 'GET',
    description: 'Get a list of all agents',
    category: 'agents',
    responseFormat: '[{ id: number, name: string, description: string, ... }]',
    queryParams: [
      {
        name: 'type',
        description: 'Filter agents by type',
        type: 'string',
        required: false
      }
    ]
  },
  {
    path: '/api/agents/:id',
    method: 'GET',
    description: 'Get a specific agent by ID',
    category: 'agents',
    responseFormat: '{ id: number, name: string, description: string, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Agent ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/agents',
    method: 'POST',
    description: 'Create a new agent',
    category: 'agents',
    requestFormat: '{ name: string, description: string, type: string, ... }',
    responseFormat: '{ id: number, name: string, description: string, ... }'
  },
  {
    path: '/api/agents/:id',
    method: 'PUT',
    description: 'Update an existing agent',
    category: 'agents',
    requestFormat: '{ name?: string, description?: string, type?: string, ... }',
    responseFormat: '{ id: number, name: string, description: string, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Agent ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/agents/:id',
    method: 'DELETE',
    description: 'Delete an agent',
    category: 'agents',
    pathParams: [
      {
        name: 'id',
        description: 'Agent ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/agents/:id/workflows',
    method: 'GET',
    description: 'Get workflows associated with an agent',
    category: 'agents',
    responseFormat: '[{ id: number, name: string, description: string, ... }]',
    pathParams: [
      {
        name: 'id',
        description: 'Agent ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/agents/:id/logs',
    method: 'GET',
    description: 'Get logs for a specific agent',
    category: 'agents',
    responseFormat: '[{ id: number, agentId: number, workflowId: number, ... }]',
    pathParams: [
      {
        name: 'id',
        description: 'Agent ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/agents/:id/trigger',
    method: 'POST',
    description: 'Trigger an agent to execute its workflows',
    category: 'agents',
    requestFormat: '{ input: string | object, metadata?: object }',
    responseFormat: '{ success: boolean, result: object, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Agent ID',
        type: 'number'
      }
    ]
  },

  // Workflow endpoints
  {
    path: '/api/workflows',
    method: 'GET',
    description: 'Get a list of all workflows',
    category: 'workflows',
    responseFormat: '[{ id: number, name: string, description: string, ... }]',
    queryParams: [
      {
        name: 'type',
        description: 'Filter workflows by type',
        type: 'string',
        required: false
      }
    ]
  },
  {
    path: '/api/workflows/:id',
    method: 'GET',
    description: 'Get a specific workflow by ID',
    category: 'workflows',
    responseFormat: '{ id: number, name: string, description: string, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Workflow ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/workflows',
    method: 'POST',
    description: 'Create a new workflow',
    category: 'workflows',
    requestFormat: '{ name: string, description: string, agentId?: number, ... }',
    responseFormat: '{ id: number, name: string, description: string, ... }'
  },
  {
    path: '/api/workflows/:id',
    method: 'PUT',
    description: 'Update an existing workflow',
    category: 'workflows',
    requestFormat: '{ name?: string, description?: string, agentId?: number, ... }',
    responseFormat: '{ id: number, name: string, description: string, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Workflow ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/workflows/:id',
    method: 'PATCH',
    description: 'Partially update a workflow',
    category: 'workflows',
    requestFormat: '{ name?: string, description?: string, flowData?: object, ... }',
    responseFormat: '{ id: number, name: string, description: string, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Workflow ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/workflows/:id',
    method: 'DELETE',
    description: 'Delete a workflow',
    category: 'workflows',
    pathParams: [
      {
        name: 'id',
        description: 'Workflow ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/workflows/:id/execute',
    method: 'POST',
    description: 'Execute a workflow with the provided input',
    category: 'workflows',
    requestFormat: '{ input: string | object, metadata?: object }',
    responseFormat: '{ success: boolean, output: any, logId: number, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Workflow ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/workflows/:id/trigger',
    method: 'POST',
    description: 'Trigger a workflow using client-side workflow engine',
    category: 'workflows',
    requestFormat: '{ input: string | object, metadata?: object }',
    responseFormat: '{ success: boolean, result: object, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Workflow ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/workflows/run',
    method: 'POST',
    description: 'Run a workflow with the provided flow data directly (without saving)',
    category: 'workflows',
    requestFormat: '{ name: string, flowData: object, input: string | object, ... }',
    responseFormat: '{ success: boolean, output: any, logId: number, ... }'
  },
  {
    path: '/api/test-workflow/:id',
    method: 'POST',
    description: 'Test a workflow with the provided input and get detailed execution results',
    category: 'workflows',
    requestFormat: '{ input: string | object, metadata?: object }',
    responseFormat: '{ success: boolean, nodeResults: object, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Workflow ID',
        type: 'number'
      }
    ]
  },

  // Node endpoints
  {
    path: '/api/nodes',
    method: 'GET',
    description: 'Get a list of all nodes',
    category: 'nodes',
    responseFormat: '[{ id: number, name: string, description: string, ... }]',
    queryParams: [
      {
        name: 'type',
        description: 'Filter nodes by type',
        type: 'string',
        required: false
      }
    ]
  },
  {
    path: '/api/nodes/:id',
    method: 'GET',
    description: 'Get a specific node by ID',
    category: 'nodes',
    responseFormat: '{ id: number, name: string, description: string, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Node ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/nodes',
    method: 'POST',
    description: 'Create a new node',
    category: 'nodes',
    requestFormat: '{ name: string, description: string, type: string, ... }',
    responseFormat: '{ id: number, name: string, description: string, ... }'
  },
  {
    path: '/api/nodes/:id',
    method: 'PUT',
    description: 'Update an existing node',
    category: 'nodes',
    requestFormat: '{ name?: string, description?: string, type?: string, ... }',
    responseFormat: '{ id: number, name: string, description: string, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Node ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/nodes/:id',
    method: 'DELETE',
    description: 'Delete a node',
    category: 'nodes',
    pathParams: [
      {
        name: 'id',
        description: 'Node ID',
        type: 'number'
      }
    ]
  },

  // Logs endpoints
  {
    path: '/api/logs',
    method: 'GET',
    description: 'Get a list of execution logs',
    category: 'logs',
    responseFormat: '[{ id: number, agentId: number, workflowId: number, ... }]',
    queryParams: [
      {
        name: 'agentId',
        description: 'Filter logs by agent ID',
        type: 'number',
        required: false
      },
      {
        name: 'limit',
        description: 'Maximum number of logs to return',
        type: 'number',
        required: false
      }
    ]
  },
  {
    path: '/api/logs/:id',
    method: 'GET',
    description: 'Get a specific log by ID',
    category: 'logs',
    responseFormat: '{ id: number, agentId: number, workflowId: number, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Log ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/logs',
    method: 'POST',
    description: 'Create a new log entry',
    category: 'logs',
    requestFormat: '{ agentId: number, workflowId: number, status: string, ... }',
    responseFormat: '{ id: number, agentId: number, workflowId: number, ... }'
  },
  {
    path: '/api/logs/:id',
    method: 'PUT',
    description: 'Update an existing log entry',
    category: 'logs',
    requestFormat: '{ status?: string, output?: object, error?: string, ... }',
    responseFormat: '{ id: number, agentId: number, workflowId: number, ... }',
    pathParams: [
      {
        name: 'id',
        description: 'Log ID',
        type: 'number'
      }
    ]
  },

  // Config endpoints
  {
    path: '/api/config',
    method: 'GET',
    description: 'Get system configuration settings',
    category: 'config',
    responseFormat: '{ perplexityApiKey: string, claudeApiKey: string, ... }'
  },
  {
    path: '/api/config',
    method: 'POST',
    description: 'Update system configuration settings',
    category: 'config',
    requestFormat: '{ perplexityApiKey?: string, claudeApiKey?: string, ... }',
    responseFormat: '{ perplexityApiKey: string, claudeApiKey: string, ... }'
  },

  // Proxy endpoints
  {
    path: '/api/proxy',
    method: 'ALL',
    description: 'Proxy requests to external APIs',
    category: 'proxy',
    queryParams: [
      {
        name: 'url',
        description: 'Target URL to proxy the request to',
        type: 'string',
        required: true
      }
    ],
    requestFormat: 'Depends on the proxied endpoint',
    responseFormat: 'Depends on the proxied endpoint'
  },

  // Internal endpoints
  {
    path: '/api/internal/create-agent',
    method: 'POST',
    description: 'Internal endpoint for creating agents with workflow processing',
    category: 'internal',
    internal: true,
    requestFormat: '{ source: "ui_button" | "ai_chat", trigger_type: "new_agent" | "chat_instruction", ... }',
    responseFormat: '{ success: boolean, agent: object, workflow: object, ... }'
  },
  {
    path: '/api/notify-agent-creation',
    method: 'POST',
    description: 'Notification endpoint for completing agent creation process',
    category: 'internal',
    internal: true,
    requestFormat: '{ agentId: number, workflowId: number, ... }',
    responseFormat: '{ success: boolean, message: string }'
  },
  {
    path: '/api/user-chat-ui-main',
    method: 'POST',
    description: 'Main entry point for the user chat UI to interact with agents of any type',
    category: 'agents',
    requestFormat: '{ prompt: string, agentId?: number, sessionId?: string, metadata?: object }',
    responseFormat: '{ success: boolean, generatorResult?: object, coordinatorResult?: object, response?: string }',
    queryParams: [
      {
        name: 'stream',
        description: 'Whether to stream the response as SSE (Server-Sent Events)',
        type: 'boolean',
        required: false
      }
    ]
  },

  // Debug endpoints
  {
    path: '/api/debug/test-agent/:id',
    method: 'GET',
    description: 'Test an agent by ID (debug endpoint)',
    category: 'debug',
    internal: true,
    pathParams: [
      {
        name: 'id',
        description: 'Agent ID',
        type: 'number'
      }
    ]
  },
  {
    path: '/api/debug/list-agents',
    method: 'GET',
    description: 'List all agents with detailed information (debug endpoint)',
    category: 'debug',
    internal: true
  },
  {
    path: '/api/debug/test-agent-creation',
    method: 'GET',
    description: 'Test agent creation process (debug endpoint)',
    category: 'debug',
    internal: true
  }
];

/**
 * Get endpoints by category
 */
export function getEndpointsByCategory(category: ApiEndpoint['category']) {
  return apiEndpoints.filter(endpoint => endpoint.category === category);
}

/**
 * Get endpoints for a specific path
 */
export function getEndpointsForPath(path: string) {
  return apiEndpoints.filter(endpoint => endpoint.path === path);
}

/**
 * Get all available categories
 */
export function getAllCategories(): ApiEndpoint['category'][] {
  const categories = new Set<ApiEndpoint['category']>();
  apiEndpoints.forEach(endpoint => categories.add(endpoint.category));
  return Array.from(categories);
}