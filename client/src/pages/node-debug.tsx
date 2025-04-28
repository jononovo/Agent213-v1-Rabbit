/**
 * Node Debug Panel
 * 
 * A dedicated page for testing and validating nodes in the system.
 * This panel allows developers to commission, test, and validate nodes
 * without impacting the main workflow editor.
 * 
 * Features:
 * - Node Directory Testing: Select a node folder to run all tests on that node
 * - Detailed Test Results: View individual test results and feedback
 * - AI Agent Testing Support: Structured for programmatic use by AI agents
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, XCircle, AlertTriangle, RefreshCcw, FileSymlink, Search, 
  Play, Zap, LayoutGrid, Clock, Link, FolderOpen, Upload, Download, 
  FileCode, Bot, RotateCw, Save, ClipboardCheck, Cpu 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainContent from '@/components/layout/MainContent';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Helper types
interface NodeType {
  type: string;
  name: string;
  category: string;
  status?: 'validated' | 'partial' | 'failed' | 'pending';
  testResults?: TestResult[];
}

interface TestResult {
  name: string;
  test: TestType;
  status: 'passed' | 'failed' | 'pending' | 'running';
  message?: string;
  duration?: number; 
}

type TestType = 'definition' | 'interface' | 'execution' | 'error' | 'ui' | 'performance' | 'integration';

interface TestDefinition {
  id: TestType;
  name: string;
  description: string;
  icon: React.ElementType;
}

// Test definitions
const TESTS: TestDefinition[] = [
  {
    id: 'definition',
    name: 'Definition Validation',
    description: 'Verifies all required fields are present and correctly formatted',
    icon: FileSymlink
  },
  {
    id: 'interface',
    name: 'Input/Output Interface',
    description: 'Tests that declared I/O ports work as expected',
    icon: Link
  },
  {
    id: 'execution',
    name: 'Execution Testing',
    description: 'Verifies the node executor works with sample inputs',
    icon: Play
  },
  {
    id: 'error',
    name: 'Error Handling',
    description: 'Tests how the node behaves with invalid inputs or failure conditions',
    icon: AlertTriangle
  },
  {
    id: 'ui',
    name: 'UI Rendering',
    description: 'Validates the node\'s visual representation renders properly',
    icon: LayoutGrid
  },
  {
    id: 'performance',
    name: 'Performance Testing',
    description: 'Measures execution time and resource usage',
    icon: Clock
  },
  {
    id: 'integration',
    name: 'Integration Testing',
    description: 'Tests the node working with other connected nodes',
    icon: Zap
  }
];

const NodeDebugPanel: React.FC = () => {
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<NodeType | null>(null);
  const [activeTab, setActiveTab] = useState('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  // Fetch available nodes from the API
  const { data: nodeTypes = [], isLoading, refetch } = useQuery({ 
    queryKey: ['nodeTypes'],
    queryFn: async () => {
      // This will be replaced with an actual API call
      // For now, we'll just mock data
      return mockNodeTypes;
    }
  });

  // Mock data for development
  const mockNodeTypes: NodeType[] = [
    { 
      type: 'webhook_trigger', 
      name: 'Webhook Trigger', 
      category: 'actions',
      status: 'validated',
      testResults: [
        { name: 'Definition Validation', test: 'definition', status: 'passed', duration: 42 },
        { name: 'Input/Output Interface', test: 'interface', status: 'passed', duration: 76 },
        { name: 'Execution Testing', test: 'execution', status: 'passed', duration: 214 },
        { name: 'Error Handling', test: 'error', status: 'passed', duration: 102 },
        { name: 'UI Rendering', test: 'ui', status: 'passed', duration: 55 },
        { name: 'Performance Testing', test: 'performance', status: 'passed', duration: 188 },
        { name: 'Integration Testing', test: 'integration', status: 'passed', duration: 310 }
      ]
    },
    { 
      type: 'csv_processor', 
      name: 'CSV Processor', 
      category: 'data',
      status: 'partial',
      testResults: [
        { name: 'Definition Validation', test: 'definition', status: 'passed', duration: 38 },
        { name: 'Input/Output Interface', test: 'interface', status: 'passed', duration: 62 },
        { name: 'Execution Testing', test: 'execution', status: 'passed', duration: 187 },
        { name: 'Error Handling', test: 'error', status: 'failed', message: 'Does not handle malformed CSV data correctly', duration: 91 },
        { name: 'UI Rendering', test: 'ui', status: 'passed', duration: 45 },
        { name: 'Performance Testing', test: 'performance', status: 'passed', duration: 166 },
        { name: 'Integration Testing', test: 'integration', status: 'pending' }
      ]
    },
    { 
      type: 'workflow_trigger', 
      name: 'Workflow Trigger', 
      category: 'actions',
      status: 'pending'
    },
    { 
      type: 'openai_chat', 
      name: 'OpenAI Chat', 
      category: 'ai',
      status: 'failed',
      testResults: [
        { name: 'Definition Validation', test: 'definition', status: 'passed', duration: 41 },
        { name: 'Input/Output Interface', test: 'interface', status: 'passed', duration: 58 },
        { name: 'Execution Testing', test: 'execution', status: 'failed', message: 'API key handling is not secure', duration: 124 },
        { name: 'Error Handling', test: 'error', status: 'failed', message: 'Fails to gracefully handle API timeout', duration: 78 },
        { name: 'UI Rendering', test: 'ui', status: 'passed', duration: 47 },
        { name: 'Performance Testing', test: 'performance', status: 'pending' },
        { name: 'Integration Testing', test: 'integration', status: 'pending' }
      ]
    }
  ];

  // Filter nodes based on search query and active tab
  const filteredNodes = nodeTypes.filter(node => {
    const matchesSearch = 
      searchQuery === '' || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'available') return matchesSearch;
    if (activeTab === 'validated') return matchesSearch && node.status === 'validated';
    if (activeTab === 'partial') return matchesSearch && node.status === 'partial';
    if (activeTab === 'failed') return matchesSearch && node.status === 'failed';
    if (activeTab === 'pending') return matchesSearch && (node.status === 'pending' || !node.status);
    
    return matchesSearch;
  });

  // Select a node to view its details
  const handleViewNode = (node: NodeType) => {
    setSelectedNode(node);
  };

  // Run tests for a node
  const handleRunTests = (node: NodeType) => {
    setIsRunningTests(true);
    setTestProgress(0);
    
    // Mock test runner with artificial delays
    const testDelay = 600; // ms per test
    const testsToRun = TESTS.length;
    
    // Create a copy of the node to manipulate during testing
    const updatedNode = { ...node };
    updatedNode.testResults = [];
    TESTS.forEach(test => {
      updatedNode.testResults?.push({
        name: test.name,
        test: test.id,
        status: 'running'
      });
    });
    
    setSelectedNode(updatedNode);
    
    // Simulate running each test with a delay
    TESTS.forEach((test, index) => {
      setTimeout(() => {
        // Update progress
        setTestProgress(Math.round(((index + 1) / testsToRun) * 100));
        
        // Simulate a test result (random for demo)
        const result: TestResult = {
          name: test.name,
          test: test.id,
          status: Math.random() > 0.2 ? 'passed' : 'failed',
          duration: Math.floor(Math.random() * 300) + 50
        };
        
        if (result.status === 'failed') {
          result.message = `Test failed: ${test.name} validation error`;
        }
        
        // Update the node's test results
        if (updatedNode.testResults) {
          updatedNode.testResults[index] = result;
          
          // Determine overall status based on test results
          const hasFailures = updatedNode.testResults.some(r => r.status === 'failed');
          const hasPending = updatedNode.testResults.some(r => r.status === 'pending');
          
          if (hasFailures) {
            updatedNode.status = 'failed';
          } else if (hasPending) {
            updatedNode.status = 'partial';
          } else {
            updatedNode.status = 'validated';
          }
          
          setSelectedNode({ ...updatedNode });
        }
        
        // When all tests are completed
        if (index === testsToRun - 1) {
          setIsRunningTests(false);
          toast({
            title: "Testing completed",
            description: `${updatedNode.name} test suite has finished`,
          });
        }
      }, testDelay * (index + 1));
    });
  };

  // Get status badge color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800 border-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      case 'pending': 
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Get test status icon
  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <RefreshCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending': 
      default: return <AlertTriangle className="h-5 w-5 text-slate-300" />;
    }
  };

  // Count nodes by status
  const getNodeStatusCount = (status: string) => {
    return nodeTypes.filter(node => node.status === status).length;
  };

  return (
    <MainContent>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Node listing */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Nodes</CardTitle>
            <CardDescription>Available nodes in the system</CardDescription>
            
            <div className="mt-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search nodes..." 
                  className="pl-8" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab}>
              <div className="px-6">
                <TabsList className="w-full">
                  <TabsTrigger value="available" className="flex-1">
                    All
                    <Badge variant="secondary" className="ml-2">{nodeTypes.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="validated" className="flex-1">
                    Validated
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                      {getNodeStatusCount('validated')}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1">
                    Pending
                    <Badge variant="secondary" className="ml-2">
                      {getNodeStatusCount('pending')}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <ScrollArea className="h-[60vh]">
                <TabsContent value="available" className="m-0">
                  <div className="divide-y">
                    {filteredNodes.map((node) => (
                      <div 
                        key={node.type} 
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedNode?.type === node.type ? 'bg-slate-100' : ''}`}
                        onClick={() => handleViewNode(node)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{node.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{node.type}</p>
                          </div>
                          <Badge 
                            className={`${getStatusColor(node.status)} border`}
                          >
                            {node.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="mt-2">
                          <Badge variant="outline" className="mr-1 text-xs">{node.category}</Badge>
                        </div>
                      </div>
                    ))}
                    
                    {filteredNodes.length === 0 && (
                      <div className="p-8 text-center text-slate-500">
                        <AlertTriangle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                        <p>No nodes found matching your criteria</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="validated" className="m-0">
                  {/* Same structure as "available" but filtered */}
                  <div className="divide-y">
                    {filteredNodes.map((node) => (
                      <div 
                        key={node.type} 
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedNode?.type === node.type ? 'bg-slate-100' : ''}`}
                        onClick={() => handleViewNode(node)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{node.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{node.type}</p>
                          </div>
                          <Badge 
                            className={`${getStatusColor(node.status)} border`}
                          >
                            {node.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="mt-2">
                          <Badge variant="outline" className="mr-1 text-xs">{node.category}</Badge>
                        </div>
                      </div>
                    ))}
                    
                    {filteredNodes.length === 0 && (
                      <div className="p-8 text-center text-slate-500">
                        <AlertTriangle className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                        <p>No validated nodes found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="partial" className="m-0">
                  {/* Similar structure for partial */}
                  <div className="divide-y">
                    {filteredNodes.map((node) => (
                      <div 
                        key={node.type} 
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedNode?.type === node.type ? 'bg-slate-100' : ''}`}
                        onClick={() => handleViewNode(node)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{node.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{node.type}</p>
                          </div>
                          <Badge 
                            className={`${getStatusColor(node.status)} border`}
                          >
                            {node.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="mt-2">
                          <Badge variant="outline" className="mr-1 text-xs">{node.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="failed" className="m-0">
                  {/* Similar structure for failed */}
                  <div className="divide-y">
                    {filteredNodes.map((node) => (
                      <div 
                        key={node.type} 
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedNode?.type === node.type ? 'bg-slate-100' : ''}`}
                        onClick={() => handleViewNode(node)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{node.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{node.type}</p>
                          </div>
                          <Badge 
                            className={`${getStatusColor(node.status)} border`}
                          >
                            {node.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="mt-2">
                          <Badge variant="outline" className="mr-1 text-xs">{node.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="pending" className="m-0">
                  {/* Similar structure for pending */}
                  <div className="divide-y">
                    {filteredNodes.map((node) => (
                      <div 
                        key={node.type} 
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${selectedNode?.type === node.type ? 'bg-slate-100' : ''}`}
                        onClick={() => handleViewNode(node)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{node.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{node.type}</p>
                          </div>
                          <Badge 
                            className={`${getStatusColor(node.status)} border`}
                          >
                            {node.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="mt-2">
                          <Badge variant="outline" className="mr-1 text-xs">{node.category}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="actions">Actions</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="integration">Integration</SelectItem>
              </SelectContent>
            </Select>
          </CardFooter>
        </Card>
        
        {/* Right panel - Test details and execution */}
        <Card className="lg:col-span-2">
          {selectedNode ? (
            <>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedNode.name}</CardTitle>
                    <CardDescription>Type: {selectedNode.type}</CardDescription>
                  </div>
                  
                  <Button 
                    onClick={() => handleRunTests(selectedNode)}
                    disabled={isRunningTests}
                  >
                    {isRunningTests ? (
                      <>
                        <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Tests
                      </>
                    )}
                  </Button>
                </div>
                
                {isRunningTests && (
                  <div className="mt-4">
                    <Label className="text-xs text-slate-500 mb-1 block">Test Progress</Label>
                    <Progress value={testProgress} />
                    <p className="text-xs text-slate-500 mt-1">Running test suite: {testProgress}% complete</p>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Node Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-500">Type:</span> {selectedNode.type}
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-500">Category:</span> {selectedNode.category}
                    </div>
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-500">Status:</span> 
                      <Badge 
                        className={`ml-2 ${getStatusColor(selectedNode.status)} border`}
                      >
                        {selectedNode.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Test Results</h3>
                  
                  {selectedNode.testResults && selectedNode.testResults.length > 0 ? (
                    <div className="space-y-3">
                      {TESTS.map((testDef) => {
                        const testResult = selectedNode.testResults?.find(r => r.test === testDef.id);
                        return (
                          <div key={testDef.id} className="border rounded-md overflow-hidden">
                            <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                              <div className="flex items-center space-x-3">
                                <div className="bg-slate-200 p-1.5 rounded">
                                  <testDef.icon className="h-4 w-4 text-slate-700" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{testDef.name}</h4>
                                  <p className="text-xs text-slate-500">{testDef.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                {testResult ? getTestStatusIcon(testResult.status) : getTestStatusIcon('pending')}
                                {testResult?.duration && (
                                  <span className="text-xs text-slate-500 ml-2">{testResult.duration}ms</span>
                                )}
                              </div>
                            </div>
                            
                            {testResult?.status === 'failed' && testResult.message && (
                              <div className="p-3 bg-red-50 text-red-700 text-sm">
                                {testResult.message}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Tests Run</AlertTitle>
                      <AlertDescription>
                        This node hasn't been tested yet. Click "Run Tests" to start the test suite.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-20 px-6 text-center text-slate-500">
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">No Node Selected</h3>
                <p>Select a node from the list to view details and run tests</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </MainContent>
  );
};

export default NodeDebugPanel;