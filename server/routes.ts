/**
 * API Routes - Express route handlers
 */
import { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { Agent, InsertAgent, InsertLog, InsertWorkflow, Log, Node, Workflow } from "@shared/schema";
import { storage } from "./storage";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { fetchWithTimeout } from "./utils/fetch";
import { log } from "./vite";
import { workflowGenerationService } from "./services/workflowGenerationService";
import { createAgentCoordinator } from "./services/agentCoordinator";
import { registerAllTools } from "./tools/implementations";
import { registerWorkflowExecution, clearWorkflowExecution, checkForTimedOutWorkflows } from "./utils/timeoutManager";


// Define interface for node type handler
interface NodeTypeHandler {
  (req: Request, res: Response, params: Record<string, string>): Promise<void>;
}

/**
 * Utility function to execute a workflow
 * This is exported for use in tools and other modules
 */
export async function runWorkflow(
  workflowId: number,
  input: any,
  options: { 
    includeDetail?: boolean, 
    debug?: boolean, 
    executionMode?: string 
  } = {}
): Promise<any> {
  
  // Default options
  const { includeDetail = false, debug = false, executionMode = "step" } = options;
  
  // Initialize webhook response tracking
  let webhookResponseHandled = false;
  
  // Get workflow
  const workflow = await storage.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error("Workflow not found");
  }
  
  // Parse the flow data (could be string or already parsed)
  let flowData: { nodes: any[], edges: any[] };
  try {
    if (typeof workflow.flowData === 'string') {
      flowData = JSON.parse(workflow.flowData);
    } else {
      flowData = workflow.flowData as any;
    }
  } catch (error) {
    console.error(`Error parsing workflow data for workflow ${workflowId}:`, error);
    throw new Error("Invalid workflow data structure");
  }
  
  // Ensure we have nodes and edges
  if (!Array.isArray(flowData.nodes) || !Array.isArray(flowData.edges)) {
    throw new Error("Workflow missing nodes or edges");
  }
  
  // Identify input and output nodes
  let inputNodes = flowData.nodes.filter((node: any) => node.type?.includes('input') || node.data?.category === 'input');
  let outputNodes = flowData.nodes.filter((node: any) => node.type?.includes('output') || node.data?.category === 'output');
  
  // Starting with input nodes, execute each node in the workflow
  const nodeOutputs: Record<string, any> = {};
  const nodeExecutionOrder: string[] = [];
  const nodeExecutionTimes: Record<string, { start: number, end: number }> = {};
  
  // Include the user input for all input nodes
  inputNodes.forEach((node: any) => {
    if (node && node.id) {
      nodeOutputs[node.id] = { output: input };
      
      // Record execution
      nodeExecutionOrder.push(node.id);
      nodeExecutionTimes[node.id] = { 
        start: Date.now(), 
        end: Date.now() 
      };
    }
  });
  
  // Create a log entry for this workflow execution
  const logEntry: InsertLog = {
    agentId: workflow.agentId || 1, // Default to agent 1 if null
    workflowId: workflowId,
    status: "running",
    input: input,
    output: {}, // Initialize with empty object
    executionPath: {
      execution_type: "workflow_execution", 
      source: "workflow_engine",
      message: `Starting workflow execution: ${workflow.name}`,
      status: "in_progress"
    }
  };
  const executionLog = await storage.createLog(logEntry);
  
  // Start executing the workflow
  console.log(`Executing workflow ${workflowId}: ${workflow.name}`);
  
  // Register this workflow execution with the timeout manager (1 minute timeout)
  const clearTimeout = registerWorkflowExecution(executionLog.id, workflowId);
  
  try {
    // Implement basic execution, but preferably use an existing solution:
    
    // 1. Identify the nodes that need to be executed next
    // For now, just execute nodes in order they appear in edges
    
    if (flowData.nodes.length === 0) {
      const result = {
        output: "Workflow is empty (no nodes to execute)",
        nodeOutputs: {},
        executionDetails: {
          workflowId,
          executionTime: 0,
          nodeCount: 0,
          executionOrder: [],
          status: "completed",
          logId: executionLog.id,
        }
      };
      
      // Update the log entry
      // Get the current executionPath or create an empty object if it doesn't exist
      const currentExecutionPath = executionLog.executionPath || {};
      
      await storage.updateLog(executionLog.id, {
        status: "completed",
        output: typeof result.output === 'string' ? { result: result.output } : result.output,
        completedAt: new Date(),
        executionPath: {
          ...currentExecutionPath,
          message: `Workflow execution completed: ${workflow.name}`,
          status: "completed"
        }
      });
      
      return result;
    }
    
    // Start a timer for overall execution
    const executionStartTime = Date.now();
    
    // Process each node based on the edges
    // This is a simplified execution algorithm that processes nodes in topological order
    const nodeMap = Object.fromEntries(flowData.nodes.map((node: any) => [node.id, node]));
    
    // Find root nodes (no incoming edges) that aren't input nodes
    const nonInputNodes = flowData.nodes.filter((node: any) => !inputNodes.includes(node));
    const edgesTo = Object.fromEntries(flowData.edges.map((edge: any) => [edge.target, edge]));
    
    // Process nodes with dependencies satisfied
    let nodeQueue = [...nonInputNodes].filter((node: any) => {
      const hasIncomingEdges = flowData.edges.some((edge: any) => edge.target === node.id);
      if (!hasIncomingEdges) return true;
      
      // If it has incoming edges, check if they're all from input nodes that we've already processed
      const incomingEdges = flowData.edges.filter((edge: any) => edge.target === node.id);
      return incomingEdges.every((edge: any) => nodeOutputs[edge.source] !== undefined);
    });
    
    // For debug mode, include more details in logs
    if (debug) {
      console.log("Execution mode:", executionMode);
      console.log("Input nodes:", inputNodes.map((n: any) => n.id));
      console.log("Output nodes:", outputNodes.map((n: any) => n.id));
      console.log("Initial nodeQueue:", nodeQueue.map((n: any) => n.id));
      console.log("Edges:", flowData.edges);
    }
    
    // Simple execution for now
    const processedNodes = new Set<string>(inputNodes.map((n: any) => n.id));
    const maxIterations = 100; // Safety to prevent infinite loops
    let iterationCount = 0;
    
    // Process nodes until none remain or we hit max iterations
    while (nodeQueue.length > 0 && iterationCount < maxIterations) {
      iterationCount++;
      
      // Process the current node
      const currentNode = nodeQueue.shift();
      if (!currentNode || !currentNode.id || processedNodes.has(currentNode.id)) continue;
      
      // Get the input for this node from its incoming edges
      const nodeInputs: Record<string, any> = {};
      const incomingEdges = flowData.edges.filter((edge: any) => edge.target === currentNode.id);
      
      // If some input nodes don't have outputs yet, put this node back in queue
      const allInputsReady = incomingEdges.every((edge: any) => nodeOutputs[edge.source] !== undefined);
      if (!allInputsReady) {
        nodeQueue.push(currentNode);
        continue;
      }
      
      // Get inputs from incoming edges
      incomingEdges.forEach((edge: any) => {
        const sourceNode = nodeMap[edge.source];
        const sourceOutput = nodeOutputs[edge.source];
        
        if (sourceNode && sourceOutput) {
          nodeInputs[edge.source] = sourceOutput;
        }
      });
      
      // Record execution start
      nodeExecutionOrder.push(currentNode.id);
      nodeExecutionTimes[currentNode.id] = { 
        start: Date.now(), 
        end: 0 // Will be updated after execution
      };
      
      try {
        if (debug) {
          console.log(`Executing node: ${currentNode.id}`, currentNode);
          console.log(`Node inputs:`, nodeInputs);
        }
        
        // Extract node information
        const nodeType = currentNode.type || currentNode.data?.type || "unknown";
        const nodeData = currentNode.data || {};
        let nodeResult: any = null;
        
        try {
          // Use the folder-based node system for execution
          // The enhanced node executor system from client/src/lib/nodeSystem.ts should be
          // mirrored on the server side or made accessible via a shared module
          
          // Here we assume we have access to the node executor registry
          // This is a simplified implementation - in a real system we would:
          // 1. Import the node executor dynamically 
          // 2. Execute it with the proper input format
          // 3. Transform the result to the expected output format
          
          // For now, we'll just pass through the inputs to maintain compatibility
          const inputs = Object.values(nodeInputs)[0]?.output || {};
          
          // Get the first input as our data source
          nodeResult = {
            output: inputs
          };
          
          if (debug) {
            console.log(`Executed node ${nodeType} (ID: ${currentNode.id}) with folder-based executor`);
          }
        } catch (error) {
          console.warn(`Error executing node ${nodeType} (ID: ${currentNode.id}):`, error);
          
          // Provide a fallback for backward compatibility
          nodeResult = {
            output: Object.values(nodeInputs)[0]?.output || null,
            error: `Error executing node: ${error instanceof Error ? error.message : String(error)}`
          };
        }
        
        // Store the node's output
        nodeOutputs[currentNode.id] = nodeResult;
        
        // Record execution end time
        nodeExecutionTimes[currentNode.id].end = Date.now();
        
        // Mark node as processed
        processedNodes.add(currentNode.id);
        
        // Add nodes that can now be executed to the queue
        const newEligibleNodes = flowData.nodes.filter((node: any) => {
          // Skip already processed nodes
          if (processedNodes.has(node.id)) return false;
          
          // Check if all incoming edges are from processed nodes
          const nodeIncomingEdges = flowData.edges.filter((edge: any) => edge.target === node.id);
          return nodeIncomingEdges.every((edge: any) => processedNodes.has(edge.source));
        });
        
        nodeQueue.push(...newEligibleNodes);
        
        if (debug) {
          console.log(`Node ${currentNode.id} execution complete:`, nodeResult);
          console.log(`Updated queue:`, nodeQueue.map((n: any) => n.id));
        }
        
      } catch (error) {
        console.error(`Error executing node ${currentNode.id}:`, error);
        
        // Store error output
        nodeOutputs[currentNode.id] = { 
          error: error instanceof Error ? error.message : String(error),
          output: null
        };
        
        // Record execution end time
        nodeExecutionTimes[currentNode.id].end = Date.now();
        processedNodes.add(currentNode.id);
      }
    }
    
    // Calculate execution time
    const executionEndTime = Date.now();
    const executionTime = executionEndTime - executionStartTime;
    
    // Get the final output from output nodes
    const outputs = outputNodes.map((node: any) => nodeOutputs[node.id]?.output).filter(Boolean);
    const finalOutput = outputs.length > 0 ? outputs[0] : "No output produced";
    
    // Find any errors in execution
    const errors = Object.entries(nodeOutputs)
      .filter(([_, output]) => output?.error !== undefined)
      .map(([nodeId, output]) => ({ nodeId, error: output.error }));
    
    const executionStatus = errors.length > 0 ? "error" : "completed";
    
    // Check if any node in the workflow marked the webhook response as handled
    // This allows the send_to_webhook node to signal it handled the response
    const webhookResponseHandledNode = Object.values(nodeOutputs).find(
      (output: any) => output?.webhookResponseHandled === true
    );
    
    if (webhookResponseHandledNode) {
      webhookResponseHandled = true;
      if (debug) {
        console.log("Webhook response was handled by a node in the workflow");
      }
    }
    
    const result = {
      output: finalOutput,
      errors: errors.length > 0 ? errors : undefined,
      nodeOutputs: includeDetail ? nodeOutputs : undefined,
      webhookResponseHandled, // Add this flag to the result
      executionDetails: {
        workflowId,
        executionTime,
        nodeCount: flowData.nodes.length,
        nodesExecuted: processedNodes.size,
        executionOrder: nodeExecutionOrder,
        executionTimes: includeDetail ? nodeExecutionTimes : undefined,
        status: executionStatus,
        logId: executionLog.id,
      }
    };
    
    // Update the log entry
    const currentExecPath = executionLog.executionPath || {};
    await storage.updateLog(executionLog.id, {
      status: executionStatus,
      output: typeof finalOutput === 'string' ? { result: finalOutput } : finalOutput,
      error: errors.length > 0 ? JSON.stringify(errors) : null,
      completedAt: new Date(),
      executionPath: {
        ...currentExecPath,
        message: `Workflow execution ${executionStatus}: ${workflow.name}`,
        executionTime,
        nodesExecuted: processedNodes.size
      }
    });
    
    // Clear the timeout since the workflow has completed
    clearTimeout();
    
    return result;
    
  } catch (error) {
    console.error(`Workflow execution error:`, error);
    
    // Update the log entry with the error
    await storage.updateLog(executionLog.id, {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      completedAt: new Date(),
      executionPath: {
        message: `Workflow execution failed: ${workflow.name}`,
        status: "failed"
      }
    });
    
    // Clear the timeout since the workflow has completed (with error)
    clearTimeout();
    
    throw error;
  }
}

// Register API routes
/**
 * Helper function to handle incoming webhook requests
 * This is used by both custom path webhooks and dynamic path webhooks
 * 
 * DEPRECATED: This function is being replaced by forwardWebhookToIntegrationEngine
 * which routes webhooks to the Integration Engine Server instead of directly to
 * the Workflow Execution Server. This aligns with the architectural principle that
 * external communication should be handled by the Integration Engine.
 */
/**
 * Forward a webhook request to the Integration Engine
 * 
 * This function proxies webhook requests from the main server to the Integration Engine,
 * which is now responsible for webhook handling in the three-server architecture.
 * 
 * Note: In the current implementation, we directly import and use the webhook handler
 * from the Integration Engine to avoid starting a separate server. In a production
 * environment, these would be separate processes.
 */
async function forwardWebhookToIntegrationEngine(
  req: Request,
  res: Response,
  workflowId: number,
  nodeId: string
): Promise<void> {
  try {
    console.log(`Forwarding webhook for workflow ${workflowId}, node ${nodeId} to Integration Engine`);
    
    // Direct import of the webhook handler from the Integration Engine
    // This is a simplified approach for development; in production these would be separate services
    const { handleWebhookRequest } = await import('../integration-engine/webhooks/webhookController');
    
    // Set the necessary parameters that the webhook handler expects
    req.params.workflowId = workflowId.toString();
    req.params.nodeId = nodeId;
    
    // Directly call the Integration Engine's webhook handler
    await handleWebhookRequest(req, res);
    
  } catch (error) {
    console.error('Error forwarding webhook to Integration Engine:', error);
    res.status(500).json({
      success: false,
      message: 'Error forwarding webhook to Integration Engine',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Handle a webhook request (deprecated)
 * 
 * This function now forwards requests to the Integration Engine, which handles
 * webhook processing in the new three-server architecture.
 */
async function handleWebhookRequest(
  req: Request,
  res: Response,
  workflowId: number,
  nodeId: string
): Promise<void> {
  // Forward to integration engine instead
  return forwardWebhookToIntegrationEngine(req, res, workflowId, nodeId);
}

/**
 * Stop a running workflow
 * 
 * This function manually stops a running workflow by updating its log
 * status to 'stopped' and clearing the workflow timeout
 */
export async function stopWorkflow(workflowId: number, logId?: number): Promise<boolean> {
  try {
    // Find the most recent running log for this workflow if logId not provided
    if (!logId) {
      const logs = await storage.getLogs(undefined, workflowId);
      const runningLog = logs.find(log => 
        (log.status === 'running' || log.status === 'in_progress') && 
        log.startedAt && 
        !log.completedAt
      );
      
      if (runningLog) {
        logId = runningLog.id;
      } else {
        console.log(`No running logs found for workflow ${workflowId}`);
        return false;
      }
    }
    
    if (!logId) {
      return false;
    }
    
    // Update the log to stopped status
    await storage.updateLog(logId, {
      status: 'stopped',
      completedAt: new Date(),
      executionPath: {
        message: `Workflow execution manually stopped by user`,
        status: 'stopped'
      }
    });
    
    // Clear any registered timeout
    clearWorkflowExecution(workflowId);
    
    console.log(`Workflow ${workflowId} (Log ${logId}) manually stopped`);
    return true;
  } catch (error) {
    console.error(`Error stopping workflow ${workflowId}:`, error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Set up a periodic check for timed-out workflows
  // Run every 5 minutes (300000 ms)
  const timeoutCheckInterval = setInterval(async () => {
    try {
      console.log("Running periodic check for timed-out workflows");
      await checkForTimedOutWorkflows();
    } catch (error) {
      console.error("Error checking for timed-out workflows:", error);
    }
  }, 300000);
  
  // Ensure the interval is cleared when the server closes
  server.on('close', () => {
    clearInterval(timeoutCheckInterval);
  });
  
  // Add token validation middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // We could validate tokens here
    next();
  });
  
  // Basic API health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Test webhook callback
  app.post('/api/test-webhook', async (req: Request, res: Response) => {
    try {
      // Import the webhook service
      const { sendWebhookCallback } = await import('./services/webhookService');
      
      const { callbackUrl, data, method = 'POST', headers = {} } = req.body;
      
      if (!callbackUrl) {
        return res.status(400).json({ success: false, message: "callbackUrl is required" });
      }
      
      console.log(`Testing webhook callback to ${callbackUrl}`, {
        method,
        headers: Object.keys(headers).reduce((acc, key) => {
          // Mask sensitive header values
          acc[key] = key.toLowerCase().includes('auth') ? '****' : headers[key];
          return acc;
        }, {} as Record<string, string>)
      });
      
      // Send the test callback
      const result = await sendWebhookCallback(callbackUrl, data || {
        searchId: `test-${Date.now()}`,
        status: "test",
        message: "This is a test callback from Lead Gen Rabbit"
      }, {
        method,
        headers,
        logPrefix: 'WebhookTest'
      });
      
      // Return the result
      res.json({
        success: true,
        message: "Webhook test executed",
        result
      });
    } catch (error) {
      console.error("Webhook test error:", error);
      res.status(500).json({
        success: false,
        message: "Error testing webhook",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test Integration Engine
  app.post('/api/test-integration-engine', async (req: Request, res: Response) => {
    try {
      log('Starting Integration Engine test', 'test');
      
      // Run the integration engine test
      const { testIntegrationEngine } = await import('./test-integration-engine');
      
      // Execute test (returns a promise)
      testIntegrationEngine()
        .then(() => {
          log('Integration Engine test completed successfully', 'test');
        })
        .catch(error => {
          console.error('Error in Integration Engine test:', error);
        });
      
      // Return immediate response (test runs in background)
      res.json({
        success: true,
        message: "Integration Engine test started",
        note: "Check server logs for test results"
      });
    } catch (error) {
      console.error("Integration Engine test error:", error);
      res.status(500).json({
        success: false,
        message: "Error starting Integration Engine test",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test Workflow Execution Server
  app.post('/api/test-workflow-execution', async (req: Request, res: Response) => {
    try {
      log('Starting Workflow Execution test', 'test');
      
      // Run the workflow execution test
      const { testWorkflowExecution } = await import('./test-workflow-execution');
      
      // Execute test (returns a promise)
      testWorkflowExecution()
        .then(() => {
          log('Workflow Execution test completed successfully', 'test');
        })
        .catch(error => {
          console.error('Error in Workflow Execution test:', error);
        });
      
      // Return immediate response (test runs in background)
      res.json({
        success: true,
        message: "Workflow Execution test started",
        note: "Check server logs for test results"
      });
    } catch (error) {
      console.error("Workflow Execution test error:", error);
      res.status(500).json({
        success: false,
        message: "Error starting Workflow Execution test",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Test Workflow Webhook Execution
  app.post('/api/test-workflow-webhook', async (req: Request, res: Response) => {
    try {
      log('Starting Workflow Webhook test', 'test');
      
      // Run the workflow webhook test using dynamic import
      const testModule = await import('./test-workflow-webhook');
      const testWorkflowWebhook = testModule.default;
      
      // Execute test (returns a promise)
      testWorkflowWebhook()
        .then(() => {
          log('Workflow Webhook test completed successfully', 'test');
        })
        .catch((error: any) => {
          console.error('Error in Workflow Webhook test:', error);
        });
      
      // Return immediate response (test runs in background)
      res.json({
        success: true,
        message: "Workflow Webhook test started",
        note: "Check server logs for test results"
      });
    } catch (error) {
      console.error("Workflow Webhook test error:", error);
      res.status(500).json({
        success: false,
        message: "Error starting Workflow Webhook test",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Endpoint to manually trigger saving of all data
  app.post('/api/admin/save-all-data', async (req: Request, res: Response) => {
    try {
      console.log('Manual save of all data triggered');
      await storage.saveAllData();
      res.json({ success: true, message: 'All data saved successfully' });
    } catch (error) {
      console.error('Error during manual save:', error);
      res.status(500).json({ success: false, message: 'Error saving data', error: String(error) });
    }
  });
  
  // Endpoint to manually check for timed-out workflows
  app.post('/api/admin/check-workflow-timeouts', async (req: Request, res: Response) => {
    try {
      console.log('Manual check for timed-out workflows triggered');
      await checkForTimedOutWorkflows();
      res.json({ success: true, message: 'Workflow timeout check completed successfully' });
    } catch (error) {
      console.error('Error checking for timed-out workflows:', error);
      res.status(500).json({ success: false, message: 'Error checking for timed-out workflows', error: String(error) });
    }
  });
  
  // Proxy for Claude API
  app.post('/api/proxy/claude', async (req: Request, res: Response) => {
    try {
      // Try to get Claude API key from environment variable
      let claudeApiKey = process.env.CLAUDE_API_KEY;
      
      // If not in env vars, try to get from persistent storage
      if (!claudeApiKey) {
        const apiConfig = await storage.getSetting('api_config');
        if (apiConfig?.value?.claudeApiKey) {
          claudeApiKey = apiConfig.value.claudeApiKey;
          // Set it in env vars for future use
          process.env.CLAUDE_API_KEY = claudeApiKey;
        }
      }
      
      if (!claudeApiKey) {
        return res.status(400).json({ 
          error: true,
          message: "Claude API key not configured. Please add your Claude API key in the API Configuration settings."
        });
      }
      
      // Forward the request to Claude API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(req.body)
      });
      
      // Get the response data
      const data = await response.json();
      
      // Return the response to the client
      return res.status(response.status).json(data);
    } catch (error) {
      console.error("Error proxying request to Claude API:", error);
      return res.status(500).json({ 
        error: true,
        message: error instanceof Error ? error.message : "Unknown error proxying to Claude API"
      });
    }
  });
  
  // API Configuration endpoints
  
  // Get API configuration
  app.get('/api/config', async (req: Request, res: Response) => {
    try {
      // Get API keys from storage if available
      const apiConfig = await storage.getSetting('api_config');
      
      // Return masked API keys to verify they exist
      // Don't return the actual keys for security reasons
      const config = {
        // First check if keys are in storage
        openaiApiKey: apiConfig?.value?.openaiApiKey ? '****' + apiConfig.value.openaiApiKey.slice(-4) : 
                     // Fall back to environment variables if not in storage
                     (process.env.OPENAI_API_KEY ? '****' + process.env.OPENAI_API_KEY.slice(-4) : null),
        
        claudeApiKey: apiConfig?.value?.claudeApiKey ? '****' + apiConfig.value.claudeApiKey.slice(-4) : 
                     (process.env.CLAUDE_API_KEY ? '****' + process.env.CLAUDE_API_KEY.slice(-4) : null),
        
        perplexityApiKey: apiConfig?.value?.perplexityApiKey ? '****' + apiConfig.value.perplexityApiKey.slice(-4) : 
                         (process.env.PERPLEXITY_API_KEY ? '****' + process.env.PERPLEXITY_API_KEY.slice(-4) : null)
      };
      
      // Set env vars from stored keys if available and env vars not set
      if (apiConfig?.value) {
        if (apiConfig.value.openaiApiKey && !process.env.OPENAI_API_KEY) {
          process.env.OPENAI_API_KEY = apiConfig.value.openaiApiKey;
        }
        if (apiConfig.value.claudeApiKey && !process.env.CLAUDE_API_KEY) {
          process.env.CLAUDE_API_KEY = apiConfig.value.claudeApiKey;
        }
        if (apiConfig.value.perplexityApiKey && !process.env.PERPLEXITY_API_KEY) {
          process.env.PERPLEXITY_API_KEY = apiConfig.value.perplexityApiKey;
        }
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error getting API config:", error);
      res.status(500).json({ 
        error: true, 
        message: "Failed to get API configuration" 
      });
    }
  });
  
  // Update API configuration
  app.post('/api/config', async (req: Request, res: Response) => {
    try {
      const { openaiApiKey, claudeApiKey, perplexityApiKey } = req.body;
      
      // Log masked keys for debugging
      console.log('API Key update requested:', {
        openaiApiKey: openaiApiKey ? '****' + openaiApiKey.slice(-4) : null,
        claudeApiKey: claudeApiKey ? '****' + claudeApiKey.slice(-4) : null,
        perplexityApiKey: perplexityApiKey ? '****' + perplexityApiKey.slice(-4) : null
      });
      
      // Set environment variables for immediate use
      if (openaiApiKey) process.env.OPENAI_API_KEY = openaiApiKey;
      if (claudeApiKey) process.env.CLAUDE_API_KEY = claudeApiKey;
      if (perplexityApiKey) process.env.PERPLEXITY_API_KEY = perplexityApiKey;
      
      // Get existing config or create a new one
      const existingConfig = await storage.getSetting('api_config');
      const currentApiKeys = existingConfig?.value || {};
      
      // Update with new values, keeping existing ones if not provided
      const updatedApiKeys = {
        ...currentApiKeys,
        ...(openaiApiKey ? { openaiApiKey } : {}),
        ...(claudeApiKey ? { claudeApiKey } : {}),
        ...(perplexityApiKey ? { perplexityApiKey } : {})
      };
      
      // Save to persistent storage
      await storage.saveSetting({
        id: 'api_config',
        value: updatedApiKeys
      });
      
      console.log('Saved API keys to persistent storage');
      
      // Return the masked config to confirm receipt
      const config = {
        openaiApiKey: updatedApiKeys.openaiApiKey ? '****' + updatedApiKeys.openaiApiKey.slice(-4) : null,
        claudeApiKey: updatedApiKeys.claudeApiKey ? '****' + updatedApiKeys.claudeApiKey.slice(-4) : null,
        perplexityApiKey: updatedApiKeys.perplexityApiKey ? '****' + updatedApiKeys.perplexityApiKey.slice(-4) : null
      };
      
      res.json(config);
    } catch (error) {
      console.error("Error updating API config:", error);
      res.status(500).json({ 
        error: true, 
        message: "Failed to update API configuration" 
      });
    }
  });
  
  // Perplexity API proxy endpoint
  app.post('/api/proxy/perplexity', async (req: Request, res: Response) => {
    try {
      const { model, messages, temperature, max_tokens } = req.body;
      
      // Validate request
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
      }
      
      // Get API key from environment
      const apiKey = process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'Perplexity API key not configured' });
      }
      
      // Prepare API request
      const perplexityUrl = 'https://api.perplexity.ai/chat/completions';
      const response = await fetch(perplexityUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'llama-3.1-sonar-small-128k-online',
          messages,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 1000
        })
      });
      
      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({ 
          error: `Perplexity API error: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }
      
      const responseData = await response.json();
      return res.json(responseData);
    } catch (error) {
      console.error('Perplexity proxy error:', error);
      return res.status(500).json({
        error: 'Error processing Perplexity API request',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // ===== Integration Engine Routes =====

  // Integration endpoint registration
  app.post('/api/integration/register', async (req: Request, res: Response) => {
    try {
      const { nodeType, capabilities, workflowId, nodeId, description, path } = req.body;
      
      // If path is directly provided, use the legacy registration method
      if (path) {
        const { config } = req.body;
        
        // Validate the config
        if (!config || !config.methods || !Array.isArray(config.methods)) {
          return res.status(400).json({
            success: false,
            message: 'Valid config with methods array is required'
          });
        }
        
        // Create a server-side handler based on the config
        const { integrationEngine } = await import('./services/integrationEngine');
        
        // Dynamically create the handler function
        const serverConfig = {
          methods: config.methods,
          workflowId: config.workflowId,
          nodeId: config.nodeId,
          nodeType: config.nodeType,
          description: config.description,
          // The actual handler logic is created by the integration engine
          handler: integrationEngine.createLazyHandler ? 
            integrationEngine.createLazyHandler(
              config.workflowId ? 'webhook' : 'custom', 
              config.workflowId, 
              config.nodeId
            ) : 
            async (req: Request, res: Response) => {
              // Fallback handler if createLazyHandler isn't available
              res.json({
                success: true,
                message: 'Integration endpoint called',
                registered: true,
                config: {
                  workflowId: config.workflowId,
                  nodeId: config.nodeId
                }
              });
            }
        };
        
        // Register the endpoint
        const registeredPath = await integrationEngine.registerEndpoint(path, serverConfig);
        
        // Return the registered path
        return res.json({
          success: true,
          path: registeredPath,
          methods: config.methods,
          workflowId: config.workflowId,
          nodeId: config.nodeId,
          description: config.description || 'Integration endpoint'
        });
      }
      
      // New node-based registration method
      if (!nodeType) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: nodeType'
        });
      }
      
      // Load the integration engine
      const { integrationEngine } = await import('./services/integrationEngine');
      
      // Check if the node provides an endpoint
      if (!capabilities?.provides?.endpoint) {
        // If no endpoint capability, try to register as a node type handler
        if (workflowId && nodeId) {
          // Generate a custom path for this registration
          const customPath = `custom/${nodeType}/${workflowId}-${nodeId}-${Date.now()}`;
          
          // Create a handler
          const handler = integrationEngine.createLazyHandler(
            'webhook', 
            workflowId, 
            nodeId
          );
          
          // Register with integration engine
          const registeredPath = await integrationEngine.registerEndpoint(customPath, {
            methods: ['POST', 'GET'],
            workflowId,
            nodeId,
            nodeType,
            description: description || `${nodeType} integration endpoint`,
            handler
          });
          
          // Return the registered endpoint info
          return res.json({
            success: true,
            path: registeredPath,
            methods: ['POST', 'GET'],
            workflowId,
            nodeId,
            description: description || `${nodeType} integration endpoint`
          });
        }
        
        return res.status(400).json({
          success: false,
          message: 'Node must provide endpoint capability or include workflowId and nodeId'
        });
      }
      
      // Extract endpoint configuration
      const pathTemplate = capabilities.endpoint?.pathTemplate || 'integration/:path';
      const methods = capabilities.endpoint?.methods || ['POST'];
      
      // Generate a path for this registration
      // If workflowId and nodeId are provided, use them to create a unique path
      // Otherwise, use a generated ID based on the node type
      const pathId = workflowId && nodeId
        ? `${workflowId}-${nodeId}-${Date.now()}`
        : `${nodeType}-${Date.now()}`;
        
      // Parse template to create path - naive implementation for now
      const integrationPath = pathTemplate.replace(/:path|:id/g, pathId);
      
      // Create the handler for this endpoint
      const handler = integrationEngine.createLazyHandler(
        'webhook', 
        workflowId, 
        nodeId
      );
      
      // Register with integration engine
      const registeredPath = await integrationEngine.registerEndpoint(integrationPath, {
        methods,
        workflowId,
        nodeId,
        nodeType,
        description: description || `${nodeType} integration endpoint`,
        handler
      });
      
      // Return the registered endpoint info
      res.json({
        success: true,
        path: registeredPath,
        methods,
        workflowId,
        nodeId,
        description: description || `${nodeType} integration endpoint`
      });
    } catch (error) {
      console.error('Error registering integration:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering integration',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Register node type integration
  app.post('/api/integration/register-node-type', async (req: Request, res: Response) => {
    try {
      const { nodeType, pathTemplate, methods, description } = req.body;
      
      if (!nodeType) {
        return res.status(400).json({
          success: false,
          message: 'Node type is required'
        });
      }
      
      if (!pathTemplate) {
        return res.status(400).json({
          success: false,
          message: 'Path template is required'
        });
      }
      
      // Create handler for the node type
      const { integrationEngine } = await import('./services/integrationEngine');
      
      // Create a handler function for this node type
      const nodeTypeHandler: NodeTypeHandler = async (req: Request, res: Response, params: Record<string, string>) => {
        // Default implementation - can be customized further
        res.json({
          success: true,
          message: `Node type ${nodeType} handler called`,
          params,
          query: req.query,
          body: req.body
        });
      };
      
      // Register the node type handler
      await integrationEngine.registerNodeType(nodeType, {
        pathTemplate: pathTemplate,
        methods: methods || ['POST', 'GET'],
        description: description || `${nodeType} handler`,
        nodeTypeHandler
      });
      
      // Return success
      res.json({
        success: true,
        nodeType,
        pathTemplate,
        methods: methods || ['POST', 'GET'],
        description: description || `${nodeType} handler`
      });
    } catch (error) {
      console.error('Error registering node type:', error);
      res.status(500).json({
        success: false,
        message: 'Error registering node type',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get all registered node types
  app.get('/api/integration/node-types', async (req: Request, res: Response) => {
    try {
      const { integrationEngine } = await import('./services/integrationEngine');
      const nodeTypes = await integrationEngine.getNodeTypes();
      
      res.json({
        success: true,
        nodeTypes
      });
    } catch (error) {
      console.error('Error getting integration node types:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting integration node types',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get all integration endpoints
  app.get('/api/integration/endpoints', async (req: Request, res: Response) => {
    try {
      const { integrationEngine } = await import('./services/integrationEngine');
      const endpoints = await integrationEngine.getEndpoints();
      
      res.json({
        success: true,
        endpoints
      });
    } catch (error) {
      console.error('Error getting integration endpoints:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting integration endpoints',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Integration Engine API Request Proxy
   * 
   * This endpoint handles outgoing API requests from integration nodes
   * It proxies the request to external APIs and returns the response
   */
  app.post('/api/integration/request', async (req: Request, res: Response) => {
    try {
      // Extract request parameters
      const { method, url, headers = {}, body, timeout = 30000 } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      if (!method) {
        return res.status(400).json({ error: 'HTTP method is required' });
      }
      
      console.log(`Integration Engine: Outgoing ${method} request to ${url}`);
      
      // Add trace headers for debugging
      const requestHeaders = {
        ...headers,
        'X-Integration-Engine': 'true',
        'X-Request-Source': 'lead-gen-rabbit'
      };
      
      // Build fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        body: body || undefined,
        // @ts-ignore - timeout is not in the standard RequestInit type
        timeout: timeout
      };
      
      // Make the external API request
      const apiResponse = await fetch(url, fetchOptions);
      
      // Get response data
      let responseData: any;
      const contentType = apiResponse.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await apiResponse.json();
      } else {
        responseData = await apiResponse.text();
      }
      
      // Build the response object
      const response = {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: Object.fromEntries(apiResponse.headers.entries()),
        data: responseData,
        ok: apiResponse.ok
      };
      
      // Return the response
      res.json(response);
      
    } catch (error) {
      console.error('Integration Engine API request error:', error);
      res.status(500).json({ 
        error: `Error making API request: ${error instanceof Error ? error.message : String(error)}`,
        ok: false 
      });
    }
  });
  
  // Integration catch-all route
  app.all('/api/integration/*', async (req: Request, res: Response) => {
    try {
      // Extract the path after /api/integration/
      const path = req.path.substring('/api/integration/'.length);
      
      // Let the integration engine handle it
      const { integrationEngine } = await import('./services/integrationEngine');
      const handled = await integrationEngine.handleRequest(path, req, res);
      
      // If not handled, return 404
      if (!handled && !res.headersSent) {
        res.status(404).json({
          success: false,
          message: 'Integration endpoint not found'
        });
      }
    } catch (error) {
      console.error('Error in integration route handler:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error processing integration request',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // ===== Agent Tools and Coordination =====

  // Register all tools during server startup
  registerAllTools();
  
  // Get all available tools for testing
  app.get('/api/tools', (req: Request, res: Response) => {
    try {
      const { context } = req.query;
      
      // Get tools from the registry
      import('./tools/registry').then(({ toolRegistry }) => {
        const tools = context ? 
          toolRegistry.getToolsByContext(context as string) : 
          toolRegistry.getAllTools();
        
        // Convert to a format suitable for the client
        const formattedTools = tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          category: tool.category,
          parameters: tool.parameters || { type: 'object', properties: {} },
          contexts: tool.contexts || []
        }));
        
        res.json(formattedTools);
      }).catch(error => {
        console.error('Error importing tool registry:', error);
        res.status(500).json({ 
          error: 'Failed to import tool registry', 
          details: error instanceof Error ? error.message : String(error) 
        });
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get tools', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Node debug endpoint
  app.post('/api/node-debug', async (req: Request, res: Response) => {
    try {
      const { handleNodeDebugRequest } = await import('./node-debug');
      await handleNodeDebugRequest(req, res);
    } catch (error) {
      console.error('Error in node debug handler:', error);
      res.status(500).json({ 
        error: 'Node debug handler failed', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  
  /**
   * Workflow Execution API - Proxy endpoints
   * 
   * These endpoints proxy requests to the dedicated workflow execution server
   */
  app.post('/api/workflow-execution/execute', async (req: Request, res: Response) => {
    try {
      const { workflowId, input, nodeId } = req.body;
      
      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: 'Workflow ID is required'
        });
      }
      
      // Forward request to workflow execution server
      const response = await fetch('http://localhost:3002/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflowId,
          input: input || {},
          startNodeId: nodeId
        })
      });
      
      const result = await response.json();
      res.status(response.status).json(result);
    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  app.get('/api/workflow-execution/status/:jobId', async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      
      // Forward request to workflow execution server
      const response = await fetch(`http://localhost:3002/api/status/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      res.status(response.status).json(result);
    } catch (error) {
      console.error('Error getting job status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Execute a tool directly (for testing)
  app.post('/api/tools/execute', async (req: Request, res: Response) => {
    try {
      const { tool: toolName, parameters } = req.body;
      
      if (!toolName) {
        return res.status(400).json({ error: 'Tool name is required' });
      }
      
      // Get the tool from the registry
      const { toolRegistry } = await import('./tools/registry');
      const tool = toolRegistry.getTool(toolName);
      
      if (!tool) {
        return res.status(404).json({ error: `Tool "${toolName}" not found` });
      }
      
      // Execute the tool
      const result = await tool.execute(parameters || {});
      
      // Create a log entry
      const logEntry: InsertLog = {
        agentId: 0,
        workflowId: 0,
        status: result.success ? 'success' : 'error',
        input: { tool: toolName, parameters },
        output: result,
        error: result.success ? null : result.error,
        completedAt: new Date(),
        executionPath: { source: 'direct-tool-execution' }
      };
      
      await storage.createLog(logEntry);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to execute tool',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Unified agent chat endpoint
  app.post('/api/agent/chat', async (req: Request, res: Response) => {
    try {
      const { message, context, agentId, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: 'No message provided' 
        });
      }
      
      // Try to get OpenAI API key from environment variable
      let openaiApiKey = process.env.OPENAI_API_KEY;
      
      // If not in env vars, try to get from persistent storage
      if (!openaiApiKey) {
        const apiConfig = await storage.getSetting('api_config');
        if (apiConfig?.value?.openaiApiKey) {
          openaiApiKey = apiConfig.value.openaiApiKey;
          // Set it in env vars for future use
          process.env.OPENAI_API_KEY = openaiApiKey;
        }
      }
      
      if (!openaiApiKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'OpenAI API key not configured. Please add your OpenAI API key in the API Configuration settings.' 
        });
      }
      
      // Create agent coordinator
      const coordinator = createAgentCoordinator(openaiApiKey);
      
      // Process the message
      const result = await coordinator.processUserInput(message, {
        context,
        agentId,
        sessionId
      });
      
      // Return the result
      return res.json(result);
    } catch (error) {
      console.error('Error in agent chat:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error processing request'
      });
    }
  });
  
  // ===== Agent Routes =====
  
  // Get all agents
  app.get("/api/agents", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const agents = await storage.getAgents(type);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching agents" });
    }
  });
  
  // Get a specific agent
  app.get("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "Error fetching agent" });
    }
  });
  
  // Create a new agent
  app.post("/api/agents", async (req, res) => {
    try {
      // Validate request body
      const agentSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        icon: z.string().optional(),
        status: z.enum(["active", "inactive", "draft"]).optional()
      });
      
      const result = agentSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid agent data", 
          details: validationError.message 
        });
      }
      
      const { name, description, type, icon, status = "active" } = result.data;
      const agentData = { name, description, type, icon, status };
      
      // Create the agent
      const agent = await storage.createAgent(agentData);
      
      // Return the created agent
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update an agent
  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get existing agent
      const existingAgent = await storage.getAgent(id);
      if (!existingAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Validate request body
      const agentUpdateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        icon: z.string().optional(),
        status: z.enum(["active", "inactive", "draft"]).optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = agentUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid agent data", 
          details: validationError.message 
        });
      }
      
      // Update the agent
      const updatedAgent = await storage.updateAgent(id, result.data);
      
      // Return the updated agent
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete an agent
  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Check if agent exists
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Delete the agent
      const success = await storage.deleteAgent(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete agent" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Run an agent
  app.post("/api/agents/:id/run", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get the agent
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Validate request body
      const runSchema = z.object({
        input: z.any(),
        options: z.object({
          includeDetail: z.boolean().optional(),
          debug: z.boolean().optional(),
          executionMode: z.string().optional()
        }).optional()
      });
      
      const result = runSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid run request", 
          details: validationError.message 
        });
      }
      
      const { input, options } = result.data;
      
      // Get associated workflows
      const workflows = await storage.getWorkflowsByAgentId(id);
      if (workflows.length === 0) {
        return res.status(400).json({ 
          message: "This agent has no associated workflows" 
        });
      }
      
      // Use the first workflow for now (in the future we could support multiple)
      const workflow = workflows[0];
      
      // Execute the workflow
      const outcome = await runWorkflow(workflow.id, input, options);
      
      // Return the result
      res.json(outcome);
      
    } catch (error) {
      console.error("Agent run error:", error);
      
      res.status(500).json({ 
        message: "Error running agent", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get workflows associated with an agent
  app.get("/api/agents/:id/workflows", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get the agent
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Get workflows associated with this agent
      const workflows = await storage.getWorkflowsByAgentId(id);
      
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching agent workflows", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get logs for an agent
  app.get("/api/agents/:id/logs", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Get the agent
      const agent = await storage.getAgent(id);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Get limit from query
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      // Get logs for this agent
      const logs = await storage.getLogs(id, limit);
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching agent logs", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // ===== Workflow Routes =====
  
  // Generate a new workflow from a natural language prompt
  app.post("/api/workflows/generate", async (req, res) => {
    try {
      // Validate request body
      const generateSchema = z.object({
        prompt: z.string(),
        agentId: z.number().optional(),
        options: z.object({
          apiKey: z.string().optional(),
          model: z.string().optional(),
          complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
          domain: z.string().optional(),
          maxNodes: z.number().optional(),
          timeout: z.number().optional(),
        }).optional(),
      });
      
      const result = generateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow generation request", 
          details: validationError.message 
        });
      }
      
      // Extract prompt and options from the request
      const { prompt, agentId, options } = result.data;
      
      console.log(`Generating workflow from prompt: "${prompt}"`);
      
      // Try to use the dynamic workflow generation service
      try {
        console.log("Using workflowGenerationService to generate dynamic workflow");
        
        // Generate a workflow using the dynamic generation service
        const generatedWorkflow = await workflowGenerationService.generateWorkflow(
          prompt,
          agentId,
          {
            ...(options || {}),
            complexity: options?.complexity || 'moderate',
            domain: options?.domain || 'general',
            maxNodes: options?.maxNodes || 10
          }
        );
        
        // Return the generated workflow
        return res.status(200).json({
          workflow: generatedWorkflow,
          message: "Workflow generated successfully with dynamically generated nodes"
        });
        
      } catch (error) {
        console.error("Error using dynamic workflow generation:", error);
        
        // Handle error case with a fallback simple workflow
        console.log("Using fallback approach for workflow generation");
        
        // Create a simple "generated text" workflow based on the prompt
        const timestamp = Date.now();
        const workflowName = `Generated workflow ${new Date().toLocaleString()}`;
        
        // Create a flow with a basic three-node pattern
        const textInputNode = {
          id: `text-input-${timestamp}`,
          type: 'text_input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Input from prompt',
            category: 'input',
            description: `Input created from: ${prompt}`,
            type: 'text_input'
          }
        };
        
        const processingNode = {
          id: `process-${timestamp}`,
          type: 'generate_text',
          position: { x: 350, y: 100 },
          data: {
            label: 'Process Input',
            category: 'ai',
            description: 'Processes the input data',
            type: 'generate_text',
            settings: {
              prompt: 'Process this input: {{text_input.output}}'
            }
          }
        };
        
        const outputNode = {
          id: `output-${timestamp}`,
          type: 'output',
          position: { x: 600, y: 100 },
          data: {
            label: 'Output Result',
            category: 'output',
            description: 'Shows the processed result',
            type: 'output'
          }
        };
        
        // Create edges connecting the nodes
        const edge1 = {
          id: `edge-input-process-${timestamp}`,
          source: textInputNode.id,
          target: processingNode.id,
          type: 'default'
        };
        
        const edge2 = {
          id: `edge-process-output-${timestamp}`,
          source: processingNode.id,
          target: outputNode.id,
          type: 'default'
        };
        
        // Create the flow data structure
        const flowData = {
          nodes: [textInputNode, processingNode, outputNode],
          edges: [edge1, edge2]
        };
        
        // Create a new workflow - ensure flowData is an object, not a string
        const processedFlowData = typeof flowData === 'string' ? JSON.parse(flowData) : flowData;
        const fallbackWorkflow = await storage.createWorkflow({
          name: workflowName,
          description: `Workflow generated from prompt: ${prompt}`,
          type: 'custom',
          status: 'active',
          agentId: agentId,
          flowData: processedFlowData
        });
        
        return res.status(200).json({
          workflow: fallbackWorkflow,
          message: "Workflow generated with basic processing nodes (fallback mode)"
        });
      }
    } catch (error) {
      console.error("Workflow generation error:", error);
      
      // Special handling for API key errors
      if (error instanceof Error && error.message.includes('API key')) {
        return res.status(401).json({
          error: true,
          message: "Missing or invalid API key for the LLM service",
          details: error.message
        });
      }
      
      res.status(500).json({ 
        error: true,
        message: "Failed to generate workflow", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update an existing workflow based on a natural language prompt
  app.post("/api/workflows/update/:id", async (req, res) => {
    try {
      // Validate request body
      const updateSchema = z.object({
        prompt: z.string(),
        currentWorkflowId: z.number(),
        currentWorkflowName: z.string().optional(),
        options: z.object({
          apiKey: z.string().optional(),
          model: z.string().optional(),
          complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
          domain: z.string().optional(),
          maxNodes: z.number().optional(),
          timeout: z.number().optional(),
        }).optional(),
      });
      
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow update request", 
          details: validationError.message 
        });
      }
      
      const workflowId = parseInt(req.params.id, 10);
      if (isNaN(workflowId)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Get the existing workflow
      const existingWorkflow = await storage.getWorkflow(workflowId);
      if (!existingWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Extract prompt and options from the request
      const { prompt, options } = result.data;
      
      // Include additional context in the prompt for the AI
      const contextualizedPrompt = `Update the existing workflow "${existingWorkflow.name}" (ID: ${workflowId}): ${prompt}`;
      
      console.log(`Updating workflow ${workflowId} from prompt: "${prompt}"`);
      
      // Parse the existing flow data structure
      let flowData: { nodes: any[], edges: any[] };
      
      try {
        // Handle both string and object flowData formats
        if (typeof existingWorkflow.flowData === 'string') {
          flowData = JSON.parse(existingWorkflow.flowData);
        } else {
          flowData = existingWorkflow.flowData as any || { nodes: [], edges: [] };
        }
        
        // Ensure we have nodes and edges arrays
        if (!Array.isArray(flowData.nodes)) flowData.nodes = [];
        if (!Array.isArray(flowData.edges)) flowData.edges = [];
      } catch (error) {
        console.error("Error parsing workflow data:", error);
        // If we can't parse the existing data, start with empty arrays
        flowData = { nodes: [], edges: [] };
      }
      
      // Try to use the dynamic workflow generation service
      try {
        console.log("Using workflowGenerationService to generate dynamic workflow");
        
        // Generate a workflow using the dynamic generation service
        const generatedWorkflow = await workflowGenerationService.generateWorkflow(
          contextualizedPrompt,
          existingWorkflow.agentId || undefined,
          {
            ...(options || {}),
            complexity: options?.complexity || 'moderate',
            domain: options?.domain || 'general',
            maxNodes: options?.maxNodes || 10
          }
        );
        
        // Parse the generated workflow data
        let generatedFlowData;
        if (typeof generatedWorkflow.flowData === 'string') {
          generatedFlowData = JSON.parse(generatedWorkflow.flowData);
        } else {
          generatedFlowData = generatedWorkflow.flowData || { nodes: [], edges: [] };
        }
        
        // Ensure the generated data has nodes and edges arrays
        if (!generatedFlowData.nodes) generatedFlowData.nodes = [];
        if (!generatedFlowData.edges) generatedFlowData.edges = [];
        
        // Position nodes properly to ensure visibility (top-left of the canvas)
        const startX = 100;
        const startY = 100;
        const spacing = 200;
        
        // Update node positions and ensure each node has a unique ID
        const timestamp = Date.now();
        generatedFlowData.nodes = generatedFlowData.nodes.map((node: any, index: number) => {
          // Ensure node has a unique ID
          if (!node.id) {
            node.id = `${node.type || 'node'}-${timestamp}-${index}`;
          }
          
          // Ensure node has a position
          if (!node.position) {
            node.position = {
              x: startX + (index % 3) * spacing,
              y: startY + Math.floor(index / 3) * spacing
            };
          }
          
          return node;
        });
        
        // Update edge IDs and ensure connections are valid
        generatedFlowData.edges = generatedFlowData.edges.map((edge: any, index: number) => {
          // Ensure edge has an ID
          if (!edge.id) {
            edge.id = `edge-${timestamp}-${index}`;
          }
          
          // Ensure edge has type
          if (!edge.type) {
            edge.type = 'default';
          }
          
          return edge;
        });
        
        // Add the generated nodes and edges to the existing workflow
        flowData.nodes.push(...generatedFlowData.nodes);
        flowData.edges.push(...generatedFlowData.edges);
        
        console.log(`Added ${generatedFlowData.nodes.length} nodes and ${generatedFlowData.edges.length} edges from dynamically generated workflow`);
        
        // Update the workflow in the database
        const updatedData = {
          ...existingWorkflow,
          flowData: flowData,
          description: generatedWorkflow.description || existingWorkflow.description
        };
        
        const updatedWorkflow = await storage.updateWorkflow(workflowId, updatedData);
        
        return res.status(200).json({
          workflow: updatedWorkflow,
          message: "Workflow updated successfully with dynamically generated nodes"
        });
        
      } catch (error) {
        console.error("Error using dynamic workflow generation:", error);
        
        // Handle error case with a fallback simple node
        console.log("Using fallback approach for workflow update");
        
        // Create a simple "generated text" node based on the prompt
        const timestamp = Date.now();
        
        // Very simple fallback of a text input node and a processing node
        const textInputNode = {
          id: `text-input-${timestamp}`,
          type: 'text_input',
          position: { x: 100, y: 100 },
          data: {
            label: 'Input from prompt',
            category: 'input',
            description: `Input created from: ${prompt}`,
            type: 'text_input'
          }
        };
        
        const processingNode = {
          id: `process-${timestamp}`,
          type: 'generate_text',
          position: { x: 350, y: 100 },
          data: {
            label: 'Process Input',
            category: 'ai',
            description: 'Processes the input data',
            type: 'generate_text',
            settings: {
              prompt: 'Process this input: {{text_input.output}}'
            }
          }
        };
        
        const outputNode = {
          id: `output-${timestamp}`,
          type: 'output',
          position: { x: 600, y: 100 },
          data: {
            label: 'Output Result',
            category: 'output',
            description: 'Shows the processed result',
            type: 'output'
          }
        };
        
        // Create edges connecting the nodes
        const edge1 = {
          id: `edge-input-process-${timestamp}`,
          source: textInputNode.id,
          target: processingNode.id,
          type: 'default'
        };
        
        const edge2 = {
          id: `edge-process-output-${timestamp}`,
          source: processingNode.id,
          target: outputNode.id,
          type: 'default'
        };
        
        // Add the fallback nodes and edges to the workflow
        flowData.nodes.push(textInputNode, processingNode, outputNode);
        flowData.edges.push(edge1, edge2);
        
        // Update the workflow with new data
        const updatedData = {
          ...existingWorkflow,
          flowData: flowData
        };
        
        // Update the workflow in the database
        const updatedWorkflow = await storage.updateWorkflow(workflowId, updatedData);
        
        return res.status(200).json({
          workflow: updatedWorkflow,
          message: "Workflow updated with basic processing nodes (fallback mode)"
        });
      }
    } catch (error) {
      console.error("Workflow update error:", error);
      
      // Special handling for API key errors
      if (error instanceof Error && error.message.includes('API key')) {
        return res.status(401).json({
          error: true,
          message: "Missing or invalid API key for the LLM service",
          details: error.message
        });
      }
      
      res.status(500).json({ 
        error: true,
        message: "Failed to update workflow", 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get all workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const workflows = await storage.getWorkflows(type);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching workflows" });
    }
  });
  
  // Get a specific workflow
  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Ensure flowData is properly formatted as an object
      let processedWorkflow = { ...workflow };
      
      if (typeof processedWorkflow.flowData === 'string') {
        try {
          processedWorkflow.flowData = JSON.parse(processedWorkflow.flowData);
        } catch (e) {
          processedWorkflow.flowData = { nodes: [], edges: [] };
        }
      }
      
      // Ensure nodes and edges exist
      if (!processedWorkflow.flowData) {
        processedWorkflow.flowData = { nodes: [], edges: [] };
      } else if (!processedWorkflow.flowData.nodes) {
        processedWorkflow.flowData.nodes = [];
      } else if (!processedWorkflow.flowData.edges) {
        processedWorkflow.flowData.edges = [];
      }
      
      // Ensure each node has the appropriate data structure for the new node system
      if (Array.isArray(processedWorkflow.flowData.nodes)) {
        processedWorkflow.flowData.nodes = processedWorkflow.flowData.nodes.map(node => {
          // Skip if node is already properly formatted
          if (node.data && node.data.defaultData) {
            return node;
          }
          
          // Create a migrated node with required fields
          const migratedNode = {
            ...node,
            type: node.type || 'unknown',
            data: {
              ...node.data,
              label: node.data?.label || node.label || node.type || 'Unknown Node',
              description: node.data?.description || node.description || '',
              icon: node.data?.icon || node.icon || null,
              category: node.data?.category || 'general',
              defaultData: {}
            }
          };
          
          // Add defaultData based on node type
          switch (migratedNode.type) {
            case 'claude':
              migratedNode.data.defaultData = {
                model: 'claude-3-haiku-20240307',
                temperature: 0.7,
                maxTokens: 1000
              };
              break;
            case 'text_input':
              migratedNode.data.defaultData = {};
              break;
            case 'text_template':
              migratedNode.data.defaultData = {
                template: migratedNode.data.template || '{{input}}'
              };
              break;
            case 'http_request':
              migratedNode.data.defaultData = {
                url: migratedNode.data.url || 'https://example.com',
                method: migratedNode.data.method || 'GET',
                headers: migratedNode.data.headers || {}
              };
              break;
          }
          
          return migratedNode;
        });
      }
      
      res.json(processedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Error fetching workflow" });
    }
  });
  
  // Create a new workflow
  app.post("/api/workflows", async (req, res) => {
    try {
      // Validate request body
      const workflowSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        agentId: z.number().optional(),
        flowData: z.union([z.record(z.any()), z.string(), z.null()]).optional(),
        prompt: z.string().optional(),
        options: z.object({
          apiKey: z.string().optional(),
          model: z.string().optional(),
          complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
          domain: z.string().optional(),
          maxNodes: z.number().optional(),
        }).optional()
      });
      
      const result = workflowSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow data", 
          details: validationError.message 
        });
      }
      
      let { name, description, type, agentId, flowData, prompt, options } = result.data;
      
      // If we have a prompt, use the workflow generation service
      if (prompt) {
        try {
          console.log("Using workflowGenerationService for new workflow");
          
          // Generate a workflow using the service
          const generatedWorkflow = await workflowGenerationService.generateWorkflow(
            prompt,
            agentId,
            {
              ...(options || {}),
              complexity: options?.complexity || 'moderate',
              domain: options?.domain || 'general',
              maxNodes: options?.maxNodes || 10
            }
          );
          
          // Merge the generated workflow data with our request
          name = name || generatedWorkflow.name;
          description = description || generatedWorkflow.description;
          type = type || generatedWorkflow.type;
          flowData = generatedWorkflow.flowData;
          
          // Ensure flowData is a proper object
          let processedFlowData = flowData;
          if (typeof processedFlowData === 'string') {
            try {
              processedFlowData = JSON.parse(processedFlowData);
            } catch (e) {
              processedFlowData = { nodes: [], edges: [] };
            }
          }

          // Create the workflow
          const workflow = await storage.createWorkflow({
            name,
            description,
            type,
            status: 'active',
            agentId,
            flowData: typeof processedFlowData === 'string' ? 
              { nodes: [], edges: [] } : processedFlowData
          });
          
          // Return the created workflow
          return res.status(201).json({
            workflow,
            message: "Workflow created successfully with generated nodes"
          });
          
        } catch (error) {
          console.error("Error generating workflow:", error);
          
          if (error instanceof Error && error.message.includes('API key')) {
            return res.status(401).json({
              error: true,
              message: "Missing or invalid API key for the LLM service",
              details: error.message
            });
          }
          
          // Continue with manual workflow creation as fallback
          console.log("Using fallback approach for workflow creation");
        }
      }
      
      // If no flowData is provided or generation failed, create an empty workflow
      if (!flowData) {
        flowData = { nodes: [], edges: [] };
      }
      
      // Ensure flowData is a proper object
      let processedFlowData = flowData;
      if (typeof processedFlowData === 'string') {
        try {
          processedFlowData = JSON.parse(processedFlowData);
        } catch (e) {
          processedFlowData = { nodes: [], edges: [] };
        }
      }

      // Create the workflow
      const workflow = await storage.createWorkflow({
        name,
        description,
        type,
        status: 'active',
        agentId,
        flowData: typeof processedFlowData === 'string' ? 
          { nodes: [], edges: [] } : processedFlowData
      });
      
      // Return the created workflow
      res.status(201).json(workflow);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update a workflow
  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Get existing workflow
      const existingWorkflow = await storage.getWorkflow(id);
      if (!existingWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Validate request body
      const workflowUpdateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        agentId: z.number().optional(),
        flowData: z.union([z.record(z.any()), z.string(), z.null()]).optional(),
        status: z.enum(["active", "inactive", "draft"]).optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = workflowUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid workflow data", 
          details: validationError.message 
        });
      }
      
      // Process the update data
      const updateData = { ...result.data };
      
      // Ensure flowData is a proper object if it exists in the update
      if (updateData.flowData !== undefined) {
        if (typeof updateData.flowData === 'string') {
          try {
            // Convert string to Record<string, any> type
            const parsedData = JSON.parse(updateData.flowData) as Record<string, any>;
            updateData.flowData = parsedData;
          } catch (e) {
            // If parsing fails, initialize with empty nodes and edges
            updateData.flowData = { nodes: [], edges: [] } as Record<string, any>;
          }
        }
      }
      
      /* We've already processed the flowData above, so we don't need this duplicate code */
      
      // Update the workflow
      const updatedWorkflow = await storage.updateWorkflow(id, updateData);
      
      // Return the updated workflow
      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete a workflow
  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Check if workflow exists
      const workflow = await storage.getWorkflow(id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Delete the workflow
      const success = await storage.deleteWorkflow(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete workflow" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Stop a running workflow
  app.post("/api/workflows/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }

      const { logId } = req.body;
      
      // Call the stopWorkflow function
      const result = await stopWorkflow(id, logId);
      
      if (result) {
        res.json({ 
          success: true, 
          message: "Workflow stopped successfully" 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "No running workflow found or failed to stop workflow" 
        });
      }
    } catch (error) {
      console.error("Error stopping workflow:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error stopping workflow",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Execute a workflow
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow ID" });
      }
      
      // Validate request body
      const executeSchema = z.object({
        input: z.any().optional(),
        options: z.object({
          includeDetail: z.boolean().optional(),
          debug: z.boolean().optional(),
          executionMode: z.string().optional()
        }).optional()
      });
      
      const result = executeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid execution request", 
          details: validationError.message 
        });
      }
      
      const { input, options } = result.data;
      
      // Execute the workflow
      const outcome = await runWorkflow(id, input || {}, options || {});
      
      // Return the result
      res.json(outcome);
      
    } catch (error) {
      console.error("Workflow execution error:", error);
      
      res.status(500).json({ 
        message: "Error executing workflow", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // ===== Node Routes =====
  
  // Get all nodes
  app.get("/api/nodes", async (req, res) => {
    try {
      const type = req.query.type as string | undefined;
      const nodes = await storage.getNodes(type);
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching nodes" });
    }
  });
  
  // Get custom node types
  app.get("/api/nodes/custom-types", async (req, res) => {
    try {
      // Find all nodes with isCustom=true and extract their types
      const nodes = await storage.getNodes();
      const customNodes = nodes.filter(node => node.isCustom === true);
      const customNodeTypes = customNodes.map(node => node.type);
      
      // Store the updated custom node types in the database for future use
      if (customNodeTypes.length > 0) {
        await storage.db.set('customNodeTypes', JSON.stringify(customNodeTypes));
        console.log('Updated custom node types in database:', customNodeTypes);
      }
      
      res.json({ customNodeTypes });
    } catch (error) {
      console.error('Error fetching custom node types:', error);
      res.status(500).json({ 
        message: "Error fetching custom node types", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get a specific node
  app.get("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      res.json(node);
    } catch (error) {
      res.status(500).json({ message: "Error fetching node" });
    }
  });
  
  // Create a new node
  app.post("/api/nodes", async (req, res) => {
    try {
      // Validate request body
      const nodeSchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.string(),
        category: z.string().default("custom"), // Added required category field with default
        icon: z.string().optional(),
        inputs: z.record(z.any()).optional(),
        outputs: z.record(z.any()).optional(),
        settings: z.record(z.any()).optional(),
        isCustom: z.boolean().default(true),
        version: z.string().default("1.0.0"),
        implementation: z.string().optional()
      });
      
      const result = nodeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid node data", 
          details: validationError.message 
        });
      }
      
      // Create the node with required category
      const nodeData = {
        ...result.data,
        category: result.data.category || "custom" // Ensure category is present
      };
      
      // Create the node
      const node = await storage.createNode(nodeData);
      
      // If this is a custom node, update the customNodeTypes collection
      if (node.isCustom) {
        try {
          // Get current custom node types
          const nodes = await storage.getNodes();
          const customNodes = nodes.filter(n => n.isCustom === true);
          const customNodeTypes = customNodes.map(n => n.type);
          
          // Save the updated list to the database
          await storage.db.set('customNodeTypes', JSON.stringify(customNodeTypes));
          console.log('Updated custom node types with new node:', node.type);
        } catch (error) {
          console.warn('Failed to update custom node types:', error);
          // This is non-critical so we continue
        }
      }
      
      // Return the created node
      res.status(201).json(node);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update a node
  app.patch("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      // Get existing node
      const existingNode = await storage.getNode(id);
      if (!existingNode) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      // Validate request body
      const nodeUpdateSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        category: z.string().optional(), // Add optional category field for updates
        icon: z.string().optional(),
        inputs: z.record(z.any()).optional(),
        outputs: z.record(z.any()).optional(),
        settings: z.record(z.any()).optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = nodeUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid node data", 
          details: validationError.message 
        });
      }
      
      // Update the node
      const updatedNode = await storage.updateNode(id, result.data);
      
      // Return the updated node
      res.json(updatedNode);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Delete a node
  app.delete("/api/nodes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      // Check if node exists
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      // Store if this node is custom before deleting
      const isCustomNode = node.isCustom === true;
      const nodeType = node.type;
      
      // Delete the node
      const success = await storage.deleteNode(id);
      
      // If it was a custom node, update the custom node types list
      if (success && isCustomNode) {
        try {
          // Get current custom node types after deletion
          const remainingNodes = await storage.getNodes();
          const customNodes = remainingNodes.filter(n => n.isCustom === true);
          const customNodeTypes = customNodes.map(n => n.type);
          
          // Save the updated list to the database
          await storage.db.set('customNodeTypes', JSON.stringify(customNodeTypes));
          console.log('Updated custom node types after deleting:', nodeType);
        } catch (error) {
          console.warn('Failed to update custom node types after deletion:', error);
          // This is non-critical so we continue
        }
      }
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete node" });
      }
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Execute a specific node
  app.post("/api/nodes/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      // Get the node
      const node = await storage.getNode(id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      
      // Validate request body
      const executeSchema = z.object({
        inputs: z.record(z.any()).optional()
      });
      
      const result = executeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid execution request", 
          details: validationError.message 
        });
      }
      
      const { inputs = {} } = result.data;
      
      // For now, return a mock response
      // In a real application, this would execute the node's specific logic
      res.json({
        output: "Node mock execution completed",
        nodeType: node.type,
        executionTime: 100
      });
      
    } catch (error) {
      res.status(500).json({ 
        message: "Error executing node", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // ===== Log Routes =====
  
  // Get all logs
  app.get("/api/logs", async (req, res) => {
    try {
      // Parse optional query parameters
      const agentId = req.query.agentId ? parseInt(req.query.agentId as string, 10) : undefined;
      const workflowId = req.query.workflowId ? parseInt(req.query.workflowId as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      const logs = await storage.getLogs(agentId, workflowId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: "Error fetching logs", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get a specific log
  app.get("/api/logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      
      const log = await storage.getLog(id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Error fetching log" });
    }
  });
  
  // Create a new log
  app.post("/api/logs", async (req, res) => {
    try {
      // Validate request body using the newer format
      const logSchema = z.object({
        agentId: z.number().optional().default(1),
        workflowId: z.number().optional().default(1),
        status: z.string(),
        input: z.any().optional(),
        output: z.any().optional(),
        error: z.string().nullable().optional(),
        executionPath: z.record(z.any()).optional()
      });
      
      const result = logSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid log data", 
          details: validationError.message 
        });
      }
      
      // Create the log with required fields
      const logEntry: InsertLog = {
        agentId: result.data.agentId || 1,
        workflowId: result.data.workflowId || 1,
        status: result.data.status,
        input: result.data.input || {},
        output: result.data.output || {},
        error: result.data.error,
        executionPath: result.data.executionPath || {}
      };
      
      // Create the log
      const log = await storage.createLog(logEntry);
      
      // Return the created log
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating log", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Update a log
  app.put("/api/logs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid log ID" });
      }
      
      const log = await storage.getLog(id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      
      // Validate request body with the new log schema
      const logUpdateSchema = z.object({
        status: z.string().optional(),
        input: z.any().optional(),
        output: z.any().optional(),
        error: z.string().nullable().optional(),
        completedAt: z.date().optional(),
        executionPath: z.record(z.any()).optional()
      });
      
      const result = logUpdateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid log data", 
          details: validationError.message 
        });
      }
      
      // Update the log with the new schema fields
      const updatedLog = await storage.updateLog(id, result.data);
      
      // Return the updated log
      res.json(updatedLog);
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating log", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // API request proxy to avoid CORS issues when making requests to third-party APIs
  app.post("/api/proxy", async (req, res) => {
    try {
      // Validate request body
      const proxySchema = z.object({
        url: z.string().url(),
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
        headers: z.record(z.string()).optional(),
        data: z.any().optional(),
        timeout: z.number().optional(),
      });
      
      const result = proxySchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid proxy request", 
          details: validationError.message 
        });
      }
      
      const { url, method, headers, data, timeout } = result.data;
      
      // Create fetch options
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {})
        },
        // Add body for non-GET requests
        ...(method !== 'GET' && data ? { body: JSON.stringify(data) } : {})
      };
      
      // Make the request
      const response = await fetchWithTimeout(url, fetchOptions, timeout);
      
      // Get the response body
      let responseBody: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      // Create response data
      // Convert headers to a plain object
      const headersObject: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersObject[key] = value;
      });
      
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: headersObject,
        data: responseBody
      };
      
      // Return response with original status code
      res.status(response.status).json(responseData);
    } catch (error) {
      console.error('API Proxy error:', error);
      res.status(500).json({ 
        message: "API Proxy error", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Get a message from the API
  app.post("/api/message", async (req, res) => {
    try {
      const messageSchema = z.object({
        agentId: z.number(),
        prompt: z.string(),
        workflowId: z.number().optional(),
        sessionId: z.string().optional(),
        metadata: z.record(z.any()).optional()
      });
      
      const result = messageSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Invalid message request", 
          details: validationError.message 
        });
      }
      
      const { agentId, prompt, workflowId, sessionId, metadata } = result.data;
      
      // Get the agent
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      // Create a session ID if one wasn't provided
      const session = sessionId || uuidv4();
      
      // Create a log for this message using the new schema
      const messageLog: InsertLog = {
        agentId,
        workflowId: workflowId || 1, // Default to 1 if not provided
        status: "received",
        input: {
          prompt,
          session,
          timestamp: new Date().toISOString()
        },
        output: {}, // Initialize with empty object
        executionPath: {
          type: "message",
          source: "user",
          metadata: metadata || {}
        }
      };
      
      const log = await storage.createLog(messageLog);
      
      // Log the incoming message
      console.log(`Message to agent ${agentId}: ${prompt}`);
      
      // If the agent has a linked workflow, use that workflow to process the message
      if (workflowId) {
        try {
          // Execute the workflow
          const workflowResult = await runWorkflow(workflowId, { prompt, session, metadata });
          
          // Return the workflow result
          return res.status(200).json({
            message: workflowResult.output,
            sessionId: session,
            agentId,
            logId: log.id,
            workflowId,
            ...workflowResult
          });
        } catch (error) {
          console.error("Error executing workflow for message:", error);
          
          return res.status(500).json({
            error: true,
            message: "Failed to process message through workflow",
            details: error instanceof Error ? error.message : String(error),
            sessionId: session
          });
        }
      }
      
      // For now, if there's no workflow, return a mock response from the workflow (a stub)
      const mockResponse = `Mock response from agent: I received your message: "${prompt}"`;
      
      // Update the log with the response using the new schema
      await storage.updateLog(log.id, {
        status: "completed",
        output: {
          response: mockResponse,
          responseTimestamp: new Date().toISOString()
        },
        completedAt: new Date()
      });
      
      res.json({
        message: mockResponse,
        sessionId: session,
        agentId,
        logId: log.id
      });
      
    } catch (error) {
      console.error("Message processing error:", error);
      
      res.status(500).json({
        error: true,
        message: "Error processing message",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // ===== Webhook Routes =====
  
  // Webhooks are now handled directly by the Integration Engine
  // The redirect code has been removed as part of the clean-break approach
  // All webhook requests should now be sent directly to:
  // - http://localhost:3001/webhooks/workflow/:workflowId/node/:nodeId
  // - http://localhost:3001/webhooks/:path
  
  // 5. Webhook documentation route
  app.get('/api/webhooks', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Webhook API endpoints documentation',
      note: 'Webhooks are now handled directly by the Integration Engine',
      endpoints: {
        base_url: 'http://localhost:3001',
        custom_path: {
          url: '/webhooks/:path',
          method: 'Any',
          description: 'Send a webhook to a workflow with custom path'
        },
        direct_workflow: {
          url: '/webhooks/workflow/:workflowId/node/:nodeId',
          method: 'Any',
          description: 'Send a webhook directly to a specific workflow node'
        },
        stats: {
          url: '/api/webhook-stats',
          method: 'GET',
          description: 'Get statistics about pending webhook responses'
        }
      }
    });
  });
  
  return server;
}
