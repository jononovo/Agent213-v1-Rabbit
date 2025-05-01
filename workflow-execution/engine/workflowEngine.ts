/**
 * Workflow Execution Engine
 * 
 * This module handles the actual execution of workflows by traversing
 * the workflow graph and executing each node in the correct order.
 */

import { Job, WorkflowExecutionContext, WorkflowValidationResult, WorkflowExecutionOutput } from '../../shared/types/workflow';
import { NodeExecutionData } from '../../shared/nodeTypes';
import { storage } from '../../server/storage';
import fetch from 'node-fetch';

/**
 * Validate a workflow before execution
 * This checks that all required node executors exist
 */
export async function validateWorkflow(flowData: any): Promise<WorkflowValidationResult> {
  const missingExecutors: string[] = [];
  
  // Check all nodes to ensure their executors can be loaded
  for (const node of flowData.nodes) {
    const nodeType = node.type;
    
    try {
      // Get the node category using the whole node object, not just the type
      const nodeCategory = getNodeCategory(node);
      
      console.log(`[Workflow Engine Debug] Validating node ${node.id} (${nodeType}) in category ${nodeCategory}`);
      
      // Use a full workspace path instead of a relative path
      const executorPath = `${process.cwd()}/client/src/nodes/categories/${nodeCategory}/${nodeType}/executor`;
      console.log(`[Workflow Engine Debug] Attempting to import from path: ${executorPath}`);
      
      // Try to directly load with require to get better error info
      try {
        // Attempt to import the executor module to verify it exists
        await import(executorPath);
        console.log(`[Workflow Engine Debug] Successfully imported executor for ${nodeType}`);
      } catch (importError) {
        console.error(`[Workflow Engine Debug] Import error for ${nodeType}:`, importError);
        throw importError; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error(`[Workflow Engine Debug] Validation failed for node ${nodeType}:`, error);
      missingExecutors.push(`${node.id} (${nodeType})`);
    }
  }
  
  console.log(`[Workflow Engine Debug] Validation result: ${missingExecutors.length === 0 ? 'Valid' : 'Invalid'}`);
  if (missingExecutors.length > 0) {
    console.log(`[Workflow Engine Debug] Missing executors: ${missingExecutors.join(', ')}`);
  }
  
  return {
    valid: missingExecutors.length === 0,
    missingExecutors
  };
}

/**
 * Execute a workflow with the given input
 */
export async function executeWorkflow(job: Job): Promise<WorkflowExecutionOutput> {
  const { workflowId, input = {}, startNodeId } = job.data;
  
  try {
    console.log(`[Workflow Engine] Executing workflow ${workflowId}`);
    
    // Load the workflow from storage
    const workflow = await storage.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    // Parse flow data
    const flowData = typeof workflow.flowData === 'string' 
      ? JSON.parse(workflow.flowData) 
      : workflow.flowData;
    
    if (!flowData || !flowData.nodes || !flowData.edges) {
      throw new Error('Invalid workflow data: Missing nodes or edges');
    }
    
    // Validate workflow before execution
    const validation = await validateWorkflow(flowData);
    if (!validation.valid) {
      const errorMessage = `Workflow validation failed. Missing node executors: ${validation.missingExecutors.join(', ')}`;
      
      // Create a log entry for the failed validation
      try {
        await storage.createLog({
          workflowId,
          agentId: job.data?.agentId || undefined,
          status: 'failed',
          input: job.data?.input || {},
          output: {},
          error: errorMessage,
          executionPath: {
            validationError: true,
            missingExecutors: validation.missingExecutors,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error(`[Workflow Engine] Error creating validation failure log for workflow ${workflowId}:`, logError);
      }
      
      throw new Error(errorMessage);
    }
    
    // Create execution context
    const context: WorkflowExecutionContext = {
      workflowId,
      nodeResults: new Map(),
      startedAt: new Date(),
      errors: new Map(),
      aborted: false
    };
    
    // Find start nodes (nodes with no incoming edges or specified start node)
    let startNodes = [];
    if (startNodeId) {
      // If start node is specified, use it
      const node = flowData.nodes.find((n: any) => n.id === startNodeId);
      if (node) {
        startNodes = [node];
      }
    } else {
      // Otherwise, find nodes with no incoming edges
      const nodesWithIncomingEdges = new Set(
        flowData.edges.map((edge: any) => edge.target)
      );
      
      startNodes = flowData.nodes.filter(
        (node: any) => !nodesWithIncomingEdges.has(node.id)
      );
    }
    
    if (startNodes.length === 0) {
      throw new Error('No start nodes found in workflow');
    }
    
    console.log(`[Workflow Engine] Starting execution with ${startNodes.length} start nodes`);
    
    // Execute each start node and follow the execution path
    const results = [];
    for (const startNode of startNodes) {
      const result = await executeNode(startNode, flowData, context, input);
      results.push(result);
      
      if (context.aborted) {
        console.log(`[Workflow Engine] Workflow execution aborted`);
        break;
      }
    }
    
    // Collect results
    const output: WorkflowExecutionOutput = {
      results,
      errors: Object.fromEntries(context.errors.entries()),
      executionTime: new Date().getTime() - context.startedAt.getTime(),
      status: context.aborted ? 'aborted' : context.errors.size > 0 ? 'completed_with_errors' : 'completed'
    };
    
    console.log(`[Workflow Engine] Workflow ${workflowId} executed in ${output.executionTime}ms with status ${output.status}`);
    
    // Create a log entry for the workflow execution
    try {
      await storage.createLog({
        workflowId,
        agentId: job.data?.agentId || undefined,
        status: output.status,
        input: job.data?.input || {},
        output: { results: output.results },
        error: Object.keys(output.errors).length > 0 ? JSON.stringify(output.errors) : undefined,
        executionPath: {
          executionTime: output.executionTime,
          nodeResults: Array.from(context.nodeResults.entries()).reduce((acc: Record<string, any>, [nodeId, result]) => {
            acc[nodeId] = { 
              type: flowData.nodes.find((n: any) => n.id === nodeId)?.type || 'unknown',
              success: !context.errors.has(nodeId)
            };
            return acc;
          }, {}),
          startedAt: context.startedAt.toISOString(),
          completedAt: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error(`[Workflow Engine] Error creating log for workflow ${workflowId}:`, logError);
      // Don't fail the workflow execution if log creation fails
    }
    
    return output;
  } catch (error) {
    console.error(`[Workflow Engine] Error executing workflow ${workflowId}:`, error);
    
    return {
      results: [],
      errors: { 'execution': error instanceof Error ? error.message : String(error) },
      executionTime: 0,
      status: 'failed'
    };
  }
}

/**
 * Execute a single node and its outgoing nodes
 */
async function executeNode(
  node: any, 
  flowData: any, 
  context: WorkflowExecutionContext,
  input: any
): Promise<any> {
  if (context.aborted) {
    return null;
  }
  
  const nodeId = node.id;
  const nodeType = node.type;
  const nodeData = node.data || {};
  
  try {
    console.log(`[Workflow Engine] Executing node ${nodeId} (${nodeType})`);
    
    // If this node has already been executed, return the cached result
    if (context.nodeResults.has(nodeId)) {
      return context.nodeResults.get(nodeId);
    }
    
    // Get inputs from incoming edges
    const incomingEdges = flowData.edges.filter((edge: any) => edge.target === nodeId);
    const nodeInputs: Record<string, NodeExecutionData> = {};
    
    // Process each incoming edge to get the input
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source;
      const sourceHandle = edge.sourceHandle || 'default';
      const targetHandle = edge.targetHandle || 'default';
      
      // Make sure source node has been executed
      if (!context.nodeResults.has(sourceNodeId)) {
        // Find source node
        const sourceNode = flowData.nodes.find((n: any) => n.id === sourceNodeId);
        if (!sourceNode) {
          throw new Error(`Source node not found: ${sourceNodeId}`);
        }
        
        // Execute source node
        await executeNode(sourceNode, flowData, context, input);
        
        // If execution was aborted, stop
        if (context.aborted) {
          return null;
        }
      }
      
      // Get result from source node
      const sourceNodeResult = context.nodeResults.get(sourceNodeId);
      
      // Add to inputs using the target handle as key
      if (sourceNodeResult && sourceNodeResult[sourceHandle]) {
        nodeInputs[targetHandle] = sourceNodeResult[sourceHandle];
      }
    }
    
    // If this is a start node with no inputs, use the workflow input
    if (Object.keys(nodeInputs).length === 0) {
      nodeInputs.default = {
        items: [{ json: input }],
        meta: {
          startTime: new Date(),
          endTime: new Date()
        }
      };
    }
    
    // Execute the node
    let result;
    
    try {
      // Find registered executor for this node type
      // Use a full workspace path instead of a relative path
      const executorPath = `${process.cwd()}/client/src/nodes/categories/${getNodeCategory(node)}/${nodeType}/executor`;
      console.log(`[Workflow Engine] Loading executor from: ${executorPath}`);
      const { execute } = await import(executorPath);
      
      if (typeof execute !== 'function') {
        throw new Error(`Invalid executor for node type: ${nodeType} - execute function not found`);
      }
      
      // Execute the node with its inputs
      result = await execute(nodeData, nodeInputs);
    } catch (error) {
      // Provide detailed error information and fail the node execution
      const errorMessage = error instanceof Error 
        ? `Error executing node ${nodeId} (${nodeType}): ${error.message}` 
        : `Unknown error executing node ${nodeId} (${nodeType})`;
      
      console.error(`[Workflow Engine] ${errorMessage}`, error);
      
      // Re-throw the error to properly fail this node execution
      throw new Error(errorMessage);
    }
    
    // Store result in context
    context.nodeResults.set(nodeId, result);
    
    // Execute outgoing nodes
    const outgoingEdges = flowData.edges.filter((edge: any) => edge.source === nodeId);
    const outResults = [];
    
    for (const edge of outgoingEdges) {
      const targetNodeId = edge.target;
      const targetNode = flowData.nodes.find((n: any) => n.id === targetNodeId);
      
      if (targetNode) {
        const outResult = await executeNode(targetNode, flowData, context, input);
        outResults.push(outResult);
      }
    }
    
    // Return this node's result
    return result;
  } catch (error) {
    // Record error and continue with other nodes
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.errors.set(nodeId, errorMessage);
    
    console.error(`[Workflow Engine] Error executing node ${nodeId}:`, errorMessage);
    
    // Create error result
    const errorResult = {
      default: {
        items: [{ json: { error: errorMessage } }],
        meta: {
          startTime: new Date(),
          endTime: new Date(),
          error: true,
          errorMessage
        }
      }
    };
    
    // Store error result in context
    context.nodeResults.set(nodeId, errorResult);
    
    return errorResult;
  }
}

/**
 * Get the node's folder category from the node data
 * Looks for 'NodeFormat' property in the node's data
 * If not found, falls back to assuming 'System' for common nodes or 'Custom' as default
 */
export function getNodeCategory(node: any): string {
  // Check if node has NodeFormat property
  if (node.data && node.data.NodeFormat) {
    return node.data.NodeFormat;
  }
  
  // Fallback to some reasonable assumptions for common nodes
  // This allows backward compatibility
  const nodeType = node.type;
  
  // Updated: All nodes are in System category for now
  // Previously webhooks were assumed to be in Integration but that's not correct
  return 'System';
}