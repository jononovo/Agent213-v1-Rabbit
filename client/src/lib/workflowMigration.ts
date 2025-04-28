/**
 * Workflow Migration Utilities
 * 
 * This module provides utilities to migrate legacy workflow data to the new folder-based node system.
 * It ensures that existing workflows are compatible with the updated node structure.
 */

import { NodeDefinition } from '../nodes/types';
import { hasNode, getAllNodes } from './unifiedNodeRegistry';

/**
 * Interface for flow data structure
 */
export interface FlowData {
  nodes: any[];
  edges: any[];
}

/**
 * Migrates a workflow's flowData to the new folder-based node format
 */
export function migrateFlowData(flowData: FlowData): FlowData {
  if (!flowData || typeof flowData !== 'object') {
    return { nodes: [], edges: [] };
  }

  // Ensure nodes and edges arrays exist
  const nodes = Array.isArray(flowData.nodes) ? [...flowData.nodes] : [];
  const edges = Array.isArray(flowData.edges) ? [...flowData.edges] : [];

  // Migrate nodes to new format
  const migratedNodes = nodes.map(node => migrateNode(node));

  return {
    nodes: migratedNodes,
    edges
  };
}

/**
 * Migrates a single node to the new format
 */
export function migrateNode(node: any): any {
  if (!node || typeof node !== 'object') {
    return node;
  }

  // If node already has proper structure, don't modify it
  if (
    node.data && 
    typeof node.data === 'object' &&
    node.data.defaultData &&
    node.type &&
    hasNode(node.type)
  ) {
    return node;
  }

  // Create a migrated node with required fields
  const migratedNode = {
    ...node,
    type: node.type || 'unknown',
    data: {
      ...node.data,
      // Add any missing fields from the legacy format
      label: node.data?.label || node.label || node.type || 'Unknown Node',
      description: node.data?.description || node.description || '',
      icon: node.data?.icon || node.icon || null,
      category: node.data?.category || 'general'
    }
  };

  // Add defaultData based on node type
  switch (migratedNode.type) {
    case 'claude':
      migratedNode.data.defaultData = {
        model: 'claude-3-haiku-20240307',
        temperature: 0.7,
        maxTokens: 1000
      };
      break;
    case 'text_input':
      migratedNode.data.defaultData = {};
      break;
    case 'text_template':
      migratedNode.data.defaultData = {
        template: migratedNode.data.template || '{{input}}'
      };
      break;
    case 'http_request':
      migratedNode.data.defaultData = {
        url: migratedNode.data.url || 'https://example.com',
        method: migratedNode.data.method || 'GET',
        headers: migratedNode.data.headers || {}
      };
      break;
    default:
      migratedNode.data.defaultData = {};
      break;
  }

  return migratedNode;
}

/**
 * Checks if a workflow needs migration
 */
export function needsMigration(flowData: FlowData): boolean {
  if (!flowData || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
    return false;
  }

  // Check if any node lacks the new structure
  return flowData.nodes.some(node => 
    !node.data || 
    !node.data.defaultData ||
    !node.type ||
    !hasNode(node.type)
  );
}

/**
 * Adds defaultData to nodes that need it
 */
export function ensureNodeDefaultData(nodes: any[]): any[] {
  if (!Array.isArray(nodes)) {
    return [];
  }

  return nodes.map(node => {
    if (!node.data || !node.data.defaultData) {
      return migrateNode(node);
    }
    return node;
  });
}