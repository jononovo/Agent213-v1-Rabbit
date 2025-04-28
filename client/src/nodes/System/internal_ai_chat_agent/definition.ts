/**
 * Internal AI Chat Agent Node Definition
 * 
 * This node enables AI-powered chat functionality within the workflow system.
 */

import { NodeDefinition, NodeSetting } from '@/nodes/types';
import { z } from 'zod';
import { MessageSquare } from 'lucide-react';

// Default configuration for the node
export const defaultData = {
  triggerPhrases: 'create a new agent, build agent, make an agent',
  responseTemplate: "I'll create a new agent called {{name}} for you...",
  extractionPrompt: 'Extract the name and description for the new agent...'
};

const definition: NodeDefinition = {
  type: 'internal_ai_chat_agent',
  name: 'AI Chat Agent',
  description: 'Enables AI chat functionality with trigger phrase detection',
  icon: MessageSquare,
  category: 'ai',
  version: '1.0.0',
  inputs: {
    message: {
      type: 'string',
      description: 'Chat message to analyze for triggers'
    }
  },
  outputs: {
    response: {
      type: 'string',
      description: 'Generated response message'
    },
    extracted: {
      type: 'object',
      description: 'Extracted data from the chat message',
      optional: true
    }
  },
  defaultData: defaultData,
  
  // Define settings for NodeSettingsDrawer
  settings: [
    {
      key: 'triggerPhrases',
      type: 'textarea',
      label: 'Trigger Phrases',
      description: 'Comma-separated list of phrases that will trigger this node when detected in chat.',
      placeholder: 'create a new agent, build agent, make an agent...'
    },
    {
      key: 'responseTemplate',
      type: 'textarea',
      label: 'Response Template',
      description: 'Template for the response when this node is triggered. Use {{variable}} for placeholders.',
      placeholder: "I'll create a new agent called {{name}} for you..."
    },
    {
      key: 'extractionPrompt',
      type: 'textarea',
      label: 'Extraction Prompt',
      description: 'Prompt to extract structured data from the user\'s chat message.',
      placeholder: 'Extract the name and description for the new agent...'
    }
  ],
  
  // Validation schema using Zod
  validation: z.object({
    triggerPhrases: z.string(),
    responseTemplate: z.string(),
    extractionPrompt: z.string()
  })
};

export default definition;