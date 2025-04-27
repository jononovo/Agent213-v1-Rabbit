import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, { 
  ReactFlowProvider, 
  Background, 
  Controls, 
  Node, 
  Edge, 
  Connection, 
  addEdge, 
  useNodesState,
  useEdgesState,
  NodeTypes,
  MarkerType,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Workflow } from '@shared/schema';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import NodesPanel from './NodesPanel';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Save, Play, Settings, TestTube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MonkeyAgentChatOverlay from '@/components/workflows/MonkeyAgentChatOverlay';
import NodeSettingsDrawer from './NodeSettingsDrawer';

// Import loading placeholder node
import LoadingNode from '../flow/nodes/LoadingNode';
// Import base node component as the fallback
import BaseNode from '../../nodes/Base';
// Import the nodeRegistry for automatic node discovery
import { getAllNodeTypes, getNodeUIPath, getNodeInfo, hasNodeType } from '@/lib/nodeRegistry';

// Define a dynamic import function for node components that uses the registry
const loadNodeComponent = (nodeType: string) => {
  try {
    // Check if the node type exists in the registry
    if (hasNodeType(nodeType)) {
      // Get the path from the registry
      const uiPath = getNodeUIPath(nodeType);
      
      // Import the component from the appropriate path
      return import(/* @vite-ignore */ uiPath)
        .then(module => module.component || module.default)
        .catch(error => {
          console.warn(`Failed to load component for ${nodeType} from registry path:`, error);
          return BaseNode;
        });
    }
    
    // Fallback to legacy path resolution if not in registry
    console.log(`Node ${nodeType} not found in registry, using legacy path resolution`);
    
    // First try loading from the Custom directory
    return import(/* @vite-ignore */ `../../nodes/Custom/${nodeType}/ui`)
      .then(module => module.component || module.default)
      .catch(customError => {
        console.log(`Node ${nodeType} not found in Custom directory, trying System directory`);
        
        // If not found in Custom directory, try the System directory
        return import(/* @vite-ignore */ `../../nodes/System/${nodeType}/ui`)
          .then(module => module.component || module.default)
          .catch(systemError => {
            console.log(`Node ${nodeType} not found in System directory, trying root path`);
            
            // Finally try the root directory as a fallback
            return import(/* @vite-ignore */ `../../nodes/${nodeType}/ui`)
              .then(module => module.component || module.default)
              .catch(rootError => {
                console.warn(`Failed to load component for node type ${nodeType}:`, rootError);
                return BaseNode;
              });
          });
      });
  } catch (error) {
    console.warn(`Error importing component for node type ${nodeType}:`, error);
    return Promise.resolve(BaseNode);
  }
};

// Map to store loaded components - will be filled lazily
const loadedComponents: Record<string, any> = {};

// Function to get a node component, loading it if needed
const getNodeComponent = async (nodeType: string) => {
  // If already loaded, return from cache
  if (loadedComponents[nodeType]) {
    return loadedComponents[nodeType];
  }
  
  try {
    // Load the component
    const component = await loadNodeComponent(nodeType);
    // Cache it for future use
    loadedComponents[nodeType] = component;
    return component;
  } catch (error) {
    console.warn(`Failed to load component for ${nodeType}:`, error);
    return BaseNode;
  }
};

// Create initial nodeTypes with fallbacks - uses registry to discover all nodes
const createNodeTypes = () => {
  const baseNodeTypes: NodeTypes = {
    // Special loading node type
    loading: LoadingNode,
  };
  
  // Add all nodes from registry with BaseNode as fallback
  getAllNodeTypes().forEach(nodeInfo => {
    baseNodeTypes[nodeInfo.id] = BaseNode;
  });
  
  // Add some additional legacy types for backward compatibility
  const legacyTypes = [
    'internal_new_agent', 'internal_ai_chat_agent', 'internal',
    'custom', 'trigger', 'processor', 'output', 'textInput',
    'webhook', 'scheduler', 'email_trigger', 'email_send',
    'database_query', 'filter', 'text_prompt', 'visualize_text',
    'transform', 'chat_interface', 'generate_text', 'prompt_crafter',
    'valid_response', 'perplexity', 'agent_trigger', 'embed_other_workflow',
    'response_message', 'api_response_message', 'generateText',
    'visualizeText', 'routing', 'promptCrafter', 'validResponse'
  ];
  
  // Add any legacy types not already in the registry
  legacyTypes.forEach(type => {
    if (!baseNodeTypes[type]) {
      baseNodeTypes[type] = BaseNode;
    }
  });
  
  console.log(`Initialized node types with ${Object.keys(baseNodeTypes).length} entries`);
  return baseNodeTypes;
};

// Create initial nodeTypes with fallbacks
const nodeTypes: NodeTypes = createNodeTypes();

interface FlowEditorProps {
  workflow?: Workflow;
  isNew?: boolean;
  onWorkflowUpdate?: (workflowId: number) => void;
  showAIChat?: boolean; // Control whether to show the AI chat interface initially
}

const FlowEditor = ({ 
  workflow, 
  isNew = false,
  onWorkflowUpdate,
  showAIChat = false // Default to not showing the AI chat
}: FlowEditorProps) => {
  const [, navigate] = useLocation();
  const [editingName, setEditingName] = useState(isNew);
  const [name, setName] = useState(workflow?.name || 'New Workflow');
  
  // Parse and handle the flow data properly
  // Define a type for the parsed flow data to ensure it has the correct shape
  interface ParsedFlowData {
    nodes: any[];
    edges: any[];
  }
  
  // Initialize with empty arrays
  let parsedFlowData: ParsedFlowData = { nodes: [], edges: [] };
  
  try {
    if (workflow?.flowData) {
      // Handle different data types correctly
      if (typeof workflow.flowData === 'string') {
        const parsed = JSON.parse(workflow.flowData) as any;
        // Ensure the parsed data has the correct shape
        parsedFlowData = {
          nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
          edges: Array.isArray(parsed.edges) ? parsed.edges : []
        };
      } else if (typeof workflow.flowData === 'object' && workflow.flowData !== null) {
        // Ensure the object has the correct shape
        const flowObj = workflow.flowData as any;
        parsedFlowData = {
          nodes: Array.isArray(flowObj.nodes) ? flowObj.nodes : [],
          edges: Array.isArray(flowObj.edges) ? flowObj.edges : []
        };
      }
      
      // Log the workflow data
      console.log("Loaded workflow data:", 
        `Nodes: ${parsedFlowData.nodes.length}, ` +
        `Edges: ${parsedFlowData.edges.length}`
      );
      
      // If we have nodes, log one for debugging
      if (parsedFlowData.nodes.length > 0) {
        console.log("Sample node:", JSON.stringify(parsedFlowData.nodes[0]).substring(0, 200) + "...");
      }
      
      // Process nodes to ensure they have all required properties
      parsedFlowData.nodes = parsedFlowData.nodes.map(node => {
        // Make sure the node has a proper position
        if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
          console.log("Fixing position for node:", node.id);
          return {
            ...node,
            position: { x: 100, y: 100 }
          };
        }
        
        // Make sure data property exists
        if (!node.data) {
          console.log("Missing data property for node:", node.id);
          return {
            ...node,
            data: { label: node.id, type: node.type }
          };
        }
        
        return node;
      });
    }
  } catch (error) {
    console.error("Error parsing workflow data:", error);
    // Continue with empty nodes/edges
  }
  
  const initialNodes = parsedFlowData.nodes || [];
  const initialEdges = parsedFlowData.edges || [];
  
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [loadedNodeTypes, setLoadedNodeTypes] = useState<Record<string, boolean>>({});
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // Store loaded components in state 
  const [loadedComponents, setLoadedComponents] = useState<Record<string, any>>({});
  
  // Memoize the dynamic nodeTypes to prevent unnecessary re-renders
  const dynamicNodeTypes = useMemo(() => {
    // Merge the base nodeTypes with any dynamically loaded components
    return { ...nodeTypes, ...loadedComponents };
  }, [loadedComponents]); // Only recalculate when loadedComponents changes
  
  // Helper function to load node components for a specific type
  const loadNodeComponent = async (type: string): Promise<void> => {
    // Skip if this node type is already loaded or being loaded
    if (loadedNodeTypes[type]) return;
    
    console.log(`Loading component for node type: ${type}`);
    
    // Mark as being loaded to prevent duplicate loading attempts
    setLoadedNodeTypes(prev => ({ ...prev, [type]: true }));
    
    try {
      // Try to load the component using the registry first
      if (hasNodeType(type)) {
        const uiPath = getNodeUIPath(type);
        console.log(`Loading node ${type} from registry path: ${uiPath}`);
        
        try {
          // Try to load the component from the registry path
          const module = await import(/* @vite-ignore */ uiPath);
          
          // Check for component or default export
          if (module && (module.component || module.default)) {
            const component = module.component || module.default;
            
            // Update the loadedComponents with the loaded component
            setLoadedComponents((prev: Record<string, any>) => ({
              ...prev,
              [type]: component
            }));
            console.log(`Successfully loaded component for ${type} from registry`);
            return;
          }
        } catch (registryError) {
          console.warn(`Failed to load component for ${type} from registry:`, registryError);
        }
      }
      
      // Fallback to legacy loading approach if registry doesn't work
      console.log(`Falling back to legacy loading for node type: ${type}`);
      
      // First try loading from the Custom directory using index.ts
      try {
        const customIndexModule = await import(/* @vite-ignore */ `../../nodes/Custom/${type}/index`);
        if (customIndexModule && customIndexModule.component) {
          // Update the loadedComponents with the loaded component
          setLoadedComponents((prev: Record<string, any>) => ({
            ...prev,
            [type]: customIndexModule.component
          }));
          console.log(`Successfully loaded component for ${type} from Custom directory (index.ts)`);
          return;
        }
      } catch (customIndexError) {
        // If not found in index.ts, try ui.tsx directly
        try {
          const customModule = await import(/* @vite-ignore */ `../../nodes/Custom/${type}/ui`);
          if (customModule && customModule.default) {
            // Update the loadedComponents with the loaded component
            setLoadedComponents((prev: Record<string, any>) => ({
              ...prev,
              [type]: customModule.default
            }));
            console.log(`Successfully loaded component for ${type} from Custom directory (ui.tsx)`);
            return;
          }
        } catch (customUiError) {
          // If not in Custom directory, try the System directory
          console.log(`Node ${type} not found in Custom directory, trying System directory`);
        }
      }
      
      // Try the System directory using index.ts
      try {
        const systemIndexModule = await import(/* @vite-ignore */ `../../nodes/System/${type}/index`);
        if (systemIndexModule && systemIndexModule.component) {
          // Update the loadedComponents with the loaded component
          setLoadedComponents((prev: Record<string, any>) => ({
            ...prev,
            [type]: systemIndexModule.component
          }));
          console.log(`Successfully loaded component for ${type} from System directory (index.ts)`);
          return;
        }
      } catch (systemIndexError) {
        // If not found in index.ts, try ui.tsx directly
        try {
          const systemModule = await import(/* @vite-ignore */ `../../nodes/System/${type}/ui`);
          if (systemModule && systemModule.default) {
            // Update the loadedComponents with the loaded component
            setLoadedComponents((prev: Record<string, any>) => ({
              ...prev,
              [type]: systemModule.default
            }));
            console.log(`Successfully loaded component for ${type} from System directory (ui.tsx)`);
            return;
          }
        } catch (systemError) {
          // If not in System directory, try the root directory
          console.log(`Node ${type} not found in System directory, trying root path`);
        }
      }
      
      // Try the standard directory as fallback
      try {
        const module = await import(/* @vite-ignore */ `../../nodes/${type}/ui`);
        
        if (module && (module.component || module.default)) {
          // Update the loadedComponents with the loaded component
          setLoadedComponents((prev: Record<string, any>) => ({
            ...prev,
            [type]: module.component || module.default
          }));
          console.log(`Successfully loaded component for ${type} from root directory`);
        }
      } catch (rootError) {
        console.warn(`Failed to load component from root directory for ${type}:`, rootError);
      }
    } catch (error) {
      console.warn(`Failed to load component for ${type}:`, error);
      // Even if loading fails, mark as attempted to prevent continuous retries
    }
  };
  
  // Load node components for all node types in the current workflow
  useEffect(() => {
    if (initialNodes.length > 0) {
      console.log("Loading components for initial nodes in workflow");
      
      // Get unique node types
      const uniqueTypes = Array.from(new Set(initialNodes.map(node => node.type)));
      
      // Load components for each unique type
      uniqueTypes.forEach(type => {
        if (type) loadNodeComponent(type);
      });
    }
  }, [initialNodes]);

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string, data: { nodes: Node[], edges: Edge[] } }) => {
      // Create a clean version of nodes without circular references
      const cleanNodes = data.data.nodes.map(node => {
        if (!node || typeof node !== 'object') {
          return node; // Return as is if not an object
        }
        return {
          ...(node as object),
          // Don't include any functions or circular references
          data: node.data ? {
            ...(node.data as object),
            // Remove any potentially circular references or functions
            _reactFlow_edge: undefined,
            _reactFlow_node: undefined
          } : {}
        };
      });
      
      // Create a clean version of edges
      const cleanEdges = data.data.edges.map(edge => {
        if (!edge || typeof edge !== 'object') {
          return edge; // Return as is if not an object
        }
        
        // Create a simpler edge object with only the essential properties
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          // Create a new style object if it exists
          style: edge.style ? { 
            strokeWidth: edge.style.strokeWidth,
            stroke: edge.style.stroke
          } : undefined,
          // Create a simple markerEnd reference if it exists
          markerEnd: edge.markerEnd ? edge.markerEnd.toString() : undefined
        };
      });
      
      // Create the JSON string with clean data
      const flowDataJson = JSON.stringify({
        nodes: cleanNodes,
        edges: cleanEdges
      });
      
      console.log("Saving workflow with flowData:", flowDataJson.slice(0, 100) + "...");
      
      if (isNew) {
        const postData = {
          name: data.name,
          type: 'custom',
          description: 'Custom workflow',
          icon: 'flow-chart',
          flowData: flowDataJson
        };
        
        return apiRequest(
          'POST',
          '/api/workflows',
          postData
        );
      } else {
        const patchData = {
          name: data.name,
          flowData: flowDataJson
        };
        
        return apiRequest(
          'PATCH',
          `/api/workflows/${workflow?.id}`,
          patchData
        );
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Workflow Saved",
        description: "Your workflow has been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      if (isNew) {
        navigate('/');
      }
    },
    onError: (error) => {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error Saving Workflow",
        description: "There was a problem saving your workflow. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  
  // Add onSettingsClick to node data for generate_text nodes
  useEffect(() => {
    setNodes(nodes => nodes.map(node => {
      if (node.type === 'generate_text') {
        return {
          ...node,
          data: {
            ...node.data,
            onSettingsClick: () => {
              setSelectedNode(node);
              setSettingsDrawerOpen(true);
            }
          }
        };
      }
      return node;
    }));
  }, []);
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({
      ...connection,
      // Use the MarkerType enum directly which is allowed
      markerEnd: MarkerType.ArrowClosed,
      style: {
        strokeWidth: 2
      }
    }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow/data'));

      // Check if the dropped element is valid
      if (!type || !nodeData) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Generate a unique ID for the new node
      const nodeId = `${type}-${Date.now()}`;
      
      // Add onSettingsClick to all node types
      const nodeDataWithHandlers = {
        ...nodeData,
        // Add settings click handler for all nodes, allowing node-specific customization
        onSettingsClick: () => {
          // Instead of trying to find the node by ID, dispatch an event that will be handled globally
          const event = new CustomEvent('node-settings-open', { 
            detail: { nodeId }
          });
          window.dispatchEvent(event);
        }
      };

      // Add a temporary loading node first
      const tempNodeId = `loading-${nodeId}`;
      const tempNode = {
        id: tempNodeId,
        type: 'loading', // Special type that will use our loading component
        position,
        data: {
          label: nodeData.label || type,
          description: nodeData.description || 'Loading...',
          icon: nodeData.icon || 'loader',
          actualType: type, // Store the actual node type for later
          actualData: nodeDataWithHandlers // Store the actual node data for later
        },
      };
      
      // Add the loading node to the canvas
      setNodes((nds) => nds.concat(tempNode));
      
      // Dynamically load the component for this node type if not already loaded
      if (type && !loadedNodeTypes[type]) {
        console.log(`Node dropped - dynamically loading component for type: ${type}`);
        await loadNodeComponent(type);
      }
      
      // Now that the component is loaded (or was already loaded),
      // replace the loading node with the actual node
      setNodes((nds) => {
        // Find and remove the loading node
        const updatedNodes = nds.filter(node => node.id !== tempNodeId);
        
        // Create the actual node
        const actualNode = {
          id: nodeId,
          type,
          position,
          data: nodeDataWithHandlers,
        };
        
        // Add the actual node
        return updatedNodes.concat(actualNode);
      });
    },
    [reactFlowInstance, setNodes, loadedNodeTypes, loadNodeComponent]
  );

  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleSave = () => {
    saveMutation.mutate({
      name,
      data: {
        nodes,
        edges
      }
    });
  };
  
  // Custom handler for node settings open via button clicks inside nodes
  useEffect(() => {
    // Handler for note updates
    const handleNodeNoteUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId) {
        const { nodeId, note, showNote } = event.detail;
        
        console.log('Handling note update for node:', nodeId, 'Setting note:', note, 'showNote:', showNote);
        
        // Update the nodes state
        setNodes((nds) => 
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...(note !== undefined ? { note } : {}),
                  ...(showNote !== undefined ? { showNote } : {})
                }
              };
            }
            return node;
          })
        );
        
        // Trigger a save after the node has been updated
        setTimeout(() => {
          saveMutation.mutate({
            name,
            data: {
              nodes,
              edges
            }
          });
        }, 500);
      }
    };
    
    const handleNodeSettingsOpen = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId) {
        const nodeId = event.detail.nodeId;
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          console.log('Opening settings for node:', node.id);
          setSelectedNode(node);
          setSettingsDrawerOpen(true);
        }
      }
    };

    const handleAgentTriggerUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId && event.detail.settings) {
        const { nodeId, settings } = event.detail;
        
        // Update the node with the new settings
        setNodes(nds => {
          return nds.map(node => {
            if (node.id === nodeId) {
              // Update node with new settings
              return {
                ...node,
                data: {
                  ...node.data,
                  settings: {
                    ...node.data.settings,
                    ...settings
                  }
                }
              };
            }
            return node;
          });
        });
      }
    };
    
    // Handle node updates from MonkeyAgent
    const handleMonkeyAgentNodeUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId && event.detail.updateData) {
        const { nodeId, updateData } = event.detail;
        
        console.log('MonkeyAgent updating node:', nodeId, updateData);
        
        // Update the node with the new data
        setNodes(nds => {
          return nds.map(node => {
            if (node.id === nodeId) {
              // Create a new node data object with the updates applied
              const newData = { ...node.data };
              
              // Apply each update to the appropriate part of the node data
              Object.entries(updateData).forEach(([key, value]) => {
                if (key === 'settings' && typeof value === 'object') {
                  // For settings, merge with existing settings
                  newData.settings = {
                    ...newData.settings,
                    ...value
                  };
                  
                  // Also check for specific Claude API settings to provide feedback
                  if (node.type === 'claude') {
                    // Log the specific settings being changed to help debug
                    const valueObj = value as Record<string, any>;
                    if (valueObj) {
                      const updatedSettings = Object.keys(valueObj);
                      console.log(`Updating Claude node settings: ${updatedSettings.join(', ')}`);
                    }
                    
                    // For Claude nodes, update the model display if the model is changed
                    const valueObject = value as Record<string, any>;
                    if (valueObject && valueObject.model) {
                      console.log(`Claude model updated to: ${valueObject.model}`);
                    }
                    
                    // For Claude nodes, update system prompt if it's changed
                    if (valueObject && valueObject.systemPrompt) {
                      const promptPrefix = valueObject.systemPrompt.substring(0, 30);
                      console.log(`System prompt updated to: ${promptPrefix}...`);
                    }
                  }
                } else if (key === 'label') {
                  // Update label
                  newData.label = value;
                  console.log(`Updated label to: ${value}`);
                } else if (key === 'description') {
                  // Update description
                  newData.description = value;
                  console.log(`Updated description to: ${value}`);
                } else if (key === 'content' && node.type === 'text_prompt') {
                  // For text_prompt nodes, update the content
                  newData.content = value;
                  console.log(`Updated content for text_prompt node`);
                } else {
                  // For any other property, just set it directly
                  newData[key] = value;
                  console.log(`Updated ${key} to:`, value);
                }
              });
              
              // Log the updated node data
              console.log('Updated node data:', newData);
              
              // Return a new node with the updated data
              return {
                ...node,
                data: newData
              };
            }
            return node;
          });
        });
        
        // Display a toast to confirm the update
        toast({
          title: "Node Updated",
          description: `Successfully updated node: ${nodeId}`,
        });
        
        // Trigger a save after updating the node
        setTimeout(() => {
          saveMutation.mutate({
            name,
            data: {
              nodes,
              edges
            }
          });
        }, 500);
      }
    };

    const handleEmbedOtherWorkflowUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId && event.detail.settings) {
        const { nodeId, settings } = event.detail;
        
        // Update the node with the new settings (same behavior as agent trigger)
        setNodes(nds => {
          return nds.map(node => {
            if (node.id === nodeId) {
              // Update node with new settings
              return {
                ...node,
                data: {
                  ...node.data,
                  settings: {
                    ...node.data.settings,
                    ...settings
                  }
                }
              };
            }
            return node;
          });
        });
      }
    };
    
    // Handler for node duplicate events with smart positioning
    const handleNodeDuplicate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId) {
        const { nodeId, nodeType, nodeData } = event.detail;
        console.log('Duplicating node with ID:', nodeId);
        
        // Find the original node to get its position and data
        const sourceNode = nodes.find(node => node.id === nodeId);
        
        if (sourceNode) {
          // Generate a new unique ID for the cloned node
          const timestamp = new Date().getTime();
          const newNodeId = `${nodeType}-${timestamp}`;
          
          // Determine smart positioning - place the new node to the right of the original
          // with a slight downward offset to make it visually distinct
          const offset = { x: 250, y: 50 };
          const newPosition = {
            x: sourceNode.position.x + offset.x,
            y: sourceNode.position.y + offset.y
          };
          
          // Create a deep copy of the node data without circular references
          // Extract only the properties we need instead of using JSON.stringify
          const newNodeData = {
            // Basic properties
            label: `${nodeData.label} (Copy)`,
            description: nodeData.description,
            category: nodeData.category,
            icon: nodeData.icon,
            type: nodeData.type,
            // Settings-related properties - carefully clone only what's needed
            settings: nodeData.settings ? { ...nodeData.settings } : {},
            settingsData: nodeData.settingsData ? { ...nodeData.settingsData } : {},
            // Any other specific data the node might have
            defaultData: nodeData.defaultData ? { ...nodeData.defaultData } : {},
            textContent: nodeData.textContent,
            // State flags - reset these for the new node
            isProcessing: false,
            isComplete: false,
            hasError: false,
            errorMessage: '',
          };
          
          // Create the new node
          const newNode = {
            id: newNodeId,
            type: nodeType,
            position: newPosition,
            data: newNodeData
          };
          
          // Add the new node to the flow
          setNodes(currentNodes => [...currentNodes, newNode]);
          
          // Make this new node the selected node
          setSelectedNode(newNode);
          
          // Show a success notification
          toast({
            title: "Node Duplicated",
            description: "Node has been cloned successfully with all its settings.",
          });
        }
      }
    };
    
    // Handler for node delete events triggered from nodes
    const handleNodeDelete = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId) {
        const nodeId = event.detail.nodeId;
        console.log('Deleting node with ID:', nodeId);
        
        // Delete the node from the flow
        setNodes(nodes => nodes.filter(node => node.id !== nodeId));
        
        // Also clean up any connected edges
        setEdges(edges => edges.filter(
          edge => edge.source !== nodeId && edge.target !== nodeId
        ));
      }
    };
    
    // Handler for node data update events (used by embed_other_workflow node)
    const handleNodeDataUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.nodeId && event.detail.data) {
        const { nodeId, data: updatedData } = event.detail;
        
        console.log('Node data update for node:', nodeId, updatedData);
        
        // Update the node with the new data
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...updatedData
                }
              };
            }
            return node;
          })
        );
        
        // Save workflow after node data update
        if (saveMutation && saveMutation.mutate) {
          saveMutation.mutate({
            name,
            data: {
              nodes,
              edges
            }
          });
        }
      }
    };

    // Add event listeners for custom events
    window.addEventListener('node-settings-open', handleNodeSettingsOpen as EventListener);
    window.addEventListener('agent-trigger-update', handleAgentTriggerUpdate as EventListener);
    window.addEventListener('embed-other-workflow-update', handleEmbedOtherWorkflowUpdate as EventListener);
    window.addEventListener('monkey-agent-update-node', handleMonkeyAgentNodeUpdate as EventListener);
    window.addEventListener('node-delete', handleNodeDelete as EventListener);
    window.addEventListener('node-duplicate', handleNodeDuplicate as EventListener);
    window.addEventListener('node-note-update', handleNodeNoteUpdate as EventListener);
    window.addEventListener('node-data-update', handleNodeDataUpdate as EventListener);
    
    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('node-settings-open', handleNodeSettingsOpen as EventListener);
      window.removeEventListener('agent-trigger-update', handleAgentTriggerUpdate as EventListener);
      window.removeEventListener('embed-other-workflow-update', handleEmbedOtherWorkflowUpdate as EventListener);
      window.removeEventListener('monkey-agent-update-node', handleMonkeyAgentNodeUpdate as EventListener);
      window.removeEventListener('node-delete', handleNodeDelete as EventListener);
      window.removeEventListener('node-duplicate', handleNodeDuplicate as EventListener);
      window.removeEventListener('node-note-update', handleNodeNoteUpdate as EventListener);
      window.removeEventListener('node-data-update', handleNodeDataUpdate as EventListener);
    };
  }, [nodes, setNodes, setSelectedNode, setSettingsDrawerOpen, name, edges, saveMutation, toast]);
  
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    // Don't automatically open settings for most node types
    // Only specific nodes should open settings when their main body is clicked
    if (
      (node.type && node.type.startsWith('internal_')) 
      // Removed agent_trigger from here to allow dropdown interaction
    ) {
      console.log('Node clicked that supports settings:', node.type, node.data);
      
      // Open settings drawer for supported nodes
      setSelectedNode(node);
      setSettingsDrawerOpen(true);
    }
    // For other node types, we'll handle settings opening
    // via the button click in the node component itself
  };
  
  const handleSettingsChange = (nodeId: string, settingsData: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Extract nodeProperties if they exist
          const { nodeProperties, ...otherSettings } = settingsData;
          
          // Create updated node with new settings and properties
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              settings: otherSettings,
              // For function_node, add settings to settingsData for proper display in UI
              settingsData: node.type === 'function_node' ? { 
                ...node.data.settingsData,
                ...otherSettings 
              } : node.data.settingsData,
            },
          };
          
          // If nodeProperties exist, update the label and description
          if (nodeProperties) {
            if (nodeProperties.label) {
              updatedNode.data.label = nodeProperties.label;
            }
            if (nodeProperties.description) {
              updatedNode.data.description = nodeProperties.description;
            }
          }
          
          // Special handling for function_node code field to ensure it's visible in the UI
          if (node.type === 'function_node' && otherSettings.code) {
            // Add code directly to the data object as well for UI display
            updatedNode.data.code = otherSettings.code;
          }
          
          return updatedNode;
        }
        return node;
      })
    );
    
    toast({
      title: "Node Updated",
      description: "Node configuration has been updated successfully.",
    });
  };
  
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    
    try {
      // Ensure all node components are loaded before running
      const nodeTypes = Array.from(new Set(nodes.map(node => node.type)));
      
      // Load UI components if not already loaded (runs in parallel)
      const loadComponentPromises = nodeTypes.map(type => {
        if (type && !loadedNodeTypes[type]) {
          return loadNodeComponent(type);
        }
        return Promise.resolve();
      });
      
      // Wait for all UI components to load
      await Promise.all(loadComponentPromises);
      
      // Import the enhanced workflow engine
      const { executeEnhancedWorkflow, registerAllEnhancedNodeExecutors } = await import('@/lib/enhancedWorkflowEngine');
      
      // Register all enhanced node executors, which includes legacy node compatibility
      await registerAllEnhancedNodeExecutors();
      
      // Show all nodes as processing - using type assertion to satisfy TypeScript
      setNodes(nodes.map(node => {
        return {
          ...node,
          data: {
            ...node.data,
            _isProcessing: true
          }
        };
      }) as Node[]);
      
      // Convert ReactFlow nodes/edges to workflow format
      const workflowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type || 'unknown',
          data: { ...node.data },
          position: node.position
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ? edge.sourceHandle : undefined,
          targetHandle: edge.targetHandle ? edge.targetHandle : undefined
        }))
      };
      
      // Execute the enhanced workflow with new data format
      await executeEnhancedWorkflow(
        workflowData,
        // Node state change handler
        (nodeId, nodeState) => {
          const updatedNodes = nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  _isProcessing: nodeState.status === 'running',
                  _isComplete: nodeState.status === 'completed',
                  _hasError: nodeState.status === 'error',
                  _errorMessage: nodeState.error,
                  _searchResult: nodeState.output?.items?.[0]?.json, // Store result in node data
                  textContent: nodeState.output?.items?.[0]?.json,   // Update text content for visualization nodes
                }
              };
            }
            return node;
          });
          setNodes(updatedNodes as Node[]);
        },
        // Workflow completion handler
        (finalState) => {
          // Check if there were any errors
          const hasErrors = Object.values(finalState.nodeStates).some(
            state => state.status === 'error'
          );
          
          if (hasErrors || finalState.status === 'error') {
            toast({
              title: "Workflow Execution",
              description: finalState.error || "Workflow completed with errors. Check node states for details.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Workflow Execution",
              description: "Workflow ran successfully!",
            });
          }
          
          // Measure execution time
          const duration = finalState.endTime && finalState.startTime
            ? (finalState.endTime.getTime() - finalState.startTime.getTime()) / 1000
            : null;
            
          console.log(`Workflow execution completed in ${duration}s with status: ${finalState.status}`);
          
          // Display the final workflow output if available
          if (finalState.output) {
            console.log('Workflow final output:', finalState.output);
          }
        }
      );
    } catch (error) {
      console.error('Error executing workflow:', error);
      toast({
        title: "Workflow Execution Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Handler for when a workflow is generated by the chat
  const handleWorkflowGenerated = (workflowId: number) => {
    // If we're already on this workflow ID, simply update our nodes and edges
    if (workflow?.id === workflowId) {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', workflowId] });
      
      // Call the parent's update handler if provided
      if (onWorkflowUpdate) {
        onWorkflowUpdate(workflowId);
      }
    } else {
      // If we're on a different workflow, navigate to the new one
      navigate(`/workflow-editor/${workflowId}`);
    }
  };

  return (
    <div className="flex h-screen relative">
      <div className="w-64 bg-gray-50 border-r flex flex-col h-full overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mx-4 my-3 flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Builder
          </Button>

          <div className="px-4 flex-shrink-0">
            <NodesPanel />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b p-4 flex justify-between items-center">
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-64"
                placeholder="Workflow name"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => setEditingName(false)}
              >
                Set
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{name}</h1>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setEditingName(true)}
              >
                Edit
              </Button>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleRunWorkflow}
              disabled={isRunning}
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Run
            </Button>
            {workflow?.id && (
              <Button
                onClick={() => navigate(`/workflow-test/${workflow.id}`)}
                variant="outline"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={dynamicNodeTypes}
              onNodeClick={handleNodeClick}
              fitView
              snapToGrid
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
      
      {/* Node Settings Drawer */}
      <NodeSettingsDrawer
        isOpen={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        node={selectedNode}
        onSettingsChange={handleSettingsChange}
      />
      
      {/* Monkey Agent Chat Overlay */}
      <MonkeyAgentChatOverlay 
        onWorkflowGenerated={handleWorkflowGenerated}
        workflow={workflow}
        isNew={isNew}
        initiallyOpen={showAIChat} // Pass the showAIChat prop to control initial visibility
      />
    </div>
  );
};

export default FlowEditor;