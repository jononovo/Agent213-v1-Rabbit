/**
 * Send to Webhook Node
 * 
 * Entry point for the send_to_webhook node that allows sending data to external webhooks or APIs.
 * Exports the node definition, UI component, and executor.
 */

import definition from './definition';
import SendToWebhookNode from './ui';
import { execute } from './executor';

export {
  definition,
  SendToWebhookNode as component,
  execute
};

export default {
  definition,
  component: SendToWebhookNode,
  execute
};