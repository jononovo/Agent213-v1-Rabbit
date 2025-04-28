import { Node, Edge } from 'reactflow';
import { 
  EnhancedNodeExecutor,
  NodeExecutionData, 
  WorkflowData, 
  WorkflowExecutionState, 
  NodeState,
  WorkflowItem,
  createWorkflowItem
} from './types/workflow';

// Import the unified node registry
import { 
  getNodeExecutor, 
  initializeRegistry,
  getAllNodeTypes 
} from './unifiedNodeRegistry';

// Legacy executor registry - this will be phased out
// but is maintained for backward compatibility
const nodeRegistry: Record<string, EnhancedNodeExecutor> = {};

/**
 * Create an enhanced node executor with standard interfaces
 * 
 * DEPRECATED: This function is maintained for backward compatibility.
 * New code should register nodes through the unified registry system.
 */
export function createEnhancedNodeExecutor(
  definition: {
    type: string;
    displayName: string;
    description: string;
    icon: string;
    category: string;
    version: string;
    inputs: Record<string, {
      type: string;
      displayName: string;
      description: string;
      required?: boolean;
      default?: any;
    }>;
    outputs: Record<string, {
      type: string;
      displayName: string;
      description: string;
    }>;
  },
  executorFn: (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>) => Promise<NodeExecutionData>
): EnhancedNodeExecutor {
  return {
    definition,
    execute: executorFn
  };
}

/**
 * Register a node executor for a specific node type
 * 
 * DEPRECATED: This function is maintained for backward compatibility.
 * New code should register nodes through the unified registry system.
 */
export function registerEnhancedNodeExecutor(nodeType: string, executor: EnhancedNodeExecutor): void {
  nodeRegistry[nodeType] = executor;
  console.log(`Registered enhanced node executor for type: ${nodeType}`);
}

/**
 * Register all enhanced node executors
 */
export async function registerAllEnhancedNodeExecutors(): Promise<void> {
  try {
    // Ensure the unified registry is initialized
    await initializeRegistry();
    
    // For backward compatibility: Import the nodeSystem module for registering folder-based executors
    // This ensures we catch any nodes that might be using the old system
    await import('./nodeSystem').then(nodeSystem => {
      nodeSystem.registerNodeExecutorsFromRegistry();
    });
    
    // List of built-in node types we need to ensure are registered
    const criticalNodeTypes = [
      'text_input', 
      'claude',
      'text_template',
      'http_request'
    ];
    
    // Check the unified registry and the legacy registry
    for (const nodeType of criticalNodeTypes) {
      const unifiedExecutor = getNodeExecutor(nodeType);
      const legacyExecutor = nodeRegistry[nodeType];
      
      if (!unifiedExecutor && !legacyExecutor) {
        console.warn(`Critical node ${nodeType} not found in registry. Make sure it exists in the System folder.`);
      } else {
        console.log(`Verified critical node type ${nodeType} is registered`);
      }
    }
    
    console.log('All enhanced node executors registered successfully');
    console.log(`Available node types: ${getAllNodeTypes().join(', ')}`);
  } catch (error) {
    console.error('Error registering enhanced node executors:', error);
    throw error;
  }
}

/**
 * Create a dependency graph from workflow nodes and edges
 */
function createNodeDependencyGraph(workflowData: WorkflowData): Record<string, string[]> {
  const dependencyGraph: Record<string, string[]> = {};
  
  // Initialize empty arrays for all nodes
  workflowData.nodes.forEach(node => {
    dependencyGraph[node.id] = [];
  });
  
  // Add dependencies based on edges
  workflowData.edges.forEach(edge => {
    if (dependencyGraph[edge.target]) {
      dependencyGraph[edge.target].push(edge.source);
    }
  });
  
  return dependencyGraph;
}

/**
 * Resolve execution order based on dependency graph (topological sort)
 */
function resolveExecutionOrder(dependencyGraph: Record<string, string[]>): string[] {
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  const order: string[] = [];
  
  // Define DFS function for topological sort
  function dfs(nodeId: string): void {
    // If node is in temp, we have a cycle
    if (temp[nodeId]) {
      throw new Error(`Cycle detected in workflow at node ${nodeId}`);
    }
    
    // If node is already visited, skip
    if (visited[nodeId]) {
      return;
    }
    
    // Mark node as temporarily visited
    temp[nodeId] = true;
    
    // Visit all dependencies first
    const dependencies = dependencyGraph[nodeId] || [];
    for (const depId of dependencies) {
      dfs(depId);
    }
    
    // Mark node as permanently visited
    temp[nodeId] = false;
    visited[nodeId] = true;
    
    // Add node to order
    order.push(nodeId);
  }
  
  // Run DFS for all nodes
  for (const nodeId in dependencyGraph) {
    if (!visited[nodeId]) {
      dfs(nodeId);
    }
  }
  
  return order;
}

/**
 * Get input mapping for nodes (which input connects to which output)
 */
function getInputMapping(workflowData: WorkflowData): Record<string, Record<string, { nodeId: string, outputKey: string }>> {
  const inputMapping: Record<string, Record<string, { nodeId: string, outputKey: string }>> = {};
  
  // Initialize empty objects for all nodes
  workflowData.nodes.forEach(node => {
    inputMapping[node.id] = {};
  });
  
  // Create mappings based on edges
  workflowData.edges.forEach(edge => {
    const targetNode = edge.target;
    const targetHandle = edge.targetHandle || 'default';
    const sourceNode = edge.source;
    const sourceHandle = edge.sourceHandle || 'default';
    
    if (inputMapping[targetNode]) {
      inputMapping[targetNode][targetHandle] = {
        nodeId: sourceNode,
        outputKey: sourceHandle
      };
    }
  });
  
  return inputMapping;
}

/**
 * Execute an enhanced workflow
 */
export async function executeEnhancedWorkflow(
  workflowData: WorkflowData,
  onNodeStateChange?: (nodeId: string, state: NodeState) => void,
  onWorkflowComplete?: (state: WorkflowExecutionState) => void,
  options: {
    debugMode?: boolean;
    metadata?: Record<string, any>;
  } = {}
): Promise<WorkflowExecutionState> {
  const { debugMode = false } = options;
  
  console.log('Executing enhanced workflow with', workflowData.nodes.length, 'nodes');
  if (debugMode) {
    console.log('Debug mode enabled for workflow execution');
  }
  
  // Create initial execution state
  const executionState: WorkflowExecutionState = {
    status: 'running',
    nodeStates: {},
    startTime: new Date(),
    endTime: null,
    nodeOutputs: {}
  };
  
  // Create dependency graph and resolve execution order
  const dependencyGraph = createNodeDependencyGraph(workflowData);
  let executionOrder: string[];
  
  try {
    executionOrder = resolveExecutionOrder(dependencyGraph);
    console.log('Resolved execution order:', executionOrder);
  } catch (error) {
    executionState.status = 'error';
    executionState.error = error instanceof Error ? error.message : String(error);
    executionState.endTime = new Date();
    
    if (onWorkflowComplete) {
      onWorkflowComplete(executionState);
    }
    
    throw new Error(`Error resolving execution order: ${executionState.error}`);
  }
  
  // Get input mapping
  const inputMapping = getInputMapping(workflowData);
  
  // Node map for quick lookup
  const nodeMap = new Map<string, any>();
  workflowData.nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });
  
  // Execute nodes in order
  try {
    for (const nodeId of executionOrder) {
      const node = nodeMap.get(nodeId);
      
      if (!node) {
        throw new Error(`Node with id ${nodeId} not found in workflow`);
      }
      
      const nodeType = node.type;
      const nodeData = node.data || {};
      
      // Get executor for node type - from either the unified registry, enhanced registry or the direct executors
      const unifiedExecutor = getNodeExecutor(nodeType);
      const legacyExecutor = nodeRegistry[nodeType];
      const executor = unifiedExecutor || legacyExecutor;
      
      if (!executor) {
        // Cannot find executor for this node type
        throw new Error(`No executor registered for node type "${nodeType}". Make sure this node type is properly registered in the System or Custom folder.`);
      }
      
      // Prepare node state in execution state
      executionState.nodeStates[nodeId] = {
        status: 'running',
        startTime: new Date(),
        endTime: null,
        output: undefined
      };
      
      // Notify of node state change
      if (onNodeStateChange) {
        onNodeStateChange(nodeId, executionState.nodeStates[nodeId]);
      }
      
      try {
        // Collect inputs from connected nodes
        const inputs: Record<string, NodeExecutionData> = {};
        const nodeInputMapping = inputMapping[nodeId] || {};
        
        // Import the transformation utility
        // @ts-ignore - This is dynamically loaded
        const { transformNodeData } = await import('./nodeDataUtils');
        
        // For each input target, get the output from the source node
        for (const [inputKey, { nodeId: sourceNodeId, outputKey }] of Object.entries(nodeInputMapping)) {
          const sourceOutput = executionState.nodeOutputs[sourceNodeId];
          
          if (!sourceOutput) {
            throw new Error(`No output available from source node ${sourceNodeId}`);
          }
          
          // Transform the output based on source node type and target node expectations
          // Determine source type and target type (simplified for now)
          const sourceType = typeof sourceOutput === 'object' ? 'object' : typeof sourceOutput;
          const targetType = 'string'; // Simplified assumption for now
          
          // Transform the data for compatibility
          try {
            // First try to access specific outputKey if specified
            let transformedOutput = sourceOutput;
            
            // Apply data transformation
            transformedOutput = transformNodeData(transformedOutput, sourceType, targetType);
            
            // Set the transformed output as input
            inputs[inputKey] = transformedOutput;
          } catch (error) {
            console.warn(`Error transforming data from node ${sourceNodeId} to ${nodeId}:`, error);
            // Still use the raw output as fallback
            inputs[inputKey] = sourceOutput;
          }
        }
        
        // Use node data as inputs for any configured values
        for (const [key, value] of Object.entries(nodeData)) {
          if (key !== 'label' && key !== 'description' && !key.startsWith('_')) {
            if (!inputs[key] && value !== undefined) {
              // Create a workflow item from the value if not already an input
              inputs[key] = {
                items: [createWorkflowItem(value, 'static')],
                meta: { startTime: new Date(), endTime: new Date() }
              };
            }
          }
        }
        
        // Execute the node
        console.log(`Executing node ${nodeId} (${nodeType})`);
        
        // In debug mode, log detailed node execution information
        if (debugMode) {
          console.log(`Node ${nodeId} (${nodeType}) execution details:`, {
            nodeData,
            inputs,
            inputMapping: nodeInputMapping
          });
        }
        
        const output = await executor.execute(nodeData, inputs);
        
        // In debug mode, log the output of the node
        if (debugMode) {
          console.log(`Node ${nodeId} (${nodeType}) output:`, output);
        }
        
        // Store output
        executionState.nodeOutputs[nodeId] = output;
        
        // Update node state
        executionState.nodeStates[nodeId] = {
          status: 'completed',
          startTime: executionState.nodeStates[nodeId].startTime,
          endTime: new Date(),
          output
        };
        
        // Check if this is the last node in the workflow
        const isLastNodeInFlow = executionOrder[executionOrder.length - 1] === nodeId;
        if (isLastNodeInFlow) {
          executionState.output = output;
        }
        
        // Notify of node state change
        if (onNodeStateChange) {
          onNodeStateChange(nodeId, executionState.nodeStates[nodeId]);
        }
      } catch (error) {
        console.error(`Error executing node ${nodeId} (${nodeType}):`, error);
        
        // Update node state with error
        executionState.nodeStates[nodeId] = {
          status: 'error',
          startTime: executionState.nodeStates[nodeId].startTime,
          endTime: new Date(),
          error: error instanceof Error ? error.message : String(error)
        };
        
        // Notify of node state change
        if (onNodeStateChange) {
          onNodeStateChange(nodeId, executionState.nodeStates[nodeId]);
        }
        
        // Stop execution if node is marked as critical
        if (nodeData.critical) {
          throw new Error(`Critical node ${nodeId} (${nodeType}) failed: ${executionState.nodeStates[nodeId].error}`);
        }
      }
    }
    
    // Mark workflow as completed
    executionState.status = 'completed';
  } catch (error) {
    console.error('Error executing workflow:', error);
    
    // Mark workflow as failed
    executionState.status = 'error';
    executionState.error = error instanceof Error ? error.message : String(error);
  } finally {
    // Set end time
    executionState.endTime = new Date();
    
    // Notify of workflow completion
    if (onWorkflowComplete) {
      onWorkflowComplete(executionState);
    }
  }
  
  return executionState;
}