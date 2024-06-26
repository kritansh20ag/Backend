const { OpenAI } = require("openai");

const OPENAI_API_KEY =
  "LL-UiYB8usBM29Uim27DcyWXDZlEVjgCF1bYlsX7gMnJ0vaH8krZZ1lkv6gDJwJHVDB";

const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
  baseURL: "https://api.llama-api.com",
});

async function processEmail(props) {
  try {
    const requestData = {
      model: "llama-7b-chat",
      messages: [
        {
          role: "user",
          content: `${props.snippet}
          This is the mail I have received. I want to know the state of this mail. There are 3 options available to you:
          1. Interested
          2. Not interested
          3. On hold
          
          Select the most suitable state from the above 3 and respond with the state. If the state is "1" (Interested), also generate an appropriate reply based on the email snippet. Format your response as:
          
          State: [state]
          Reply: [reply (only if state is "1")]
          `,
        },
      ],
    };

    const response = await client.chat.completions.create(requestData);
    const fullResponse = response.choices[0].message.content.trim();

    // Extract state and reply from the response
    const stateMatch = fullResponse.match(/State:\s*(\d)/);
    const replyMatch = fullResponse.match(/Reply:\s*(.*)/);

    const state = stateMatch ? stateMatch[1] : "Error";
    const reply = replyMatch ? replyMatch[1] : "";

    return { state, reply }; // Return both the state and the reply
  } catch (error) {
    console.error("Error:", error);
    return { state: "Error", reply: "Error generating reply" }; // Return default values on error
  }
}

module.exports = { processEmail };
