/**
 * Text Template Node
 * 
 * This node provides template-based text generation with variable substitution.
 */

import { NodeRegistryEntry } from '../../lib/types';
import { metadata, schema } from './definition';
import * as executor from './executor';
import * as ui from './ui';

/**
 * Text Template Node Registry Entry
 */
const entry: NodeRegistryEntry = {
  type: 'text_template',
  metadata,
  schema,
  executor,
  ui: ui.component,
  defaultData: executor.defaultData,
  validator: ui.validator
};

export default entry;