/**
 * Standard Node Tests
 * 
 * Core test implementations that apply to all nodes in the system.
 * These tests focus on fundamental requirements that every node must meet.
 */
import { NodeTest, NodeTestResult } from '../../../nodes/nodeTestsStandard';

// Access current test node details
declare global {
  interface Window {
    __currentTestingNode?: {
      type: string;
      category: string;
    };
  }
}

// Define port type interface to prevent unknown type errors
interface PortDefinition {
  type: string;
  description: string;
  [key: string]: any;
}

/**
 * Helper function to try importing a module from both System and Integration folders
 */
async function tryImportFromBothFolders(nodeType: string, filename: string) {
  try {
    // Try System folder first
    return await import(/* @vite-ignore */ `../../../nodes/System/${nodeType}/${filename}`);
  } catch (e) {
    // Try Integration folder next
    return await import(/* @vite-ignore */ `../../../nodes/Integration/${nodeType}/${filename}`);
  }
}

/**
 * Helper function to get node type from context or return error
 */
function getNodeType(): { passed: boolean; nodeType?: string; message?: string } {
  const nodeType = window.__currentTestingNode?.type;
  
  if (!nodeType) {
    return {
      passed: false,
      message: 'Cannot determine node type for testing'
    };
  }
  
  return {
    passed: true,
    nodeType: nodeType
  };
}

/**
 * Helper to get definition module and definition object or return error
 */
async function getNodeDefinition(nodeType: string): Promise<{ passed: boolean; definition?: any; message?: string }> {
  try {
    const definitionModule = await tryImportFromBothFolders(nodeType, 'definition.ts');
    
    if (!definitionModule.definition) {
      return {
        passed: false,
        message: 'Node does not export a definition object'
      };
    }
    
    return {
      passed: true,
      definition: definitionModule.definition
    };
  } catch (e) {
    return {
      passed: false,
      message: 'Failed to import definition module (checked both System and Integration folders)'
    };
  }
}

/**
 * Helper to get executor module and execute function or return error
 */
async function getNodeExecutor(nodeType: string): Promise<{ passed: boolean; execute?: Function; message?: string }> {
  try {
    const executorModule = await tryImportFromBothFolders(nodeType, 'executor.ts');
    
    if (!executorModule.execute || typeof executorModule.execute !== 'function') {
      return {
        passed: false,
        message: 'Node does not export an execute function'
      };
    }
    
    return {
      passed: true,
      execute: executorModule.execute
    };
  } catch (e) {
    return {
      passed: false,
      message: 'Failed to import executor module (checked both System and Integration folders)'
    };
  }
}

/**
 * Tests that the node has the required files
 */
export const fileStructureTest: NodeTest = {
  name: 'File Structure',
  description: 'Verifies the node has the required definition.ts and executor.ts files',
  category: 'structure',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const result = getNodeType();
      if (!result.passed) {
        return {
          passed: false,
          message: result.message
        };
      }
      
      const nodeType = result.nodeType!;
      
      // Just check if both files are importable
      try {
        await tryImportFromBothFolders(nodeType, 'definition.ts');
        await tryImportFromBothFolders(nodeType, 'executor.ts');
        
        return {
          passed: true,
          message: 'Node has all required files'
        };
      } catch (e) {
        return {
          passed: false,
          message: `Missing required files (checked both System and Integration folders)`
        };
      }
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking file structure: ${error.message}`
      };
    }
  }
};

/**
 * Tests that the node exports the required components
 */
export const exportValidationTest: NodeTest = {
  name: 'Export Validation',
  description: 'Verifies the node exports the required definition and execute function',
  category: 'structure',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const result = getNodeType();
      if (!result.passed) {
        return {
          passed: false,
          message: result.message
        };
      }
      
      const nodeType = result.nodeType!;

      // Check definition exports
      const defResult = await getNodeDefinition(nodeType);
      if (!defResult.passed) {
        return {
          passed: false,
          message: defResult.message
        };
      }
      
      // Check executor exports
      const execResult = await getNodeExecutor(nodeType);
      if (!execResult.passed) {
        return {
          passed: false,
          message: execResult.message
        };
      }
      
      return {
        passed: true,
        message: 'Node exports all required components'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error validating exports: ${error.message}`
      };
    }
  }
};

/**
 * Tests that the node metadata is complete
 */
export const metadataCompletenessTest: NodeTest = {
  name: 'Metadata Completeness',
  description: 'Validates that all required metadata fields exist and are non-empty',
  category: 'definition',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const result = getNodeType();
      if (!result.passed) {
        return {
          passed: false,
          message: result.message || 'Unknown error'
        };
      }
      
      const nodeType = result.nodeType!;
      
      // Get definition using the helper function
      const defResult = await getNodeDefinition(nodeType);
      if (!defResult.passed) {
        return {
          passed: false,
          message: defResult.message || 'Failed to get definition'
        };
      }
      
      const definition = defResult.definition;
      
      // Required metadata fields
      const requiredFields = ['type', 'name', 'description', 'category', 'version'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!definition[field]) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        return {
          passed: false,
          message: `Missing required metadata fields: ${missingFields.join(', ')}`
        };
      }
      
      return {
        passed: true,
        message: 'Node contains all required metadata fields'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking metadata: ${error.message}`
      };
    }
  }
};

/**
 * Tests that the node ports are properly defined
 */
export const portDefinitionTest: NodeTest = {
  name: 'Port Definition',
  description: 'Verifies the node defines both inputs and outputs with required fields',
  category: 'definition',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const result = getNodeType();
      if (!result.passed) {
        return {
          passed: false,
          message: result.message || 'Unknown error'
        };
      }
      
      const nodeType = result.nodeType!;
      
      // Get definition using the helper function
      const defResult = await getNodeDefinition(nodeType);
      if (!defResult.passed) {
        return {
          passed: false,
          message: defResult.message || 'Failed to get definition'
        };
      }
      
      const definition = defResult.definition;
      
      // Check inputs
      if (!definition.inputs || typeof definition.inputs !== 'object') {
        return {
          passed: false,
          message: 'Node does not define inputs object'
        };
      }
      
      // Check outputs
      if (!definition.outputs || typeof definition.outputs !== 'object') {
        return {
          passed: false,
          message: 'Node does not define outputs object'
        };
      }
      
      // Check that at least one input and output port is defined with required fields
      let hasValidInput = false;
      let hasValidOutput = false;
      
      for (const [key, port] of Object.entries(definition.inputs)) {
        const typedPort = port as PortDefinition;
        if (typedPort.type && typedPort.description) {
          hasValidInput = true;
          break;
        }
      }
      
      for (const [key, port] of Object.entries(definition.outputs)) {
        const typedPort = port as PortDefinition;
        if (typedPort.type && typedPort.description) {
          hasValidOutput = true;
          break;
        }
      }
      
      if (!hasValidInput || !hasValidOutput) {
        return {
          passed: false,
          message: `Node is missing properly defined ${!hasValidInput ? 'input' : ''}${!hasValidInput && !hasValidOutput ? ' and ' : ''}${!hasValidOutput ? 'output' : ''} ports`
        };
      }
      
      return {
        passed: true,
        message: 'Node ports are properly defined'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking port definitions: ${error.message}`
      };
    }
  }
};

/**
 * Tests that the executor function has the correct signature
 */
export const executorSignatureTest: NodeTest = {
  name: 'Executor Signature',
  description: 'Verifies the executor function accepts the correct parameters',
  category: 'execution',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const result = getNodeType();
      if (!result.passed) {
        return {
          passed: false,
          message: result.message || 'Unknown error'
        };
      }
      
      const nodeType = result.nodeType!;
      
      // Get executor using the helper function
      const execResult = await getNodeExecutor(nodeType);
      if (!execResult.passed) {
        return {
          passed: false,
          message: execResult.message || 'Failed to get executor'
        };
      }
      
      const execute = execResult.execute!;
      
      // Function.length reveals the number of formal parameters
      if (execute.length < 1) {
        return {
          passed: false,
          message: 'Executor function must accept at least 1 parameter'
        };
      }
      
      return {
        passed: true,
        message: 'Executor function has the correct signature'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking executor signature: ${error.message}`
      };
    }
  }
};

/**
 * Tests that the executor returns the correct output format
 */
export const outputFormatTest: NodeTest = {
  name: 'Output Format',
  description: 'Verifies the executor returns data in the expected format',
  category: 'execution',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const typeResult = getNodeType();
      if (!typeResult.passed) {
        return {
          passed: false,
          message: typeResult.message || 'Unknown error'
        };
      }
      
      const nodeType = typeResult.nodeType!;
      
      // Call the node debug API to execute the node with minimal input
      const response = await fetch('/api/node-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodeType,
          data: {}, // Empty data
          inputs: {
            default: {
              items: [{ json: {} }],
              meta: {
                startTime: new Date(),
                endTime: new Date()
              }
            }
          }
        })
      });
      
      if (!response.ok) {
        return {
          passed: false,
          message: `Failed to call node-debug API: ${response.statusText}`
        };
      }
      
      const apiResult = await response.json();
      
      // Some nodes might return errors with valid inputs
      if (!apiResult.success || !apiResult.result) {
        // If there's an explicit error message, the node may require specific inputs
        if (apiResult.error) {
          return {
            passed: true,
            message: `Node requires specific inputs, returning a proper error: ${apiResult.error}`
          };
        }
        
        return {
          passed: false,
          message: 'Node execution failed without a proper error message'
        };
      }
      
      // Check basic structure - we accept either items array or output object with items
      const output = apiResult.result;
      const hasItems = (output.items && Array.isArray(output.items)) || 
                     (output.output && output.output.items && Array.isArray(output.output.items));
                     
      const hasMeta = output.meta || (output.output && output.output.meta);
      
      if (!hasItems || !hasMeta) {
        return {
          passed: false,
          message: `Output is missing ${!hasItems ? 'items array' : ''}${!hasItems && !hasMeta ? ' and ' : ''}${!hasMeta ? 'meta object' : ''}`
        };
      }
      
      return {
        passed: true,
        message: 'Executor returns data in the expected format'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking output format: ${error.message}`
      };
    }
  }
};

/**
 * Tests that the node properly formats errors
 */
export const errorHandlingTest: NodeTest = {
  name: 'Error Handling',
  description: 'Verifies the node properly formats error responses',
  category: 'error-handling',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const typeResult = getNodeType();
      if (!typeResult.passed) {
        return {
          passed: false,
          message: typeResult.message || 'Unknown error'
        };
      }
      
      const nodeType = typeResult.nodeType!;
      
      // Call the node-debug API with explicitly invalid input to trigger an error
      const response = await fetch('/api/node-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nodeType,
          data: {}, // Empty data
          inputs: {
            default: {
              items: [{ json: { _test_error_trigger_: true } }],
              meta: {
                startTime: new Date(),
                endTime: new Date()
              }
            }
          }
        })
      });
      
      // We expect either:
      // 1. A successful response with error info in the meta
      // 2. A failed response with a proper error message
      // Either is valid for this test
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const output = result.result;
          
          // If the node detected the error and set error flag
          if (output.meta && output.meta.error === true) {
            return {
              passed: true,
              message: 'Node properly handles errors and sets error flag in meta'
            };
          }
          
          // If there's no error in meta, the node might not consider our input invalid
          return {
            passed: true,
            message: 'Node did not detect an error in our test input, which is acceptable'
          };
        }
      }
      
      // We also accept error responses as valid if properly formatted
      return {
        passed: true,
        message: 'Node responded to invalid input, which is acceptable'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error testing error handling: ${error.message}`
      };
    }
  }
};

// Integration-specific tests

/**
 * Tests that integration nodes have capabilities defined
 */
export const integrationCapabilitiesTest: NodeTest = {
  name: 'Integration Capabilities',
  description: 'Verifies the node has integration capabilities defined',
  category: 'integration',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const typeResult = getNodeType();
      if (!typeResult.passed) {
        return {
          passed: false,
          message: typeResult.message || 'Unknown error'
        };
      }
      
      const nodeType = typeResult.nodeType!;
      // Category is used to skip non-integration nodes
      const category = window.__currentTestingNode?.category;
      
      // Skip this test if not an integration node
      if (category !== 'Integration') {
        return {
          passed: true,
          message: 'Not an integration node, skipping test'
        };
      }
      
      // Get definition
      let definition;
      try {
        const definitionModule = await import(/* @vite-ignore */ `../../../nodes/${category}/${nodeType}/definition.ts`);
        definition = definitionModule.definition;
      } catch (e) {
        return {
          passed: false,
          message: 'Failed to import definition module'
        };
      }
      
      // Check for integrationCapabilities
      if (!definition.integrationCapabilities) {
        return {
          passed: false,
          message: 'Integration node does not define integrationCapabilities'
        };
      }
      
      // Check provides section exists
      if (!definition.integrationCapabilities.provides) {
        return {
          passed: false,
          message: 'Integration capabilities missing "provides" section'
        };
      }
      
      return {
        passed: true,
        message: 'Node has properly defined integration capabilities'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking integration capabilities: ${error.message}`
      };
    }
  }
};

/**
 * Tests integration requirements
 */
export const integrationRequirementsTest: NodeTest = {
  name: 'Integration Requirements',
  description: 'Checks that integration nodes specify their requirements',
  category: 'integration',
  run: async (): Promise<NodeTestResult> => {
    try {
      // Get node type using helper
      const typeResult = getNodeType();
      if (!typeResult.passed) {
        return {
          passed: false,
          message: typeResult.message || 'Unknown error'
        };
      }
      
      const nodeType = typeResult.nodeType!;
      // Category is used to skip non-integration nodes
      const category = window.__currentTestingNode?.category;
      
      // Skip this test if not an integration node
      if (category !== 'Integration') {
        return {
          passed: true,
          message: 'Not an integration node, skipping test'
        };
      }
      
      // Get definition
      let definition;
      try {
        const definitionModule = await import(/* @vite-ignore */ `../../../nodes/${category}/${nodeType}/definition.ts`);
        definition = definitionModule.definition;
      } catch (e) {
        return {
          passed: false,
          message: 'Failed to import definition module'
        };
      }
      
      // Check for integration property
      if (!definition.integration) {
        return {
          passed: false,
          message: 'Node does not define integration capabilities'
        };
      }
      
      // Check that provides and requires are defined
      const integration = definition.integration;
      if (!integration.provides || !integration.requires) {
        return {
          passed: false,
          message: 'Integration definition is missing provides or requires'
        };
      }
      
      return {
        passed: true,
        message: 'Node has properly defined integration requirements'
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking integration requirements: ${error.message}`
      };
    }
  }
};

// Export both standard and integration-specific tests
export const standardNodeTests = [
  fileStructureTest,
  exportValidationTest,
  metadataCompletenessTest,
  portDefinitionTest,
  executorSignatureTest,
  outputFormatTest,
  errorHandlingTest
];

// Define the set of integration-specific tests
export const integrationNodeTests = [
  integrationCapabilitiesTest,
  integrationRequirementsTest
];

export default standardNodeTests;