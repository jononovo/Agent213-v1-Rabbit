/**
 * JSON Path Node
 * 
 * This node extracts data using JSONPath expressions.
 */

import { NodeRegistryEntry } from '../../lib/types';
import { metadata, schema } from './definition';
import * as executor from './executor';
import * as ui from './ui';
import { FileSearch } from 'lucide-react';
import React from 'react';

const JSONPathNode: NodeRegistryEntry = {
  type: 'json_path',
  metadata,
  schema,
  executor,
  ui: {
    component: ui.component,
    defaultData: ui.defaultData,
    validator: ui.validator
  },
  icon: React.createElement(FileSearch, { size: 16 })
};

export default JSONPathNode;