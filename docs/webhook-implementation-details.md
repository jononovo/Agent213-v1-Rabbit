# Webhook System Implementation Details

This document provides code-level implementation details of the webhook system, focusing on the internal mechanisms and data flows.

## Contents

1. [Webhook Registration Process](#webhook-registration-process)
2. [Webhook Trigger Node Implementation](#webhook-trigger-node-implementation)
3. [Data Flow Through System](#data-flow-through-system)
4. [Send to Webhook Node Implementation](#send-to-webhook-node-implementation)
5. [Test Mode Execution](#test-mode-execution)
6. [Troubleshooting Implementation Issues](#troubleshooting-implementation-issues)

## Webhook Registration Process

### Integration Client Implementation

The webhook_trigger node uses the integration client to register itself with the Integration Engine:

```typescript
// From client/src/lib/integrationClient.ts
export interface IntegrationClient {
  registerIntegration(options: {
    nodeType: string;
    capabilities: {
      provides: { endpoint?: boolean; webhook?: boolean; };
      endpoint?: {
        pathTemplate: string;
        methods: string[];
        authTypes: string[];
      };
    };
    workflowId: number;
    nodeId: string;
    description: string;
  }): Promise<{
    success: boolean;
    path: string;
    methods: string[];
    workflowId: number;
    nodeId: string;
    description: string;
  }>;
  
  getIntegrationUrl(path: string): string;
}

export class DefaultIntegrationClient implements IntegrationClient {
  private baseUrl: string;
  
  constructor() {
    // In production, this would use the actual server domain
    this.baseUrl = 'http://localhost:3001';
  }
  
  async registerIntegration(options: {...}): Promise<{...}> {
    const response = await fetch(`${this.baseUrl}/api/integration/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to register integration: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  getIntegrationUrl(path: string): string {
    return `${this.baseUrl}/${path}`;
  }
}
```

### Integration Engine Registration Handler

The Integration Engine handles registration requests and maintains the webhook registry:

```typescript
// From integration-engine/webhook-server.ts
app.post('/api/integration/register', async (req: Request, res: Response) => {
  try {
    const {
      nodeType,
      capabilities,
      workflowId,
      nodeId,
      description
    } = req.body;
    
    if (!capabilities?.provides?.endpoint || !capabilities?.endpoint?.pathTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid integration capabilities'
      });
    }
    
    const path = capabilities.endpoint.pathTemplate;
    const methods = capabilities.endpoint.methods || ['POST'];
    
    // Register in the webhook registry
    webhookRegistry.set(path, {
      workflowId,
      nodeId,
      methods,
      description,
      createdAt: new Date()
    });
    
    // Log the registration
    console.log(`Registered webhook: ${path} for workflow ${workflowId}, node ${nodeId}`);
    
    return res.status(200).json({
      success: true,
      path,
      methods,
      workflowId,
      nodeId,
      description
    });
  } catch (error) {
    console.error('Integration registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register integration'
    });
  }
});
```

## Webhook Trigger Node Implementation

### Webhook Trigger Node Executor

The executor is responsible for handling both test execution and real webhook triggers:

```typescript
// From client/src/nodes/categories/System/webhook_trigger/executor.ts
export async function execute(
  nodeData: Record<string, any>,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  const startTime = new Date();
  
  try {
    // Extract node data and settings (workflowId might come from configuration)
    const { path, workflowId, nodeId, id, settings = {} } = nodeData;
    
    // During test execution, try to derive workflowId and nodeId if not provided directly
    const effectiveWorkflowId = workflowId || settings.workflowId || 
        (typeof window !== 'undefined' && window.location.pathname.match(/\/workflow-test\/(\d+)/)?.[1]);
    
    // Make sure we have the node ID for test execution
    // In test mode, the nodeId might be missing but we can identify it in multiple ways
    
    // First, check if nodeId is directly provided
    let effectiveNodeId = nodeId;
    
    // If not, try to use the id parameter which should be the full instance ID (nodetype-timestamp)
    if (!effectiveNodeId && id) {
      effectiveNodeId = id;
    }
    
    // If still not found and we're in browser context, try to extract from URL
    if (!effectiveNodeId && typeof window !== 'undefined') {
      // For test execution in the node tester UI, the node ID is in the URL path
      const urlMatch = window.location.pathname.match(/\/([^\/]+?-\d+)/);
      if (urlMatch && urlMatch[1]) {
        effectiveNodeId = urlMatch[1];
      }
    }
    
    // In test mode, if we don't have a node ID, use the current node instance ID from the execution context
    // This ensures we always have a valid node ID for webhook URLs
    if (!effectiveNodeId && typeof id === 'string') {
      effectiveNodeId = id;
    }
    
    // Generate a webhook URL for display - always include the node ID for proper routing
    const webhookPath = path 
      ? `webhooks/${path}` 
      : `webhooks/workflow/${effectiveWorkflowId}/node/${effectiveNodeId || 'webhook_trigger-' + Date.now()}`;
    
    // Try to register the webhook if we have enough info
    let registrationResult = null;
    if (effectiveWorkflowId) {
      try {
        registrationResult = await integrationClient.registerIntegration({
          nodeType: 'webhook_trigger',
          capabilities: {
            provides: { endpoint: true, webhook: true },
            endpoint: {
              pathTemplate: webhookPath,
              methods: ['POST', 'GET'],
              authTypes: ['none']
            }
          },
          workflowId: Number(effectiveWorkflowId),
          nodeId: effectiveNodeId || id || 'webhook_trigger-' + Date.now(),
          description: `Webhook for workflow ${effectiveWorkflowId}`
        });
      } catch (regError) {
        console.error('Webhook registration error:', regError);
      }
    }
    
    // Create a response that looks like a real webhook trigger
    const result = {
      success: true,
      message: "Webhook trigger executed successfully",
      timestamp: startTime.toISOString(),
      webhookUrl: integrationClient.getIntegrationUrl(webhookPath),
      registered: !!registrationResult,
      webhookData: {
        workflowId: effectiveWorkflowId,
        nodeId: effectiveNodeId || id || 'webhook_trigger-' + Date.now(),
        method: "POST",
        payload: { inputText: nodeData.inputText || "Test webhook payload" }
      }
    };
    
    // Return in the expected format
    return {
      items: [
        { 
          json: result,
          text: JSON.stringify(result)
        }
      ],
      meta: {
        startTime,
        endTime: new Date(),
        source: 'webhook_trigger',
        webhookData: {
          nodeId: effectiveNodeId || id || 'webhook_trigger-' + Date.now(),
          workflowId: effectiveWorkflowId 
        }
      }
    };
  } catch (error: any) {
    // Error handling...
  }
}
```

## Data Flow Through System

### Integration Engine Webhook Handler

The Integration Engine receives webhook requests and forwards them to the Workflow Execution Server:

```typescript
// From integration-engine/webhook-server.ts
app.all('/webhooks/:path(*)', async (req: Request, res: Response) => {
  const fullPath = `webhooks/${req.params.path}`;
  
  // Look up the webhook in the registry
  const webhook = webhookRegistry.get(fullPath);
  
  if (!webhook) {
    // Try pattern matching for parameterized paths
    // ...
    
    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      });
    }
  }
  
  // Extract workflow and node information
  const { workflowId, nodeId } = webhook;
  
  // Create a standardized webhook payload
  const webhookData = {
    id: uuid(),
    workflowId: String(workflowId),
    nodeId,
    timestamp: Date.now(),
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    path: fullPath,
    respondDirectly: true  // Flag to indicate we should respond to this request
  };
  
  try {
    // Forward to the Workflow Execution Server
    const executionResponse = await fetch('http://localhost:3002/api/workflow-execution/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowId,
        triggerNodeId: nodeId,
        input: webhookData,
        executeMode: 'webhook'
      })
    });
    
    const executionResult = await executionResponse.json();
    
    if (webhookData.respondDirectly) {
      // Hold the connection open until we get a response or timeout
      // The Workflow Execution Server will use the requestId to match the response
      pendingWebhookResponses.set(webhookData.id, {
        request: req,
        response: res,
        createdAt: Date.now()
      });
      
      // Set a timeout to return a default response if the workflow takes too long
      setTimeout(() => {
        if (pendingWebhookResponses.has(webhookData.id)) {
          pendingWebhookResponses.delete(webhookData.id);
          res.status(202).json({
            success: true,
            message: 'Request accepted but processing is still in progress'
          });
        }
      }, WEBHOOK_TIMEOUT);
    } else {
      // Respond immediately if not expecting a direct response
      res.status(202).json({
        success: true,
        message: 'Webhook received and processing started'
      });
    }
  } catch (error) {
    console.error('Error forwarding webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook'
    });
  }
});

// Handle webhook responses
app.post('/api/webhook-response', (req: Request, res: Response) => {
  const { requestId, data, statusCode = 200 } = req.body;
  
  if (!requestId || !pendingWebhookResponses.has(requestId)) {
    return res.status(404).json({
      success: false,
      message: 'No pending webhook request found with this ID'
    });
  }
  
  const pendingResponse = pendingWebhookResponses.get(requestId);
  pendingWebhookResponses.delete(requestId);
  
  // Send the response back to the original caller
  pendingResponse.response.status(statusCode).json(data);
  
  return res.status(200).json({
    success: true,
    message: 'Webhook response sent successfully'
  });
});
```

### Workflow Execution Server Processing

The Workflow Execution Server processes the webhook request through the workflow:

```typescript
// From workflow-execution/engine/workflowEngine.ts
async function executeWorkflow(options: {
  workflowId: number;
  triggerNodeId?: string;
  input?: any;
  executeMode?: 'normal' | 'webhook' | 'test';
}): Promise<WorkflowExecutionResult> {
  const { workflowId, triggerNodeId, input, executeMode = 'normal' } = options;
  
  // Fetch the workflow definition
  const workflow = await fetchWorkflowDefinition(workflowId);
  
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }
  
  // Create execution context
  const executionContext = createExecutionContext(workflow);
  
  // If this is a webhook trigger, inject the input to the trigger node
  if (executeMode === 'webhook' && triggerNodeId && input) {
    executionContext.setNodeInput(triggerNodeId, 'default', {
      items: [{ json: input }],
      meta: {
        startTime: new Date(),
        endTime: new Date()
      }
    });
  }
  
  // Execute the workflow
  try {
    await executeNodes(executionContext);
    
    return {
      success: true,
      workflowId,
      executionId: executionContext.executionId,
      status: 'completed',
      output: executionContext.getOutput()
    };
  } catch (error) {
    return {
      success: false,
      workflowId,
      executionId: executionContext.executionId,
      status: 'error',
      error: error.message
    };
  }
}
```

## Send to Webhook Node Implementation

### Send to Webhook Node Executor

This node handles responding to original webhook requests:

```typescript
// From client/src/nodes/categories/System/send_to_webhook/executor.ts
export async function execute(
  nodeData: SendToWebhookNodeData,
  inputs: Record<string, NodeExecutionData> = {}
): Promise<NodeExecutionData> {
  const startTime = new Date();
  
  try {
    // Get input data
    const inputData = inputs.data?.items?.[0]?.json || {};
    
    // Check if this is responding to an original webhook request
    const respondToOriginal = 
      nodeData.respondToOriginal === true || 
      nodeData.respondToOriginal === 'true' || 
      nodeData.isWebhookResponse === true || 
      nodeData.isWebhookResponse === 'true' ||
      (nodeData.settings && 
        (nodeData.settings.respondToOriginal === true || 
         nodeData.settings.respondToOriginal === 'true'));
    
    // Handle webhook response if applicable and if we have a requestId
    if (respondToOriginal && inputData.requestId && inputData.isWebhookRequest) {
      console.log('Send to webhook node is handling webhook response for request:', inputData.requestId);
      
      // Send the response directly to the Workflow Execution Server
      const response = await fetch('http://localhost:3002/api/webhook-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: inputData.requestId,
          data: inputData.payload || inputData,
          statusCode: 200 // Default status code
        })
      });
      
      const result = await response.json();
      
      // Return the result indicating we've handled the webhook response
      return {
        items: [
          {
            json: {
              webhookResponse: {
                success: result.success,
                message: result.message,
                requestId: inputData.requestId
              }
            },
            text: JSON.stringify({
              webhookResponse: {
                success: result.success,
                message: result.message,
                requestId: inputData.requestId
              }
            })
          }
        ],
        meta: {
          startTime,
          endTime: new Date(),
          isWebhookResponse: true,
          handled: result.success
        }
      };
    }
    
    // Regular webhook sending logic for non-response cases
    // Only require URL if we're not responding to an original webhook
    if (!respondToOriginal && !nodeData.url) {
      throw new Error('Webhook URL is required');
    }
    
    // Skip the HTTP request if we're responding to an original webhook
    // This handles the case where URL is not provided but respondToOriginal is true
    if (respondToOriginal) {
      return {
        items: [
          {
            json: { 
              success: true, 
              message: "This node is configured to respond to the original webhook" 
            },
            text: JSON.stringify({ 
              success: true, 
              message: "This node is configured to respond to the original webhook" 
            }),
            _key: "response"
          },
          {
            json: 200,
            text: "200",
            _key: "status"
          },
          {
            json: {},
            text: "{}",
            _key: "headers"
          },
          {
            json: {
              success: true,
              isWebhookResponse: true,
              status: 200,
              message: "Configured to respond to original webhook"
            },
            text: JSON.stringify({
              success: true,
              isWebhookResponse: true,
              status: 200,
              message: "Configured to respond to original webhook"
            }),
            _key: "meta"
          }
        ],
        meta: {
          startTime,
          endTime: new Date(),
          executionTime: 0,
          source: 'send_to_webhook'
        }
      };
    }
    
    // Regular webhook sending logic (omitted for brevity)
    // ...
  } catch (error) {
    // Error handling...
  }
}
```

## Test Mode Execution

### Test Bench Initialization

The test bench simulates a webhook request for testing:

```typescript
// From client/src/components/workflow/TestBench.tsx
async function executeWebhookTest(workflowId: number, nodeId: string) {
  // Create a simulated webhook request
  const simulatedWebhookData = {
    query: "Test query",
    searchId: `test_${Date.now()}`,
    callbackUrl: "https://example.com/callback",
    userId: 1,
    parameters: {
      limit: 10
    }
  };
  
  try {
    // Start the test execution
    const response = await fetch('/api/workflow-execution/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowId,
        triggerNodeId: nodeId,
        input: {
          id: `test-${Date.now()}`,
          workflowId: String(workflowId),
          nodeId,
          timestamp: Date.now(),
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'user-agent': 'TestBench/1.0'
          },
          body: simulatedWebhookData,
          path: `/webhooks/workflow/${workflowId}/node/${nodeId}`,
          // Test flag
          isTestExecution: true
        },
        executeMode: 'test'
      })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Test execution error:', error);
    throw error;
  }
}
```

## Troubleshooting Implementation Issues

### Webhook Debugging Tools

To diagnose webhook issues, these code snippets can be added to help track data flow:

```typescript
// Add to webhook_trigger/executor.ts to trace data propagation
console.log('Webhook trigger output:', JSON.stringify({
  workflowId: effectiveWorkflowId,
  nodeId: effectiveNodeId,
  webhookPath,
  input: inputData
}, null, 2));

// Add to send_to_webhook/executor.ts to trace input data
console.log('Send to webhook input:', JSON.stringify({
  respondToOriginal,
  inputData,
  hasRequestId: !!inputData.requestId,
  isWebhookRequest: !!inputData.isWebhookRequest
}, null, 2));

// Add to workflow-execution/engine/workflowEngine.ts to trace execution
console.log('Node execution:', {
  nodeId,
  nodeType,
  hasInput: !!nodeInput,
  inputKeys: nodeInput ? Object.keys(nodeInput) : []
});
```

### Common Implementation Issues

1. **Missing requestId Propagation**

If the `requestId` is not being properly passed through the workflow, check that the webhook_trigger node is properly including it in its output:

```typescript
// Ensure webhook_trigger includes the requestId in its output
return {
  items: [
    { 
      json: {
        ...result,
        requestId: input.id, // Make sure the requestId is included
        isWebhookRequest: true // Flag as a webhook request
      },
      text: JSON.stringify({
        ...result,
        requestId: input.id,
        isWebhookRequest: true
      })
    }
  ],
  meta: {
    // ...
  }
};
```

2. **Node ID Resolution Issues**

If node IDs are not being properly resolved, implement this fallback strategy:

```typescript
// Ensure a valid node ID is always available
let nodeId = originalNodeId;

// Fallback chain
if (!nodeId && nodeInstanceId) {
  nodeId = nodeInstanceId;
} else if (!nodeId) {
  // Generate a deterministic ID based on available information
  nodeId = `node-${workflowId}-${Date.now()}`;
  
  // Log the generated ID for debugging
  console.log(`Generated fallback node ID: ${nodeId}`);
}
```

3. **Webhook Registration Failures**

If webhook registration is failing, implement this diagnostic code:

```typescript
// Add detailed error logging for registration failures
try {
  const regResult = await integrationClient.registerIntegration({
    // ...registration parameters
  });
  
  console.log('Webhook registration successful:', regResult);
  return regResult;
} catch (error) {
  console.error('Webhook registration failed with error:', error);
  console.error('Registration parameters:', {
    nodeType,
    workflowId,
    nodeId,
    pathTemplate
  });
  
  // Try a simplified registration as fallback
  try {
    const fallbackResult = await integrationClient.registerIntegration({
      nodeType: 'webhook_trigger',
      capabilities: {
        provides: { endpoint: true },
        endpoint: {
          pathTemplate: `webhooks/fallback/${Date.now()}`,
          methods: ['POST'],
          authTypes: ['none']
        }
      },
      workflowId: Number(workflowId) || 0,
      nodeId: nodeId || `fallback-${Date.now()}`,
      description: 'Fallback webhook registration'
    });
    
    console.log('Fallback registration succeeded:', fallbackResult);
    return fallbackResult;
  } catch (fallbackError) {
    console.error('Even fallback registration failed:', fallbackError);
    throw error; // Throw the original error
  }
}
```