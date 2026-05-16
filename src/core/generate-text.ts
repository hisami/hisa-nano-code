import type {
	GenerateParams,
	GenerateTextResult,
	LanguageModel,
} from "../types";

type GenerateTextParams = GenerateParams & {
	model: LanguageModel;
};

// 統一されたテキスト生成関数
export async function generateText(
	params: GenerateTextParams,
): Promise<GenerateTextResult> {
	const { model, ...generateParams } = params;
	return await model.doGenerate(generateParams);
}
