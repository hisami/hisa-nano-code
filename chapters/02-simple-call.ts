async function callAnthropicAI(){
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': `${process.env.ANTHROPIC_API_KEY}`
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      messages: [
        { role: "user", content: "What is the capital of France?" }
      ]
    })
  });

  const data = await response.json();
  console.log(data);
}

async function callGoogleAI() {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "What is the capital of France?" }
            ]
          }
        ]
      })
    }
  );

  const data = await response.json();
  console.log(data.candidates[0].content.parts[0].text);
}

callGoogleAI();

// callAnthropicAI();