/**
 * Node Data Utilities
 * 
 * This module provides utilities for handling data transfer between nodes,
 * including type validation and data transformation.
 */

import { PortDefinition } from '../../../shared/nodeTypes';

/**
 * Determines if two ports are compatible for connection
 */
export function arePortsCompatible(
  outputPort: PortDefinition, 
  inputPort: PortDefinition
): boolean {
  // Direct type match
  if (outputPort.type === inputPort.type) return true;
  
  // String outputs can connect to most inputs
  if (outputPort.type === 'string' && 
      ['string', 'text', 'prompt'].includes(inputPort.type)) return true;
  
  // Objects can connect to string inputs (implicit conversion)
  if (outputPort.type === 'object' && inputPort.type === 'string') return true;
  
  return false;
}

/**
 * Transforms data from a source node to match the expected input of a target node
 * This is the key function that enables nodes to work together
 */
export function transformNodeData(
  sourceData: any,
  sourceType: string,
  targetType: string
): any {
  // If types match directly, no transformation needed
  if (sourceType === targetType) return sourceData;

  // Handle common transformations
  
  // Object to string (stringify)
  if (sourceType === 'object' && targetType === 'string') {
    try {
      return JSON.stringify(sourceData);
    } catch (e) {
      console.warn('Failed to stringify object:', e);
      return String(sourceData);
    }
  }
  
  // Handle text extraction from various formats
  if (targetType === 'string' || targetType === 'text') {
    // If source is already a string
    if (typeof sourceData === 'string') return sourceData;
    
    // Handle common text node output structures
    if (sourceData && typeof sourceData === 'object') {
      // Try common text properties
      if (sourceData.text) return sourceData.text;
      if (sourceData.content) return sourceData.content;
      
      // Try to extract from items array (common in our nodes)
      if (sourceData.items && Array.isArray(sourceData.items) && sourceData.items.length > 0) {
        const item = sourceData.items[0];
        
        // Handle nested structures
        if (item && typeof item === 'object') {
          if (item.text) return item.text;
          if (item.content) return item.content;
          if (item.json && item.json.text) return item.json.text;
        }
        
        // If item is directly a string
        if (typeof item === 'string') return item;
      }
      
      // Try looking for output or response properties (common in API nodes)
      if (sourceData.output) return sourceData.output;
      if (sourceData.response) return sourceData.response;
      
      // Try to stringify as last resort
      try {
        return JSON.stringify(sourceData);
      } catch (e) {
        return String(sourceData);
      }
    }
  }
  
  // Return original if no transformation applied
  console.warn(`No transformation available from ${sourceType} to ${targetType}`);
  return sourceData;
}