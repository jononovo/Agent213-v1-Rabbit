/**
 * JSON Parser Node Executor
 * 
 * This file contains the logic for executing the JSON parser node.
 * It takes a JSON string input and returns a parsed JavaScript object.
 */

export const execute = async (nodeData: any, inputs: any = {}): Promise<any> => {
  try {
    // Get the input JSON string
    const jsonString = inputs?.json_string || '{}';
    
    // Default settings
    const returnErrorObject = nodeData?.returnErrorObject || false;
    
    try {
      // Attempt to parse the JSON string
      const parsedData = JSON.parse(jsonString);
      
      // Return successful result
      return {
        parsed_data: parsedData
      };
    } catch (parseError: any) {
      // Handle JSON parsing error
      if (returnErrorObject) {
        return {
          parsed_data: null,
          error: `Failed to parse JSON: ${parseError.message || String(parseError)}`
        };
      } else {
        throw new Error(`Failed to parse JSON: ${parseError.message || String(parseError)}`);
      }
    }
  } catch (error: any) {
    // Handle unexpected errors
    return {
      error: error.message || 'Error processing JSON parser'
    };
  }
};