/**
 * Base Integration Node Definition
 * 
 * This is a template for creating nodes that integrate with external services
 * through the Integration Engine.
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
  category: 'integrations',
  
  // REQUIRED: Version of the node
  version: '1.0.0',
  
  // REQUIRED: Input ports definition (can be empty object if no inputs)
  inputs: {
    // Example input port - modify or add more as needed
    input: {
      type: 'string',
      description: 'Input data',
    }
  },
  
  // REQUIRED: Output ports definition
  outputs: {
    // Example output ports - modify as needed
    output: {
      type: 'string',
      description: 'Processed output',
    },
    metadata: {
      type: 'object',
      description: 'Additional response metadata',
    }
  },
  
  // REQUIRED: Default configuration values
  defaultData: {
    // Add your default configuration values here
    apiEndpoint: 'https://api.example.com/v1',
    apiKey: '',
    method: 'GET',
    useAuth: true
  },
  
  // REQUIRED FOR INTEGRATION NODES: Integration configuration
  integrationConfig: {
    // What this node provides to the system
    provides: {
      // Does this node provide an HTTP endpoint for incoming requests?
      endpoint: false,
      
      // Does this node handle webhooks?
      webhook: false,
      
      // Does this node schedule operations?
      scheduler: false,
      
      // Does this node connect to an external API?
      api: true
    },
    
    // What this node requires from the system
    requires: {
      // Does this node need persistent storage?
      storage: false,
      
      // Does this node require authentication?
      authentication: true,
      
      // Environment variable name for API key (if applicable)
      apiKey: 'EXAMPLE_API_KEY'
    },
    
    // Endpoint configuration (only needed if provides.endpoint is true)
    endpoint: {
      // URL path template with parameters (e.g., 'webhooks/:path')
      pathTemplate: '',
      
      // Supported HTTP methods
      methods: ['GET', 'POST'],
      
      // Supported authentication types
      authTypes: ['none', 'apiKey']
    }
  }
};

export default definition;