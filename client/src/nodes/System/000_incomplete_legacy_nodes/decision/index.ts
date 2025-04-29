/**
 * Decision Node
 * 
 * This node creates conditional branching based on rules and input data.
 */

import { NodeRegistryEntry } from '../../../lib/types';
import { metadata, schema } from './definition';
import * as executor from './executor';
import * as ui from './ui';

/**
 * Decision Node Registry Entry
 */
const entry: NodeRegistryEntry = {
  type: 'decision',
  metadata,
  schema,
  executor,
  ui: ui.component,
  defaultData: executor.defaultData,
  validator: ui.validator
};

export default entry;