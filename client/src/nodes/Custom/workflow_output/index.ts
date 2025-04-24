/**
 * Workflow Output Node Entry Point
 */

import definition from './definition';
import { execute } from './executor';
import UI from './ui';

export default {
  definition,
  executor: execute,
  ui: UI
};