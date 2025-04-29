/**
 * Base Integration Node UI Component
 * 
 * This component provides the configuration UI for an integration node.
 * It demonstrates how to create settings for API endpoints, authentication, and methods.
 */

import React, { useCallback, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BaseIntegrationNodeData } from './executor';
// Import your existing API check function
// Update this import to your actual secrets checking function
import { checkApiKey } from '@/utils/apiKeyUtils';

// Interface for validation result
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates node configuration
 * Customize this function for your node's specific validation requirements
 */
export const validator = (data: BaseIntegrationNodeData): ValidationResult => {
  const errors: string[] = [];
  
  // Example validation rules - modify for your node
  if (!data.apiEndpoint || data.apiEndpoint.trim() === '') {
    errors.push('API endpoint cannot be empty');
  }
  
  if (data.useAuth && !data.apiKey) {
    errors.push('API key is required when authentication is enabled');
  }
  
  // More validation rules as needed...
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Node configuration UI component
 */
export const component = ({ 
  data, 
  updateNodeData 
}: { 
  data: BaseIntegrationNodeData; 
  updateNodeData: (data: any) => void;
}) => {
  // State for whether the API key is available in environment
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  
  // Check if API key is available in environment variables
  useEffect(() => {
    const checkApiKey = async () => {
      // This will check if the EXAMPLE_API_KEY is available in environment
      // Replace with your actual API key name from definition.ts
      const result = await checkSecrets(['EXAMPLE_API_KEY']);
      setHasApiKey(result.EXAMPLE_API_KEY || false);
    };
    
    checkApiKey();
  }, []);
  
  // Handler for text input changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  
  // Handler for switch changes
  const handleSwitchChange = useCallback((checked: boolean) => {
    updateNodeData({
      ...data,
      useAuth: checked
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
          onChange={handleTextChange}
          placeholder="https://api.example.com/v1"
        />
      </div>
      
      {/* HTTP Method */}
      <div className="space-y-2">
        <Label htmlFor="method">HTTP Method</Label>
        <Select 
          value={data.method || 'GET'} 
          onValueChange={handleMethodChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select method" />
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
      
      {/* Authentication Switch */}
      <div className="flex items-center space-x-2 pt-2">
        <Switch
          id="useAuth"
          checked={data.useAuth || false}
          onCheckedChange={handleSwitchChange}
        />
        <Label htmlFor="useAuth">Use Authentication</Label>
      </div>
      
      {/* API Key - Only shown if useAuth is true */}
      {data.useAuth && (
        <div className="space-y-2 pt-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            value={data.apiKey || ''}
            onChange={handleTextChange}
            placeholder={hasApiKey ? '(Using environment variable)' : 'Enter API key'}
            disabled={hasApiKey}
          />
          
          {hasApiKey && (
            <Alert className="mt-2 bg-green-50">
              <AlertDescription>
                Using API key from environment variables.
              </AlertDescription>
            </Alert>
          )}
          
          {!hasApiKey && !data.apiKey && (
            <Alert className="mt-2 bg-amber-50">
              <AlertDescription>
                API key is required. Either enter it here or add it to environment variables.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};