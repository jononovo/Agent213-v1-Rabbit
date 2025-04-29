/**
 * Webhook Trigger Node Definition
 * 
 * This node provides a webhook endpoint that can trigger a workflow
 * based on external HTTP requests.
 */

import { NodeDefinition } from '@nodes/types';

const definition: NodeDefinition = {
  type: 'webhook_trigger_integration',
  name: 'Webhook Trigger (Integration)',
  description: 'Triggers a workflow when an external HTTP webhook is received',
  category: 'triggers',
  icon: 'webhook',
  version: '1.0.0',
  
  inputs: {},
  
  outputs: {
    trigger: {
      type: 'object',
      description: 'The webhook data that triggered the workflow'
    }
  },
  
  defaultData: {
    webhookPath: '',
    description: 'Webhook endpoint',
    methods: ['POST'],
    authType: 'none'
  },
  
  // Integration-specific configuration
  integrationConfig: {
    // What the node offers to the system
    provides: {
      endpoint: true,     // This node provides an HTTP endpoint
      webhook: true,      // This node acts as a webhook receiver
      scheduler: false    // This node doesn't schedule anything
    },
    
    // What the node needs from the system
    requires: {
      storage: true,       // Needs persistent storage for configuration
      authentication: false // Doesn't require authentication by default
    },
    
    // Endpoint configuration
    endpoint: {
      pathTemplate: 'webhooks/:path',  // URL path template
      methods: ['POST', 'GET'],        // Supported HTTP methods
      authTypes: ['none', 'apiKey'],   // Supported auth methods
    }
  }
};

export default definition;