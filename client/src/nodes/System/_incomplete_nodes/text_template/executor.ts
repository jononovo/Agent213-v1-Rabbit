/**
 * Text Template Node Executor
 * 
 * This executor processes a template string and replaces variables with provided values.
 */

// Define the shape of the node's data
export interface TextTemplateNodeData {
  template: string;
}

/**
 * Get a property from an object using a path string (e.g., "user.name")
 * 
 * @param obj The object to get the property from
 * @param path The property path (e.g., "user.name")
 * @returns The property value or undefined if not found
 */
function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.');
  return keys.reduce((acc, key) => {
    return acc && typeof acc === 'object' ? acc[key] : undefined;
  }, obj);
}

/**
 * Replace template variables in the format {{variableName}} with values from data
 * 
 * @param template The template string with {{variableName}} placeholders
 * @param data The data object containing variable values
 * @returns The processed template with variables replaced
 */
function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  
  return template.replace(variableRegex, (match, variablePath) => {
    const trimmedPath = variablePath.trim();
    const value = getValueByPath(data, trimmedPath);
    
    // If the value is undefined, keep the placeholder
    if (value === undefined) {
      return match;
    }
    
    // Convert objects and arrays to JSON string representation
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return String(value);
  });
}

/**
 * Execute the text template node with the provided data and inputs
 */
export async function execute(nodeData: TextTemplateNodeData, inputs: Record<string, any> = {}) {
  const { template } = nodeData;
  const variables = inputs.variables || {};
  
  try {
    if (!template || template.trim() === '') {
      return {
        error: 'Template is empty'
      };
    }
    
    // Process the template and replace variables
    const processedText = replaceTemplateVariables(template, variables);
    
    // Check if any variables were not replaced
    const variableRegex = /\{\{([^}]+)\}\}/g;
    let match;
    const unreplacedVariables = [];
    
    while ((match = variableRegex.exec(processedText)) !== null) {
      unreplacedVariables.push(match);
    }
    
    if (unreplacedVariables.length > 0) {
      const missingVars = unreplacedVariables.map(match => match[1].trim()).join(', ');
      console.warn(`Some variables were not replaced in template: ${missingVars}`);
    }
    
    return {
      text: processedText
    };
  } catch (error) {
    console.error('Error executing text template node:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export const defaultData: TextTemplateNodeData = {
  template: 'Hello, {{name}}!'
};