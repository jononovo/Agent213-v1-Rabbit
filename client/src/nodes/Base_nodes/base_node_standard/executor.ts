/**
 * Base Standard Node Executor
 * 
 * This file contains the execution logic for the node.
 * Modify it to implement your node's specific functionality.
 */

// Define the node data interface - customize this to match your node's needs
export interface BaseNodeData {
  setting1: string;
  setting2: number;
  setting3: boolean;
  // Add more settings as needed
}

// Default data to use when creating a new node
export const defaultData: BaseNodeData = {
  setting1: 'default value',
  setting2: 123,
  setting3: true
};

/**
 * The execute function is called when the node is processed in a workflow
 * 
 * @param nodeData The configuration data for this node instance
 * @param inputs The input data from connected nodes
 * @param context Additional context from the workflow
 * @returns Object with output port names as keys and processed data as values
 */
export const execute = async (
  nodeData: BaseNodeData,
  inputs: Record<string, any> = {},
  context?: any
) => {
  try {
    // Log execution start time for performance tracking
    const startTime = new Date();
    
    // STEP 1: Get input data
    // This example gets text from the input port, with fallback to empty string
    const inputData = inputs?.input?.items?.[0]?.json?.text || '';
    
    // STEP 2: Process the data (modify this to implement your node's logic)
    let result: string;
    
    // Example processing logic - replace with your own
    if (nodeData.setting3) {
      result = `${nodeData.setting1}: ${inputData.toUpperCase()}`;
    } else {
      result = `${nodeData.setting1}: ${inputData.toLowerCase()}`;
    }
    
    // STEP 3: Return processed data to output ports
    return {
      // Each key should match an output port name from definition.ts
      output: {
        // Output data structure
        items: [{ 
          json: { text: result }
        }],
        // Metadata about this execution
        meta: {
          startTime,
          endTime: new Date()
        }
      }
    };
  } catch (error) {
    // STEP 4: Handle errors properly
    console.error('Error in base node execution:', error);
    
    // Return a standardized error format
    return {
      output: {
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
      }
    };
  }
};