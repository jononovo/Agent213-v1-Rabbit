/**
 * Contact Finder Node UI Component
 */

import React, { useState } from 'react';
import { Users, Settings } from 'lucide-react';
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
export interface ContactFinderNodeData {
  jobTitles: string[];
  includeLinkedIn: boolean;
  includeEmail: boolean;
  includePhone: boolean;
  maxContacts: number;
  prioritizeLeadership: boolean;
}

// Using same default data as in the definition
export { defaultData };

/**
 * Contact Finder Node UI Component
 */
const ContactFinderUI: React.FC<{
  data: ContactFinderNodeData;
  onChange: (data: ContactFinderNodeData) => void;
}> = ({ data, onChange }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  
  // Create a merged data object with defaults for any missing properties
  const mergedData = {
    ...defaultData,
    ...data
  };
  
  // Function to handle updating a specific field
  const updateField = (field: keyof ContactFinderNodeData, value: any) => {
    onChange({
      ...mergedData,
      [field]: value
    });
  };
  
  // Add a new job title
  const addJobTitle = () => {
    if (newJobTitle.trim() && !mergedData.jobTitles.includes(newJobTitle.trim())) {
      updateField('jobTitles', [...mergedData.jobTitles, newJobTitle.trim()]);
      setNewJobTitle('');
    }
  };
  
  // Remove a job title
  const removeJobTitle = (title: string) => {
    updateField('jobTitles', mergedData.jobTitles.filter(t => t !== title));
  };
  
  // Settings panel content
  const settingsPanel = (
    <div className="p-2 space-y-4 w-72">
      <h3 className="font-semibold">Contact Finder Settings</h3>
      
      <div className="space-y-3">
        <FormItem>
          <FormLabel>Include LinkedIn URLs</FormLabel>
          <Checkbox 
            checked={mergedData.includeLinkedIn} 
            onCheckedChange={(checked) => updateField('includeLinkedIn', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Include Email Addresses</FormLabel>
          <Checkbox 
            checked={mergedData.includeEmail} 
            onCheckedChange={(checked) => updateField('includeEmail', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Include Phone Numbers</FormLabel>
          <Checkbox 
            checked={mergedData.includePhone} 
            onCheckedChange={(checked) => updateField('includePhone', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Prioritize Leadership</FormLabel>
          <Checkbox 
            checked={mergedData.prioritizeLeadership} 
            onCheckedChange={(checked) => updateField('prioritizeLeadership', checked)}
          />
        </FormItem>
        
        <FormItem>
          <FormLabel>Max Contacts: {mergedData.maxContacts}</FormLabel>
          <Slider
            value={[mergedData.maxContacts]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => updateField('maxContacts', value[0])}
          />
        </FormItem>
      </div>
    </div>
  );
  
  // Main node content
  const nodeContent = (
    <div className="p-3 space-y-3">
      <div className="flex items-center">
        <Users className="mr-2 h-5 w-5" />
        <div className="font-medium">Contact Finder</div>
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
                <p>Contact Finder Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div>
        <FormItem>
          <FormLabel>Target Job Titles</FormLabel>
          <div className="flex gap-2">
            <Input
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              placeholder="Add job title..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addJobTitle();
                }
              }}
            />
            <Button size="sm" onClick={addJobTitle}>Add</Button>
          </div>
        </FormItem>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {mergedData.jobTitles.map((title) => (
            <Badge key={title} variant="secondary" className="flex items-center gap-1">
              {title}
              <button 
                onClick={() => removeJobTitle(title)}
                className="text-xs font-bold ml-1"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-2">
        Max Contacts: {mergedData.maxContacts}
      </div>
    </div>
  );
  
  // Wrap in the BaseNode
  return (
    <BaseNode
      id="contact_finder"
      data={{
        label: "Contact Finder",
        description: "Find contacts at target companies",
        type: "contact_finder",
        category: "lead_generation",
        childrenContent: nodeContent, // Use childrenContent prop instead of children
        // Define input/output points as needed
        inputPoints: [
          { id: 'company', type: 'object' }, 
          { id: 'jobTitles', type: 'array' }
        ],
        outputPoints: [
          { id: 'contacts', type: 'array' }, 
          { id: 'metadata', type: 'object' }
        ]
      }}
    />
  );
};

export default ContactFinderUI;