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
import { useQuery } from '@tanstack/react-query';
import { Agent } from '@shared/schema';
import { NodeReadmeModal } from '@/nodes/components/base';
// Import from the unified registry
import { getNodeSettings, hasNode, getNodeDefinitionPath, getNode } from '@/nodes/core/registry/unifiedNodeRegistry';

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

interface SettingsField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea' | 'radio' | 'multiselect' | 'json' | 'number';
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | string[] | number | boolean;
  min?: number; // For number fields
  max?: number; // For number fields
  step?: number; // For number fields
  showWhen?: (settings: Record<string, any>) => boolean;
}

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
      const nodeType = node.type;
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
      } else {
        // Fall back to default handling for specific node types
        if (nodeType === 'embed_other_workflow' && node.data.workflowId) {
          initialSettings.workflowId = node.data.workflowId.toString();
        }
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
  
  // Fetch available agents for agent_trigger node
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json() as Promise<Agent[]>;
    },
    // Only fetch when node is agent_trigger and drawer is open
    enabled: isOpen && node?.type === 'agent_trigger'
  });
  
  // Fetch available workflows for embed_other_workflow node
  const { data: workflows } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json();
    },
    // Only fetch when node is embed_other_workflow and drawer is open
    enabled: isOpen && node?.type === 'embed_other_workflow'
  });
  
  // Dynamically update the agent dropdown options when agents are loaded
  useEffect(() => {
    if (node?.type === 'agent_trigger' && agents && agents.length > 0) {
      const agentOptions = agents.map((agent: Agent) => ({
        value: agent.id.toString(),
        label: agent.name
      }));
      
      // Get a fresh copy of the fields based on the node type
      const updatedFields = getFieldsForNodeType(node.type);
      
      // Find the agentId field and update its options
      const agentIdField = updatedFields.find(f => f.id === 'agentId');
      if (agentIdField) {
        agentIdField.options = agentOptions;
        // Update the fieldOptions state to trigger a re-render with the new options
        setFieldOptions([...updatedFields]);
      }
    }
  }, [agents, node]);
  
  // Dynamically update the workflow dropdown options when workflows are loaded
  useEffect(() => {
    if (workflows && workflows.length > 0) {
      const workflowOptions = workflows.map((workflow: any) => ({
        value: workflow.id.toString(),
        label: `${workflow.name} (ID: ${workflow.id})`
      }));
      
      // Handle embed_other_workflow nodes and any node with workflowId in its data
      if (node) {
        // Always get a fresh copy of the fields based on the node type
        const updatedFields = getFieldsForNodeType(node.type);
        
        // Find the workflowId field and update its options
        const workflowIdField = updatedFields.find(f => f.id === 'workflowId');
        if (workflowIdField) {
          workflowIdField.options = workflowOptions;
          // Update the fieldOptions state to trigger a re-render with the new options
          setFieldOptions([...updatedFields]);
        }
        
        // Set the current workflowId value in settings from node.data if it exists
        // This handles both direct workflowId property and nested settings.workflowId
        const nodeWorkflowId = node.data?.workflowId || node.data?.settings?.workflowId;
        if (nodeWorkflowId && !settings.workflowId) {
          console.log(`Setting workflowId in settings: ${nodeWorkflowId}`);
          setSettings(prev => ({
            ...prev,
            workflowId: nodeWorkflowId.toString()
          }));
        }
      }
    }
  }, [workflows, node]);
    
  // Helper function to map field types from node settings to drawer settings format
  const mapFieldType = (type: string): SettingsField['type'] => {
    const typeMap: Record<string, SettingsField['type']> = {
      'text': 'text',
      'textarea': 'textarea',
      'number': 'number',
      'select': 'select',
      'checkbox': 'select', // Convert checkbox to select with yes/no options
      'slider': 'number',   // Convert slider to number input
      'password': 'password',
      'json': 'json',
      'radio': 'radio',
      'multiselect': 'multiselect'
    };
    
    return typeMap[type] || 'text'; // Default to text for unknown types
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
    const nodeSettings = getNodeSettings(type);
    
    if (nodeSettings && nodeSettings.length > 0) {
      console.log(`Found ${nodeSettings.length} settings in node definition for ${type}:`, nodeSettings);
      
      // Transform settings to match SettingsField format
      const transformedSettings = nodeSettings.map((setting: any) => ({
        id: setting.key, // Use key from node definition
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
          type: 'select',
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
          type: 'select',
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
          type: 'textarea',
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
        let fieldType: SettingsField['type'] = 'text';
        
        // Determine field type based on value type
        if (valueType === 'number') {
          fieldType = 'number';
        } else if (valueType === 'boolean') {
          fieldType = 'select';
        } else if (valueType === 'object') {
          fieldType = 'json';
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
        if (fieldType === 'select' && typeof value === 'boolean') {
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
        type: 'text',
        description: 'The display name for this node',
        defaultValue: node?.data?.label || ''
      });
    }
    
    return basicSettings;
  };

  const handleSettingChange = (fieldId: string, value: any) => {
    let updatedSettings = { ...settings, [fieldId]: value };
    
    // Special handling for function node templates
    if (node?.type === 'function_node' && fieldId === 'selectedTemplate' && value) {
      try {
        // Dynamically import the function node definition which contains our templates
        import('@/nodes/categories/System/function_node/definition').then((module) => {
          // Access the template library and type it properly
          const templateLibrary = module.nodeMetadata?.templateLibrary as Record<string, string> || {};
          
          // Get the template code for the selected value
          if (typeof value === 'string' && value in templateLibrary) {
            const templateCode = templateLibrary[value];
            
            // Update the code field with the selected template
            updatedSettings = { 
              ...updatedSettings, 
              code: templateCode 
            };
            setSettings(updatedSettings);
          }
        }).catch(err => {
          console.error('Failed to load function_node templates:', err);
        });
      } catch (error) {
        console.error('Error applying template:', error);
      }
    }
    
    setSettings(updatedSettings);
  };

  const handleSave = () => {
    if (node) {
      // Create a copy of the current settings
      const updatedSettings = { ...settings };
      
      // For embed_other_workflow nodes, we need to make the workflowId directly accessible
      // in the node data as well as in settings
      const nodeUpdates: Record<string, any> = {
        ...updatedSettings,
        nodeProperties: {
          label: nodeName,
          description: nodeDescription
        }
      };
      
      // For embed_other_workflow nodes, add workflowId as a direct property 
      // This is required for the workflow executor
      if (node.type === 'embed_other_workflow' && updatedSettings.workflowId) {
        nodeUpdates.workflowId = updatedSettings.workflowId;
        console.log(`Saving ${node.type} node with workflowId:`, updatedSettings.workflowId);
      }
      
      // Update the node with all changes
      onSettingsChange(node.id, nodeUpdates);
      onClose();
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
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
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
        
        <ScrollArea className="px-6 h-[calc(100vh-220px)]">
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
              {node.type === 'function_node' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for {node.type}
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Configure this node's settings below.
                    </AlertDescription>
                  </Alert>
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
        
        <div className="p-6 pt-2 border-t">
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