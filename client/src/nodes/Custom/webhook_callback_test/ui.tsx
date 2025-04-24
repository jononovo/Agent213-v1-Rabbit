/**
 * Webhook Callback Test Node UI Component
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Send, ExternalLink, Code, AlertCircle } from 'lucide-react';

interface WebhookCallbackNodeData {
  label?: string;
  url?: string;
  method?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  error?: string;
}

/**
 * UI component for the webhook callback test node
 */
export const component = memo(({ id, data, selected }: NodeProps<WebhookCallbackNodeData>) => {
  const nodeData = data || {};
  const label = nodeData.label || 'Webhook Callback';
  const status = nodeData.status || 'idle';
  const url = nodeData.url || '';
  const method = nodeData.method || 'POST';
  
  // Handle click to open node settings
  const handleSettingsClick = () => {
    window.dispatchEvent(new CustomEvent('node-settings-open', {
      detail: { nodeId: id }
    }));
  };
  
  // Determine icon and status color
  let StatusIcon = Send;
  let statusColor = 'text-gray-400';
  let statusBg = 'bg-gray-100';
  let statusText = 'Ready';
  
  if (status === 'running') {
    StatusIcon = Send;
    statusColor = 'text-blue-500';
    statusBg = 'bg-blue-100';
    statusText = 'Sending...';
  } else if (status === 'success') {
    StatusIcon = ExternalLink;
    statusColor = 'text-green-500';
    statusBg = 'bg-green-100';
    statusText = 'Sent';
  } else if (status === 'error') {
    StatusIcon = AlertCircle;
    statusColor = 'text-red-500';
    statusBg = 'bg-red-100';
    statusText = 'Error';
  }
  
  return (
    <div className={`node-container ${selected ? 'selected' : ''}`}>
      {/* Node title bar */}
      <div className="node-header bg-gray-100 flex items-center p-2">
        <Send size={16} className="mr-2 text-blue-500" />
        <div className="font-semibold flex-grow">{label}</div>
        <button 
          className="node-settings-button"
          onClick={handleSettingsClick}
          aria-label="Open node settings"
        >
          <Code size={16} />
        </button>
      </div>
      
      {/* Node content */}
      <div className="p-3">
        {/* URL display */}
        {url && (
          <div className="mb-2 text-xs overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="font-semibold mr-1">{method}:</span>
            <span className="text-gray-500">{url.length > 25 ? url.substring(0, 22) + '...' : url}</span>
          </div>
        )}
        
        {/* Status indicator */}
        <div className={`flex items-center mt-1 ${statusColor}`}>
          <StatusIcon size={14} className="mr-1" />
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusBg} ${statusColor}`}>
            {statusText}
          </span>
        </div>
        
        {/* Error message (if any) */}
        {status === 'error' && nodeData.error && (
          <div className="mt-2 text-xs text-red-500 overflow-hidden text-ellipsis">
            {nodeData.error.length > 35 ? nodeData.error.substring(0, 32) + '...' : nodeData.error}
          </div>
        )}
      </div>
      
      {/* Node ports */}
      <Handle
        type="target"
        position={Position.Left}
        id="url"
        className="port port-target"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="data"
        className="port port-target"
        style={{ top: 45 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="headers"
        className="port port-target"
        style={{ top: 65 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="result"
        className="port port-source"
      />
    </div>
  );
});