/**
 * LEGACY TEST DEFINITIONS - DEPRECATED
 * 
 * This file contains the original test definitions that have been replaced by 
 * the new standardTests.ts implementation. It is kept for backwards compatibility
 * and will be removed in the future.
 */
import React from 'react';

export type LegacyTestType = 'definition' | 'interface' | 'execution' | 'error' | 'ui' | 'performance' | 'integration';

export interface LegacyTestDefinition {
  id: LegacyTestType;
  name: string;
  description: string;
  icon: React.ElementType;
}

// Standard test definitions - updated for BaseNode compatibility
export const LEGACY_STANDARD_TESTS: Omit<LegacyTestDefinition, 'icon'>[] = [
  {
    id: 'definition',
    name: 'BaseNode Definition',
    description: 'Verifies the node follows BaseNode structure and has all required base properties'
  },
  {
    id: 'interface',
    name: 'Type-Safe Interface',
    description: 'Tests the input/output ports match the TypeScript definitions'
  },
  {
    id: 'execution',
    name: 'Executor Validation',
    description: 'Verifies the node executor properly processes inputs and generates outputs'
  },
  {
    id: 'error',
    name: 'Error Handling',
    description: 'Tests how the node handles invalid inputs and error conditions'
  },
  {
    id: 'ui',
    name: 'UI Components',
    description: 'Verifies all UI components are properly registered and render correctly'
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Tests the node for memory usage and execution speed'
  },
  {
    id: 'integration',
    name: 'Integration Capabilities',
    description: 'Tests the node\'s integration with external systems'
  }
];