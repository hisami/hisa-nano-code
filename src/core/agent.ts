import type { LanguageModel, Message, Tool } from "../types";
import { requestApproval } from "./approval";
import { generateText } from "./generate-text";

interface AgentConfig {
	name: string;
	instructions: string;
	model: LanguageModel;
	tools: Record<string, Tool>;
	maxSteps?: number;
	verbose?: boolean;
	approvalFunc?: (toolName: string, args: any) => Promise<boolean>;
}

// ツール実行関数
async function executeTool(tool: Tool, args: any): Promise<string> {
	try {
		return await tool.execute(args);
	} catch (e) {
		return `ツールの実行中にエラーが発生しました: ${(e as Error).message}`;
	}
}

export class Agent {
	private name: string;
	private instructions: string;
	private model: LanguageModel;
	private tools: Tool[];
	private maxSteps = 10;
	private verbose = false;
	private approvalFunc: (toolName: string, args: any) => Promise<boolean>;
	constructor(config: AgentConfig) {
		this.name = config.name;
		this.instructions = config.instructions;
		this.model = config.model;
		this.tools = Object.values(config.tools);
		this.maxSteps = config.maxSteps ?? 10;
		this.verbose = config.verbose ?? false;
		this.approvalFunc = config.approvalFunc ?? requestApproval;
	}

	async generate(usePrompt: string): Promise<{ text: string }> {
		const messages: Message[] = [
			{ role: "system", content: this.instructions },
			{ role: "user", content: usePrompt },
		];

		let currentStep = 0;
		let finalText = "";
		let toolCallCount = 0;

		while (currentStep < this.maxSteps) {
			currentStep++;

			if (this.verbose) {
				console.log(`Step ${currentStep}/${this.maxSteps}`);
			}

			const response = await generateText({
				model: this.model,
				messages,
				tools: this.tools,
			});

			// テキスト応答を保存
			if (response.text) {
				finalText = response.text;
				if (this.verbose) {
					console.log("LLM Response:", response.text);
				}
			}

			// ステップ2:ツール実行
			if (response.toolCalls && response.toolCalls.length > 0) {
				messages.push({
					role: "assistant",
					content: response.text || "",
					toolCalls: response.toolCalls,
				});

				for (const toolCall of response.toolCalls) {
					const tool = this.tools.find((t) => t.name === toolCall.name);
					if (!tool) {
						messages.push({
							role: "tool",
							toolCallId: toolCall.toolCallId,
							name: toolCall.name,
							content: `エラー: ツールが見つかりません - ${toolCall.name}`,
						});
						continue;
					}

					if (this.verbose) {
						console.log("Executing tool:", toolCall.name, toolCall.args);
					}

					// ステップ3:承認チェック
					if (tool.needsApproval) {
						const approved = await this.approvalFunc(
							toolCall.name,
							toolCall.args,
						);
						if (!approved) {
							messages.push({
								role: "tool",
								toolCallId: toolCall.toolCallId,
								name: toolCall.name,
								content: `ツールの実行が承認されませんでした - ${toolCall.name}`,
							});
							continue;
						}
					}

					// ツール実行
					const result = await executeTool(tool, toolCall.args);
					toolCallCount++;

					if (this.verbose) {
						console.log(`Tool result for ${toolCall.name}:`, result);
					}
					messages.push({
						role: "tool",
						toolCallId: toolCall.toolCallId,
						name: toolCall.name,
						content: result,
					});
				}
				continue;
			}
			// ツール呼び出しがない場合は完了
			messages.push({ role: "assistant", content: response.text || "" });
			break;
		}

		// ループ終了後のチェック
		if (currentStep >= this.maxSteps) {
			console.warn(
				"最大ステップ数に達しました。ツール呼び出しが完了していない可能性があります。",
			);
		}
		// ツール未使用で終了した場合の警告
		if (toolCallCount === 0) {
			console.warn(
				"ツールが呼び出されませんでした。LLMの応答を確認してください。",
			);
		}

		return { text: finalText };
	}
}
