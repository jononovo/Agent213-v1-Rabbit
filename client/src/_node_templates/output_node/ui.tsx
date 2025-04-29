/**
 * Output Node Template - UI Component
 * 
 * This component renders the output node in the workflow editor.
 * It uses the BaseNode component to ensure consistency with the system.
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BaseNode from '@/nodes/Base/ui';
import { NodeProps } from 'reactflow';
import { BaseNodeData } from '@/nodes/Base/ui';

export default function MyOutputNode({ id, data, selected, isConnectable }: NodeProps) {
  // Extract essential settings with defaults
  const settingsData = data?.settingsData || {};
  const destinationUrl = settingsData.destinationUrl || 'No destination configured';
  const method = settingsData.method || 'POST';
  const formatOutput = settingsData.formatOutput === true;
  
  // Function to open URL in new tab
  const openUrl = (e: React.MouseEvent) => {
    if (!settingsData.destinationUrl) return;
    e.stopPropagation();
    window.open(settingsData.destinationUrl, '_blank', 'noopener,noreferrer');
  };
  
  // Format URL for display
  const displayUrl = destinationUrl?.length > 35 ? destinationUrl.substring(0, 32) + '...' : destinationUrl;
  
  // Prepare custom content for the node
  const customContent = (
    <div className="flex flex-col gap-2">
      {/* URL display */}
      <div className="bg-muted/80 p-2 rounded-md flex flex-col">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{method}</Badge>
          <div className="text-xs text-muted-foreground">Destination</div>
        </div>
        
        <div 
          onClick={openUrl}
          className="text-xs font-mono mt-1 truncate hover:text-primary cursor-pointer flex items-center"
          title={destinationUrl}
        >
          {displayUrl}
          {settingsData.destinationUrl && <ExternalLink className="h-3 w-3 ml-1 inline" />}
        </div>
      </div>
      
      {/* Simple config summary */}
      {formatOutput && (
        <div className="text-xs text-muted-foreground">
          Format output: Yes
        </div>
      )}
    </div>
  );
  
  // Prepare the node data with the properties expected by BaseNode
  const baseNodeData: BaseNodeData = {
    ...data,
    icon: ExternalLink,
    label: data.label || 'Output',
    description: data.description || 'Sends data to external system',
    settingsData,
    // Add the custom content to the node data
    childrenContent: customContent,
    // Maintain the existing custom handles flag if present,
    // otherwise don't hide the default handles
    hideDefaultHandles: data.hideDefaultHandles
  };
  
  return (
    <BaseNode
      id={id}
      data={baseNodeData}
      selected={selected}
      isConnectable={isConnectable}
      type="output_node"
    />
  );
}