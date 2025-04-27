/**
 * Email Discovery Node UI Component
 */

import React, { useState } from 'react';
import { Mail, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { BaseNode } from '@/nodes/Base';
import { Badge } from '@/components/ui/badge';
import { defaultData } from './definition';

// Define the node data structure
export interface EmailDiscoveryNodeData {
  includeVerification: boolean;
  useDomainPatterns: boolean;
  includeConfidenceScore: boolean;
  maxAttempts: number;
  emailFormats: string[];
}

// Using same default data as in the definition
export { defaultData };

/**
 * Email Discovery Node UI Component
 */
const EmailDiscoveryUI: React.FC<{
  data: EmailDiscoveryNodeData;
  onChange: (data: EmailDiscoveryNodeData) => void;
}> = ({ data, onChange }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newFormat, setNewFormat] = useState('');
  
  // Create a merged data object with defaults for any missing properties
  const mergedData = {
    ...defaultData,
    ...data
  };
  
  // Function to handle updating a specific field
  const updateField = (field: keyof EmailDiscoveryNodeData, value: any) => {
    onChange({
      ...mergedData,
      [field]: value
    });
  };
  
  // Add a new email format
  const addEmailFormat = () => {
    if (newFormat.trim() && !mergedData.emailFormats.includes(newFormat.trim())) {
      updateField('emailFormats', [...mergedData.emailFormats, newFormat.trim()]);
      setNewFormat('');
    }
  };
  
  // Remove an email format
  const removeEmailFormat = (format: string) => {
    updateField('emailFormats', mergedData.emailFormats.filter(f => f !== format));
  };
  
  // Settings panel content
  const settingsPanel = (
    <div className="p-2 space-y-4 w-72">
      <h3 className="font-semibold">Email Discovery Settings</h3>
      
      <div className="space-y-3">
        <FormItem>
          <FormLabel>Include Verification</FormLabel>
          <Checkbox 
            checked={mergedData.includeVerification} 
            onCheckedChange={(checked) => updateField('includeVerification', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Use Domain Patterns</FormLabel>
          <Checkbox 
            checked={mergedData.useDomainPatterns} 
            onCheckedChange={(checked) => updateField('useDomainPatterns', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Include Confidence Score</FormLabel>
          <Checkbox 
            checked={mergedData.includeConfidenceScore} 
            onCheckedChange={(checked) => updateField('includeConfidenceScore', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Max Attempts: {mergedData.maxAttempts}</FormLabel>
          <Slider
            value={[mergedData.maxAttempts]}
            min={1}
            max={5}
            step={1}
            onValueChange={(value) => updateField('maxAttempts', value[0])}
          />
        </FormItem>
      </div>
    </div>
  );
  
  // Main node content
  const nodeContent = (
    <div className="p-3 space-y-3">
      <div className="flex items-center">
        <Mail className="mr-2 h-5 w-5" />
        <div className="font-medium">Email Discovery</div>
        <div className="ml-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="p-0">
                    {settingsPanel}
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email Discovery Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div>
        <FormItem>
          <FormLabel>Email Formats</FormLabel>
          <div className="flex gap-2">
            <Input
              value={newFormat}
              onChange={(e) => setNewFormat(e.target.value)}
              placeholder="Add format (e.g., first.last@domain.com)..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEmailFormat();
                }
              }}
            />
            <Button size="sm" onClick={addEmailFormat}>Add</Button>
          </div>
        </FormItem>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {mergedData.emailFormats.map((format) => (
            <Badge key={format} variant="secondary" className="flex items-center gap-1">
              {format}
              <button 
                onClick={() => removeEmailFormat(format)}
                className="text-xs font-bold ml-1"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        Max Attempts: {mergedData.maxAttempts}
      </div>
    </div>
  );
  
  // Wrap in the DefaultNode
  return (
    <DefaultNode
      inputs={[{ name: 'contact', type: 'object' }, { name: 'domain', type: 'string' }]}
      outputs={[{ name: 'contact', type: 'object' }, { name: 'metadata', type: 'object' }]}
    >
      {nodeContent}
    </DefaultNode>
  );
};

export default EmailDiscoveryUI;