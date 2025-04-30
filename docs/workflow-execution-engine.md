# Workflow Execution Engine

The Workflow Execution Engine is a dedicated subsystem responsible for safely executing workflows in isolation from the main application. This document provides a detailed overview of its architecture, implementation, and integration with the rest of the platform.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Server Components](#server-components)
  - [Simple Queue](#simple-queue)
  - [Workflow Engine](#workflow-engine)
  - [API Endpoints](#api-endpoints)
- [Integration with Main Application](#integration-with-main-application)
- [Error Handling and Resilience](#error-handling-and-resilience)
- [Node Execution](#node-execution)
- [Development and Testing](#development-and-testing)

## Architecture Overview

The Workflow Execution Engine operates as a standalone server running on port 3002, separate from the main application server. This separation is designed to:

1. **Isolate Execution**: Prevent workflow execution errors from affecting the main application
2. **Resource Management**: Segregate computational resources for workflow processing
3. **Fault Tolerance**: Allow workflows to run independently of main application health
4. **Performance**: Enable specialized optimization for workflow execution

The engine uses a queue-based architecture to manage workflow execution requests, track their status, and return results.

## Server Components

### Simple Queue

The Simple Queue is the core data structure for managing workflow execution jobs:

```typescript
class SimpleQueue {
  private queue: Record<string, WorkflowJob> = {};
  private timeouts: Record<string, NodeJS.Timeout> = {};
  
  enqueue(job: WorkflowJob): string {
    const jobId = job.id || uuidv4();
    const jobWithId = { ...job, id: jobId, status: 'pending' };
    this.queue[jobId] = jobWithId;
    
    // Set timeout for job expiration
    this.timeouts[jobId] = setTimeout(() => {
      if (this.queue[jobId] && this.queue[jobId].status === 'running') {
        this.queue[jobId].status = 'timeout';
        this.queue[jobId].result = { error: 'Workflow execution timed out' };
      }
    }, JOB_TIMEOUT_MS);
    
    return jobId;
  }
  
  getJob(jobId: string): WorkflowJob | undefined {
    return this.queue[jobId];
  }
  
  startJob(jobId: string): boolean {
    if (!this.queue[jobId] || this.queue[jobId].status !== 'pending') {
      return false;
    }
    
    this.queue[jobId].status = 'running';
    this.queue[jobId].startTime = new Date();
    return true;
  }
  
  completeJob(jobId: string, result: any): void {
    if (!this.queue[jobId]) {
      return;
    }
    
    this.queue[jobId].status = 'completed';
    this.queue[jobId].endTime = new Date();
    this.queue[jobId].result = result;
    
    // Clear timeout
    if (this.timeouts[jobId]) {
      clearTimeout(this.timeouts[jobId]);
      delete this.timeouts[jobId];
    }
  }
  
  failJob(jobId: string, error: any): void {
    if (!this.queue[jobId]) {
      return;
    }
    
    this.queue[jobId].status = 'failed';
    this.queue[jobId].endTime = new Date();
    this.queue[jobId].result = { error };
    
    // Clear timeout
    if (this.timeouts[jobId]) {
      clearTimeout(this.timeouts[jobId]);
      delete this.timeouts[jobId];
    }
  }
}
```

### Workflow Engine

The Workflow Engine handles the core logic of executing workflows:

1. **Node Resolution**: Loads node definitions and executors
2. **Execution Flow**: Manages the flow of data between nodes
3. **Context Management**: Maintains execution context and environment
4. **Results Processing**: Formats and returns execution results

Key components of the Workflow Engine:

```typescript
class WorkflowEngine {
  async executeWorkflow(workflow: Workflow, input?: any): Promise<WorkflowResult> {
    const context: WorkflowContext = {
      workflowId: workflow.id,
      startTime: new Date(),
      nodeResults: {},
      nodeStatus: {},
      input
    };
    
    try {
      // Find the starting node
      const startNode = this.findStartNode(workflow);
      
      // Execute the workflow from the start node
      const result = await this.executeNode(workflow, startNode, context);
      
      return {
        success: true,
        workflowId: workflow.id,
        result,
        context
      };
    } catch (error) {
      return {
        success: false,
        workflowId: workflow.id,
        error: error.message,
        context
      };
    }
  }
  
  async executeNode(workflow: Workflow, node: Node, context: WorkflowContext): Promise<NodeExecutionResult> {
    // Implementation details for node execution
  }
  
  async resolveNodeExecutor(nodeType: string): Promise<NodeExecutor> {
    // Implementation details for node executor resolution
  }
  
  findNextNodes(workflow: Workflow, nodeId: number): Node[] {
    // Find downstream nodes connected to this one
  }
}
```

### API Endpoints

The Workflow Execution Server exposes two main API endpoints:

1. **Execute Workflow**:
   - `POST /api/workflow-execution/execute`
   - Accepts a workflow definition and optional input data
   - Returns a job ID for tracking execution

2. **Get Execution Status**:
   - `GET /api/workflow-execution/status/:jobId`
   - Returns the current status and results of a workflow execution job

## Integration with Main Application

The main application integrates with the Workflow Execution Engine through a proxy mechanism:

1. **API Proxying**: The main server forwards workflow execution requests to the execution server
2. **Status Polling**: The main server polls execution status and updates workflow logs
3. **Webhook Registration**: The main server registers webhooks with the execution server

Example integration in `server/routes.ts`:

```typescript
// Workflow Execution API - Proxy endpoints
app.post('/api/workflow-execution/execute', async (req: Request, res: Response) => {
  try {
    const response = await fetch('http://localhost:3002/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Workflow execution service unavailable' });
  }
});

app.get('/api/workflow-execution/status/:jobId', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`http://localhost:3002/api/status/${req.params.jobId}`);
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Workflow execution service unavailable' });
  }
});
```

## Error Handling and Resilience

The Workflow Execution Engine implements several error handling mechanisms:

1. **Job Timeouts**: Automatically terminates jobs that exceed maximum execution time
2. **Error Propagation**: Captures and formats node execution errors
3. **Status Tracking**: Maintains detailed status information for each execution
4. **Service Recovery**: Auto-restarts if terminated unexpectedly
5. **Result Persistence**: Ensures results are available even after unexpected termination

## Node Execution

The execution engine loads and executes node processing logic in a controlled environment:

1. **Executor Resolution**: Dynamically loads the appropriate executor for each node type
2. **Input Preparation**: Formats input data according to node requirements
3. **Execution**: Invokes the node's execute function with appropriate context
4. **Output Processing**: Formats output data for downstream nodes

## Development and Testing

Testing workflow execution is simplified with dedicated test scripts:

```typescript
/**
 * Test script for Workflow Execution Server
 */
export async function testWorkflowExecution() {
  // Create a simple test workflow
  const workflow = {
    id: 1,
    name: 'Test Workflow',
    type: 'test',
    nodes: [
      {
        id: 1,
        type: 'function_node',
        data: {
          function: 'return { test: "Hello World" };'
        }
      }
    ],
    connections: []
  };
  
  // Submit workflow to execution server
  const response = await fetch('http://localhost:3002/api/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workflow,
      input: { test: true }
    })
  });
  
  const result = await response.json();
  console.log('Workflow execution job created:', result);
  
  // Poll for results
  const jobId = result.jobId;
  let status = 'pending';
  
  while (status === 'pending' || status === 'running') {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const statusResponse = await fetch(`http://localhost:3002/api/status/${jobId}`);
    const statusResult = await statusResponse.json();
    
    status = statusResult.status;
    console.log('Current status:', status);
    
    if (status === 'completed' || status === 'failed') {
      console.log('Final result:', statusResult);
      break;
    }
  }
}
```

This testing approach allows developers to verify the execution engine's behavior with different workflow configurations.