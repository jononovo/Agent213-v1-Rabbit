/**
 * Default Node Schema
 * 
 * This defines the schema and interface for the default node type.
 */

import { z } from 'zod';

/**
 * Schema for default node settings
 */
export const defaultNodeSchema = z.object({
  // Basic node information
  label: z.string().optional().default('Node'),
  description: z.string().optional().default('Generic node'),
  
  // Type identification
  type: z.string().optional().default('default'),
  category: z.string().optional().default('general'),
  
  // Execution state
  isProcessing: z.boolean().optional().default(false),
  isComplete: z.boolean().optional().default(false),
  hasError: z.boolean().optional().default(false),
  errorMessage: z.string().optional().default(''),
  
  // UI elements
  icon: z.string().optional().default('box'),
  
  // Settings are open-ended to allow for flexibility
  settings: z.record(z.any()).optional().default({}),
});

export type DefaultNodeType = z.infer<typeof defaultNodeSchema>;

/**
 * Default node metadata
 */
export const defaultNodeInfo = {
  type: 'default',
  name: 'Default Node',
  description: 'A generic node that can be used for any purpose.',
  category: 'general',
  inputs: {
    input: {
      type: 'any',
      description: 'General input data',
    }
  },
  outputs: {
    output: {
      type: 'any',
      description: 'General output data',
    }
  }
};