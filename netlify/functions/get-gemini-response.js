const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the request body
    const { userMessage } = JSON.parse(event.body);
    
    if (!userMessage) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'No message provided' }) 
      };
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Generate content
    const result = await model.generateContent(userMessage);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: text
            }]
          }
        }]
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process your request',
        details: error.message 
      })
    };
  }
};
