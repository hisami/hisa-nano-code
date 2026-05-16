import { generateText } from "../src/core/generate-text";
import { createGoogle } from "../src/providers/google";

const google = createGoogle();
const result = await generateText({
	model: google("gemini-2.5-flash"),
	messages: [{ role: "user", content: "今日は何月何日?" }],
});
console.log(result.text);
