/**
 * Email Discovery Node Executor
 * 
 * This is the execution logic for the Email Discovery node.
 * It discovers and verifies email addresses for contacts.
 */

import { defaultData } from './definition';

export { defaultData };

// Define the node data structure (should match the one in UI)
export interface EmailDiscoveryNodeData {
  includeVerification: boolean;
  useDomainPatterns: boolean;
  includeConfidenceScore: boolean;
  maxAttempts: number;
  emailFormats: string[];
}

/**
 * Execute the email discovery node
 */
export const execute = async (
  data: EmailDiscoveryNodeData, 
  inputs: Record<string, any>
): Promise<Record<string, any>> => {
  try {
    const startTime = new Date();
    
    // Get input contact data
    const contact = inputs.contact;
    let domain = inputs.domain;
    
    // Check if we have valid contact data
    if (!contact || !contact.name) {
      throw new Error("No valid contact data provided. Input must include at least a contact name.");
    }
    
    // Extract first name and last name from the contact name
    let firstName = '';
    let lastName = '';
    
    if (contact.name) {
      const nameParts = contact.name.split(' ');
      firstName = nameParts[0].toLowerCase();
      lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';
    }
    
    // Get company domain from contact or input
    if (!domain) {
      if (contact.company && typeof contact.company === 'object' && contact.company.website) {
        domain = extractDomainFromUrl(contact.company.website);
      } else if (contact.email) {
        domain = contact.email.split('@')[1];
      } else if (contact.company && typeof contact.company === 'string') {
        // Try to derive domain from company name
        domain = convertCompanyNameToDomain(contact.company);
      } else {
        throw new Error("No domain provided and couldn't derive one from contact data.");
      }
    }
    
    // Generate possible email addresses
    const possibleEmails = generateEmailAddresses(firstName, lastName, domain, data.emailFormats);
    
    // Use Perplexity API to predict the most likely email format
    let predictedEmail = '';
    let verificationStatus = 'unknown';
    let confidenceScore = 0;
    
    // Construct the prompt for the Perplexity API
    const prompt = `I need to find the business email address for ${contact.name} who works at ${contact.company || 'a company'} with domain ${domain}.
    
    Based on the information provided, what is the most likely email address format?
    
    Here are some candidates:
    ${possibleEmails.join('\n')}
    
    Please analyze common email patterns for this domain and predict which format is most likely correct.
    Return your answer as a JSON object with the following fields:
    - email: The most likely email address
    - confidence: A number between 0 and 1 representing your confidence level
    - explanation: A brief explanation of why you chose this format
    
    Format your response as valid JSON only with no additional text.`;
    
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
            content: "You are an expert at email address discovery and verification. You understand common email patterns used by companies and can predict the most likely email format used at a particular domain."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
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
    try {
      // Find a JSON object in the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      let result;
      
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to trying to parse the whole response if no JSON is found
        result = JSON.parse(responseText);
      }
      
      predictedEmail = result.email || '';
      confidenceScore = parseFloat(result.confidence) || 0.5;
      
      // Simple verification check - just make sure the email format is valid
      verificationStatus = isValidEmail(predictedEmail) ? 'valid_format' : 'invalid_format';
      
    } catch (error) {
      console.error("Error parsing API response:", error);
      console.log("Response text:", responseText);
      
      // Fallback to the most common format
      predictedEmail = possibleEmails[0];
      confidenceScore = 0.3;
      verificationStatus = 'fallback';
    }
    
    // Create result with the enriched contact
    const enrichedContact = {
      ...contact,
      email: predictedEmail,
      emailVerificationStatus: verificationStatus,
      emailConfidence: confidenceScore
    };
    
    // Create metadata about the discovery process
    const metadata = {
      timestamp: new Date().toISOString(),
      domain: domain,
      emailCandidates: possibleEmails,
      verificationStatus: verificationStatus,
      confidenceScore: confidenceScore,
      apiResponse: {
        model: responseData.model,
        usage: responseData.usage
      },
      executionTime: new Date().getTime() - startTime.getTime()
    };
    
    // Return the results
    return {
      contact: enrichedContact,
      metadata
    };
  } catch (error) {
    console.error("Error in Email Discovery node:", error);
    throw new Error(`Email discovery failed: ${error.message}`);
  }
};

/**
 * Helper function to extract domain from URL
 */
function extractDomainFromUrl(url: string): string {
  try {
    // Remove protocol (http://, https://, etc.)
    let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Remove path, query parameters, and hash
    domain = domain.split('/')[0];
    
    return domain;
  } catch (error) {
    console.error("Error extracting domain from URL:", error);
    return url;
  }
}

/**
 * Helper function to convert company name to domain
 */
function convertCompanyNameToDomain(companyName: string): string {
  try {
    // Remove legal entity types (e.g., Inc., LLC)
    let name = companyName.replace(/\s+(Inc\.?|LLC|Corp\.?|Corporation|Ltd\.?)$/i, '');
    
    // Remove spaces, convert to lowercase, and replace special characters
    name = name.toLowerCase()
      .replace(/[^\w\s]/gi, '')  // Remove special characters
      .replace(/\s+/g, '');      // Remove spaces
    
    return `${name}.com`;
  } catch (error) {
    console.error("Error converting company name to domain:", error);
    return `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
  }
}

/**
 * Helper function to generate possible email addresses
 */
function generateEmailAddresses(firstName: string, lastName: string, domain: string, formats: string[]): string[] {
  const results: string[] = [];
  
  // Clean up the inputs
  firstName = firstName.toLowerCase().trim();
  lastName = lastName.toLowerCase().trim();
  domain = domain.toLowerCase().trim();
  
  // Make sure domain doesn't include protocol or www
  domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // For each format, generate the email
  formats.forEach(format => {
    let email = format;
    
    // Replace placeholders with actual values
    email = email.replace(/first/g, firstName);
    email = email.replace(/last/g, lastName);
    email = email.replace(/f/g, firstName.charAt(0));
    email = email.replace(/l/g, lastName.charAt(0));
    
    // Replace domain placeholder with actual domain
    email = email.replace(/domain\.com/g, domain);
    
    // If domain already includes .com but email has @domain.com, adjust
    if (domain.includes('.') && email.includes('@domain.com')) {
      email = email.replace(/@domain\.com/g, `@${domain}`);
    }
    
    // If email doesn't have @ symbol, add it with domain
    if (!email.includes('@')) {
      email = `${email}@${domain}`;
    }
    
    results.push(email);
  });
  
  return results;
}

/**
 * Helper function to check if email format is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}