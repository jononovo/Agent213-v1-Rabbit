/**
 * Webhook Callback Test Node UI Component
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { Send, ExternalLink, AlertCircle } from 'lucide-react';
import { BaseNode } from '@/nodes/Base';

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
  
  // Node content
  const nodeContent = (
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
  );
  
  // Using BaseNode to handle consistent node UI
  return (
    <BaseNode 
      id={id}
      data={{
        ...nodeData,
        label: label,
        type: 'webhook_callback_test',
        category: 'utility',
        childrenContent: nodeContent,
        icon: 'webhook',
        inputPoints: [
          { id: 'url', type: 'string' },
          { id: 'data', type: 'object' },
          { id: 'headers', type: 'object' }
        ],
        outputPoints: [
          { id: 'result', type: 'object' }
        ]
      }}
    />
  );
});