import { GoogleGenAI } from "@google/genai";
import type {
	GenerateParams,
	GenerateTextResult,
	LanguageModel,
	Message,
	Provider,
	ToolCall,
} from "../types";
import { LLMApiError } from "../types";

export function createGoogle(config?: { apiKey?: string }): Provider {
	const client = new GoogleGenAI({
		apiKey: config?.apiKey,
	});

	// メッセージをGoogle形式に変換
	function convertMessages(messages: Message[]) {
		return messages
			.filter((m) => m.role !== "system")
			.map((m) => {
				// ツール結果はuserロール + functionResponse
				if (m.role === "tool") {
					return {
						role: "user" as const,
						parts: [
							{
								functionResponse: {
									name: m.name,
									response: { result: m.content },
								},
							},
						],
					};
				}
				//assistantのツール呼び出し
				if (m.role === "assistant" && m.toolCalls) {
					const parts: any[] = [];
					if (m.content) {
						parts.push({ text: m.content });
					}
					for (const call of m.toolCalls) {
						parts.push({
							functionCall: {
								name: call.name,
								args: call.args,
							},
						});
					}
				}
				// 通常のメッセージ
				const role = m.role === "assistant" ? "model" : "user";
				return {
					role: role as "user" | "model",
					parts: [{ text: m.content }],
				};
			});
	}
	function mapFinishReason(
		finishReason: string | null | undefined,
		hasFunctionCall: boolean,
	): GenerateTextResult["finishReason"] {
		if (hasFunctionCall) {
			return "tool_calls";
		}
		const normalized = finishReason?.toUpperCase();
		switch (normalized) {
			case "STOP":
				return "stop";
			case "MAX_TOKENS":
				return "length";
			case "SAFETY":
			case "RECITATION":
				return "content_filter";
			default:
				return "stop";
		}
	}

	return (modelId: string): LanguageModel => ({
		async doGenerate(params: GenerateParams): Promise<GenerateTextResult> {
			// systemメッセージを抽出
			const systemMessages = params.messages.filter((m) => m.role === "system");
			const systemInstruction = systemMessages.map((m) => m.content).join("\n");

			// ツール定義をGoogle形式に変換
			const tools =
				params.tools && params.tools.length > 0
					? [
							{
								functionDeclarations: params.tools.map((tool) => ({
									name: tool.name,
									description: tool.description,
									parameters: tool.parameters,
								})),
							},
						]
					: undefined;

			try {
				const response = await client.models.generateContent({
					model: modelId,
					contents: convertMessages(params.messages),
					config: {
						systemInstruction,
						temperature: params.temperature,
						maxOutputTokens: params.maxTokens,
						...(tools && { tools }),
					},
				});

				const candidate = response.candidates?.[0];
				const parts = candidate?.content?.parts ?? [];

				// partsからテキストとfunctionCallを抽出
				const textParts = parts.filter((p) => p.text);
				const text = textParts.map((p) => p.text).join("");

				const functionCallParts = parts.filter((p) => p.functionCall);
				const toolCalls: ToolCall[] | undefined =
					functionCallParts.length > 0
						? functionCallParts.map((p: any, i) => ({
								toolCallId: `call_${i}`,
								name: p.functionCall.name,
								args: p.functionCall.args,
							}))
						: undefined;

				return {
					text,
					finishReason: mapFinishReason(
						candidate?.finishReason,
						functionCallParts.length > 0,
					),
					toolCalls,
					usage: {
						promptTokens: response.usageMetadata?.promptTokenCount,
						completionTokens: response.usageMetadata?.candidatesTokenCount,
						totalTokens: response.usageMetadata?.totalTokenCount,
					},
				};
			} catch (error: any) {
				throw new LLMApiError(
					error.status ?? 500,
					"google",
					error.code,
					error.message,
					error,
				);
			}
		},
	});
}
