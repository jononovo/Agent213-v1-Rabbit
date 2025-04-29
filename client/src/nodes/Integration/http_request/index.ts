/**
 * HTTP Request Node
 * 
 * This node allows workflows to make HTTP requests to external APIs
 * and web services.
 */

import { NodeRegistryEntry } from '../../lib/types';
import definition from './definition';
import schema from './schema';
import * as executor from './executor';
import * as ui from './ui';
import { Globe } from 'lucide-react';
import React from 'react';

// Create metadata that complies with NodeMetadata interface
const metadata = {
  name: definition.name,
  description: definition.description,
  category: definition.category,
  version: definition.version
};

// Create the node registry entry
const HttpRequestNode: NodeRegistryEntry = {
  type: 'http_request',
  metadata,
  schema,
  executor: {
    execute: executor.execute,
    defaultData: ui.defaultData
  },
  ui: ui.component,
  validator: ui.validator,
  icon: React.createElement(Globe, { size: 16 })
};

export default HttpRequestNode;