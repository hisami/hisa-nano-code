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

callAnthropicAI();