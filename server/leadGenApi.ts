/**
 * Lead Generation API
 * 
 * This module handles external API requests for lead generation.
 * It processes search prompts and returns structured lead data.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import fetch from 'node-fetch';
import { storage } from './storage';
import { runWorkflow } from './routes';

// Define request schema for lead generation
const leadGenRequestSchema = z.object({
  searchQuery: z.string().min(3).max(500),
  targetTitles: z.string().optional(),
  maxResults: z.number().int().positive().optional().default(10),
  includeLinkedIn: z.boolean().optional().default(true),
  includeEmail: z.boolean().optional().default(true),
  includePhone: z.boolean().optional().default(false),
  exportFormat: z.enum(['json', 'csv']).optional().default('json'),
  webhookUrl: z.string().url().optional(),
});

// Define response format for lead data
export interface LeadContact {
  id: string;
  name: string;
  title: string;
  company: {
    name: string;
    website: string;
    industry?: string;
    size?: string;
    description?: string;
  };
  linkedIn?: string;
  email?: string;
  emailConfidence?: number;
  phone?: string;
  lastUpdated: string;
}

/**
 * Process a lead generation request from an external application
 */
export async function processLeadGenRequest(req: Request, res: Response) {
  try {
    // Validate the request
    const validationResult = leadGenRequestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request format",
        details: validationResult.error.format()
      });
    }
    
    const requestData = validationResult.data;
    
    // Create a tracking ID for this request
    const requestId = `lead-gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Log the incoming request
    await storage.createLog({
      status: 'running',
      input: { requestData },
      output: { requestId },
      executionPath: {
        source: 'lead_gen_api',
        message: `Lead generation request received: ${requestId}`,
        requestId
      }
    });
    
    // Find the master workflow
    const workflows = await storage.getWorkflows();
    const masterWorkflow = workflows.find(w => w.name.includes('Lead Generation Master'));
    
    if (!masterWorkflow) {
      return res.status(404).json({
        success: false,
        error: "Lead generation workflow not found",
        requestId
      });
    }
    
    // Prepare inputs for the workflow
    const workflowInputs = {
      searchQuery: requestData.searchQuery,
      targetTitles: requestData.targetTitles || "CEO, CTO, VP of Engineering, VP of Marketing, VP of Sales",
      maxResults: requestData.maxResults,
      includeLinkedIn: requestData.includeLinkedIn,
      includeEmail: requestData.includeEmail,
      includePhone: requestData.includePhone
    };
    
    // Return an immediate acknowledgement with the request ID
    res.status(202).json({
      success: true,
      message: "Lead generation request accepted",
      requestId,
      estimatedTime: "30-90 seconds"
    });
    
    // Execute the workflow asynchronously
    setTimeout(async () => {
      try {
        const workflowResult = await runWorkflow(masterWorkflow.id, workflowInputs);
        
        // Process the results
        const formattedResults = formatLeadResults(workflowResult.data, requestData.exportFormat);
        
        // Log the success
        await storage.createLog({
          status: 'completed',
          input: { requestData },
          output: { 
            requestId,
            resultCount: formattedResults.leads?.length || 0 
          },
          executionPath: {
            source: 'lead_gen_api',
            message: `Lead generation completed: ${requestId}`,
            requestId
          }
        });
        
        // Send to webhook if provided
        if (requestData.webhookUrl) {
          try {
            await fetch(requestData.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestId,
                results: formattedResults
              })
            });
          } catch (webhookError) {
            console.error('Webhook delivery failed:', webhookError);
          }
        }
      } catch (workflowError) {
        console.error('Workflow execution failed:', workflowError);
        
        // Log the error
        await storage.createLog({
          status: 'error',
          input: { requestData },
          output: { requestId },
          error: typeof workflowError === 'object' && workflowError !== null && 'message' in workflowError 
            ? String(workflowError.message) 
            : 'Unknown workflow execution error',
          executionPath: {
            source: 'lead_gen_api',
            message: `Lead generation failed: ${requestId}`,
            requestId
          }
        });
        
        // Notify webhook of failure if provided
        if (requestData.webhookUrl) {
          try {
            await fetch(requestData.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestId,
                success: false,
                error: typeof workflowError === 'object' && workflowError !== null && 'message' in workflowError 
                  ? String(workflowError.message) 
                  : 'Unknown workflow execution error'
              })
            });
          } catch (webhookError) {
            console.error('Webhook error notification failed:', webhookError);
          }
        }
      }
    }, 100); // Small delay to allow response to be sent
    
  } catch (error) {
    console.error('Lead generation API error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error processing lead generation request"
    });
  }
}

/**
 * Format lead generation results based on the requested format
 */
function formatLeadResults(workflowData: any, format: 'json' | 'csv' = 'json') {
  // Extract lead data from workflow results
  const leads: LeadContact[] = [];
  
  try {
    if (Array.isArray(workflowData)) {
      workflowData.forEach((item, index) => {
        // Convert workflow data to standardized lead format
        leads.push({
          id: `lead-${Date.now()}-${index}`,
          name: item.name || 'Unknown',
          title: item.title || 'Unknown',
          company: {
            name: item.company?.name || item.companyName || 'Unknown',
            website: item.company?.website || item.companyWebsite || '',
            industry: item.company?.industry || item.industry || undefined,
            size: item.company?.size || item.companySize || undefined,
            description: item.company?.description || item.companyDescription || undefined
          },
          linkedIn: item.linkedIn || item.linkedInUrl || undefined,
          email: item.email || undefined,
          emailConfidence: item.emailConfidence || undefined,
          phone: item.phone || undefined,
          lastUpdated: new Date().toISOString()
        });
      });
    }
    
    // Format the results
    if (format === 'csv') {
      // Generate CSV
      const headers = 'id,name,title,company_name,company_website,industry,company_size,linkedin,email,email_confidence,phone,last_updated\n';
      const rows = leads.map(lead => {
        return [
          lead.id,
          escapeCsvField(lead.name),
          escapeCsvField(lead.title),
          escapeCsvField(lead.company.name),
          escapeCsvField(lead.company.website),
          escapeCsvField(lead.company.industry || ''),
          escapeCsvField(lead.company.size || ''),
          escapeCsvField(lead.linkedIn || ''),
          escapeCsvField(lead.email || ''),
          lead.emailConfidence || '',
          escapeCsvField(lead.phone || ''),
          lead.lastUpdated
        ].join(',');
      }).join('\n');
      
      return {
        format: 'csv',
        data: headers + rows
      };
    } else {
      // Return JSON
      return {
        format: 'json',
        success: true,
        count: leads.length,
        leads
      };
    }
  } catch (error) {
    console.error('Error formatting lead results:', error);
    return {
      format: format,
      success: false,
      error: 'Failed to format lead data',
      leads: []
    };
  }
}

/**
 * Escape CSV field values
 */
function escapeCsvField(value: string): string {
  if (!value) return '';
  
  // If the field contains comma, newline or double quote, enclose it in double quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // Replace double quotes with two double quotes
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}