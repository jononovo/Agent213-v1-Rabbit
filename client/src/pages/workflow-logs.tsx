import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import type { Log as BaseLog, Workflow } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';

// Extended Log type with proper typing for executionPath
interface ExecutionPath {
  nodes?: string[];
  completed?: boolean;
  error?: string;
  message?: string;
}

interface Log extends BaseLog {
  executionPath: ExecutionPath;
}

const WorkflowLogs = () => {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const workflowId = parseInt(params.id, 10);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = useState(false);

  // Fetch workflow details
  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery<Workflow>({
    queryKey: ['/api/workflows', workflowId],
    queryFn: async () => {
      return apiRequest<Workflow>('GET', `/api/workflows/${workflowId}`);
    },
    enabled: !isNaN(workflowId)
  });

  // Fetch logs for this workflow
  const { data: logs, isLoading: isLoadingLogs } = useQuery<Log[]>({
    queryKey: ['/api/logs', { workflowId }],
    queryFn: async () => {
      return apiRequest<Log[]>('GET', `/api/logs?workflowId=${workflowId}`);
    },
    enabled: !isNaN(workflowId)
  });

  const handleBackClick = () => {
    navigate(`/workflow-editor/${workflowId}`);
  };

  const handleViewLogDetails = (log: Log) => {
    setSelectedLog(log);
    setIsLogDetailsOpen(true);
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500 mr-2" />;
      case 'running':
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500 mr-2" />;
    }
  };

  // Helper function to format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBackClick} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workflow
        </Button>
        <h1 className="text-2xl font-bold">
          Workflow Logs: {isLoadingWorkflow ? 'Loading...' : workflow?.name}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
          <CardDescription>
            Recent logs for workflow {isLoadingWorkflow ? 'Loading...' : workflow?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs && logs.map((log: Log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono">#{log.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                          <span className="capitalize">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(log.startedAt)}</TableCell>
                      <TableCell>{formatDate(log.completedAt)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewLogDetails(log)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/50">
              <h3 className="font-medium">No logs found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This workflow doesn't have any execution logs yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Sheet */}
      <Sheet open={isLogDetailsOpen} onOpenChange={setIsLogDetailsOpen}>
        <SheetContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Log Details</SheetTitle>
            <SheetDescription>
              Execution details for log #{selectedLog?.id}
            </SheetDescription>
          </SheetHeader>
          
          {selectedLog && (
            <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
              <div className="grid gap-6">
                {/* Status and Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                    <div className="flex items-center">
                      {getStatusIcon(selectedLog.status)}
                      <span className="font-medium capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Duration</h4>
                    <div>
                      {selectedLog.startedAt && selectedLog.completedAt ? (
                        <span>
                          {formatDate(selectedLog.startedAt)} to {formatDate(selectedLog.completedAt)}
                        </span>
                      ) : (
                        <span>Started: {formatDate(selectedLog.startedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Input */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Input</h4>
                  <div className="bg-muted rounded-md p-3 overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.input, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Output */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Output</h4>
                  <div className="bg-muted rounded-md p-3 overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.output, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Error (if any) */}
                {selectedLog.error && (
                  <div>
                    <h4 className="text-sm font-medium text-red-500 mb-2">Error</h4>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 overflow-x-auto">
                      <pre className="text-xs text-red-700 whitespace-pre-wrap">
                        {selectedLog.error}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Execution Path */}
                {selectedLog.executionPath && Object.keys(selectedLog.executionPath).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Execution Path</h4>
                    <div className="bg-muted rounded-md p-3 overflow-x-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.executionPath, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default WorkflowLogs;