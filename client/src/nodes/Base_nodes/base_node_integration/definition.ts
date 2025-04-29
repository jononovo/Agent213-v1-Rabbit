/**
 * Base Integration Node Definition
 * 
 * This is a template for creating integration nodes that connect with external services.
 */

import { NodeDefinition } from '@/nodes/types';

export const definition: NodeDefinition = {
  // REQUIRED: Unique identifier for the node (change this to your node type)
  type: 'base_node_integration',
  
  // REQUIRED: Display name shown in the node palette
  name: 'Base Integration Node',
  
  // REQUIRED: Description of what the node does
  description: 'Template for creating integration nodes',
  
  // OPTIONAL: Icon name from Lucide icons
  icon: 'box',
  
  // REQUIRED: Category for grouping in the node palette
  category: 'integration',
  
  // REQUIRED: Version of the node
  version: '1.0.0',
  
  // REQUIRED: Input ports definition (can be empty object if no inputs)
  inputs: {
    // Example input port - modify or add more as needed
    input: {
      type: 'string',  // Type: string, number, boolean, object, array
      description: 'Input data',
    }
  },
  
  // REQUIRED: Output ports definition
  outputs: {
    // Example output port - modify or add more as needed
    output: {
      type: 'string',
      description: 'Processed output',
    }
  },
  
  // OPTIONAL: Default configuration values
  defaultData: {
    // Add your default configuration values here
    apiEndpoint: 'https://api.example.com',
    apiKey: '',
    method: 'GET'
  },
  
  // REQUIRED FOR INTEGRATION NODES: Integration-specific configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: false,     // Does this node provide an HTTP endpoint?
      webhook: false,      // Does this node act as a webhook receiver?
      scheduler: false,    // Does this node schedule operations?
      api: true           // Does this node connect to an external API?
    },
    
    // What the node needs from the system
    requires: {
      storage: false,       // Does this node need persistent storage?
      authentication: true, // Does this node require authentication?
      apiKey: 'API_KEY'     // Environment variable name for API key (if needed)
    },
    
    // Endpoint configuration (only needed if provides.endpoint = true)
    endpoint: {
      pathTemplate: 'api/:path',  // URL path template
      methods: ['GET', 'POST'],   // Supported HTTP methods
      authTypes: ['none', 'apiKey'], // Supported auth methods
    }
  }
};

export default definition;