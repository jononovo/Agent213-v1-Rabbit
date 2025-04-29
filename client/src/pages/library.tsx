'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiClient } from '@/lib/apiClient';
import MainContent from '@/components/layout/MainContent';
import Sidebar from '@/components/layout/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  GitBranch,
  Puzzle,
  Pencil,
  Play,
  Copy,
  Trash2,
  MoreVertical,
  Plus,
  Search,
  Filter,
} from 'lucide-react';

// Types based on the DB schema
type Agent = {
  id: number;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type Workflow = {
  id: number;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  agentId: number | null;
};

type Node = {
  id: number;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
};

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const statusStyles = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    draft: 'bg-amber-100 text-amber-800 border-amber-200',
    archived: 'bg-red-100 text-red-800 border-red-200',
    template: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.default;
  
  return (
    <Badge variant="outline" className={style}>
      {status}
    </Badge>
  );
}

// Type badge component
function TypeBadge({ type }: { type: string }) {
  const typeStyles = {
    custom: 'bg-purple-100 text-purple-800 border-purple-200',
    internal: 'bg-blue-100 text-blue-800 border-blue-200',
    template: 'bg-green-100 text-green-800 border-green-200',
    interface: 'bg-amber-100 text-amber-800 border-amber-200',
    workflow: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    integration: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    default: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const style = typeStyles[type as keyof typeof typeStyles] || typeStyles.default;
  
  return (
    <Badge variant="outline" className={style}>
      {type}
    </Badge>
  );
}

// Format date helper
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Library() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('_all');
  const [statusFilter, setStatusFilter] = useState<string>('_all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, name: string, type: string } | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch agents data
  const {
    data: agents = [],
    isLoading: agentsLoading,
    error: agentsError,
  } = useQuery({
    queryKey: ['/api/agents'],
    queryFn: async () => {
      const response = await apiClient.get<Agent[]>('/api/agents');
      return response;
    },
  });

  // Fetch workflows data
  const {
    data: workflows = [],
    isLoading: workflowsLoading,
    error: workflowsError,
  } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const response = await apiClient.get<Workflow[]>('/api/workflows');
      return response;
    },
  });

  // Fetch nodes data
  const {
    data: nodes = [],
    isLoading: nodesLoading,
    error: nodesError,
  } = useQuery({
    queryKey: ['/api/nodes'],
    queryFn: async () => {
      const response = await apiClient.get<Node[]>('/api/nodes');
      return response;
    },
  });

  // Filter functions
  const filterWorkflows = (workflows: Workflow[]) => {
    return workflows.filter(workflow => {
      const matchesSearch = searchQuery === '' || 
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workflow.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === '_all' || typeFilter === '' || workflow.type.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === '_all' || statusFilter === '' || workflow.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const filterAgents = (agents: Agent[]) => {
    return agents.filter(agent => {
      const matchesSearch = searchQuery === '' || 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === '_all' || typeFilter === '' || agent.type.toLowerCase() === typeFilter.toLowerCase();
      const matchesStatus = statusFilter === '_all' || statusFilter === '' || agent.status.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesType && matchesStatus;
    });
  };

  const filterNodes = (nodes: Node[]) => {
    return nodes.filter(node => {
      const matchesSearch = searchQuery === '' || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === '_all' || typeFilter === '' || node.type.toLowerCase() === typeFilter.toLowerCase();
      const matchesCategory = statusFilter === '_all' || statusFilter === '' || node.category.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesType && matchesCategory;
    });
  };

  // Extract unique types and statuses for filters without using Set
  const workflowTypes = workflows
    .map(workflow => workflow.type)
    .filter((value, index, self) => self.indexOf(value) === index);
  const workflowStatuses = workflows
    .map(workflow => workflow.status)
    .filter((value, index, self) => self.indexOf(value) === index);
  
  const agentTypes = agents
    .map(agent => agent.type)
    .filter((value, index, self) => self.indexOf(value) === index);
  const agentStatuses = agents
    .map(agent => agent.status)
    .filter((value, index, self) => self.indexOf(value) === index);
  
  const nodeTypes = nodes
    .map(node => node.type)
    .filter((value, index, self) => self.indexOf(value) === index);
  const nodeCategories = nodes
    .map(node => node.category)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Get the current filter options based on active tab
  const getFilterOptions = () => {
    switch (activeTab) {
      case 'agents':
        return {
          types: agentTypes,
          statuses: agentStatuses,
          statusLabel: 'Status'
        };
      case 'nodes':
        return {
          types: nodeTypes,
          statuses: nodeCategories,
          statusLabel: 'Category'
        };
      case 'workflows':
      default:
        return {
          types: workflowTypes,
          statuses: workflowStatuses,
          statusLabel: 'Status'
        };
    }
  };

  const filterOptions = getFilterOptions();

  // Reset filters when changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTypeFilter('_all');
    setStatusFilter('_all');
    setPage(1); // Reset to first page when tab changes
  };
  
  // Calculate total pages and handle pagination
  const getPaginatedData = (data: any[]) => {
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Update totalPages whenever filtered data changes
  useEffect(() => {
    let filteredData: any[] = [];
    
    switch(activeTab) {
      case 'workflows':
        filteredData = filterWorkflows(workflows);
        break;
      case 'agents':
        filteredData = filterAgents(agents);
        break;
      case 'nodes':
        filteredData = filterNodes(nodes);
        break;
    }
    
    const calculatedTotalPages = Math.ceil(filteredData.length / itemsPerPage);
    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    
    // If current page is now greater than total pages, reset to page 1
    if (page > calculatedTotalPages && calculatedTotalPages > 0) {
      setPage(1);
    }
  }, [activeTab, searchQuery, typeFilter, statusFilter, workflows, agents, nodes, itemsPerPage, page]);
  
  // Delete item function
  const deleteItem = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const endpoint = 
        itemToDelete.type === 'workflow' ? `/api/workflows/${itemToDelete.id}` :
        itemToDelete.type === 'agent' ? `/api/agents/${itemToDelete.id}` :
        `/api/nodes/${itemToDelete.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete ${itemToDelete.type}: ${response.statusText}`);
      }
      
      // Invalidate the relevant query to refresh the data
      const queryKey = 
        itemToDelete.type === 'workflow' ? '/api/workflows' :
        itemToDelete.type === 'agent' ? '/api/agents' :
        '/api/nodes';
      
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      
      toast({
        title: "Success",
        description: `The ${itemToDelete.type} "${itemToDelete.name}" has been deleted.`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };
  
  // Pagination controls
  const PaginationControls = ({ itemsCount }: { itemsCount: number }) => {
    if (itemsCount === 0) return null;
    
    return (
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar collapsed={isMobile} />
      <MainContent>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Library</h1>
          </div>

          <Tabs defaultValue="workflows" value={activeTab} onValueChange={handleTabChange}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="workflows" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Workflows
                </TabsTrigger>
                <TabsTrigger value="agents" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Agents
                </TabsTrigger>
                <TabsTrigger value="nodes" className="flex items-center gap-2">
                  <Puzzle className="h-4 w-4" />
                  Nodes
                </TabsTrigger>
              </TabsList>

              {activeTab === 'workflows' && (
                <Button size="sm" asChild>
                  <Link href="/workflow-editor/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Workflow
                  </Link>
                </Button>
              )}
              {activeTab === 'agents' && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Agent
                </Button>
              )}
              {activeTab === 'nodes' && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Node
                </Button>
              )}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {activeTab === 'workflows' && 'Workflows'}
                      {activeTab === 'agents' && 'Agents'}
                      {activeTab === 'nodes' && 'Nodes'}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === 'workflows' && 'Manage your workflow library'}
                      {activeTab === 'agents' && 'Manage your agent library'}
                      {activeTab === 'nodes' && 'Manage your node library'}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">All Types</SelectItem>
                          {filterOptions.types.map(type => (
                            <SelectItem key={type} value={type || "_none"}>
                              {type || "Unspecified"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={filterOptions.statusLabel} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">All {filterOptions.statusLabel}es</SelectItem>
                          {filterOptions.statuses.map(status => (
                            <SelectItem key={status} value={status || "_none"}>
                              {status || "Unspecified"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Workflows Tab */}
                <TabsContent value="workflows" className="mt-0">
                  {workflowsLoading ? (
                    <div className="text-center py-4">Loading workflows...</div>
                  ) : workflowsError ? (
                    <div className="text-center py-4 text-red-500">Error loading workflows</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filterWorkflows(workflows).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                No workflows found
                              </TableCell>
                            </TableRow>
                          ) : (
                            getPaginatedData(filterWorkflows(workflows)).map((workflow) => (
                              <TableRow key={workflow.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <Link href={`/workflow-editor/${workflow.id}`}>
                                      <span className="hover:underline cursor-pointer">{workflow.name}</span>
                                    </Link>
                                    {workflow.description && (
                                      <span className="text-xs text-gray-500 truncate max-w-[300px]">
                                        {workflow.description}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <TypeBadge type={workflow.type} />
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={workflow.status} />
                                </TableCell>
                                <TableCell>
                                  {workflow.agentId ? (
                                    <Link href={`/agent/${workflow.agentId}`}>
                                      <span className="text-blue-600 hover:underline cursor-pointer">
                                        Agent #{workflow.agentId}
                                      </span>
                                    </Link>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </TableCell>
                                <TableCell>{formatDate(workflow.createdAt)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1">
                                    <Link href={`/workflow-editor/${workflow.id}`}>
                                      <Button size="icon" variant="ghost" title="Edit">
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Link href={`/workflow-test/${workflow.id}`}>
                                      <Button size="icon" variant="ghost" title="Test">
                                        <Play className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="flex items-center">
                                          <Copy className="h-4 w-4 mr-2" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="flex items-center text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <PaginationControls itemsCount={filterWorkflows(workflows).length} />
                    </>
                  )}
                </TabsContent>

                {/* Agents Tab */}
                <TabsContent value="agents" className="mt-0">
                  {agentsLoading ? (
                    <div className="text-center py-4">Loading agents...</div>
                  ) : agentsError ? (
                    <div className="text-center py-4 text-red-500">Error loading agents</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Workflows</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filterAgents(agents).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                No agents found
                              </TableCell>
                            </TableRow>
                          ) : (
                            getPaginatedData(filterAgents(agents)).map((agent) => (
                              <TableRow key={agent.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <Link href={`/agent/${agent.id}`}>
                                      <span className="hover:underline cursor-pointer">{agent.name}</span>
                                    </Link>
                                    {agent.description && (
                                      <span className="text-xs text-gray-500 truncate max-w-[300px]">
                                        {agent.description}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <TypeBadge type={agent.type} />
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={agent.status} />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-blue-600 hover:underline"
                                    asChild
                                  >
                                    <Link href={`/agent/${agent.id}`}>
                                      View Workflows
                                    </Link>
                                  </Button>
                                </TableCell>
                                <TableCell>{formatDate(agent.createdAt)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1">
                                    <Link href={`/agent/${agent.id}`}>
                                      <Button size="icon" variant="ghost" title="Edit">
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </Link>
                                    <Button size="icon" variant="ghost" title="Run">
                                      <Play className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="flex items-center">
                                          <Copy className="h-4 w-4 mr-2" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="flex items-center text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <PaginationControls itemsCount={filterAgents(agents).length} />
                    </>
                  )}
                </TabsContent>

                {/* Nodes Tab */}
                <TabsContent value="nodes" className="mt-0">
                  {nodesLoading ? (
                    <div className="text-center py-4">Loading nodes...</div>
                  ) : nodesError ? (
                    <div className="text-center py-4 text-red-500">Error loading nodes</div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filterNodes(nodes).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-4">
                                No nodes found
                              </TableCell>
                            </TableRow>
                          ) : (
                            getPaginatedData(filterNodes(nodes)).map((node) => (
                              <TableRow key={node.id}>
                                <TableCell className="font-medium">
                                  <div className="flex flex-col">
                                    <span>{node.name}</span>
                                    {node.description && (
                                      <span className="text-xs text-gray-500 truncate max-w-[300px]">
                                        {node.description}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <TypeBadge type={node.type} />
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-slate-100">
                                    {node.category || 'Uncategorized'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{formatDate(node.createdAt)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1">
                                    <Button size="icon" variant="ghost" title="Edit">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="icon" variant="ghost">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="flex items-center">
                                          <Copy className="h-4 w-4 mr-2" />
                                          Duplicate
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="flex items-center text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <PaginationControls itemsCount={filterNodes(nodes).length} />
                    </>
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </MainContent>
    </div>
  );
}