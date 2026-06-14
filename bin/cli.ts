import * as path from "path";
import { Agent } from "../src/core/agent";
import { loadInstructions } from "../src/core/prompt";
import { createModelFromEnv } from "../src/providers/modelFactory";
import { editFile } from "../src/tools";
import { execCommand } from "../src/tools/execCommand";
import { readFile } from "../src/tools/readFile";
import { writeFile } from "../src/tools/writeFile";

async function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.log("Usage: npm start -- <input>");
		process.exit(1);
	}

	const userPrompt = args.join(" ");

	const model = createModelFromEnv();

	const workspaceRoot = path.resolve(process.cwd(), "workspace");

	const instructions = loadInstructions(workspaceRoot);

	const agent = new Agent({
		name: "nano-code",
		model,
		instructions,
		tools: {
			readFile,
			writeFile,
			editFile,
			execCommand,
		},
		maxSteps: 15,
		verbose: true,
	});

	console.log("エージェント起動...\n");
	console.log("ユーザープロンプト:", userPrompt, "\n");
	console.log("---".repeat(30), "\n");

	try {
		const result = await agent.generate(userPrompt);
		console.log(result.text);
		console.log("\n--- エージェント実行完了 ---");
		console.log("タスク完了");
	} catch (error: any) {
		console.error("エージェント実行中にエラーが発生:", error.message);
		process.exit(1);
	}
}

main();
