import 'dotenv/config';

async function testPerplexityApi() {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      console.error('Error: PERPLEXITY_API_KEY environment variable is not set');
      return;
    }
    
    const apiUrl = 'https://api.perplexity.ai/chat/completions';
    const requestBody = {
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { 
          role: 'system', 
          content: 'You are a business research assistant. Provide accurate information.'
        },
        { 
          role: 'user', 
          content: 'Find information about top health insurance companies in the USA.'
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Extract the response text
    const responseText = data.choices?.[0]?.message?.content || '';
    console.log('\nExtracted response:\n', responseText);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPerplexityApi();
