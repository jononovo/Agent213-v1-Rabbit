/**
 * JSON Path Node Executor
 * 
 * This executor extracts data from JSON using JSONPath expressions.
 */

// Define the shape of the node's data
export interface JSONPathNodeData {
  path: string;
}

/**
 * A very simple implementation of JSONPath
 * Note: In a production environment, you'd use a full JSONPath library
 */
function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;
  
  // Handle root object indicator
  if (path === '$') return obj;
  
  // Remove root indicator if present
  const normalizedPath = path.startsWith('$.') ? path.slice(2) : path;
  
  // Split path into segments
  const segments = normalizedPath.split('.');
  
  // Traverse the object according to the path
  let current = obj;
  for (const segment of segments) {
    // Handle array indexing with [n] notation
    if (segment.includes('[') && segment.includes(']')) {
      const bracketStart = segment.indexOf('[');
      const bracketEnd = segment.indexOf(']');
      const property = segment.substring(0, bracketStart);
      const index = parseInt(segment.substring(bracketStart + 1, bracketEnd), 10);
      
      current = current[property][index];
    } else {
      current = current[segment];
    }
    
    if (current === undefined || current === null) {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Execute a JSONPath node with the provided data and inputs
 */
export async function execute(nodeData: JSONPathNodeData, inputs: Record<string, any> = {}) {
  const { path } = nodeData;
  const inputData = inputs.data;
  
  try {
    if (!inputData) {
      return {
        error: 'No input data provided'
      };
    }
    
    if (!path) {
      return {
        error: 'No JSONPath expression provided'
      };
    }
    
    // Extract value using JSONPath
    const extractedValue = getValueByPath(inputData, path);
    
    return {
      value: extractedValue
    };
  } catch (error) {
    console.error('Error executing JSONPath:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export const defaultData: JSONPathNodeData = {
  path: '$.data'
};