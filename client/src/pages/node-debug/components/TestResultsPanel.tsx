/**
 * Test Results Panel
 * 
 * This component displays test results for both standard and custom tests
 * for the selected node.
 */
import React from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, RefreshCcw, 
  FileSymlink, Link, Play, Zap, LayoutGrid, Clock, 
  FileCode, Database, Server, Workflow, AlertTriangle as AlertIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { NodeType, TestResult, CustomTestResult, TestType } from '../utils/testRunner';

// Icons for test types (original test types)
const TEST_ICONS: Partial<Record<TestType, React.ElementType>> = {
  'definition': FileSymlink,
  'interface': Link,
  'execution': Play,
  'integration': Zap,
  'ui': LayoutGrid,
  'performance': Clock,
  'error': AlertIcon,
  
  // Add new test types
  'structure': FileCode,
  'error-handling': AlertIcon,
  'file-structure': FileCode,
  'metadata': Database, 
  'validation': FileSymlink,
  'port-definition': Link,
  'executor-signature': Play,
  'output-format': Workflow
};

// Icons for our new test categories
const TEST_CATEGORY_ICONS: Record<string, React.ElementType> = {
  'definition': FileSymlink,
  'interface': Link,
  'execution': Play,
  'integration': Server,
  'ui': LayoutGrid,
  'performance': Clock,
  'error-handling': AlertIcon,
  
  // New specific test categories
  'file-structure': FileCode,
  'metadata': Database,
  'validation': FileSymlink,
  'port-definition': Link,
  'executor-signature': Play,
  'output-format': Workflow,
};

interface TestResultsPanelProps {
  selectedNode: NodeType;
  isRunningTests: boolean;
  testProgress: number;
}

const TestResultsPanel: React.FC<TestResultsPanelProps> = ({ 
  selectedNode, 
  isRunningTests, 
  testProgress 
}) => {
  // Function to get test status icon
  const getTestStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running': return <RefreshCcw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending': 
      default: return <AlertTriangle className="h-5 w-5 text-slate-300" />;
    }
  };

  // Determine test stats for status badges
  const standardTestCount = selectedNode.testResults?.length || 0;
  const standardPassedCount = selectedNode.testResults?.filter(r => r.status === 'passed').length || 0;
  
  const customTestCount = selectedNode.customTestResults?.length || 0;
  const customPassedCount = selectedNode.customTestResults?.filter(r => r.status === 'passed').length || 0;
  
  const integrationTestCount = selectedNode.integrationTestResults?.length || 0;
  const integrationPassedCount = selectedNode.integrationTestResults?.filter(r => r.status === 'passed').length || 0;
  
  const hasCustomTests = customTestCount > 0;
  const hasIntegrationTests = integrationTestCount > 0;
  
  // Helper function to format test duration
  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return `${duration}ms`;
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Test Results</CardTitle>
          <div className="flex items-center space-x-2">
            {standardTestCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Standard: {standardPassedCount}/{standardTestCount}
              </Badge>
            )}
            {hasCustomTests && (
              <Badge variant="outline" className="text-xs">
                Custom: {customPassedCount}/{customTestCount}
              </Badge>
            )}
            {hasIntegrationTests && (
              <Badge variant="outline" className="text-xs">
                Integration: {integrationPassedCount}/{integrationTestCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isRunningTests && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Running tests...</span>
              <span className="text-sm font-medium">{testProgress}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all" 
                style={{ width: `${testProgress}%` }}
              />
            </div>
          </div>
        )}
        
        <Tabs defaultValue="standard">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="standard" className="flex-1">Standard Tests</TabsTrigger>
            {hasIntegrationTests && (
              <TabsTrigger value="integration" className="flex-1">
                Integration Tests
              </TabsTrigger>
            )}
            <TabsTrigger value="custom" className="flex-1" disabled={!hasCustomTests}>
              Custom Tests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard">
            {selectedNode.testResults && selectedNode.testResults.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {selectedNode.testResults.map((testResult: TestResult, index: number) => {
                    // Try using category-specific icon first, fallback to general test type icon
                    const TestIcon = TEST_CATEGORY_ICONS[testResult.test] || 
                                    TEST_ICONS[testResult.test as TestType] || 
                                    AlertIcon;
                    
                    return (
                      <div key={`std-test-${index}`} className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                        <div className="mt-0.5">
                          {getTestStatusIcon(testResult.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <TestIcon className="h-4 w-4 text-gray-500" />
                              <h3 className="font-medium">{testResult.name}</h3>
                            </div>
                            {testResult.duration !== undefined && (
                              <span className="text-xs text-slate-500 ml-2">{formatDuration(testResult.duration)}</span>
                            )}
                          </div>
                          
                          {testResult.message && (
                            <p className="text-sm text-gray-600 mt-1">{testResult.message}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No test results</AlertTitle>
                <AlertDescription>
                  Run tests on this node to see results.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="integration">
            {hasIntegrationTests ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {selectedNode.integrationTestResults?.map((testResult: TestResult, index: number) => {
                    // Try using category-specific icon first, fallback to general test type icon
                    const TestIcon = TEST_CATEGORY_ICONS[testResult.test] || 
                                    TEST_ICONS[testResult.test as TestType] || 
                                    AlertIcon;
                    
                    return (
                      <div key={`int-test-${index}`} className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                        <div className="mt-0.5">
                          {getTestStatusIcon(testResult.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <TestIcon className="h-4 w-4 text-purple-500" />
                              <h3 className="font-medium">{testResult.name}</h3>
                            </div>
                            {testResult.duration !== undefined && (
                              <span className="text-xs text-slate-500 ml-2">{formatDuration(testResult.duration)}</span>
                            )}
                          </div>
                          
                          {testResult.message && (
                            <p className="text-sm text-gray-600 mt-1">{testResult.message}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No integration tests</AlertTitle>
                <AlertDescription>
                  This node doesn't have any integration tests or isn't an Integration category node.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="custom">
            {hasCustomTests ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {selectedNode.customTestResults?.map((testResult: CustomTestResult, index: number) => (
                    <div key={`custom-test-${index}`} className="flex items-start space-x-3 pb-3 border-b border-gray-100">
                      <div className="mt-0.5">
                        {getTestStatusIcon(testResult.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{testResult.name}</h3>
                          {testResult.duration !== undefined && (
                            <span className="text-xs text-slate-500 ml-2">{formatDuration(testResult.duration)}</span>
                          )}
                        </div>
                        
                        {testResult.category && (
                          <Badge variant="outline" className="mb-1 mt-1">
                            {testResult.category}
                          </Badge>
                        )}
                        
                        <p className="text-sm text-gray-600 mt-1">{testResult.description}</p>
                        
                        {testResult.message && (
                          <p className="text-sm font-medium mt-2">
                            {testResult.status === 'passed' ? (
                              <span className="text-green-600">{testResult.message}</span>
                            ) : (
                              <span className="text-red-600">{testResult.message}</span>
                            )}
                          </p>
                        )}
                        
                        {testResult.details && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                            <details>
                              <summary className="cursor-pointer">Test details</summary>
                              <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-100 rounded">
                                {JSON.stringify(testResult.details, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No custom tests</AlertTitle>
                <AlertDescription>
                  This node doesn't have any custom tests defined.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TestResultsPanel;