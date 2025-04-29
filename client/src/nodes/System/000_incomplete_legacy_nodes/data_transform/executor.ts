/**
 * Data Transform Node Executor
 * 
 * This executor applies JavaScript transformations to data.
 */

// Define the shape of a transformation
export interface Transformation {
  name: string;
  expression: string;
  enabled: boolean;
}

// Define the shape of the node's data
export interface DataTransformNodeData {
  transformations: Transformation[];
}

/**
 * Execute the data transform node with the provided data and inputs
 */
export async function execute(nodeData: DataTransformNodeData, inputs: Record<string, any> = {}) {
  const { transformations } = nodeData;
  let inputData = inputs.data;
  
  try {
    if (inputData === undefined) {
      return {
        error: 'No input data provided'
      };
    }
    
    if (!transformations || transformations.length === 0) {
      return {
        result: inputData,
        warning: 'No transformations defined'
      };
    }
    
    // Apply each enabled transformation in sequence
    let currentData = inputData;
    const enabledTransformations = transformations.filter(t => t.enabled);
    
    for (const transform of enabledTransformations) {
      try {
        // Create a function from the expression string
        const transformFunction = new Function('data', transform.expression);
        
        // Execute the transformation
        currentData = transformFunction(currentData);
        
      } catch (transformError) {
        return {
          error: `Error in transformation "${transform.name}": ${
            transformError instanceof Error ? transformError.message : String(transformError)
          }`,
          result: currentData // Return data up to the point of failure
        };
      }
    }
    
    return {
      result: currentData
    };
  } catch (error) {
    console.error('Error executing data transform:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export const defaultData: DataTransformNodeData = {
  transformations: [
    {
      name: "Default Transform",
      expression: "return data;",
      enabled: true
    }
  ]
};