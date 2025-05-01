/**
 * Perplexity API Integration Service
 * 
 * This module provides functions to interact with the Perplexity API
 * for getting company and contact information based on search queries.
 */

import fetch from 'node-fetch';

/**
 * Class to manage Perplexity API requests
 */
export class PerplexityService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('Perplexity API key is required. Set PERPLEXITY_API_KEY environment variable.');
    }
    
    this.baseUrl = 'https://api.perplexity.ai/chat/completions';
    this.defaultModel = 'llama-3.1-sonar-small-128k-online'; 
  }
  
  /**
   * Search for company and contact information
   * 
   * @param {string} query - The search query (e.g., "marketing agencies in Atlanta")
   * @param {string} context - Additional context to refine the search
   * @param {number} maxResults - Maximum number of companies to return
   * @returns {Promise<object>} - Structured company and contact data
   */
  async searchCompanies(query, context = '', maxResults = 5) {
    try {
      console.log(`Searching for companies with query: "${query}"`);
      
      // Construct the search prompt for company and contact information
      const searchPrompt = `
        I need information about companies and their key contacts.
        
        Search query: "${query}"
        
        ${context ? `Additional context: ${context}` : ''}
        
        Please find the top ${maxResults} most relevant companies, with these details for each:
        - Company name
        - Website URL
        - Industry sector
        - Location (city and state/country)
        - Company size (approximate employee count)
        - Year founded (if available)
        
        For each company, provide key contact information for 1-3 decision makers:
        - Full name
        - Job title
        - Email address (if available, or use a standard format like firstname.lastname@domain.com)
        - Phone number (if available)
        - LinkedIn profile URL (if available)
        
        Format your answer as structured data only, no introductions or explanations.
      `;
      
      // Make API request to Perplexity
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that specializes in finding accurate information about companies and business contacts. Provide specific details and structured data about companies and their executives based on search queries.'
            },
            {
              role: 'user',
              content: searchPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000,
          search_recency_filter: 'month',
          search_domain_filter: ['linkedin.com', 'crunchbase.com', 'bloomberg.com', 'dnb.com', 'forbes.com', 'inc.com'],
          stream: false
        })
      });
      
      const responseData = await response.json();
      
      // Extract the content from the response
      const content = responseData.choices?.[0]?.message?.content || '';
      
      // Parse the response to extract structured company and contact data
      const extractedData = this.extractStructuredData(content);
      
      return {
        success: true,
        query,
        results: extractedData,
        rawResponse: responseData,
        citations: responseData.citations || []
      };
    } catch (error) {
      console.error('Error searching companies with Perplexity:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Extract structured company and contact data from Perplexity's markdown response
   * 
   * Note: This is a simplified parser to extract structured data from the markdown
   * response. A more robust parser would use a more sophisticated approach.
   * 
   * @param {string} markdownContent - The markdown content from Perplexity
   * @returns {object} - Structured company and contact data
   */
  extractStructuredData(markdownContent) {
    try {
      // For this proof of concept, we'll return a simplified parsing
      // In a production environment, we would parse the markdown more carefully
      
      // Example structure to match the 5 Ducks format
      const companies = [];
      const contacts = [];
      
      // Split the content by company sections (usually marked with #### headers)
      const companyBlocks = markdownContent.split(/####\s+\d+\.\s+\*\*([^*]+)\*\*/);
      
      // Skip the first element which is usually blank
      for (let i = 1; i < companyBlocks.length; i += 2) {
        if (i + 1 >= companyBlocks.length) break;
        
        const companyName = companyBlocks[i].trim();
        const companyData = companyBlocks[i + 1].trim();
        
        // Extract company details
        const websiteMatch = companyData.match(/Website URL[^:]*:\s*([^\n]+)/);
        const industryMatch = companyData.match(/Industry Sector[^:]*:\s*([^\n]+)/);
        const locationMatch = companyData.match(/Location[^:]*:\s*([^\n]+)/);
        const sizeMatch = companyData.match(/Company Size[^:]*:\s*([^\n]+)/);
        const foundedMatch = companyData.match(/Year Founded[^:]*:\s*(\d+)/);
        
        const company = {
          name: companyName,
          website: websiteMatch ? websiteMatch[1].trim() : '',
          industry: industryMatch ? industryMatch[1].trim() : '',
          location: locationMatch ? locationMatch[1].trim() : '',
          size: sizeMatch ? sizeMatch[1].trim() : '',
          foundedYear: foundedMatch ? parseInt(foundedMatch[1].trim()) : null
        };
        
        companies.push(company);
        
        // Extract contacts
        const contactBlocks = companyData.split(/\*\*Key Contacts:\*\*|\*\*([^*]+)\*\*/g);
        
        for (let j = 3; j < contactBlocks.length; j += 2) {
          if (j + 1 >= contactBlocks.length) break;
          
          const contactName = contactBlocks[j].trim();
          const contactData = contactBlocks[j + 1].trim();
          
          const titleMatch = contactData.match(/Job Title[^:]*:\s*([^\n]+)/);
          const emailMatch = contactData.match(/Email Address[^:]*:\s*([^\n]+)/);
          const phoneMatch = contactData.match(/Phone Number[^:]*:\s*([^\n]+)/);
          const linkedinMatch = contactData.match(/LinkedIn Profile URL[^:]*:\s*([^\n]+)/);
          
          if (contactName && titleMatch) {
            const contact = {
              name: contactName,
              title: titleMatch ? titleMatch[1].trim() : '',
              email: emailMatch ? emailMatch[1].trim() : '',
              phone: phoneMatch ? phoneMatch[1].trim() : '',
              linkedin: linkedinMatch ? linkedinMatch[1].trim() : '',
              company: companyName
            };
            
            contacts.push(contact);
          }
        }
      }
      
      return {
        companies,
        contacts
      };
    } catch (error) {
      console.error('Error extracting structured data:', error);
      // Return a basic structure in case of parsing failure
      return {
        companies: [],
        contacts: []
      };
    }
  }
}

// Export a singleton instance for easy import
let perplexityService = null;

export function getPerplexityService() {
  if (!perplexityService) {
    perplexityService = new PerplexityService();
  }
  return perplexityService;
}

export default getPerplexityService;