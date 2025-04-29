import { useQuery } from '@tanstack/react-query';
import { Agent, Workflow, Node } from '@shared/schema';
import { AgentCard, WorkflowCard, NodeCard } from './Cards';
import Flow from './ui/flow';
import { useBuilderContext } from '@/contexts/BuilderContext';
import { nodeCategories } from '@/lib/data';

const TabContent = () => {
  const { activeTab } = useBuilderContext();

  // Fetch agents data
  const { 
    data: agents = [], 
    isLoading: isLoadingAgents 
  } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json() as Promise<Agent[]>;
    }
  });

  // Fetch workflows data
  const { 
    data: workflows = [], 
    isLoading: isLoadingWorkflows 
  } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json() as Promise<Workflow[]>;
    }
  });

  // Fetch nodes data
  const { 
    data: nodes = [], 
    isLoading: isLoadingNodes 
  } = useQuery({
    queryKey: ['/api/nodes'],
    queryFn: async () => {
      const res = await fetch('/api/nodes');
      if (!res.ok) throw new Error('Failed to fetch nodes');
      return res.json() as Promise<Node[]>;
    }
  });

  // Filter agents by type
  const internalAgents = agents.filter(agent => agent.type === 'internal');
  const customAgents = agents.filter(agent => agent.type === 'custom');
  const templateAgents = [
    {
      id: 101,
      name: "Chatbot Template",
      description: "Multi-purpose chatbot with customizable knowledge base",
      type: "template",
      icon: "comment-dots",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 0,
      configuration: {}
    },
    {
      id: 102,
      name: "Task Manager",
      description: "Automates task creation, assignment, and tracking with reminders",
      type: "template",
      icon: "calendar-check",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 0,
      configuration: {}
    },
    {
      id: 103,
      name: "Content Generator",
      description: "Creates blog posts, social media content, and email newsletters",
      type: "template",
      icon: "newspaper",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 0,
      configuration: {}
    }
  ];

  // Filter workflows by type
  const customWorkflows = workflows.filter(workflow => workflow.type === 'custom');
  const internalWorkflows = workflows.filter(workflow => workflow.type === 'internal' || workflow.type === 'system');
  const templateWorkflows = [
    {
      id: 101,
      name: "Lead Qualification",
      description: "Automates lead scoring, qualification, and follow-up processes",
      type: "template",
      icon: "robot",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 0,
      agentId: 0,
      flowData: {}
    },
    {
      id: 102,
      name: "Alert System",
      description: "Monitors data sources and sends notifications based on custom triggers",
      type: "template",
      icon: "bell",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 0,
      agentId: 0,
      flowData: {}
    },
    {
      id: 103,
      name: "Content Translation",
      description: "Translates and localizes content across multiple languages",
      type: "template",
      icon: "language",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 0,
      agentId: 0,
      flowData: {}
    }
  ];

  if (activeTab === 'agents') {
    return (
      <div>
        {/* Internal Builder Agents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">Internal Builder Agents</h2>
            <button className="text-sm text-primary hover:text-indigo-700 flex items-center space-x-1">
              <span>View All</span>
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingAgents ? (
              // Loading state
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 h-[194px] animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="ml-2 w-24 h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-full h-12 bg-slate-200 rounded mb-3"></div>
                  <div className="flex items-center">
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                    <div className="mx-2">•</div>
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              internalAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))
            )}
          </div>
        </div>
        
        {/* My Agents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">My Agents</h2>
            <button className="text-sm px-3 py-1.5 bg-primary text-white rounded-md hover:bg-indigo-700 flex items-center space-x-1">
              <i className="fas fa-plus text-xs"></i>
              <span>New Agent</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingAgents ? (
              // Loading state
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 h-[194px] animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="ml-2 w-24 h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-full h-12 bg-slate-200 rounded mb-3"></div>
                  <div className="flex items-center">
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                    <div className="mx-2">•</div>
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {customAgents.map(agent => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
                <AgentCard 
                  agent={{} as Agent} 
                  isPlaceholder={true} 
                  onClick={() => console.log('Create new agent')}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Agent Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">Agent Templates</h2>
            <a href="#" className="text-sm text-primary hover:text-indigo-700 flex items-center space-x-1">
              <span>Browse Templates</span>
              <i className="fas fa-chevron-right text-xs"></i>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
        
        {/* Optimization Agents section removed as requested */}
      </div>
    );
  }

  if (activeTab === 'workflows') {
    return (
      <div>
        {/* My Custom Workflows */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">My Custom Workflows</h2>
            <div className="flex space-x-2">
              <a href="/workflow-editor/new?ai=true" className="text-sm px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 flex items-center space-x-1">
                <span className="mr-1">✨</span>
                <span>AI Generator</span>
              </a>
              <a href="/workflow-editor/new" className="text-sm px-3 py-1.5 bg-primary text-white rounded-md hover:bg-indigo-700 flex items-center space-x-1">
                <i className="fas fa-plus text-xs"></i>
                <span>New Workflow</span>
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingWorkflows ? (
              // Loading state
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 h-[194px] animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="ml-2 w-24 h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-full h-12 bg-slate-200 rounded mb-3"></div>
                  <div className="flex items-center">
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                    <div className="mx-2">•</div>
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {customWorkflows.map(workflow => (
                  <WorkflowCard key={workflow.id} workflow={workflow} />
                ))}
                <WorkflowCard 
                  workflow={{} as Workflow} 
                  isPlaceholder={true} 
                  onClick={() => window.location.href = '/workflow-editor/new'}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Internal Workflows */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">Internal Workflows</h2>
            <div className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-full">System Use</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingWorkflows ? (
              // Loading state
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 h-[194px] animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="ml-2 w-24 h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-full h-12 bg-slate-200 rounded mb-3"></div>
                  <div className="flex items-center">
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                    <div className="mx-2">•</div>
                    <div className="w-20 h-3 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              internalWorkflows.map(workflow => (
                <WorkflowCard key={workflow.id} workflow={workflow} />
              ))
            )}
          </div>
        </div>
        
        {/* Workflow Templates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">Workflow Templates</h2>
            <a href="#" className="text-sm text-primary hover:text-indigo-700 flex items-center space-x-1">
              <span>Browse Templates</span>
              <i className="fas fa-chevron-right text-xs"></i>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templateWorkflows.map(workflow => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'nodes') {
    return (
      <div>
        {/* My Custom Nodes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">My Custom Nodes</h2>
            <button className="text-sm px-3 py-1.5 bg-primary text-white rounded-md hover:bg-indigo-700 flex items-center space-x-1">
              <i className="fas fa-plus text-xs"></i>
              <span>New Node</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoadingNodes ? (
              // Loading state
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 h-[140px] animate-pulse">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="ml-2 w-24 h-4 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-full h-8 bg-slate-200 rounded mb-3"></div>
                  <div className="w-20 h-3 bg-slate-200 rounded"></div>
                </div>
              ))
            ) : (
              nodes.map(node => (
                <NodeCard key={node.id} node={node} />
              ))
            )}
          </div>
        </div>
        
        {/* Node Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-slate-900">Node Categories</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nodeCategories.map((category, index) => (
              <NodeCard key={index} node={category} isCategory={true} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TabContent;
