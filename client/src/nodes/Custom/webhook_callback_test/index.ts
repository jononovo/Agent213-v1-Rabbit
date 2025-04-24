/**
 * Webhook Callback Test Node
 * 
 * This exports the node definition and implementation
 */

import * as definition from './definition';
import * as implementation from './implementation';

export const nodeDefinition = {
  ...definition,
  implementation: implementation.execute,
  settingsDefinition: definition.settingsDefinition
};

export default nodeDefinition;