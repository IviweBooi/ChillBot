// This file contains the logic for communicating with the Gemini API.

/**
 * Sends a message to the Gemini API and returns the response.
 * @param {string} userMessage The message from the user.
 * @returns {Promise<string>} The text response from the AI.
 */
async function getGeminiResponse(userMessage) {
  // The front-end now calls our own serverless function
  const url = `/.netlify/functions/get-gemini-response`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // We send the user's message in the body
      body: JSON.stringify({ userMessage: userMessage }),
    });

    // Check if the response from the Netlify function was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Netlify function error: ${response.status} ${response.statusText}`, errorText);
      return "I'm sorry, but I couldn't get a response from the server. This can happen if the request times out. Please try again.";
    }
    const data = await response.json();

    // Add a robust check to ensure the response has the expected structure.
    if (data && data.candidates && data.candidates.length > 0) {
      const firstCandidate = data.candidates[0];
      if (firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.length > 0) {
        return firstCandidate.content.parts[0].text;
      }
    }

    // If the structure is not as expected, log it and return a graceful error message.
    console.error("Invalid response structure from Gemini API:", data);
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      return `I'm sorry, I can't respond to that. My safety filters were triggered. Reason: ${data.promptFeedback.blockReason}.`;
    }
    return "I'm having a little trouble thinking right now. Could you try rephrasing your message?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble connecting right now. Please try again in a moment.";
  }
}