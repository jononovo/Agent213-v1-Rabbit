# Lead Generation Workflow Suite

This documentation explains how to use the lead generation workflow suite to automate the process of finding companies, identifying key decision makers, and discovering their contact information.

## Overview

The lead generation suite consists of four interconnected workflows:

1. **Company Search Workflow**: Discovers companies based on search criteria
2. **Contact Finder Workflow**: Identifies key decision makers at target companies
3. **Email Discovery Workflow**: Discovers and verifies email addresses for contacts
4. **Lead Generation Master Workflow**: Orchestrates the entire process

## Workflow Details

### Company Search Workflow

This workflow uses the Perplexity API to search for companies based on user-provided criteria.

**Inputs:**
- Search query text (e.g., "Tech companies in Healthcare with 50-200 employees")

**Process:**
1. Takes a text input with search criteria
2. Passes it to the Company Search node
3. Processes the results with a JSON parser
4. Passes the structured company data to the next workflow

**Outputs:**
- Array of company objects with the following properties:
  - name
  - website
  - industry (if requested)
  - employeeCount (if requested)
  - revenue (if requested)
  - funding (if requested)
  - description (if requested)

### Contact Finder Workflow

This workflow identifies key decision makers at the companies discovered in the previous step.

**Inputs:**
- Company object from the Company Search workflow

**Process:**
1. Takes a company object as input
2. Uses the Contact Finder node to discover key personnel
3. Processes the results with a JSON parser
4. Passes the structured contact data to the next workflow

**Outputs:**
- Array of contact objects with the following properties:
  - name
  - title
  - company
  - linkedIn (if requested)
  - email (if discovered)
  - phone (if requested)

### Email Discovery Workflow

This workflow discovers and verifies email addresses for the contacts identified in the previous step.

**Inputs:**
- Contact object from the Contact Finder workflow

**Process:**
1. Takes a contact object as input
2. Transforms the data into the format needed for email discovery
3. Uses the Email Discovery node to predict and verify email addresses
4. Processes the results and formats them for output
5. Generates a CSV file with all lead information

**Outputs:**
- Contact objects enriched with:
  - email
  - emailVerificationStatus
  - emailConfidence
- CSV file with all lead data

### Lead Generation Master Workflow

This workflow orchestrates the entire lead generation process, connecting all three workflows together.

**Inputs:**
- Company search query
- Target job titles (comma-separated)

**Process:**
1. Takes user inputs for search criteria and job titles
2. Triggers the Company Search workflow
3. Checks if companies were found
4. Triggers the Contact Finder workflow with company data
5. Checks if contacts were found
6. Triggers the Email Discovery workflow with contact data
7. Sends the final lead data to an external API (optional)

**Outputs:**
- Complete lead generation dataset ready for export or integration

## Usage Instructions

1. **Import the Workflows**: Use the Lead Generation Workflow Import component to import all workflows
2. **Configure the Master Workflow**: Update the HTTP Request node with your API endpoint details if needed
3. **Run the Master Workflow**: Execute the Lead Generation Master workflow
4. **Enter Search Criteria**: Provide company search criteria and target job titles
5. **Review Results**: Check the results at each step of the process

## Configuration Options

### Company Search Node
- Include industry information
- Include employee count
- Include revenue information
- Include funding information
- Include company descriptions
- Maximum number of results

### Contact Finder Node
- Target job titles
- Include LinkedIn profiles
- Include email addresses
- Include phone numbers
- Maximum number of contacts per company
- Prioritize leadership positions

### Email Discovery Node
- Include verification
- Use domain patterns
- Include confidence scores
- Maximum attempts
- Email format patterns

## API Integration

The final step in the Master workflow includes an HTTP Request node that can send the lead data to an external API. Update the following settings to connect with your CRM or lead management system:

```json
{
  "url": "https://your-api-endpoint.com/leads",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  }
}
```

## Troubleshooting

- **No Companies Found**: Try broadening your search criteria or using more general terms
- **No Contacts Found**: Check if the company names and websites are correct
- **Email Discovery Issues**: Verify that company domains are valid
- **API Integration Errors**: Check your API key and endpoint URL

## Dependencies

This workflow suite requires:
- Perplexity API Key (set as an environment variable)
- Internet access for API calls