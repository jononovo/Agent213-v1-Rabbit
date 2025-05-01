/**
 * Node Execution Types
 * 
 * This file contains the types related to node execution.
 */

// No need to import NodeDefinition since it's not used in this file

/**
 * Workflow Item - The basic unit of data passed between nodes
 */
export interface WorkflowItem {
  // The actual data
  json: any;
  
  // Text representation of the data - especially useful for display
  text?: string;
  
  // Unique key/identifier for the item within a collection
  _key?: string;
  
  // Metadata about this data item
  meta?: {
    // The source of this data
    source?: string;
    
    // Timestamp when this data was created
    timestamp?: Date;
    
    // The output type, for nodes with multiple output types
    outputType?: string;
    
    // Additional context about this data
    context?: Record<string, any>;
  };
  
  // Binary data if applicable
  binary?: {
    mimeType: string;
    data: string;
    filename?: string;
  };
}

/**
 * Node Execution Data - The standardized format for node outputs
 */
export interface NodeExecutionData {
  items: WorkflowItem[];  // Output data items
  meta: {
    startTime: Date;           // When execution started
    endTime: Date;             // When execution completed
    source?: string;           // Source node identifier
    error?: boolean;           // Whether execution resulted in an error
    errorMessage?: string;     // Error message if error is true
    warning?: string;          // Non-critical warning message
    [key: string]: any;        // Additional metadata properties
  };
}

/**
 * Enhanced Node Executor - Interface for node executor implementations
 */
export interface EnhancedNodeExecutor {
  // Node definition
  definition?: Record<string, any>;
  
  // Execute function
  execute: (nodeData: Record<string, any>, inputs: Record<string, NodeExecutionData>) => Promise<NodeExecutionData>;
}

/**
 * Helper function to create a workflow item
 */
export function createWorkflowItem(
  data: any,
  source: string = 'unknown',
  binary?: WorkflowItem['binary']
): WorkflowItem {
  return {
    json: data,
    meta: {
      source,
      timestamp: new Date()
    },
    binary
  };
}

export default {
  createWorkflowItem
};