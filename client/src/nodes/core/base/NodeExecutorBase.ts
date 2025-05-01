/**
 * BaseExecutor
 * 
 * Provides a single, standardized approach for all node executors in the workflow system.
 * This module completely replaces any previous node execution patterns with a
 * unified approach for creating consistent outputs and handling errors.
 */

import { NodeExecutionData, WorkflowItem } from '../types/nodeExecutionTypes';

/**
 * Interface for all node processing functions
 * This defines the standard contract for node-specific logic
 */
export interface NodeProcessor {
  /**
   * Process the node's core logic
   * 
   * @param nodeData - Configuration data specific to this node instance
   * @param inputs - Input data from connected nodes
   * @returns A record of output values or a single output value
   */
  process(
    nodeData: Record<string, any>,
    inputs?: Record<string, NodeExecutionData>
  ): Promise<Record<string, any>>;
}

/**
 * BaseExecutor class
 * This is the foundation for all node executors in the system
 */
export class BaseExecutor implements NodeProcessor {
  /** The node type identifier */
  protected nodeType: string;
  
  /** Timestamp for when execution started */
  protected startTime: Date;
  
  /**
   * Create a new BaseExecutor
   * @param nodeType - The type of node being executed
   */
  constructor(nodeType: string) {
    this.nodeType = nodeType;
    this.startTime = new Date();
  }
  
  /**
   * Default implementation - Override this in each node
   */
  async process(
    nodeData: Record<string, any>,
    inputs?: Record<string, NodeExecutionData>
  ): Promise<Record<string, any>> {
    // This should be overridden by each node executor
    return { result: 'Base executor - no implementation provided' };
  }
  
  /**
   * Standard execute method for all nodes
   * This method standardizes how nodes are executed
   */
  async execute(
    nodeData: Record<string, any>,
    inputs?: Record<string, NodeExecutionData>
  ): Promise<NodeExecutionData> {
    this.startTime = new Date();
    
    try {
      // Call the node-specific process method
      const result = await this.process(nodeData, inputs);
      
      return this.formatOutput(result);
    } catch (error: any) {
      console.error(`Error executing ${this.nodeType} node:`, error);
      return this.formatError(error.message || 'Unknown error');
    }
  }
  
  /**
   * Create a standardized output from node results
   */
  protected formatOutput(data: Record<string, any> | any): NodeExecutionData {
    const endTime = new Date();
    
    // If not an object or null, wrap in an object
    const resultObj = (typeof data === 'object' && data !== null) 
      ? data 
      : { result: data };
    
    // Convert to workflow items
    const items: WorkflowItem[] = Object.entries(resultObj).map(([key, value]) => ({
      json: value,
      text: typeof value === 'string' ? value : JSON.stringify(value),
      _key: key
    }));
    
    // Return standardized format
    return {
      items,
      meta: {
        startTime: this.startTime,
        endTime,
        executionTime: endTime.getTime() - this.startTime.getTime(),
        source: this.nodeType
      }
    };
  }
  
  /**
   * Create a standardized error output
   */
  protected formatError(errorMessage: string): NodeExecutionData {
    const endTime = new Date();
    
    return {
      items: [],
      meta: {
        startTime: this.startTime,
        endTime,
        error: true,
        errorMessage,
        source: this.nodeType
      }
    };
  }
}

/**
 * Factory function for creating node executors
 * 
 * This approach allows us to keep the implementation details
 * hidden while providing a simple API for node developers.
 */
export function createNodeExecutor<T extends Record<string, any>>(
  nodeType: string,
  processFn: (nodeData: T, inputs?: Record<string, NodeExecutionData>) => Promise<Record<string, any>>
): (nodeData: T, inputs?: Record<string, NodeExecutionData>) => Promise<NodeExecutionData> {
  
  // Create custom executor class for this node
  class CustomExecutor extends BaseExecutor {
    constructor() {
      super(nodeType);
    }
    
    async process(nodeData: T, inputs?: Record<string, NodeExecutionData>): Promise<Record<string, any>> {
      return processFn(nodeData, inputs);
    }
  }
  
  // Create an instance
  const executor = new CustomExecutor();
  
  // Return the execute function
  return executor.execute.bind(executor);
}