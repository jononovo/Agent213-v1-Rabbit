/**
 * Base Integration Node UI Component
 * 
 * This component provides the configuration UI for the integration node.
 */

import React, { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BaseIntegrationNodeData } from './executor';

// Node UI component
export const component = ({ 
  data, 
  updateNodeData 
}: { 
  data: BaseIntegrationNodeData; 
  updateNodeData: (data: any) => void;
}) => {
  // Handler for text input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData({
      ...data,
      [e.target.name]: e.target.value
    });
  }, [data, updateNodeData]);
  
  // Handler for select changes
  const handleMethodChange = useCallback((value: string) => {
    updateNodeData({
      ...data,
      method: value
    });
  }, [data, updateNodeData]);

  return (
    <div className="p-4 space-y-4">
      {/* API Endpoint */}
      <div className="space-y-2">
        <Label htmlFor="apiEndpoint">API Endpoint</Label>
        <Input
          id="apiEndpoint"
          name="apiEndpoint"
          value={data.apiEndpoint || ''}
          onChange={handleInputChange}
          placeholder="https://api.example.com"
        />
      </div>
      
      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          value={data.apiKey || ''}
          onChange={handleInputChange}
          placeholder="Enter your API key"
        />
        <p className="text-xs text-muted-foreground">
          The API key is stored within the workflow configuration.
          For production, use environment variables instead.
        </p>
      </div>
      
      {/* HTTP Method */}
      <div className="space-y-2">
        <Label htmlFor="method">HTTP Method</Label>
        <Select
          value={data.method || 'GET'}
          onValueChange={handleMethodChange}
        >
          <SelectTrigger id="method">
            <SelectValue placeholder="Select HTTP method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Add more configuration options as needed */}
    </div>
  );
};