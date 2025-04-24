/**
 * Lead Generation Workflow Import Component
 * 
 * Provides a simple UI for importing the predefined lead generation workflows.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building, Users, Mail, Workflow, Loader2 } from 'lucide-react';
import { importLeadGenerationWorkflows } from '@/utils/import-workflows';

export function LeadGenWorkflowImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<null | {
    success: boolean;
    message: string;
    workflowIds?: Record<string, number>;
  }>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const workflowIds = await importLeadGenerationWorkflows();
      
      setImportResult({
        success: true,
        message: 'Successfully imported all lead generation workflows!',
        workflowIds
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import workflows'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Lead Generation Workflow Suite</CardTitle>
        <CardDescription>
          Import a complete set of interconnected workflows for automated lead generation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col border rounded-md p-4">
            <div className="flex items-center mb-2">
              <Building className="mr-2 h-5 w-5 text-blue-500" />
              <h3 className="font-medium">Company Search</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Discovers companies based on search criteria using Perplexity AI
            </p>
          </div>
          
          <div className="flex flex-col border rounded-md p-4">
            <div className="flex items-center mb-2">
              <Users className="mr-2 h-5 w-5 text-green-500" />
              <h3 className="font-medium">Contact Finder</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Identifies key decision makers at target companies
            </p>
          </div>
          
          <div className="flex flex-col border rounded-md p-4">
            <div className="flex items-center mb-2">
              <Mail className="mr-2 h-5 w-5 text-purple-500" />
              <h3 className="font-medium">Email Discovery</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Discovers and verifies email addresses for identified contacts
            </p>
          </div>
          
          <div className="flex flex-col border rounded-md p-4">
            <div className="flex items-center mb-2">
              <Workflow className="mr-2 h-5 w-5 text-amber-500" />
              <h3 className="font-medium">Master Workflow</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Orchestrates the entire lead generation process from end to end
            </p>
          </div>
        </div>
        
        {importResult && (
          <Alert className={`mt-4 ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <AlertTitle>{importResult.success ? 'Import Successful' : 'Import Failed'}</AlertTitle>
            <AlertDescription>
              {importResult.message}
              
              {importResult.success && importResult.workflowIds && (
                <div className="mt-2 text-sm">
                  <p>Created workflows with IDs:</p>
                  <ul className="list-disc list-inside">
                    {Object.entries(importResult.workflowIds).map(([key, id]) => (
                      <li key={key}>{key}: {id}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleImport} 
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing Workflows...
            </>
          ) : 'Import Lead Generation Workflows'}
        </Button>
      </CardFooter>
    </Card>
  );
}