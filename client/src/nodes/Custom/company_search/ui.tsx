/**
 * Company Search Node UI Component
 */

import React, { useState } from 'react';
import { Building, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormItem, FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { BaseNode } from '@/nodes/Base';
import { defaultData } from './definition';

// Define the node data structure
export interface CompanySearchNodeData {
  prompt: string;
  includeIndustry: boolean;
  includeEmployeeCount: boolean;
  includeRevenue: boolean;
  includeFunding: boolean;
  includeDescription: boolean;
  maxResults: number;
}

// Using same default data as in the definition
export { defaultData };

/**
 * Company Search Node UI Component
 */
const CompanySearchUI: React.FC<{
  data: CompanySearchNodeData;
  onChange: (data: CompanySearchNodeData) => void;
}> = ({ data, onChange }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Create a merged data object with defaults for any missing properties
  const mergedData = {
    ...defaultData,
    ...data
  };
  
  // Function to handle updating a specific field
  const updateField = (field: keyof CompanySearchNodeData, value: any) => {
    onChange({
      ...mergedData,
      [field]: value
    });
  };
  
  // Settings panel content
  const settingsPanel = (
    <div className="p-2 space-y-4 w-72">
      <h3 className="font-semibold">Company Search Settings</h3>
      
      <div className="space-y-3">
        <FormItem>
          <FormLabel>Include Industry</FormLabel>
          <Checkbox 
            checked={mergedData.includeIndustry} 
            onCheckedChange={(checked) => updateField('includeIndustry', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Include Employee Count</FormLabel>
          <Checkbox 
            checked={mergedData.includeEmployeeCount} 
            onCheckedChange={(checked) => updateField('includeEmployeeCount', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Include Revenue</FormLabel>
          <Checkbox 
            checked={mergedData.includeRevenue} 
            onCheckedChange={(checked) => updateField('includeRevenue', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Include Funding</FormLabel>
          <Checkbox 
            checked={mergedData.includeFunding} 
            onCheckedChange={(checked) => updateField('includeFunding', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Include Description</FormLabel>
          <Checkbox 
            checked={mergedData.includeDescription} 
            onCheckedChange={(checked) => updateField('includeDescription', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Max Results: {mergedData.maxResults}</FormLabel>
          <Slider
            value={[mergedData.maxResults]}
            min={1}
            max={20}
            step={1}
            onValueChange={(value) => updateField('maxResults', value[0])}
          />
        </FormItem>
      </div>
    </div>
  );
  
  // Main node content
  const nodeContent = (
    <div className="p-3 space-y-3">
      <div className="flex items-center">
        <Building className="mr-2 h-5 w-5" />
        <div className="font-medium">Company Search</div>
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
                <p>Search Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div>
        <FormItem>
          <FormLabel>Search Query</FormLabel>
          <Input
            value={mergedData.prompt}
            onChange={(e) => updateField('prompt', e.target.value)}
            placeholder="Enter company search criteria..."
            className="w-full"
          />
        </FormItem>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        Max Results: {mergedData.maxResults}
      </div>
    </div>
  );
  
  // Wrap in the BaseNode - BaseNode expects different props than DefaultNode
  return (
    <BaseNode
      id="company_search"
      data={{
        label: "Company Search",
        description: "Search for company information",
        type: "company_search",
        category: "lead_generation",
        childrenContent: nodeContent, // Use childrenContent prop instead of children
        // Define input/output points as needed
        inputPoints: [{ id: 'query', type: 'string' }, { id: 'filters', type: 'object' }],
        outputPoints: [{ id: 'companies', type: 'array' }, { id: 'metadata', type: 'object' }]
      }}
    />
  );
};

export default CompanySearchUI;