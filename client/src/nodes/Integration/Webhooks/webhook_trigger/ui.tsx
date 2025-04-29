/**
 * Webhook Trigger Node UI Component
 * 
 * This component provides the settings UI for the webhook trigger node
 */

import React, { useCallback } from 'react';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { getIntegrationBaseUrl } from '@utils/integrationClient';

// HTTP methods for webhook
const HTTP_METHODS = ['POST', 'GET', 'PUT', 'DELETE', 'PATCH'];

// Auth types for webhook
const AUTH_TYPES = [
  { id: 'none', name: 'None' },
  { id: 'apiKey', name: 'API Key' },
  { id: 'bearer', name: 'Bearer Token' }
];

/**
 * Webhook Trigger Node Settings Component
 */
export default function WebhookTriggerNodeSettings({ 
  data, 
  updateNodeData 
}: { 
  data: any; 
  updateNodeData: (data: any) => void;
}) {
  // Get base URL for displaying preview
  const baseUrl = getIntegrationBaseUrl();
  
  // Update node data
  const handleChange = useCallback((field: string, value: any) => {
    updateNodeData({
      ...data,
      [field]: value
    });
  }, [data, updateNodeData]);
  
  // Handle webhook path change
  const handlePathChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleChange('webhookPath', value);
  }, [handleChange]);
  
  // Handle description change
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleChange('description', value);
  }, [handleChange]);
  
  // Handle method selection (single method for now)
  const handleMethodChange = useCallback((value: string) => {
    handleChange('methods', [value]);
  }, [handleChange]);
  
  // Handle auth type change
  const handleAuthTypeChange = useCallback((value: string) => {
    handleChange('authType', value);
  }, [handleChange]);
  
  // Get the current values with defaults
  const webhookPath = data.webhookPath || '';
  const description = data.description || 'Webhook endpoint';
  const methods = data.methods || ['POST'];
  const authType = data.authType || 'none';
  
  // Calculate the full webhook URL preview
  const webhookUrlPreview = `${baseUrl}/webhooks/${webhookPath || ':path'}`;
  
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="webhookPath">Webhook Path</Label>
        <Input
          id="webhookPath"
          value={webhookPath}
          onChange={handlePathChange}
          placeholder="my-webhook"
        />
        <p className="text-xs text-gray-500">
          Unique path for this webhook endpoint
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Webhook endpoint"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="method">HTTP Method</Label>
        <Select
          value={methods[0]}
          onValueChange={handleMethodChange}
        >
          <SelectTrigger id="method">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map(method => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="authType">Authentication</Label>
        <Select
          value={authType}
          onValueChange={handleAuthTypeChange}
        >
          <SelectTrigger id="authType">
            <SelectValue placeholder="Select authentication type" />
          </SelectTrigger>
          <SelectContent>
            {AUTH_TYPES.map(type => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
        <Label>Webhook URL Preview</Label>
        <p className="text-sm font-mono mt-1 break-all">
          {webhookUrlPreview}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          This URL will be generated when the workflow is saved and run
        </p>
      </div>
    </div>
  );
}