/**
 * Workflow Output Node Definition
 * 
 * This node captures and returns output from the workflow.
 * It is specifically designed to be recognized as an output node
 * by the workflow execution system.
 */

import { z } from 'zod';
import { CheckCircle } from 'lucide-react';

// Default configuration for the node
const defaultData = {
  label: 'Workflow Output',
  description: 'Captures workflow output',
  formatOutput: true,
  includeMetadata: true
};

const definition = {
  type: 'workflow_output',
  name: 'Workflow Output',
  description: 'Returns workflow results',
  category: 'output', // This is critical - must be "output" to be recognized
  icon: CheckCircle,
  version: '1.0.0',
  defaultData: defaultData,
  inputs: {
    input: {
      type: 'any',
      description: 'Data to return from the workflow',
      required: true
    }
  },
  outputs: {
    // No outputs as this is a terminal node
  },
  settings: [
    {
      key: 'label',
      type: 'string',
      label: 'Node Label',
      description: 'Custom label for this node',
      placeholder: 'Workflow Output',
      required: false
    },
    {
      key: 'description',
      type: 'string',
      label: 'Description',
      description: 'Custom description for this node',
      placeholder: 'Captures workflow output',
      required: false
    },
    {
      key: 'formatOutput',
      type: 'boolean',
      label: 'Format Output',
      description: 'Whether to format the output as JSON',
      default: true
    },
    {
      key: 'includeMetadata',
      type: 'boolean',
      label: 'Include Metadata',
      description: 'Whether to include execution metadata in the output',
      default: true
    }
  ],
  validation: z.object({
    label: z.string().optional(),
    description: z.string().optional(),
    formatOutput: z.boolean().default(true),
    includeMetadata: z.boolean().default(true)
  })
};

export default definition;