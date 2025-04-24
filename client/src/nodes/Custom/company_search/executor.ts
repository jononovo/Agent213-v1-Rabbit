/**
 * Company Search Node Executor
 * 
 * This is the execution logic for the Company Search node.
 * It uses the Perplexity API to search for company information.
 */

import { defaultData } from './definition';

export { defaultData };

// Define the node data structure (should match the one in UI)
export interface CompanySearchNodeData {
  prompt: string;
  includeIndustry: boolean;
  includeEmployeeCount: boolean;
  includeRevenue: boolean;
  includeFunding: boolean;
  includeDescription: boolean;
  maxResults: number;
}

/**
 * Execute the company search node
 */
export const execute = async (
  data: CompanySearchNodeData, 
  inputs: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    const startTime = new Date();
    
    // Get input query or use default from node config
    const query = inputs.query || data.prompt;
    const filters = inputs.filters || {};
    
    // Construct the prompt for the Perplexity API
    let prompt = `I'm looking for company information. ${query}`;
    
    // Add instructions based on settings
    prompt += "\n\nPlease return the results in a structured JSON format with the following information for each company:";
    prompt += "\n- name (string): Company name";
    prompt += "\n- website (string): Company website URL";
    
    if (data.includeIndustry) {
      prompt += "\n- industry (string): Main industry or sector";
    }
    
    if (data.includeEmployeeCount) {
      prompt += "\n- employeeCount (string): Approximate number of employees";
    }
    
    if (data.includeRevenue) {
      prompt += "\n- revenue (string): Estimated annual revenue";
    }
    
    if (data.includeFunding) {
      prompt += "\n- funding (string): Funding information if available";
    }
    
    if (data.includeDescription) {
      prompt += "\n- description (string): Brief company description";
    }
    
    prompt += `\n\nPlease return exactly ${data.maxResults} companies that best match the search criteria.`;
    prompt += "\n\nFormat the response as a valid JSON array of company objects. Include ONLY the JSON array with no additional text.";
    
    // Get API key from environment
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      throw new Error("Perplexity API key is not set. Please add it to your environment variables.");
    }
    
    // Call Perplexity API
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that specializes in company research. Provide accurate, up-to-date information about companies based on the user's query. Format your responses as clean JSON when requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2, // Lower temperature for more focused results
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `API error: ${response.status} ${response.statusText}`;
      throw new Error(`Perplexity API request failed: ${errorMessage}`);
    }
    
    // Parse the response
    const responseData = await response.json();
    const responseText = responseData.choices?.[0]?.message?.content || '';
    
    // Extract JSON from the response
    let companies = [];
    try {
      // Extract JSON array from the text - handle both when it returns clean JSON and when it adds extra text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        companies = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to trying to parse the whole response if no JSON array is found
        companies = JSON.parse(responseText);
      }
      
      // Ensure it's an array
      if (!Array.isArray(companies)) {
        if (typeof companies === 'object' && companies.companies && Array.isArray(companies.companies)) {
          companies = companies.companies;
        } else {
          companies = [companies];
        }
      }
      
      // Limit results to max requested
      companies = companies.slice(0, data.maxResults);
      
    } catch (error) {
      console.error("Error parsing API response:", error);
      console.log("Response text:", responseText);
      throw new Error(`Failed to parse company data from API response: ${error.message}`);
    }
    
    // Create metadata about the search
    const metadata = {
      timestamp: new Date().toISOString(),
      query: query,
      filters: filters,
      resultCount: companies.length,
      apiResponse: {
        model: responseData.model,
        usage: responseData.usage
      },
      executionTime: new Date().getTime() - startTime.getTime()
    };
    
    // Return the results
    return {
      companies,
      metadata
    };
  } catch (error) {
    console.error("Error in Company Search node:", error);
    throw new Error(`Company search failed: ${error.message}`);
  }
};