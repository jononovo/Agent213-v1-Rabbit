/**
 * Agent Trigger Node Executor
 * 
 * This executor handles triggering an agent to execute a workflow.
 * It uses the agent ID specified in the node data to identify which agent to trigger.
 */

import { NodeExecutionData } from '../../../core/types/nodeExecutionTypes';
import { createNodeExecutor } from '../../../core/base/NodeExecutorBase';

/**
 * Type definition for agent trigger node configuration
 */
interface AgentTriggerNodeData {
  agentId?: string | number;
  triggerMode?: 'automatic' | 'manual';
  inputFormat?: 'text' | 'json';
}

/**
 * Process function for the agent trigger node
 */
async function processAgentTrigger(
  nodeData: AgentTriggerNodeData, 
  inputs?: Record<string, NodeExecutionData>
): Promise<Record<string, any>> {
  try {
    const { agentId } = nodeData;
    
    if (!agentId) {
      return {
        error: 'No agent ID specified. Please select an agent in the node settings.'
      };
    }
    
    // In a real implementation, this would call the agent execution API
    // For now, we'll just return a success message
    return {
      output: {
        success: true,
        agentId,
        message: `Triggered agent ${agentId} successfully`,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error executing agent trigger node:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Create the node executor
 */
export const executor = createNodeExecutor<AgentTriggerNodeData>(
  'agent_trigger',
  processAgentTrigger
);

export default executor;