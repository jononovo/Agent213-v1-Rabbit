/**
 * Node Validation
 * 
 * This module provides utilities for validating node definitions.
 * It ensures that nodes have all required fields and follow the expected format.
 */

// Define interface types locally to avoid circular dependencies
export interface PortDefinition {
  type: string;
  description: string;
  optional?: boolean;
  defaultValue?: any;
}

export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  version: string;
  inputs?: Record<string, PortDefinition>;
  outputs?: Record<string, PortDefinition>;
  defaultData?: Record<string, any>;
  icon?: string;
  [key: string]: any;
}

// Required fields for validation
const REQUIRED_NODE_FIELDS = [
  'type',
  'name',
  'description',
  'category',
  'version',
  'inputs',
  'outputs'
];

const REQUIRED_PORT_FIELDS = [
  'type',
  'description'
];

/**
 * Validate a node definition
 */
export function validateNodeDefinition(definition: NodeDefinition): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  for (const field of REQUIRED_NODE_FIELDS) {
    if (definition[field as keyof NodeDefinition] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check for defaultData (warn rather than error)
  if (!definition.defaultData) {
    warnings.push('Missing defaultData');
  }
  
  // Validate semantic versioning format
  if (definition.version && !/^\d+\.\d+\.\d+$/.test(definition.version)) {
    warnings.push(`Version should follow semantic versioning (e.g., 1.0.0), got: ${definition.version}`);
  }
  
  // Validate inputs
  if (definition.inputs) {
    validatePorts('input', definition.inputs, errors, warnings);
  }
  
  // Validate outputs
  if (definition.outputs) {
    validatePorts('output', definition.outputs, errors, warnings);
  }
  
  // Check if icon is provided
  if (!definition.icon) {
    warnings.push('No icon specified for node');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate port definitions
 */
export function validatePorts(
  portType: 'input' | 'output',
  ports: Record<string, PortDefinition>,
  errors: string[],
  warnings: string[]
): void {
  const portNames = Object.keys(ports);
  
  // Outputs should have at least one port
  if (portNames.length === 0 && portType === 'output') {
    warnings.push(`Node has no ${portType} ports defined`);
  }
  
  // Validate each port
  for (const portName of portNames) {
    const port = ports[portName];
    
    // Check required port fields
    for (const field of REQUIRED_PORT_FIELDS) {
      if (port[field as keyof PortDefinition] === undefined) {
        errors.push(`Missing required field '${field}' for ${portType} port: ${portName}`);
      }
    }
  }
}

/**
 * Format port definitions for the workflow engine
 */
export function formatPortDefinitions(ports: Record<string, any>, isInput: boolean): Record<string, any> {
  return Object.fromEntries(
    Object.entries(ports).map(([key, value]: [string, any]) => [
      key,
      {
        type: value.type || 'string',
        displayName: key,
        description: value.description || '',
        ...(isInput ? { required: value.optional ? !value.optional : true } : {})
      }
    ])
  );
}

export default {
  validateNodeDefinition,
  validatePorts,
  formatPortDefinitions,
  REQUIRED_NODE_FIELDS,
  REQUIRED_PORT_FIELDS
};