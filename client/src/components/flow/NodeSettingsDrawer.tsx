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
import { NodeData } from './NodeItem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Save, X, BookOpen, HelpCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Agent } from '@shared/schema';
import NodeReadmeModal from '@/components/nodes/common/NodeReadmeModal';
import { getNodeDefinitionPath, getNodeSettings } from '@/lib/nodeRegistry';

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
      // Initialize with current settings or defaults, merging direct properties and settings
      const initialSettings: Record<string, any> = {
        ...(node.data.settings || {}),
      };
      
      // Check for direct properties that should be in settings (like workflowId)
      if (node.type === 'embed_other_workflow' && node.data.workflowId) {
        initialSettings.workflowId = node.data.workflowId.toString();
      }
      
      // Handle node-specific initialization here in the future if needed
      // The drawer should not have special cases for specific node types
      
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
    
    // Get settings from node definition via registry
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
    
    // Fall back to type-specific settings for special cases while migrating
    switch (type) {
      
      case 'webhook_response':
        return [
          {
            id: 'url',
            label: 'Webhook URL',
            type: 'text',
            placeholder: 'https://example.com/webhook',
            description: 'URL of the external webhook endpoint',
            required: true
          },
          {
            id: 'method',
            label: 'HTTP Method',
            type: 'select',
            description: 'HTTP method to use for the webhook request',
            options: [
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'PATCH', label: 'PATCH' }
            ],
            defaultValue: 'POST'
          },
          {
            id: 'headers',
            label: 'Custom Headers',
            type: 'json',
            placeholder: '{"Content-Type": "application/json", "Authorization": "Bearer your-token"}',
            description: 'Custom HTTP headers to include in the request (JSON format)'
          },
          {
            id: 'retryCount',
            label: 'Retry Count',
            type: 'number',
            description: 'Number of times to retry if the request fails',
            min: 0,
            max: 10,
            defaultValue: 3
          },
          {
            id: 'retryDelay',
            label: 'Retry Delay (ms)',
            type: 'number',
            description: 'Delay between retry attempts in milliseconds',
            min: 100,
            max: 10000,
            defaultValue: 1000
          },
          {
            id: 'timeout',
            label: 'Timeout (ms)',
            type: 'number',
            description: 'Request timeout in milliseconds',
            min: 100,
            max: 30000,
            defaultValue: 5000
          }
        ];
      case 'perplexity':
      case 'perplexity_api':
        return [
          {
            id: 'apiKey',
            label: 'API Key',
            type: 'password',
            placeholder: 'Enter your Perplexity API key',
            description: 'Your Perplexity API key is securely stored and used only for this node.'
          },
          {
            id: 'model',
            label: 'Model',
            type: 'text',
            description: 'The Perplexity model to use (e.g., llama-3.1-sonar-small-128k-online)',
            placeholder: 'llama-3.1-sonar-small-128k-online'
          },
          {
            id: 'temperature',
            label: 'Temperature',
            type: 'number',
            min: 0,
            max: 1,
            step: 0.1,
            defaultValue: 0.7,
            description: 'Controls randomness. Lower values (0.1) are more deterministic, higher values (1.0) more creative.'
          },
          {
            id: 'maxTokens',
            label: 'Max Tokens',
            type: 'number',
            min: 1,
            max: 4000,
            defaultValue: 1000,
            description: 'Maximum number of tokens to generate.'
          },
          {
            id: 'useSystemPrompt',
            label: 'Use System Prompt',
            type: 'select',
            description: 'Enable system prompt input',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ],
            defaultValue: 'false'
          },
          {
            id: 'systemPrompt',
            label: 'System Prompt',
            type: 'textarea',
            description: 'Instructions for the AI assistant',
            showWhen: (settings) => settings.useSystemPrompt === 'true'
          },
        ];
      case 'claude':
        return [
          {
            id: 'apiKey',
            label: 'API Key',
            type: 'password',
            placeholder: 'Enter your Claude API key',
            description: 'Your Claude API key is securely stored and used only for this node.'
          },
          {
            id: 'model',
            label: 'Model',
            type: 'select',
            placeholder: 'Select Claude model',
            description: 'The Claude AI model to use for text generation.',
            options: [
              { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
              { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
              { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
              { value: 'claude-2.1', label: 'Claude 2.1' },
              { value: 'claude-instant-1.2', label: 'Claude Instant 1.2' }
            ]
          },
          {
            id: 'systemPrompt',
            label: 'System Prompt',
            type: 'textarea',
            placeholder: 'Enter a system prompt to guide Claude...',
            description: 'Initial instructions that prime Claude on how to respond (optional).'
          },
          {
            id: 'temperature',
            label: 'Temperature',
            type: 'text',
            placeholder: '0.7',
            description: 'Controls randomness. Lower values (0.1) are more deterministic, higher values (1.0) more creative.'
          },
          {
            id: 'maxTokens',
            label: 'Max Tokens',
            type: 'text',
            placeholder: '2000',
            description: 'Maximum number of tokens to generate. Higher values allow longer responses.'
          },
        ];
      case 'generate_text':
      case 'generateText':
        return [
          {
            id: 'apiKey',
            label: 'API Key',
            type: 'password',
            placeholder: 'Enter your Claude API key',
            description: 'Your Claude API key is securely stored and used only for this node.'
          },
          {
            id: 'model',
            label: 'Model',
            type: 'text',
            placeholder: 'e.g., claude-3.5-sonnet',
            description: 'The model to use for text generation.'
          },
          {
            id: 'temperature',
            label: 'Temperature',
            type: 'text',
            placeholder: '0.7',
            description: 'Controls randomness. Lower values are more deterministic, higher values more creative.'
          },
          {
            id: 'maxTokens',
            label: 'Max Tokens',
            type: 'text',
            placeholder: '1024',
            description: 'Maximum number of tokens to generate.'
          },
        ];
      case 'internal_new_agent':
        return [
          {
            id: 'agentTemplate',
            label: 'Agent Template',
            type: 'select',
            placeholder: 'Select an agent template',
            description: 'Optional template to use as a base for the new agent.',
            options: [
              { value: 'blank', label: 'Blank Agent' },
              { value: 'customer-support', label: 'Customer Support Agent' },
              { value: 'data-analysis', label: 'Data Analysis Agent' },
              { value: 'content-creation', label: 'Content Creation Agent' }
            ]
          },
          {
            id: 'defaultWorkflow',
            label: 'Default Workflow',
            type: 'select',
            placeholder: 'Create default workflow?',
            description: 'Automatically create a starter workflow for the new agent',
            options: [
              { value: 'none', label: 'No Default Workflow' },
              { value: 'basic-chat', label: 'Basic Chat Workflow' },
              { value: 'data-processing', label: 'Data Processing Workflow' },
              { value: 'custom', label: 'Custom Template' }
            ]
          },
          {
            id: 'autoActivate',
            label: 'Auto-Activate',
            type: 'select',
            placeholder: 'Automatically activate the agent?',
            description: 'Set the agent as active immediately after creation.',
            options: [
              { value: 'true', label: 'Yes - Activate Immediately' },
              { value: 'false', label: 'No - Manual Activation' }
            ]
          },
          {
            id: 'sendWelcomeMessage',
            label: 'Welcome Message',
            type: 'textarea',
            placeholder: 'Enter a welcome message to display when the agent is created...',
            description: 'Optional message to show upon successful agent creation.'
          }
        ];
      case 'internal_ai_chat_agent':
        return [
          {
            id: 'triggerPhrases',
            label: 'Trigger Phrases',
            type: 'textarea',
            placeholder: 'create a new agent, build agent, make an agent...',
            description: 'Comma-separated list of phrases that will trigger this node when detected in chat.'
          },
          {
            id: 'responseTemplate',
            label: 'Response Template',
            type: 'textarea',
            placeholder: 'I\'ll create a new agent called {{name}} for you...',
            description: 'Template for the response when this node is triggered. Use {{variable}} for placeholders.'
          },
          {
            id: 'extractionPrompt',
            label: 'Extraction Prompt',
            type: 'textarea',
            placeholder: 'Extract the name and description for the new agent...',
            description: 'Prompt to extract structured data from the user\'s chat message.'
          }
        ];
      case 'internal_create_agent':
        return [
          {
            id: 'defaultAgentType',
            label: 'Default Agent Type',
            type: 'select',
            placeholder: 'Select default agent type',
            description: 'The type of agent to create if not specified in the input.',
            options: [
              { value: 'custom', label: 'Custom Agent' },
              { value: 'specialized', label: 'Specialized Agent' },
              { value: 'system', label: 'System Agent' }
            ]
          },
          {
            id: 'defaultIcon',
            label: 'Default Icon',
            type: 'text',
            placeholder: 'e.g., brain',
            description: 'Default icon to use if not specified in the input.'
          },
          {
            id: 'notifyOnCreate',
            label: 'Notification',
            type: 'select',
            placeholder: 'Send notification on creation?',
            description: 'Whether to show a notification when the agent is created.',
            options: [
              { value: 'true', label: 'Yes - Show Notification' },
              { value: 'false', label: 'No - Silent Creation' }
            ]
          },
          {
            id: 'logLevel',
            label: 'Logging Level',
            type: 'select',
            placeholder: 'Select logging level',
            description: 'Level of detail for logging agent creation events.',
            options: [
              { value: 'minimal', label: 'Minimal' },
              { value: 'standard', label: 'Standard' },
              { value: 'verbose', label: 'Verbose' }
            ]
          }
        ];
        
      case 'response_message':
        return [
          {
            id: 'successMessage',
            label: 'Success Message',
            type: 'textarea',
            placeholder: 'Enter success message...',
            description: 'Message to display when the operation is successful.'
          },
          {
            id: 'errorMessage',
            label: 'Error Message',
            type: 'textarea',
            placeholder: 'Enter error message...',
            description: 'Message to display when there is an error.'
          },
          {
            id: 'conditionField',
            label: 'Condition Field',
            type: 'text',
            placeholder: 'e.g., result, status, success',
            description: 'The input field to check for success/error determination.'
          },
          {
            id: 'successValue',
            label: 'Success Value',
            type: 'text',
            placeholder: 'e.g., success, true, 1',
            description: 'The value that indicates success in the condition field.'
          }
        ];
      
      case 'api_response_message':
        return [
          {
            id: 'successMessage',
            label: 'Success Message',
            type: 'textarea',
            placeholder: 'Enter success message',
            description: 'Message to display when the condition is met (success case). Supports template variables like {{agent.id}}.'
          },
          {
            id: 'errorMessage',
            label: 'Error Message',
            type: 'textarea',
            placeholder: 'Enter error message',
            description: 'Message to display when the condition is not met (error case). Supports template variables like {{agent.id}}.'
          },
          {
            id: 'conditionField',
            label: 'Condition Field',
            type: 'text',
            placeholder: 'e.g., status, success, true',
            description: 'Field in the input data to check for success/failure. Use "true" for always success.'
          },
          {
            id: 'successValue',
            label: 'Success Value',
            type: 'text',
            placeholder: 'e.g., success, true, 1',
            description: 'The value that indicates success in the condition field. Use "true" for always success.'
          },
          {
            id: 'targetEndpoint',
            label: 'Target Endpoint',
            type: 'text',
            placeholder: '/api/chat',
            description: 'API endpoint to send the message to. Default is /api/chat for the chat UI.'
          },
          {
            id: 'formatOutput',
            label: 'Format for Chat UI',
            type: 'radio',
            description: 'Format the output specifically for the chat UI.',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ],
            defaultValue: 'true'
          }
        ];
      case 'agent_trigger':
        return [
          {
            id: 'triggerType',
            label: 'Trigger Type',
            type: 'radio',
            description: 'Choose whether to trigger an agent or a workflow.',
            options: [
              { value: 'agent', label: 'Agent' },
              { value: 'workflow', label: 'Workflow' }
            ],
            defaultValue: 'agent'
          },
          {
            id: 'agentId',
            label: 'Target Agent',
            type: 'select',
            placeholder: 'Select target agent',
            description: 'The agent that will be triggered by this node.',
            options: [], // Will be populated dynamically with available agents
            showWhen: (settings) => !settings.triggerType || settings.triggerType === 'agent'
          },
          {
            id: 'workflowId',
            label: 'Target Workflow',
            type: 'select',
            placeholder: 'Select target workflow',
            description: 'The workflow that will be triggered by this node.',
            options: [], // Will be populated dynamically with available workflows
            showWhen: (settings) => settings.triggerType === 'workflow'
          },
          {
            id: 'promptField',
            label: 'Prompt Field',
            type: 'text',
            placeholder: 'Enter prompt field name',
            description: 'The field from input data to use as the prompt for the agent or workflow.'
          },
          {
            id: 'timeout',
            label: 'Timeout (ms)',
            type: 'text',
            placeholder: '30000',
            description: 'Maximum time in milliseconds to wait for agent response. Default: 30000 (30 seconds)'
          }
        ];
      case 'embed_other_workflow':
        return [
          {
            id: 'workflowId',
            label: 'Target Workflow',
            type: 'select',
            placeholder: 'Select target workflow',
            description: 'The workflow that will be triggered by this node.',
            options: [] // Will be populated dynamically with available workflows
          },
          {
            id: 'inputField',
            label: 'Input Field',
            type: 'text',
            placeholder: 'Enter input field name',
            description: 'The field from input data to use as the input for the workflow.'
          },
          {
            id: 'timeout',
            label: 'Timeout (ms)',
            type: 'text',
            placeholder: '30000',
            description: 'Maximum time in milliseconds to wait for workflow response. Default: 30000 (30 seconds)'
          }
        ];
      case 'function_node':
        return [
          {
            id: 'code',
            label: 'Function Code',
            type: 'textarea',
            placeholder: 'function process(input) {\n  // Your code here\n  return input;\n}',
            description: 'JavaScript function code that processes input data.'
          },
          {
            id: 'selectedTemplate',
            label: 'Function Template',
            type: 'select',
            placeholder: 'Select template',
            description: 'Pre-defined template to use for this function.',
            options: [
              { value: 'basic', label: 'Basic (return input)' },
              { value: 'transform', label: 'Data Transform' },
              { value: 'api', label: 'API Request' },
              { value: 'json', label: 'JSON Processing' },
              { value: 'conditional', label: 'Conditional Logic' }
            ]
          },
          {
            id: 'useAsyncFunction',
            label: 'Async Function',
            type: 'select',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ],
            description: 'Whether to execute the function asynchronously.'
          },
          {
            id: 'timeout',
            label: 'Timeout (ms)',
            type: 'number',
            placeholder: '5000',
            description: 'Maximum execution time in milliseconds.',
            min: 100,
            max: 30000
          },
          {
            id: 'errorHandling',
            label: 'Error Handling',
            type: 'select',
            description: 'How to handle errors in the function.',
            options: [
              { value: 'throw', label: 'Throw error' },
              { value: 'return', label: 'Return error object' },
              { value: 'null', label: 'Return null on error' }
            ]
          },
          {
            id: 'cacheResults',
            label: 'Cache Results',
            type: 'select',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' }
            ],
            description: 'Cache results for identical inputs to improve performance.'
          },
          {
            id: 'executionEnvironment',
            label: 'Execution Environment',
            type: 'select',
            description: 'Where to execute the function.',
            options: [
              { value: 'client', label: 'Client-side' },
              { value: 'server', label: 'Server-side' }
            ]
          }
        ];
      default:
        // For any other node that starts with "internal_"
        if (type && type.startsWith('internal_')) {
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
    }
  };

  if (!node) return null;

  const handleSettingChange = (fieldId: string, value: any) => {
    let updatedSettings = { ...settings, [fieldId]: value };
    
    // Special handling for function node templates
    if (node?.type === 'function_node' && fieldId === 'selectedTemplate' && value) {
      try {
        // Dynamically import the function node definition which contains our templates
        import('@/nodes/System/function_node/definition').then((module) => {
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
              activeTab === 'variables' ? "bg-background border border-border shadow-sm" : "hover:bg-background/50"
            )}
            onClick={() => setActiveTab('variables')}
          >
            Variables
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
        
        <ScrollArea className="px-6 h-[calc(100vh-280px)]">
          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nodeName">Node Name</Label>
                <Input
                  id="nodeName"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  placeholder="Enter node name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nodeDescription">Description</Label>
                <Textarea
                  id="nodeDescription"
                  value={nodeDescription}
                  onChange={(e) => setNodeDescription(e.target.value)}
                  placeholder="Add description to your workflow"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          
          {/* Variables Tab */}
          {activeTab === 'variables' && (
            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                Add Variable
              </Button>
              
              {/* We'll implement variable handling in the future */}
              {!settings.variables || settings.variables?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No variables defined for this node.
                </div>
              ) : null}
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {node.type === 'webhook_trigger' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Webhook Trigger node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node creates a webhook endpoint that can trigger this workflow when called from external systems.
                      Configure the endpoint path, authentication method, and acceptable HTTP methods.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {(node.type === 'webhook_response' || node.type === 'send_to_webhook') && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the {node.type === 'send_to_webhook' ? 'Send to Webhook' : 'Webhook Response'} node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node sends data to an external webhook endpoint when the workflow reaches this point.
                      Configure the destination URL, HTTP method, custom headers, and retry settings.
                      
                      {node.type === 'send_to_webhook' && (
                        <div className="mt-2">
                          <strong>Respond to Original Webhook:</strong> Enable this option to directly respond to the original webhook request 
                          that triggered this workflow, rather than making a new outbound request.
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'perplexity' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Additional settings specific to this node type.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Configure your Perplexity API settings below. An API key is required for actual API requests. 
                      Without an API key, the node will use simulated responses for testing.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'claude' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Claude AI text generation.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Claude is a powerful AI assistant by Anthropic that excels at thoughtful, nuanced responses.
                      Configure your Claude API settings below with your API key from Anthropic's developer portal.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {(node.type === 'generate_text' || node.type === 'generateText') && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Claude AI text generation.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Configure your Claude API settings below. An API key is required for actual AI text generation.
                      Without an API key, the node will use simulated responses for testing purposes.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'api_response_message' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the API Response Message node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node sends direct API messages to the chat UI. You can use template variables like
                      <code className="px-1 mx-1 bg-muted rounded">{'{{agent.id}}'}</code> in your messages,
                      which will be resolved with actual values when executed.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'internal_new_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the New Agent Trigger node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node triggers when a user clicks the "New Agent" button in the UI. 
                      Configure the template settings and default behavior when creating new agents.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'internal_ai_chat_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the AI Chat Agent Trigger node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node triggers when a user asks the chat agent to create a new agent.
                      Configure trigger phrases and response templates to customize how the agent responds.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'internal_create_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Create Agent Action node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node creates a new agent in the system with the specified properties.
                      Configure default settings and notification preferences for agent creation.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'function_node' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Function Node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node allows you to write custom JavaScript functions to transform, process, or enhance your workflow data.
                      Select a template or write your own code. You can enable advanced features like caching, async execution, and custom error handling.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'agent_trigger' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Agent/Embed Other Workflow node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node triggers another agent or workflow from within your workflow. Choose the trigger type, 
                      select the agent or workflow to call, specify which input field to use as the prompt, 
                      and set a timeout if needed.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type === 'embed_other_workflow' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for the Embed Other Workflow node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      This node triggers another workflow from within your current workflow. Select the workflow to call,
                      specify which input field to use as the input data, and set a timeout if needed.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {node.type && node.type.startsWith('internal_') && 
               node.type !== 'internal_new_agent' && 
               node.type !== 'internal_ai_chat_agent' && 
               node.type !== 'internal_create_agent' && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Configure settings for this Internal System node.
                  </p>
                  
                  <Alert className="mt-2">
                    <AlertDescription>
                      Internal nodes connect directly to system functions and events.
                      Configure how this node interacts with internal system components.
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
                        ) : field.type === 'radio' && field.options ? (
                          <RadioGroup
                            value={settings[field.id] || field.defaultValue || ''}
                            onValueChange={(value) => handleSettingChange(field.id, value)}
                            className="flex flex-col space-y-1"
                          >
                            {field.options.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                                <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : field.type === 'textarea' ? (
                          <Textarea
                            id={field.id}
                            placeholder={field.placeholder}
                            value={settings[field.id] || ''}
                            onChange={(e) => handleSettingChange(field.id, e.target.value)}
                            className={`${field.id === 'code' && node.type === 'function_node' 
                              ? 'min-h-[250px] font-mono text-sm bg-slate-100 dark:bg-slate-800' 
                              : 'min-h-[100px]'}`}
                            style={{
                              whiteSpace: field.id === 'code' ? 'pre-wrap' : 'normal',
                              tabSize: 2
                            }}
                          />
                        ) : field.type === 'number' ? (
                          <Input
                            id={field.id}
                            type="number"
                            placeholder={field.placeholder}
                            min={field.min}
                            max={field.max}
                            step={field.step || 1}
                            value={settings[field.id] !== undefined ? settings[field.id] : field.defaultValue || ''}
                            onChange={(e) => handleSettingChange(field.id, field.step ? parseFloat(e.target.value) || 0 : parseInt(e.target.value, 10) || 0)}
                          />
                        ) : field.type === 'json' ? (
                          <Textarea
                            id={field.id}
                            placeholder={field.placeholder}
                            value={typeof settings[field.id] === 'object' 
                              ? JSON.stringify(settings[field.id], null, 2) 
                              : settings[field.id] || ''}
                            onChange={(e) => {
                              try {
                                // Try to parse as JSON if possible
                                const jsonValue = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                                handleSettingChange(field.id, jsonValue);
                              } catch (err) {
                                // Store as string if not valid JSON
                                handleSettingChange(field.id, e.target.value);
                              }
                            }}
                            className="min-h-[120px] font-mono text-sm"
                          />
                        ) : field.type === 'multiselect' && field.options ? (
                          <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background">
                            {field.options.map((option) => {
                              const selectedValues = Array.isArray(settings[field.id]) 
                                ? settings[field.id] 
                                : field.defaultValue || [];
                              const isSelected = selectedValues.includes(option.value);
                              
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  className={`px-3 py-1 text-xs rounded-full ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                                  onClick={() => {
                                    // Ensure we're working with an array
                                    const currentValues = Array.isArray(settings[field.id]) 
                                      ? [...settings[field.id]] 
                                      : Array.isArray(field.defaultValue) 
                                          ? [...field.defaultValue] 
                                          : [];
                                    
                                    // Toggle the value in the array
                                    if (isSelected) {
                                      const newValues = currentValues.filter((v: string) => v !== option.value);
                                      handleSettingChange(field.id, newValues);
                                    } else {
                                      handleSettingChange(field.id, [...currentValues, option.value]);
                                    }
                                  }}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div>
                            <Input
                              id={field.id}
                              type="text"
                              placeholder={field.placeholder}
                              value={settings[field.id] || ''}
                              onChange={(e) => handleSettingChange(field.id, e.target.value)}
                            />
                            {field.id === 'model' && (node.type === 'perplexity' || node.type === 'perplexity_api') && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Recommended models: llama-3.1-sonar-small-128k-online, llama-3.1-sonar-large-128k-online, llama-3.1-sonar-huge-128k-online
                              </p>
                            )}
                            {field.id === 'model' && (node.type === 'claude') && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Claude models: claude-3-sonnet-20240229, claude-3-opus-20240229, claude-3-haiku-20240307
                              </p>
                            )}
                            {field.id === 'model' && (node.type === 'generate_text' || node.type === 'generateText') && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Claude models: claude-3.5-sonnet, claude-3-opus, claude-3-sonnet, claude-3-haiku
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Show description if available */}
                        {field.description && (
                          <p className="text-xs text-muted-foreground">
                            {field.description}
                          </p>
                        )}
                        
                        {/* Add special help text for function code field */}
                        {field.id === 'code' && node.type === 'function_node' && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                            Tip: Your function must include a process(input) method that returns a value
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No settings available for this node type.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <SheetFooter className="px-6 py-4 border-t">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default NodeSettingsDrawer;