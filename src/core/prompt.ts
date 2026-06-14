import * as fs from "fs";
import * as path from "path";

export function loadInstructions(workspaceRoot: string): string {
	const basePath = path.resolve(__dirname, "prompt.md");
	const base = fs.readFileSync(basePath, "utf-8");

	// AGENTS.mdを読み込む
	const agentsPath = path.resolve(workspaceRoot, "AGENTS.md");
	if (fs.existsSync(agentsPath)) {
		const agentsMd = fs.readFileSync(agentsPath, "utf-8");
		return `${base}\n\n## プロジェクト固有の指示\n\n${agentsMd}`;
	}
	return base;
}
