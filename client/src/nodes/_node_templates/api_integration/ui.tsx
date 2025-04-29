/**
 * API Integration Node UI Component
 * 
 * This component renders the API integration node in the workflow editor.
 * It displays the API configuration and request details.
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { Globe, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Import the BaseNode component
import { BaseNode } from '@/nodes/Base';

import { ApiIntegrationData, defaultData } from './definition';

// Re-export the default data for use elsewhere
export { defaultData };

// Node UI component
export function component({ id, data, selected, isConnectable }: NodeProps<ApiIntegrationData>) {
  // Merge incoming data with default data
  const nodeData = { ...defaultData, ...data };
  
  // Method badge color based on HTTP method
  const getMethodBadgeColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'PATCH': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Create a custom content element for the node
  const customContent = (
    <div className="p-3 flex flex-col gap-2">
      <div className="text-sm">
        {/* API endpoint details */}
        <div className="flex items-center mb-1">
          <Badge variant="outline" className={`mr-2 text-xs ${getMethodBadgeColor(nodeData.method)}`}>
            {nodeData.method}
          </Badge>
          <code className="text-xs block overflow-hidden text-ellipsis whitespace-nowrap">
            {nodeData.url}
          </code>
        </div>
        
        {/* Request configuration */}
        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
          <div className="flex items-center">
            <span className="text-muted-foreground mr-1">Proxy:</span>
            {nodeData.useProxy ? 'Yes' : 'No'}
          </div>
          <div className="flex items-center">
            <span className="text-muted-foreground mr-1">Timeout:</span>
            {nodeData.timeout}ms
          </div>
          <div className="flex items-center">
            <span className="text-muted-foreground mr-1">Retries:</span>
            {nodeData.retries}
          </div>
          <div className="flex items-center">
            <span className="text-muted-foreground mr-1">Pagination:</span>
            {nodeData.usePagination ? 'Yes' : 'No'}
          </div>
        </div>
        
        {/* Authentication status */}
        {nodeData.authType && (
          <div className="flex items-center mt-2">
            <span className="text-xs text-muted-foreground mr-2">Auth:</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              {nodeData.authType}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );

  // Create icon element for the node header
  const iconElement = (
    <div className="bg-primary/10 p-1.5 rounded-md">
      <ArrowUpDown className="h-4 w-4 text-primary" />
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
    // This is not a source node, it has both inputs and outputs
    isSourceNode: false,
    // No need to hide default handles
    hideDefaultHandles: false
  };
  
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="api_integration"
    />
  );
}