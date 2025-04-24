/**
 * Webhook Callback Test Node
 * 
 * This exports the node definition and implementation
 */

import { definition, interfaceDefinition, settingsDefinition } from './definition';
import { execute } from './executor';
import { component } from './ui';

export { 
  definition,
  interfaceDefinition,
  settingsDefinition,
  component,
  execute
};

export default {
  definition,
  interfaceDefinition,
  settingsDefinition,
  component,
  execute
};