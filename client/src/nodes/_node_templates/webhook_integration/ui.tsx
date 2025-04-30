/**
 * Webhook Integration Node UI Component
 * 
 * This component renders the webhook integration node in the workflow editor.
 * It displays the webhook configuration and status.
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Import the BaseNode component
import { BaseNode } from '@/nodes/core/base';

import { WebhookIntegrationData, defaultData } from './definition';

// Re-export the default data for use elsewhere
export { defaultData };

// Node UI component
export function component({ id, data, selected, isConnectable }: NodeProps<WebhookIntegrationData>) {
  // Merge incoming data with default data
  const nodeData = { ...defaultData, ...data };
  
  // Format webhook URL for display
  const webhookUrl = nodeData.webhookUrl || '(Generated when workflow is deployed)';
  
  // Create a custom content element for the node
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      <div className="text-sm">
        {/* Display webhook endpoint details */}
        <div className="rounded-md bg-secondary/30 p-2 mb-2">
          <p className="text-xs font-medium mb-1">Webhook Endpoint</p>
          <code className="text-xs block overflow-hidden text-ellipsis whitespace-nowrap">
            {nodeData.method} {nodeData.path}
          </code>
          {nodeData.webhookUrl && (
            <code className="text-xs block overflow-hidden text-ellipsis whitespace-nowrap mt-1">
              URL: {webhookUrl}
            </code>
          )}
        </div>
        
        {/* Authentication status */}
        <div className="flex items-center mt-2">
          <span className="text-xs mr-2">Authentication:</span>
          {nodeData.requireAuth ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              Required ({nodeData.authType || 'token'})
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              Not Required
            </Badge>
          )}
        </div>
      </div>
    </div>
  );

  // Create icon element for the node header
  const iconElement = (
    <div className="bg-blue-100 p-1.5 rounded-md">
      <Globe className="h-4 w-4 text-blue-600" />
    </div>
  );

  // Prepare the node data with the properties expected by BaseNode
  const baseNodeData = {
    ...data,
    icon: iconElement,
    label: nodeData.label || defaultData.label,
    description: nodeData.description || defaultData.description,
    settingsData: nodeData,
    childrenContent: customContent,
    // Specify that this is a source node (no inputs)
    isSourceNode: true,
    // Hide default handles for custom positioning
    hideDefaultHandles: true
  };
  
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="webhook_integration"
    />
  );
}