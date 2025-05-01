/**
 * Node Settings Drawer
 * 
 * This component provides a sliding drawer to configure node settings.
 * It dynamically renders settings fields based on node type and handles
 * form state management and saving.
 */

import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Node } from 'reactflow';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Save, X, BookOpen, HelpCircle } from 'lucide-react';
import { NodeReadmeModal } from '@/nodes/components/base';
// Import data access helpers
import { useWorkflows, useAgents, formatWorkflowOptions, formatAgentOptions } from '@/nodes/categories/Internal/internalDataAccessServiceForNodes';
// Import from the unified registry
import { getNodeSettings, hasNode, getNodeDefinitionPath, getNode } from '@/nodes/core/registry/unifiedNodeRegistry';
import { SettingField, SettingType, NodeSettingsHandlers } from '@/nodes/core/types/nodeSettingsTypes';

// We need to get the NodeData type - import it from the proper location
// This might need an adjustment based on your specific structure
interface NodeData {
  label?: string;
  description?: string;
  workflowId?: number | string;
  settings?: Record<string, any>;
  settingsData?: Record<string, any>;
  [key: string]: any;
}

interface NodeSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node<NodeData> | null;
  onSettingsChange: (nodeId: string, settings: Record<string, any>) => void;
}

type TabType = 'properties' | 'variables' | 'settings';

// Alias SettingField from our types to SettingsField for backward compatibility
type SettingsField = SettingField;

const NodeSettingsDrawer: React.FC<NodeSettingsDrawerProps> = ({
  isOpen,
  onClose,
  node,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('properties');
  const [settings, setSettings] = React.useState<Record<string, any>>({});
  const [nodeName, setNodeName] = React.useState('');
  const [nodeDescription, setNodeDescription] = React.useState('');
  const [fieldOptions, setFieldOptions] = React.useState<SettingsField[]>([]);
  const [readmeModalOpen, setReadmeModalOpen] = React.useState(false);

  // Reset settings when node changes
  React.useEffect(() => {
    if (node && node.data) {
      let initialSettings: Record<string, any> = {
        ...(node.data.settings || {}),
      };
      
      // Get the node definition from registry to check for custom initialization handlers
      const nodeType = node.type || '';
      
      if (nodeType) {
        const nodeDefinition = getNode(nodeType);
        
        // Check if the node has custom initialization handlers
        if (nodeDefinition?.metadata?.handlers?.initializeSettings) {
          try {
            // Use the custom handler to initialize settings
            const customSettings = nodeDefinition.metadata.handlers.initializeSettings(node.data);
            if (customSettings) {
              initialSettings = customSettings;
              console.log(`Used custom handler to initialize settings for ${nodeType}`);
            }
          } catch (error) {
            console.error(`Error using custom handler for ${nodeType}:`, error);
          }
        }
        // No else clause needed - individual node handlers now handle specialized initialization
      }
      
      // Set the initial settings
      setSettings(initialSettings);
      setNodeName(node.data.label || '');
      setNodeDescription(node.data.description || '');
      
      // Initialize field options based on node type
      setFieldOptions(getFieldsForNodeType(node.type));
      
      console.log(`Initialized settings for node ${node.id} (${node.type}):`, initialSettings);
    } else {
      setSettings({});
      setNodeName('');
      setNodeDescription('');
      setFieldOptions([]);
    }
  }, [node]);
  
  // Generic loading state for field options
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Generic effect to load field options using the node's loadFieldOptions handler
  useEffect(() => {
    // Only run if we have a node, the drawer is open, and we have initial fields to work with
    if (!node || !isOpen || !fieldOptions.length) return;

    const loadOptions = async () => {
      const nodeType = node.type || '';
      if (!nodeType) return;

      // Get the node definition to access its handlers
      const nodeDefinition = getNode(nodeType);
      
      // Check if the node has a loadFieldOptions handler 
      const handlers = nodeDefinition?.metadata?.handlers as any;
      if (handlers && typeof handlers.loadFieldOptions === 'function') {
        try {
          setLoadingOptions(true);
          console.log(`Loading field options for ${nodeType} using handler...`);
          
          // Call the handler to load options
          const updatedFields = await handlers.loadFieldOptions(fieldOptions);
          
          // Update field options with the result
          if (updatedFields && Array.isArray(updatedFields)) {
            console.log(`Field options loaded for ${nodeType}:`, updatedFields);
            setFieldOptions(updatedFields);
          }
        } catch (error) {
          console.error(`Error loading field options for ${nodeType}:`, error);
        } finally {
          setLoadingOptions(false);
        }
      }
    };
    
    // Execute the async function
    loadOptions();
  }, [node, isOpen, fieldOptions.length]);
  
  // Get node data requirements if this node type has any
  const getNodeDataRequirements = () => {
    if (!node || !node.type) return null;
    
    const nodeDefinition = getNode(node.type);
    const handlers = nodeDefinition?.metadata?.handlers;
    
    if (handlers && typeof handlers.getDataRequirements === 'function') {
      try {
        return handlers.getDataRequirements();
      } catch (error) {
        console.error(`Error getting data requirements for ${node.type}:`, error);
      }
    }
    
    return null;
  };
  
  // Get data requirements for the current node
  const dataRequirements = getNodeDataRequirements();
  
  // Fetch workflows if required by this node
  const { data: workflows } = useWorkflows(
    isOpen && Boolean(dataRequirements?.requiresWorkflows)
  );
  
  // Fetch agents if required by this node  
  const { data: agents } = useAgents(
    isOpen && Boolean(dataRequirements?.requiresAgents)
  );
  
  // Update field options when related data is loaded
  useEffect(() => {
    if (!node || !isOpen || !fieldOptions.length) return;
    
    // Check if we have workflow data and the node requires it
    if (dataRequirements?.requiresWorkflows && workflows && workflows.length > 0) {
      console.log(`Updating workflow options for ${node.type}:`, workflows);
      
      // Format workflows as dropdown options
      const workflowOptions = formatWorkflowOptions(workflows);
      
      // Get a fresh copy of the fields
      const updatedFields = [...fieldOptions];
      
      // Find fields that might need workflow options (by convention, these usually have 'workflow' in their ID)
      updatedFields.forEach(field => {
        // Look for workflowId field or any field that might need workflow data
        if (field.id === 'workflowId' || field.key === 'workflowId') {
          field.options = workflowOptions;
          console.log(`Updated ${field.id} with workflow options`);
        }
      });
      
      // Update field options to trigger re-render
      setFieldOptions([...updatedFields]);
    }
    
    // Check if we have agent data and the node requires it
    if (dataRequirements?.requiresAgents && agents && agents.length > 0) {
      console.log(`Updating agent options for ${node.type}:`, agents);
      
      // Format agents as dropdown options
      const agentOptions = formatAgentOptions(agents);
      
      // Get a fresh copy of the fields
      const updatedFields = [...fieldOptions];
      
      // Find fields that might need agent options
      updatedFields.forEach(field => {
        // Look for agentId field or any field that might need agent data
        if (field.id === 'agentId' || field.key === 'agentId') {
          field.options = agentOptions;
          console.log(`Updated ${field.id} with agent options`);
        }
      });
      
      // Update field options to trigger re-render
      setFieldOptions([...updatedFields]);
    }
  }, [workflows, agents, node, isOpen, fieldOptions, dataRequirements]);
  
  // Helper function to map field types from node settings to drawer settings format
  const mapFieldType = (type: string): SettingsField['type'] => {
    const typeMap: Record<string, SettingsField['type']> = {
      'text': SettingType.TEXT,
      'textarea': SettingType.TEXTAREA,
      'number': SettingType.NUMBER,
      'select': SettingType.SELECT,
      'checkbox': SettingType.SELECT, // Convert checkbox to select with yes/no options
      'slider': SettingType.NUMBER,   // Convert slider to number input
      'password': SettingType.PASSWORD,
      'json': SettingType.JSON,
      'radio': SettingType.RADIO,
      'multiselect': SettingType.MULTISELECT,
      'workflow_selector': SettingType.WORKFLOW
    };
    
    return typeMap[type] || SettingType.TEXT; // Default to text for unknown types
  };

  // Get fields configuration based on node type
  const getFieldsForNodeType = (type: string | undefined): SettingsField[] => {
    if (!type) return [];
    
    // First check if the node has its own settings in its data (legacy nodes)
    if (node?.data?.settings?.fields) {
      // Transform the node's settings to match our SettingsField format
      const nodeSettings = node.data.settings.fields.map((field: any) => ({
        id: field.key,
        label: field.label,
        type: mapFieldType(field.type),
        description: field.description,
        options: field.options,
        min: field.min,
        max: field.max,
        step: field.step,
        defaultValue: field.defaultValue,
        placeholder: field.placeholder
      }));
      
      // Return the node's own settings
      return nodeSettings;
    }
    
    // Get settings from node definition via the unified registry
    const nodeSettings = getNodeSettings(type as string);
    
    if (nodeSettings && nodeSettings.length > 0) {
      console.log(`Found ${nodeSettings.length} settings in node definition for ${type}:`, nodeSettings);
      
      // Transform settings to match SettingsField format
      const transformedSettings = nodeSettings.map((setting: any) => ({
        id: setting.key, // Use key from node definition
        key: setting.key, // Also preserve original key for reference
        label: setting.label,
        type: mapFieldType(setting.type),
        description: setting.description,
        placeholder: setting.placeholder,
        required: setting.required,
        options: setting.options,
        defaultValue: setting.default,
        min: setting.min,
        max: setting.max,
        step: setting.step,
        showWhen: setting.showWhen
      }));
      
      console.log(`Transformed settings for ${type}:`, transformedSettings);
      return transformedSettings;
    }
    
    // Fall back to default settings for internal nodes that don't have definition files yet
    if (type && type.startsWith('internal_') && !hasNode(type)) {
      return [
        {
          id: 'eventType',
          label: 'Event Type',
          type: SettingType.SELECT,
          placeholder: 'Select event type',
          description: 'The type of system event this node responds to.',
          options: [
            { value: 'ui_action', label: 'UI Action' },
            { value: 'system_event', label: 'System Event' },
            { value: 'scheduled', label: 'Scheduled Task' },
            { value: 'manual', label: 'Manual Trigger' }
          ]
        },
        {
          id: 'priority',
          label: 'Priority Level',
          type: SettingType.SELECT,
          placeholder: 'Select priority',
          description: 'Execution priority for this internal operation.',
          options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'critical', label: 'Critical' }
          ]
        },
        {
          id: 'customConfig',
          label: 'Custom Configuration',
          type: SettingType.TEXTAREA,
          placeholder: 'Enter any custom configuration as JSON...',
          description: 'Additional configuration options in JSON format.'
        }
      ];
    }
        
    // Generate basic settings based on node data for any other node type
    const basicSettings: SettingsField[] = [];
    
    // If node has a settingsData object, we'll create dynamic fields based on it
    if (node?.data?.settingsData) {
      // Generate fields from the settingsData object
      Object.entries(node.data.settingsData).forEach(([key, value]) => {
        const valueType = typeof value;
        let fieldType: SettingsField['type'] = SettingType.TEXT;
        
        // Determine field type based on value type
        if (valueType === 'number') {
          fieldType = SettingType.NUMBER;
        } else if (valueType === 'boolean') {
          fieldType = SettingType.SELECT;
        } else if (valueType === 'object') {
          fieldType = SettingType.JSON;
        }
        
        // Create field definition
        // Ensure the value is of a type that can be assigned to defaultValue
        let defaultValue: string | number | boolean | string[] | undefined = undefined;
        
        if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
          defaultValue = value as string | number | boolean;
        } else if (Array.isArray(value)) {
          // Only use string arrays
          const stringArray = value.filter(item => typeof item === 'string') as string[];
          if (stringArray.length > 0) {
            defaultValue = stringArray;
          }
        }
        
        const field: SettingsField = {
          id: key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
          type: fieldType,
          description: `Configure the ${key} setting for this node`,
          defaultValue
        };
        
        // Add options for boolean fields
        if (fieldType === SettingType.SELECT && typeof value === 'boolean') {
          field.options = [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ];
        }
        
        basicSettings.push(field);
      });
    }
    
    // Add a label field for all nodes if one doesn't already exist
    if (!basicSettings.some(f => f.id === 'label')) {
      basicSettings.unshift({
        id: 'label',
        label: 'Node Label',
        type: SettingType.TEXT,
        description: 'The display name for this node',
        defaultValue: node?.data?.label || ''
      });
    }
    
    return basicSettings;
  };

  const handleSettingChange = (fieldId: string, value: any) => {
    // Get node type and check for custom handlers
    const nodeType = node?.type || '';
    if (!nodeType) {
      // If no node type, just update the setting directly
      setSettings({ ...settings, [fieldId]: value });
      return;
    }

    // Try to get node definition with handlers
    const nodeDefinition = getNode(nodeType);
    
    // Check if node has a custom setting change handler
    if (nodeDefinition?.metadata?.handlers?.handleSettingChange) {
      try {
        // Use the custom handler to process the setting change
        const updatedSettings = nodeDefinition.metadata.handlers.handleSettingChange(
          fieldId,
          value, 
          settings
        );
        
        // Update state with the result from the handler
        setSettings(updatedSettings);
        return;
      } catch (error) {
        console.error(`Error using custom setting handler for ${nodeType}:`, error);
        // Fall through to default handling
      }
    }
    
    // Default handling - just update the setting directly
    setSettings({ ...settings, [fieldId]: value });
  };

  const handleSave = () => {
    if (node) {
      try {
        // Create a copy of the current settings
        const updatedSettings = { ...settings };
        
        // Node properties object with label and description
        const nodeProperties = {
          label: nodeName,
          description: nodeDescription
        };
        
        // Get node type and check for custom handlers
        const nodeType = node.type || '';
        if (!nodeType) return;
        const nodeDefinition = getNode(nodeType);
        
        // Check if node has a custom save handler
        if (nodeDefinition?.metadata?.handlers?.prepareSaveData) {
          try {
            // Use custom handler to prepare data for saving
            const customSaveData = nodeDefinition.metadata.handlers.prepareSaveData(
              updatedSettings,
              nodeProperties
            );
            
            console.log(`Used custom handler to prepare save data for ${nodeType}:`, customSaveData);
            
            // Update the node with data from custom handler
            onSettingsChange(node.id, customSaveData);
            onClose();
            return;
          } catch (error) {
            console.error(`Error using custom save handler for ${nodeType}:`, error);
            // Continue with default handling below
          }
        }
        
        // Default handling for all nodes (fallback)
        const nodeUpdates: Record<string, any> = {
          ...updatedSettings,
          nodeProperties
        };
        
        // Update the node with all changes
        onSettingsChange(node.id, nodeUpdates);
        onClose();
      } catch (error) {
        console.error("Error saving node settings:", error);
        // Could add a toast here to show the error
      }
    }
  };

  // When Sheet close button is clicked, call onClose
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Only call onClose directly - no setTimeout to avoid DOM manipulation issues
      onClose();
    }
  };

  // Handler for opening the README documentation modal
  const openReadmeModal = () => {
    setReadmeModalOpen(true);
  };

  // Handler for closing the README documentation modal
  const closeReadmeModal = () => {
    setReadmeModalOpen(false);
  };

  // Check if node is null to avoid rendering with invalid data
  if (!node) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <div className="p-6 pb-1">
          <SheetHeader className="p-0">
            <SheetTitle>Node Configuration <span className="text-sm text-muted-foreground">({node.type})</span></SheetTitle>
            <SheetDescription>
              Configure the properties and variables for this node.
            </SheetDescription>
          </SheetHeader>
          <Button 
            variant="link" 
            className="mt-2 p-0 h-auto text-sm text-muted-foreground hover:text-primary"
            onClick={openReadmeModal}
          >
            <BookOpen className="h-4 w-4 mr-1 inline" />
            Technical Readme
          </Button>
        </div>
        
        {/* README Modal */}
        <NodeReadmeModal 
          isOpen={readmeModalOpen}
          onClose={closeReadmeModal}
          nodeType={node?.type || null}
        />
        
        {/* Tabs */}
        <div className="bg-muted/50 p-1 mx-6 rounded-lg mb-4 flex">
          <button
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md",
              activeTab === 'properties' ? "bg-background border border-border shadow-sm" : "hover:bg-background/50"
            )}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          <button
            className={cn(
              "flex-1 px-3 py-2 text-sm font-medium rounded-md",
              activeTab === 'settings' ? "bg-background border border-border shadow-sm" : "hover:bg-background/50"
            )}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        <ScrollArea className="px-6 flex-grow overflow-auto">
          {activeTab === 'properties' && (
            <div className="space-y-4 pb-6">
              <div>
                <Label htmlFor="node-name">Node Label</Label>
                <Input
                  id="node-name"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="Enter a name for this node"
                />
              </div>
              
              <div>
                <Label htmlFor="node-description">Description</Label>
                <Textarea
                  id="node-description"
                  value={nodeDescription}
                  onChange={(e) => setNodeDescription(e.target.value)}
                  placeholder="Optional description"
                  className="min-h-[80px]"
                />
              </div>
              
              {/* Show the node type */}
              <div>
                <Label>Type</Label>
                <div className="text-sm p-2 bg-muted rounded-md">{node.type}</div>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="pb-6">
              {/* Show loading indicator when options are being loaded */}
              {loadingOptions && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading options...</span>
                </div>
              )}
              
              {fieldOptions.length > 0 ? (
                <div className="space-y-4 pb-6">
                  {fieldOptions.map((field) => {
                    // Check if this field should be shown based on the showWhen condition
                    if (field.showWhen && !field.showWhen(settings)) {
                      return null;
                    }
                    
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        
                        {field.type === 'password' ? (
                          <Input
                            id={field.id}
                            type="password"
                            placeholder={field.placeholder}
                            value={settings[field.id] || ''}
                            onChange={(e) => handleSettingChange(field.id, e.target.value)}
                          />
                        ) : field.type === 'select' && field.options ? (
                          <Select 
                            value={settings[field.id] || ''} 
                            onValueChange={(value) => handleSettingChange(field.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder || "Select an option"} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            id={field.id}
                            placeholder={field.placeholder}
                            value={settings[field.id] || ''}
                            onChange={(e) => handleSettingChange(field.id, e.target.value)}
                            className="min-h-[100px] font-mono text-xs"
                          />
                        ) : field.type === 'radio' && field.options ? (
                          <RadioGroup
                            value={settings[field.id] || ''}
                            onValueChange={(value) => handleSettingChange(field.id, value)}
                          >
                            <div className="space-y-2">
                              {field.options.map((option) => (
                                <div key={option.value} className="flex items-center">
                                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                                  <Label htmlFor={`${field.id}-${option.value}`} className="pl-2 cursor-pointer">
                                    {option.label}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        ) : field.type === 'number' ? (
                          <Input
                            id={field.id}
                            type="number"
                            placeholder={field.placeholder}
                            value={settings[field.id] || ''}
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            onChange={(e) => handleSettingChange(field.id, e.target.value ? Number(e.target.value) : '')}
                          />
                        ) : (
                          <Input
                            id={field.id}
                            placeholder={field.placeholder}
                            value={settings[field.id] || ''}
                            onChange={(e) => handleSettingChange(field.id, e.target.value)}
                          />
                        )}
                        
                        {field.description && (
                          <p className="text-xs text-muted-foreground">
                            {field.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No configurable settings for this node type.
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-6 pt-2 border-t mt-auto">
          <div className="flex justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
            >
              <Save className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NodeSettingsDrawer;