import type { LanguageModel } from "../types";
import { createGoogle } from "./google";

export function createModelFromEnv(): LanguageModel {
	const provider = process.env.LLM_PROVIDER;
	const modelName = process.env.LLM_MODEL_NAME;
	const apiKey = process.env.LLM_API_KEY;

	if (!provider) {
		throw new Error("LLM_PROVIDER environment variable is not set.");
	}
	if (!modelName) {
		throw new Error("LLM_MODEL_NAME environment variable is not set.");
	}
	if (!apiKey) {
		throw new Error("LLM_API_KEY environment variable is not set.");
	}

	switch (provider.toLowerCase()) {
		case "google": {
			const google = createGoogle({ apiKey });
			return google(modelName);
		}
		default:
			throw new Error(`Unsupported LLM provider: ${provider}`);
	}
}
