/**
 * Perplexity API Node Executor
 * 
 * This node calls the Perplexity API to get real-time search results
 * while preserving the searchId throughout the workflow.
 */

async function execute(nodeData, inputData, context) {
  console.log("Perplexity API Node - Input data:", JSON.stringify(inputData, null, 2));
  console.log("Node settings:", JSON.stringify(nodeData.settings, null, 2));
  
  // Extract API key from environment variables
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY environment variable is required");
  }
  
  // Extract prompt from input data or settings
  let promptText, systemPrompt;
  
  // If input has explicit prompt and system values (from function node)
  if (inputData.prompt) {
    promptText = inputData.prompt;
    systemPrompt = inputData.system || "Be precise and concise.";
  } 
  // If node has settings for prompt
  else if (nodeData.settings?.prompt) {
    promptText = nodeData.settings.prompt;
    systemPrompt = nodeData.settings.systemPrompt || "Be precise and concise.";
  }
  // Check if we need to build a prompt from query
  else if (inputData.query || inputData.body?.query) {
    const query = inputData.query || inputData.body?.query;
    // Build structured prompt for company search
    promptText = `
      I need information about companies and their key contacts related to this query:
      "${query}"
      
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
    `;
    
    systemPrompt = "You are a helpful assistant that specializes in finding accurate information about companies and business contacts. Provide specific details and structured data about companies and their executives based on search queries.";
  } else {
    throw new Error("No prompt provided in input data or node settings");
  }
  
  // CRITICAL PART: Extract and preserve searchId
  let searchId;
  
  // Check for searchId in different possible locations
  if (inputData.searchId) {
    searchId = inputData.searchId;
  } else if (inputData.metadata?.searchId) {
    searchId = inputData.metadata.searchId;
  } else if (inputData.body?.searchId) {
    searchId = inputData.body.searchId;
  }
  
  console.log(`Extracted searchId for Perplexity API: ${searchId}`);
  
  // Extract callbackUrl (if available)
  let callbackUrl;
  if (inputData.callbackUrl) {
    callbackUrl = inputData.callbackUrl;
  } else if (inputData.metadata?.callbackUrl) {
    callbackUrl = inputData.metadata.callbackUrl;
  } else if (inputData.body?.callbackUrl) {
    callbackUrl = inputData.body.callbackUrl;
  }
  
  // Select model from settings or default
  const model = nodeData.settings?.model || "llama-3.1-sonar-small-128k-online";
  
  // Configure other parameters
  const temperature = parseFloat(nodeData.settings?.temperature || "0.2");
  const maxTokens = parseInt(nodeData.settings?.maxTokens || "1024");
  
  try {
    // Prepare request to Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: promptText
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
        top_p: 0.9,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Perplexity API Response:", JSON.stringify(data, null, 2));
    
    // Extract citations and content
    const citations = data.citations || [];
    const content = data.choices[0].message.content;
    
    // Extract companies from the content
    const companies = extractCompanies(content);
    
    // Create the structured output
    const output = {
      // Include the searchId in the output (critical!)
      searchId: searchId,
      
      // Include the callbackUrl (if available)
      callbackUrl: callbackUrl,
      
      // Include the companies data
      results: {
        companies: companies
      },
      
      // Preserve original metadata
      metadata: {
        ...(inputData.metadata || {}),
        searchId: searchId,
        citations: citations,
        model: model,
        rawContent: content
      }
    };
    
    console.log("Perplexity Node Output:", JSON.stringify(output, null, 2));
    return output;
    
  } catch (error) {
    console.error("Perplexity API Node Error:", error);
    throw error;
  }
}

// Helper function to extract company data from Perplexity API response
function extractCompanies(content) {
  try {
    // First, try to see if the content is already valid JSON
    try {
      const json = JSON.parse(content);
      if (json.companies) return json.companies;
      return json;
    } catch (e) {
      // Not JSON, continue with text extraction
    }
    
    // Split by numbered sections if content is formatted with numbers
    const companies = [];
    const sections = content.split(/\d+\.\s+/);
    
    // Skip the first section if it's empty (often is when split by numbers)
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i].trim();
      if (!section) continue;
      
      // Extract company info
      const company = {
        name: extractField(section, "Company name", "Website") || 
              extractField(section, "Name", "Website"),
        website: extractField(section, "Website", "Industry") || 
                extractField(section, "Website URL", "Industry"),
        industry: extractField(section, "Industry", "Location") || 
                extractField(section, "Industry sector", "Location"),
        location: extractField(section, "Location", "Company size") || 
                extractField(section, "Location", "Size"),
        size: extractField(section, "Company size", "Year founded") || 
              extractField(section, "Size", "Founded") || 
              extractField(section, "Company size", "Founded"),
        founded: extractField(section, "Year founded", "Key contacts") || 
                extractField(section, "Founded", "Key contacts") || 
                extractField(section, "Year founded", "Contacts") || 
                extractField(section, "Founded", "Contacts"),
        contacts: []
      };
      
      // Extract contacts
      const contactsSection = extractSection(section, "Key contacts", "") || 
                            extractSection(section, "Contacts", "");
                            
      if (contactsSection) {
        const contactLines = contactsSection.split("\n");
        let currentContact = {};
        
        for (const line of contactLines) {
          if (line.includes("Name:") || line.includes("Full name:")) {
            if (Object.keys(currentContact).length > 0) {
              company.contacts.push(currentContact);
              currentContact = {};
            }
            currentContact.name = line.split(":")[1].trim();
          } else if (line.includes("Title:") || line.includes("Job title:")) {
            currentContact.title = line.split(":")[1].trim();
          } else if (line.includes("Email:") || line.includes("Email address:")) {
            currentContact.email = line.split(":")[1].trim();
          } else if (line.includes("Phone:") || line.includes("Phone number:")) {
            currentContact.phone = line.split(":")[1].trim();
          } else if (line.includes("LinkedIn:") || line.includes("LinkedIn profile:")) {
            currentContact.linkedin = line.split(":")[1].trim();
          }
        }
        
        // Add the last contact
        if (Object.keys(currentContact).length > 0) {
          company.contacts.push(currentContact);
        }
      }
      
      companies.push(company);
    }
    
    return companies;
  } catch (error) {
    console.error("Error parsing company data:", error);
    // Return the raw content if parsing fails
    return [{ 
      name: "Parsing Error", 
      rawContent: content 
    }];
  }
}

// Helper to extract a field from text
function extractField(text, fieldName, nextFieldName) {
  const regex = new RegExp(`${fieldName}[:\\s]+(.*?)(?=\\s*${nextFieldName}[:\\s]|$)`, 's');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

// Helper to extract a section
function extractSection(text, sectionName, nextSectionName) {
  const regex = new RegExp(`${sectionName}[:\\s]+(.*?)(?=\\s*${nextSectionName}[:\\s]|$)`, 's');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

module.exports = { execute };