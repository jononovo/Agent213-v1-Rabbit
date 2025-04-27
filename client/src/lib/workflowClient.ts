/**
 * Workflow Client
 * 
 * This module provides a client interface for working with workflows
 * that emphasizes client-side execution with minimal server dependencies.
 */

import { apiClient } from './apiClient';
import { executeEnhancedWorkflow } from './enhancedWorkflowEngine';
import { WorkflowExecutionState, NodeState } from './types/workflow';

// Extended WorkflowData interface to include additional properties from the API
interface WorkflowData {
  id: number;
  name: string;
  description: string;
  type: string;
  agentId?: number;
  flowData: any;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Loads a workflow by ID from the server
 */
export async function loadWorkflow(id: number): Promise<WorkflowData> {
  try {
    const workflow = await apiClient.get(`/api/workflows/${id}`);
    
    // Parse the flow data if it's a string
    if (workflow.flowData && typeof workflow.flowData === 'string') {
      workflow.flowData = JSON.parse(workflow.flowData);
    }
    
    return workflow;
  } catch (error) {
    console.error(`Error loading workflow ${id}:`, error);
    throw error;
  }
}

/**
 * Executes a workflow in the client-side engine
 * 
 * @param workflowIdOrData Either a workflow ID to fetch from server or a complete workflow data object
 * @param input Input data for the workflow
 * @param options Execution options
 * @returns Promise resolving to execution state
 */
export async function executeWorkflow(
  workflowIdOrData: number | WorkflowData,
  input: any = {},
  options: {
    onNodeStateChange?: (nodeId: string, state: NodeState) => void;
    onWorkflowComplete?: (state: WorkflowExecutionState) => void;
    logToServer?: boolean;
    metadata?: Record<string, any>;
  } = {}
): Promise<WorkflowExecutionState> {
  try {
    // Default options
    const { 
      onNodeStateChange, 
      onWorkflowComplete, 
      logToServer = true,
      metadata = {}
    } = options;
    
    // Load workflow if ID is provided
    let workflowData: WorkflowData;
    if (typeof workflowIdOrData === 'number') {
      workflowData = await loadWorkflow(workflowIdOrData);
    } else {
      workflowData = workflowIdOrData;
    }
    
    // Validate workflow data
    if (!workflowData || !workflowData.flowData) {
      throw new Error('Invalid workflow data');
    }
    
    // Extract flow data if it's a string
    const flowData = typeof workflowData.flowData === 'string' 
      ? JSON.parse(workflowData.flowData) 
      : workflowData.flowData;
    
    // Inject input data
    // Find trigger nodes or text_input nodes to inject data
    const { nodes = [] } = flowData;
    
    // Determine entry points based on the input data and metadata
    const entryNodeTypes = [
      'text_input', 
      'internal_new_agent',
      'internal_ai_chat_agent',
      'embed_other_workflow',
      'agent_trigger'
    ];
    
    // Enhance input with metadata
    const enhancedInput = {
      ...input,
      metadata: {
        ...metadata,
        clientExecuted: true
      }
    };
    
    // Find appropriate entry nodes and inject input
    let injectedInput = false;
    for (const node of nodes) {
      if (entryNodeTypes.includes(node.type)) {
        if (!node.data) node.data = {};
        
        // Check if this node is appropriate for the input source
        const isSourceCompatible = 
          (node.type === 'internal_ai_chat_agent' && metadata.source === 'ai_chat') ||
          (node.type === 'internal_new_agent' && metadata.source !== 'ai_chat') ||
          node.type === 'text_input' || 
          node.type === 'embed_other_workflow' ||
          node.type === 'agent_trigger';
        
        if (isSourceCompatible) {
          // Add a special flag to indicate this is the preferred entry point
          node.data._preferredTrigger = true;
          
          // Add input data
          if (typeof input === 'string') {
            node.data.inputText = input;
            node.data.text = input;
          } else {
            // Inject all input properties
            for (const [key, value] of Object.entries(enhancedInput)) {
              if (key !== 'metadata') {
                node.data[key] = value;
              }
            }
            
            // Set the text property as JSON string if it doesn't exist
            if (!node.data.inputText && !node.data.text) {
              node.data.inputText = JSON.stringify(enhancedInput, null, 2);
              node.data.text = node.data.inputText;
            }
          }
          
          injectedInput = true;
          break;
        }
      }
    }
    
    // If no compatible entry node found, inject into the first node as fallback
    if (!injectedInput && nodes.length > 0) {
      const firstNode = nodes[0];
      if (!firstNode.data) firstNode.data = {};
      
      if (typeof input === 'string') {
        firstNode.data.inputText = input;
        firstNode.data.text = input;
      } else {
        Object.assign(firstNode.data, enhancedInput);
      }
      
      console.log(`Injected input into first node (${firstNode.id}) as fallback`);
    }
    
    // Log execution start to server if requested
    let logId = null;
    if (logToServer) {
      try {
        // Make sure we include all required fields for log creation
        const logResponse = await apiClient.post('/api/logs', {
          workflowId: typeof workflowIdOrData === 'number' ? workflowIdOrData : workflowData.id,
          agentId: 0, // Use a default agent ID since this is required
          status: 'running',
          input: enhancedInput
        });
        
        logId = logResponse.id;
        console.log(`Created server execution log: ${logId}`);
      } catch (error) {
        console.warn('Failed to create execution log on server:', error);
        // Continue execution even if logging fails
      }
    }
    
    // Execute workflow using client-side engine
    const executionState = await executeEnhancedWorkflow(
      flowData,
      onNodeStateChange,
      async (finalState) => {
        // Update log on server when workflow completes
        if (logToServer && logId) {
          try {
            await apiClient.patch(`/api/logs/${logId}`, {
              status: finalState.status,
              output: finalState.output,
              error: finalState.error,
              completedAt: new Date()
            });
          } catch (error) {
            console.warn('Failed to update execution log on server:', error);
            // Continue execution even if log update fails
          }
        }
        
        // Call provided callback
        if (onWorkflowComplete) {
          onWorkflowComplete(finalState);
        }
      },
      {
        debugMode: metadata?.debug_mode || false,
        metadata
      }
    );
    
    return executionState;
  } catch (error) {
    console.error('Error executing workflow:', error);
    throw error;
  }
}

/**
 * Creates a new agent using workflow 15 (Build New Agent Structure)
 * This is a convenience method for the most common workflow operation
 */
export async function createAgent(
  agentData: {
    name: string;
    description?: string;
    type?: string;
    icon?: string;
    status?: 'active' | 'inactive';
  },
  options: {
    source?: 'ui_button' | 'ui_form' | 'ai_chat';
    onNodeStateChange?: (nodeId: string, state: NodeState) => void;
    onWorkflowComplete?: (state: WorkflowExecutionState) => void;
  } = {}
): Promise<WorkflowExecutionState> {
  const { source = 'ui_form', ...executionOptions } = options;
  
  // Prepare input data for workflow 15
  const input = {
    request_type: 'new_agent',
    source,
    ...agentData
  };
  
  // Execute workflow 15 (Build New Agent Structure)
  return executeWorkflow(15, input, {
    ...executionOptions,
    metadata: { source },
    logToServer: true
  });
}

/**
 * Creates a new workflow for an agent
 */
export async function createWorkflow(
  workflowData: {
    name: string;
    description?: string;
    type?: string;
    flowData?: any;
    agentId?: number;
  },
  options: {
    onNodeStateChange?: (nodeId: string, state: NodeState) => void;
    onWorkflowComplete?: (state: WorkflowExecutionState) => void;
  } = {}
): Promise<any> {
  // Direct API call for now - could be replaced with workflow execution later
  return apiClient.post('/api/workflows', workflowData);
}

/**
 * Links a workflow to an agent
 */
export async function linkWorkflowToAgent(
  agentId: number,
  workflowId: number,
  options: {
    onNodeStateChange?: (nodeId: string, state: NodeState) => void;
    onWorkflowComplete?: (state: WorkflowExecutionState) => void;
  } = {}
): Promise<any> {
  // Use Workflow 6 (Link Workflow to Agent) instead of direct API call
  const input = {
    agentId,
    workflowId
  };
  
  // Execute workflow 6 (Link Workflow to Agent)
  return executeWorkflow(6, input, {
    ...options,
    metadata: { source: 'api_client' },
    logToServer: true
  });
}