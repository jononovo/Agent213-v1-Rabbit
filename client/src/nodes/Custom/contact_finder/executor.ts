/**
 * Contact Finder Node Executor
 * 
 * This is the execution logic for the Contact Finder node.
 * It identifies key decision makers at companies using the Perplexity API.
 */

import { defaultData } from './definition';

export { defaultData };

// Define the node data structure (should match the one in UI)
export interface ContactFinderNodeData {
  jobTitles: string[];
  includeLinkedIn: boolean;
  includeEmail: boolean;
  includePhone: boolean;
  maxContacts: number;
  prioritizeLeadership: boolean;
}

/**
 * Execute the contact finder node
 */
export const execute = async (
  data: ContactFinderNodeData, 
  inputs: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    const startTime = new Date();
    
    // Get input company data
    const company = inputs.company;
    
    // Check if we have valid company data
    if (!company || !company.name) {
      throw new Error("No valid company data provided. Input must include at least a company name.");
    }
    
    // Get job titles from input or use default from node config
    const jobTitles = inputs.jobTitles || data.jobTitles;
    
    // Construct the prompt for the Perplexity API
    let prompt = `I need to find key contacts at ${company.name}.`;
    
    // Add company context if available
    if (company.website) {
      prompt += ` The company website is ${company.website}.`;
    }
    
    if (company.industry) {
      prompt += ` They are in the ${company.industry} industry.`;
    }
    
    // Add job titles to target
    prompt += `\n\nPlease find contacts for the following positions: ${jobTitles.join(', ')}.`;
    
    if (data.prioritizeLeadership) {
      prompt += " Prioritize executive leadership and decision makers.";
    }
    
    // Specify output format
    prompt += "\n\nPlease return the results in a structured JSON format with the following information for each contact:";
    prompt += "\n- name (string): Full name of the contact";
    prompt += "\n- title (string): Job title or position";
    prompt += "\n- company (string): Company name";
    
    if (data.includeLinkedIn) {
      prompt += "\n- linkedIn (string): LinkedIn profile URL if available";
    }
    
    if (data.includeEmail) {
      prompt += "\n- email (string): Business email address if available";
    }
    
    if (data.includePhone) {
      prompt += "\n- phone (string): Business phone number if available";
    }
    
    prompt += `\n\nPlease return up to ${data.maxContacts} contacts that best match the criteria.`;
    prompt += "\n\nFormat the response as a valid JSON array of contact objects. Include ONLY the JSON array with no additional text.";
    
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
            content: "You are a skilled business researcher who specializes in finding accurate contact information for professionals. Provide up-to-date information about company leaders and key personnel based on the user's query. Format your responses as clean JSON when requested."
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
    let contacts = [];
    try {
      // Extract JSON array from the text - handle both when it returns clean JSON and when it adds extra text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        contacts = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to trying to parse the whole response if no JSON array is found
        contacts = JSON.parse(responseText);
      }
      
      // Ensure it's an array
      if (!Array.isArray(contacts)) {
        if (typeof contacts === 'object' && contacts.contacts && Array.isArray(contacts.contacts)) {
          contacts = contacts.contacts;
        } else {
          contacts = [contacts];
        }
      }
      
      // Limit results to max requested
      contacts = contacts.slice(0, data.maxContacts);
      
      // Ensure each contact has the company property set
      contacts = contacts.map(contact => ({
        ...contact,
        company: contact.company || company.name
      }));
      
    } catch (error) {
      console.error("Error parsing API response:", error);
      console.log("Response text:", responseText);
      throw new Error(`Failed to parse contact data from API response: ${error.message}`);
    }
    
    // Create metadata about the search
    const metadata = {
      timestamp: new Date().toISOString(),
      company: company.name,
      jobTitlesSearched: jobTitles,
      resultCount: contacts.length,
      apiResponse: {
        model: responseData.model,
        usage: responseData.usage
      },
      executionTime: new Date().getTime() - startTime.getTime()
    };
    
    // Return the results
    return {
      contacts,
      metadata
    };
  } catch (error) {
    console.error("Error in Contact Finder node:", error);
    throw new Error(`Contact finder failed: ${error.message}`);
  }
};