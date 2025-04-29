/**
 * Integration Adapter
 * 
 * This utility adapts integration nodes to work with the Integration Engine.
 * It converts internal node types to the format expected by the Integration Engine.
 */

import { NodeDefinition } from '@/nodes/types';

// Types for adapted integration nodes
export interface AdaptedIntegrationNode {
  type: string;
  name: string;
  description: string;
  category: string;
  capabilities: {
    provides: {
      endpoint?: boolean;
      webhook?: boolean;
      scheduler?: boolean;
      api?: boolean;
    };
    requires: {
      storage?: boolean;
      authentication?: boolean;
      apiKey?: string;
    };
  };
  endpoint?: {
    pathTemplate: string;
    methods: string[];
    authTypes: string[];
  };
}

/**
 * Adapt a node definition to an integration node format
 * 
 * This function extracts integration configuration from a node definition
 * and converts it to the format expected by the Integration Engine.
 * 
 * @param definition Node definition with integrationConfig
 * @returns Adapted integration node or null if not an integration node
 */
export function adaptNodeToIntegration(definition: NodeDefinition): AdaptedIntegrationNode | null {
  // Only adapt nodes with integration configuration
  if (!definition.integrationConfig) {
    return null;
  }
  
  // Extract integration capabilities
  const { provides, requires, endpoint } = definition.integrationConfig;
  
  // Create adapted node
  const adaptedNode: AdaptedIntegrationNode = {
    type: definition.type,
    name: definition.name,
    description: definition.description,
    category: definition.category,
    capabilities: {
      provides: {
        endpoint: provides.endpoint || false,
        webhook: provides.webhook || false,
        scheduler: provides.scheduler || false,
        api: provides.api || false
      },
      requires: {
        storage: requires.storage || false,
        authentication: requires.authentication || false,
        apiKey: requires.apiKey
      }
    }
  };
  
  // Add endpoint configuration if provided
  if (endpoint) {
    adaptedNode.endpoint = {
      pathTemplate: endpoint.pathTemplate,
      methods: endpoint.methods,
      authTypes: endpoint.authTypes
    };
  }
  
  return adaptedNode;
}

/**
 * Identify integration nodes in a collection of node definitions
 * 
 * @param definitions Collection of node definitions
 * @returns Array of integration node types
 */
export function identifyIntegrationNodes(
  definitions: Record<string, NodeDefinition>
): string[] {
  return Object.values(definitions)
    .filter(def => def.integrationConfig !== undefined)
    .map(def => def.type);
}

/**
 * Convert an array of node definitions to integration nodes
 * 
 * @param definitions Array of node definitions
 * @returns Array of adapted integration nodes
 */
export function convertToIntegrationNodes(
  definitions: NodeDefinition[]
): AdaptedIntegrationNode[] {
  return definitions
    .filter(def => def.integrationConfig !== undefined)
    .map(def => adaptNodeToIntegration(def))
    .filter((node): node is AdaptedIntegrationNode => node !== null);
}