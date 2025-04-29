/**
 * Base Integration Node Executor
 * 
 * This file contains the execution logic for an integration node.
 * It demonstrates how to register with the Integration Engine and make API requests.
 */

import { NodeExecutionData } from '@/shared/nodeTypes';
import { registerIntegration, makeIntegrationRequest } from '@/utils/integrationClient';

// Define the node data interface
export interface BaseIntegrationNodeData {
  apiEndpoint: string;
  apiKey: string;
  method: string;
  useAuth: boolean;
  // Add more settings as needed
}

// Default data to use when creating a new node
export const defaultData: BaseIntegrationNodeData = {
  apiEndpoint: 'https://api.example.com/v1',
  apiKey: '',
  method: 'GET',
  useAuth: true
};

/**
 * Execute the integration node
 * 
 * @param nodeData The configuration data for this node instance
 * @param inputs The input data from connected nodes
 * @param context Additional context information including workflowId, nodeId
 * @returns Object with output port names as keys and processed data as values
 */
export const execute = async (
  nodeData: BaseIntegrationNodeData,
  inputs: Record<string, any> = {},
  context?: any
): Promise<NodeExecutionData> => {
  try {
    const startTime = new Date();
    
    // INTEGRATION HANDLING: Different execution paths for different scenarios
    
    // SCENARIO 1: If this is during workflow execution with inputs, process them
    if (inputs?.input) {
      // Get input data
      const inputData = inputs.input?.items?.[0]?.json?.text || '';
      
      // Make API request through the Integration Engine
      // This automatically handles API keys and authentication
      const result = await makeIntegrationRequest({
        url: nodeData.apiEndpoint,
        method: nodeData.method,
        headers: {
          'Content-Type': 'application/json',
          // API key will be injected by Integration Engine if nodeData.useAuth is true
        },
        data: { query: inputData }
      });
      
      // Return processed result
      return {
        output: {
          items: [{ json: { text: result?.data?.response || 'No response' } }],
          meta: {
            startTime,
            endTime: new Date()
          }
        },
        metadata: {
          items: [{ json: result }],
          meta: {
            startTime,
            endTime: new Date()
          }
        }
      };
    }
    
    // SCENARIO 2: If this is initialization and needs to register with Integration Engine
    // For nodes providing webhooks, endpoints or schedulers
    else if (context?.workflowId && context?.nodeId) {
      // Example of registering with Integration Engine (usually for webhook/endpoint nodes)
      // For API consumer nodes, this step is usually not needed
      const registrationResult = await registerIntegration({
        nodeType: 'base_node_integration',
        capabilities: {
          provides: {
            api: true
          }
        },
        workflowId: context.workflowId,
        nodeId: context.nodeId,
        description: 'Base integration node instance'
      });
      
      // Return info about the integration (e.g., registered URL, capabilities)
      return {
        output: {
          items: [{ 
            json: { 
              text: `Integration registered: ${nodeData.apiEndpoint}`,
              status: 'ready'
            } 
          }],
          meta: {
            startTime,
            endTime: new Date()
          }
        },
        metadata: {
          items: [{ 
            json: { 
              registration: registrationResult,
              endpoint: nodeData.apiEndpoint
            } 
          }],
          meta: {
            startTime,
            endTime: new Date()
          }
        }
      };
    }
    
    // SCENARIO 3: Neither workflow execution nor initialization with context
    else {
      throw new Error('Integration node requires either input data or workflow context');
    }
  } catch (error) {
    console.error('Error in integration node:', error);
    
    // Standardized error response
    const errorOutput = {
      items: [{ 
        json: { 
          error: error instanceof Error ? error.message : String(error) 
        } 
      }],
      meta: {
        startTime: new Date(),
        endTime: new Date(),
        error: true,
        errorMessage: error instanceof Error ? error.message : String(error)
      }
    };
    
    // Return error to all output ports
    return {
      output: errorOutput,
      metadata: errorOutput
    };
  }
};