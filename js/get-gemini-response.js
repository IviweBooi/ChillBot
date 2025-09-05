// This is our secure, server-side Netlify Function.

// Access the API key from Netlify's environment variables
const API_KEY = process.env.API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { userMessage } = JSON.parse(event.body);

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: userMessage }] }] }),
    });

    const data = await response.json();

    // Return the data from the Gemini API to the front-end
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};