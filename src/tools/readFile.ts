import * as fs from "fs/promises";
import * as path from "path";

const WORKSPACE_ROOT = path.resolve(process.cwd(), "workspace");

const MAX_FILE_SIZE = 100 * 1024; // 100KB

async function readFileExecute(args: { path: string }): Promise<string> {
	const absolutePath = path.resolve(WORKSPACE_ROOT, args.path);

	const allowedPrefix = WORKSPACE_ROOT + path.sep;
	if (!absolutePath.startsWith(allowedPrefix)) {
		throw new Error("Invalid file path. Access denied.");
	}

	const realPath = await fs.realpath(absolutePath);
	if (!realPath.startsWith(allowedPrefix) && realPath !== WORKSPACE_ROOT) {
		throw new Error("Invalid file path. Access denied.");
	}

	// ファイル種別とサイズのチェック
	try {
		const stats = await fs.stat(absolutePath);
		if (!stats.isFile()) {
			throw new Error("The specified path is not a file.");
		}
		if (stats.size > MAX_FILE_SIZE) {
			throw new Error("File size exceeds the maximum allowed limit.");
		}
	} catch (err: any) {
		if (err.code === "ENOENT") {
			throw new Error("File not found.");
		}
		throw err;
	}

	const content = await fs.readFile(absolutePath, "utf-8");
	return content;
}

export const readFile = {
	name: "readFile",
	description:
		"ワークスペース内の指定されたパスのファイル内容を文字列として読み込む。ファイルが存在しない場合はエラーを返す。100KBを超える巨大ファイルは読み込めない。相対パスまたは絶対パスで指定できるが、ワークスペース外のファイルにはアクセスできない。",
	parameters: {
		type: "object",
		properties: {
			path: {
				type: "string",
				description: "ワークスペース内のファイルへのパス。",
			},
		},
		required: ["path"],
	},
	execute: readFileExecute,
};
