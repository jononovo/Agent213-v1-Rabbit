/**
 * Workflow Execution Engine
 * 
 * This module handles the actual execution of workflows by traversing
 * the workflow graph and executing each node in the correct order.
 */

import { Job } from './simpleQueue';
import { storage } from '../storage';
import { NodeExecutionData } from '@/lib/types/workflow';

// Helper interfaces
interface WorkflowExecutionContext {
  workflowId: number;
  nodeResults: Map<string, any>;
  startedAt: Date;
  errors: Map<string, string>;
  aborted: boolean;
}

/**
 * Validate a workflow before execution
 * This checks that all required node executors exist
 */
async function validateWorkflow(flowData: any): Promise<{ valid: boolean, missingExecutors: string[] }> {
  const missingExecutors: string[] = [];
  
  // Check all nodes to ensure their executors can be loaded
  for (const node of flowData.nodes) {
    const nodeType = node.type;
    
    try {
      // Attempt to import the executor module to verify it exists
      await import(`../../../client/src/nodes/${getNodeCategory(nodeType)}/${nodeType}/executor`);
    } catch (error) {
      missingExecutors.push(`${node.id} (${nodeType})`);
    }
  }
  
  return {
    valid: missingExecutors.length === 0,
    missingExecutors
  };
}

/**
 * Execute a workflow with the given input
 */
export async function executeWorkflow(job: Job): Promise<any> {
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
      throw new Error(`Workflow validation failed. Missing node executors: ${validation.missingExecutors.join(', ')}`);
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
    const output = {
      results,
      errors: Object.fromEntries(context.errors.entries()),
      executionTime: new Date().getTime() - context.startedAt.getTime(),
      status: context.aborted ? 'aborted' : context.errors.size > 0 ? 'completed_with_errors' : 'completed'
    };
    
    console.log(`[Workflow Engine] Workflow ${workflowId} executed in ${output.executionTime}ms with status ${output.status}`);
    
    return output;
  } catch (error) {
    console.error(`[Workflow Engine] Error executing workflow ${workflowId}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
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
    
    // Execute the node without fallback to mock implementations
    let result;
    
    try {
      // Find registered executor for this node type
      const { execute } = await import(`../../../client/src/nodes/${getNodeCategory(nodeType)}/${nodeType}/executor`);
      
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
 * Determine the category folder for a node type
 */
function getNodeCategory(nodeType: string): string {
  // Common mappings between node types and their categories
  const categoryMap: Record<string, string> = {
    'claude': 'System',
    'function_node': 'System',
    'webhook_trigger': 'Integration',
    'perplexity_api': 'Integration',
    'embed_other_workflow': 'System',
    'send_to_webhook': 'System'
  };
  
  return categoryMap[nodeType] || 'Custom';
}