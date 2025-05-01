/**
 * Test Script for Perplexity API Integration with SearchID Preservation
 * 
 * This script tests the full workflow for the 5 Ducks integration
 * with real Perplexity API search results while preserving the searchId.
 */

require('dotenv').config();
const fetch = require('node-fetch');

async function searchPerplexity(query, searchId, callbackUrl) {
  console.log(`Testing Perplexity API search for query: "${query}" with searchId: ${searchId}`);
  
  // System prompt for consistent, structured company data
  const systemPrompt = `You are a helpful assistant that specializes in finding accurate information about companies and business contacts. 
Provide specific details and structured data about companies and their executives based on search queries.`;

  // User prompt formulated for company search
  const userPrompt = `
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

  // Check if PERPLEXITY_API_KEY is available
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error("PERPLEXITY_API_KEY is not set in environment variables");
    throw new Error("PERPLEXITY_API_KEY is required");
  }

  try {
    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1024,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract response content
    const content = data.choices[0].message.content;
    console.log("Perplexity API response content:", content);
    
    // Parse the text response to structured data
    // Note: In a real application, you would have more robust parsing
    // This is a simplified version assuming the content is structured
    const companies = extractCompanies(content);
    
    // Now, let's send the results back to the callback URL
    // with the searchId preserved
    const callbackResponse = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchId: searchId,
        results: { 
          companies: companies
        },
        source: "perplexity_api"
      })
    });
    
    if (!callbackResponse.ok) {
      throw new Error(`Callback HTTP error! status: ${callbackResponse.status}`);
    }
    
    const callbackData = await callbackResponse.json();
    console.log("Callback response:", callbackData);
    
    console.log("============================================");
    console.log("Test completed successfully!");
    console.log(`SearchId "${searchId}" was preserved and sent back to ${callbackUrl}`);
    console.log("============================================");
    
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Helper function to roughly extract company data from the text response
// In a real application, you would have a more robust parser
function extractCompanies(content) {
  // This is a simplified version - in reality, you'd want more robust parsing
  // or have the LLM output JSON directly
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

// Run the test
const searchId = `test_${Date.now()}`;
const query = "renewable energy companies in California";
const callbackUrl = "https://b583ab2d-d622-4068-baa1-f0925606ed0a-00-1jadsml3yljop.riker.replit.dev/api/webhooks/search-results";

searchPerplexity(query, searchId, callbackUrl);