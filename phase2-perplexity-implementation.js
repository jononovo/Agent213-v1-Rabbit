/**
 * Phase 2 Implementation: Perplexity API Integration
 * 
 * This is a complete implementation for the Phase 2 of the 5 Ducks integration
 * which uses the Perplexity API to fetch real-time search results while
 * preserving the searchId throughout the workflow.
 * 
 * To implement this, we need to:
 * 1. Update the function node code to extract the query and searchId
 * 2. Add a perplexity_api node to perform the real search
 * 3. Format the perplexity response into the structure expected by 5 Ducks
 * 4. Send the properly formatted response to the 5 Ducks callback URL
 */

// STEP 1: Function Node Code
// This will extract searchId and prepare data for Perplexity API
const functionNodeCode = `
function process(input) {
  console.log("Processing 5 Ducks webhook data:", JSON.stringify(input, null, 2));
  
  // Extract data from webhook input
  let searchId, query, callbackUrl;
  
  // Handle different potential input structures
  if (input.body && typeof input.body === 'object') {
    // Extract from body (common webhook trigger format)
    searchId = input.body.searchId;
    query = input.body.query;
    callbackUrl = input.body.callbackUrl;
  } else if (input.searchId) {
    // Direct access if already extracted
    searchId = input.searchId;
    query = input.query;
    callbackUrl = input.callbackUrl;
  } else if (typeof input === 'object') {
    // Try to access directly from input
    searchId = input.searchId;
    query = input.query;
    callbackUrl = input.callbackUrl;
  }
  
  // Validate critical fields
  if (!searchId) {
    console.error("Error: Missing searchId in webhook data");
    throw new Error("Missing searchId in webhook data");
  }
  
  if (!query) {
    console.error("Error: Missing query in webhook data");
    throw new Error("Missing query in webhook data");
  }
  
  console.log(\`Extracted searchId: \${searchId}, query: \${query}\`);
  
  // Create a response object for the Perplexity API node
  const output = {
    // Include the searchId for preservation through the workflow
    searchId: searchId,
    
    // Include the query for the Perplexity API
    query: query,
    
    // Include the callbackUrl for the send_to_webhook node
    callbackUrl: callbackUrl,
    
    // Create a prompt for the Perplexity API
    prompt: \`
      I need information about companies and their key contacts related to this query:
      "\${query}"
      
      Please find the top 5 most relevant companies, with these details for each:
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
    \`,
    
    // Provide a system prompt for consistent results
    systemPrompt: "You are a helpful assistant that specializes in finding accurate information about companies and business contacts. Provide specific details and structured data about companies and their executives based on search queries."
  };
  
  console.log("Function node output:", JSON.stringify(output, null, 2));
  return output;
}`;

// STEP 2: Perplexity API Node Settings
const perplexityNodeSettings = {
  "model": "llama-3.1-sonar-small-128k-online",
  "temperature": 0.2,
  "maxTokens": 1024,
  "streamResponse": false
};

// STEP 3: Response Formatting Function Node Code
// This will take Perplexity API output and format it for 5 Ducks
const formattingFunctionCode = `
function process(input) {
  console.log("Formatting Perplexity API response:", JSON.stringify(input, null, 2));
  
  // Extract searchId and callbackUrl (critical for data flow)
  const searchId = input.searchId || input.metadata?.searchId;
  const callbackUrl = input.callbackUrl || input.metadata?.callbackUrl;
  
  if (!searchId) {
    console.error("Error: Missing searchId in Perplexity API response");
    throw new Error("Missing searchId in Perplexity API response");
  }
  
  // Extract content from Perplexity API response
  let content = "";
  if (input.content) {
    content = input.content;
  } else if (input.choices && input.choices[0] && input.choices[0].message) {
    content = input.choices[0].message.content;
  } else if (typeof input.output === 'string') {
    content = input.output;
  }
  
  // Function to parse the text into structured company and contact data
  function parseContent(text) {
    try {
      // First try to parse as JSON
      try {
        const parsed = JSON.parse(text);
        if (parsed.companies || parsed.contacts) {
          return parsed;
        }
      } catch (e) {
        // Not valid JSON, continue with text parsing
      }
      
      // Parse text-based response
      const companies = [];
      const contacts = [];
      
      // Split by numbered sections (common format from Perplexity)
      const companyBlockRegex = /\\d+\\.\\s+([^\\n]+)[\\s\\S]*?(?=\\d+\\.|$)/g;
      let companyMatch;
      
      while ((companyMatch = companyBlockRegex.exec(text)) !== null) {
        const companyBlock = companyMatch[0];
        const companyName = companyMatch[1].trim();
        
        // Extract company details
        const company = {
          name: companyName,
          website: extractValue(companyBlock, "Website", "\\S+"),
          industry: extractValue(companyBlock, "Industry", "[^\\n]+"),
          location: extractValue(companyBlock, "Location", "[^\\n]+"),
          size: extractValue(companyBlock, "Size", "[^\\n]+") || 
                extractValue(companyBlock, "Company size", "[^\\n]+"),
          founded: extractValue(companyBlock, "Founded", "\\d+") || 
                  extractValue(companyBlock, "Year founded", "\\d+")
        };
        
        companies.push(company);
        
        // Extract contacts for this company
        const contactsSection = extractSection(companyBlock, "Key contacts|Contacts");
        if (contactsSection) {
          const contactRegex = /(.*?):\\s*([^\\n]*)/g;
          let currentContact = { company: companyName };
          let lastField = "";
          
          let match;
          while ((match = contactRegex.exec(contactsSection)) !== null) {
            const field = match[1].trim();
            const value = match[2].trim();
            
            if (field.includes("Name") || field === "1" || field === "2" || field === "3") {
              // If we have a previous contact with data, save it
              if (currentContact.name) {
                contacts.push(currentContact);
                currentContact = { company: companyName };
              }
              
              // This is a name field
              currentContact.name = value;
              lastField = "name";
            } else if (field.includes("Title") || field.includes("Position")) {
              currentContact.title = value;
              lastField = "title";
            } else if (field.includes("Email")) {
              currentContact.email = value;
              lastField = "email";
            } else if (field.includes("Phone")) {
              currentContact.phone = value;
              lastField = "phone";
            } else if (field.includes("LinkedIn")) {
              currentContact.linkedin = value;
              lastField = "linkedin";
            } else {
              // If no recognizable field, it might be a continuation
              if (lastField && !value) {
                currentContact[lastField] += " " + field.trim();
              }
            }
          }
          
          // Add the last contact if it has a name
          if (currentContact.name) {
            contacts.push(currentContact);
          }
        }
      }
      
      return { companies, contacts };
    } catch (error) {
      console.error("Error parsing Perplexity response:", error);
      return { 
        companies: [{ name: "Error parsing response", industry: "Unknown" }],
        contacts: [] 
      };
    }
  }
  
  // Helper functions for text extraction
  function extractValue(text, label, pattern) {
    const regex = new RegExp(label + "\\s*:\\s*(" + pattern + ")", "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }
  
  function extractSection(text, sectionLabels) {
    const regex = new RegExp("(?:" + sectionLabels + ")\\s*:([\\s\\S]*?)(?=\\n\\s*\\S+\\s*:|$)", "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  }
  
  // Parse the content into structured data
  const parsedData = parseContent(content);
  
  // Create a 5 Ducks compatible response
  const response = {
    searchId: searchId,
    status: "completed",
    results: {
      companies: parsedData.companies || [],
      contacts: parsedData.contacts || []
    },
    callbackUrl: callbackUrl
  };
  
  console.log("Formatted response for 5 Ducks:", JSON.stringify(response, null, 2));
  return response;
}`;

// STEP 4: Implementation instructions
console.log(`
PHASE 2 IMPLEMENTATION INSTRUCTIONS

This file contains the implementation code for Phase 2 of the 5 Ducks integration,
which uses the Perplexity API to fetch real-time search results while preserving
the searchId throughout the workflow.

TO IMPLEMENT PHASE 2:

1. Update your workflow to include these nodes:
   a. webhook_trigger → Receives the initial request from 5 Ducks
   b. function_node (preprocessing) → Extracts searchId, query, and formats data for Perplexity
   c. perplexity_api → Performs the actual search using real data
   d. function_node (formatting) → Formats the Perplexity response for 5 Ducks
   e. send_to_webhook → Sends the formatted response to the 5 Ducks callback URL

2. Configure each node:
   a. In the first function_node, paste the functionNodeCode
   b. Configure the perplexity_api node with the settings shown in perplexityNodeSettings
   c. In the second function_node, paste the formattingFunctionCode
   d. Configure the send_to_webhook node to send to the callbackUrl from the input data

3. IMPORTANT: Make sure the PERPLEXITY_API_KEY environment variable is set

4. Test the implementation using the test scripts provided

The workflow will now:
1. Receive a request from 5 Ducks with a searchId and query
2. Extract the searchId and preserve it throughout the workflow
3. Use the Perplexity API to get real search results
4. Format the results according to 5 Ducks' expected format
5. Send the response to the 5 Ducks callback URL with the searchId preserved
`);