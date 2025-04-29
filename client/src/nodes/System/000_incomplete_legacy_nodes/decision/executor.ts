/**
 * Decision Node Executor
 * 
 * This executor evaluates conditional logic and routes data flow.
 */

// Define the shape of the node's data
export interface DecisionNodeData {
  condition: string;
}

/**
 * Execute the decision node with the provided data and inputs
 */
export async function execute(nodeData: DecisionNodeData, inputs: Record<string, any> = {}) {
  const { condition } = nodeData;
  const value = inputs.value;
  
  try {
    if (value === undefined) {
      return {
        error: 'No input value provided'
      };
    }
    
    if (!condition || condition.trim() === '') {
      return {
        error: 'No condition provided'
      };
    }
    
    // Create and evaluate the condition expression
    const conditionFunction = new Function('value', `return ${condition};`);
    const result = conditionFunction(value);
    
    // Return the appropriate output based on the condition result
    if (result) {
      return {
        true: value
      };
    } else {
      return {
        false: value
      };
    }
  } catch (error) {
    console.error('Error executing decision node:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export const defaultData: DecisionNodeData = {
  condition: 'value === true'
};