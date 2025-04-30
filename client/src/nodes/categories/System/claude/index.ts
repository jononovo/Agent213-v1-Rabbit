/**
 * Claude API Node
 * 
 * This node provides integration with Anthropic's Claude AI model.
 * It's designed to be used for generating text responses.
 */

import { NodeRegistryEntry } from '../../../lib/types';
import definition from './definition';
import * as executor from './executor';
import * as ui from './ui';
import { Sparkles } from 'lucide-react';
import React from 'react';

// Ensure the definition complies with NodeMetadata interface
const metadata = {
  name: definition.name,
  description: definition.description,
  category: definition.category,
  version: definition.version
};

// Claude API Node Implementation
const ClaudeNode: NodeRegistryEntry = {
  type: 'claude',
  metadata,
  executor: {
    execute: executor.execute,
    defaultData: ui.defaultData
  },
  ui: ui.component,
  validator: ui.validator,
  icon: React.createElement(Sparkles, { size: 16 })
};

export default ClaudeNode;