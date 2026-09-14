import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { CONFIG_DIR_NAME, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { isKeyRelease, isKeyRepeat, matchesKey } from "@earendil-works/pi-tui";
import { parse } from "yaml";

const MODES_FILE = "AGENT_MODES.yml";
const SEPARATOR = " --- ";
const WIDGET_KEY = "just-answer-mode";

export default function (pi: ExtensionAPI) {
	let modes: [string, string][] = [["exec", ""]];
	let modeIndex = 0;
	let removeTerminalInputListener: (() => void) | undefined;

	const showMode = (ctx: ExtensionContext): void => {
		const [name, text] = modes[modeIndex];
		const content = name === "exec" && text === "" ? undefined : [name];
		ctx.ui.setWidget(WIDGET_KEY, content, { placement: "belowEditor" });
	};

	pi.on("session_start", async (_event, ctx) => {
		removeTerminalInputListener?.();
		removeTerminalInputListener = undefined;

		const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), CONFIG_DIR_NAME, "agent");
		const globalPackageRoots = [
			{ path: join(agentDir, "npm", "node_modules"), type: "npm" },
			{ path: join(agentDir, "git"), type: "git" },
			{ path: join(agentDir, "extensions"), type: "extensions" },
		];
		const projectPackageDir = join(ctx.cwd, CONFIG_DIR_NAME);
		const projectPackageRoots = [
			{ path: join(projectPackageDir, "npm", "node_modules"), type: "npm" },
			{ path: join(projectPackageDir, "git"), type: "git" },
			{ path: join(projectPackageDir, "extensions"), type: "extensions" },
		];
		const packageScanRoots = [...globalPackageRoots, ...projectPackageRoots].filter(({ path }) => existsSync(path));
		const projectManifestPath = join(ctx.cwd, "package.json");
		const packageManifestPaths = existsSync(projectManifestPath) ? [projectManifestPath] : [];

		const paths = [{ path: join(homedir(), CONFIG_DIR_NAME, MODES_FILE), optional: true }];
		if (ctx.isProjectTrusted()) {
			paths.push({ path: join(ctx.cwd, CONFIG_DIR_NAME, MODES_FILE), optional: true });
		}
		const configured = new Map<string, string>();

		for (const { path, optional } of paths) {
			try {
				const document: unknown = parse(await readFile(path, "utf8"), { mapAsMap: true });
				if (document === null) continue;
				if (!(document instanceof Map)) throw new Error("Expected a map of mode names to text.");

				const entries: [string, string][] = [];
				for (const [name, text] of document) {
					if (typeof name !== "string" || name.trim() === "" || typeof text !== "string") {
						throw new Error('Each mode needs a non-empty string name and a string value. Use "" for no appended text.');
					}
					entries.push([name, text]);
				}
				for (const [name, text] of entries) configured.set(name, text);
			} catch (error) {
				if (optional && error instanceof Error && "code" in error && error.code === "ENOENT") continue;
				const message = `Cannot load modes from ${path}: ${error instanceof Error ? error.message : String(error)}`;
				if (ctx.hasUI) ctx.ui.notify(message, "error");
				else console.error(message);
			}
		}

		modes = configured.size > 0 ? [...configured] : [["exec", ""]];
		modeIndex = 0;
		showMode(ctx);

		if (ctx.mode !== "tui") return;

		removeTerminalInputListener = ctx.ui.onTerminalInput((data) => {
			if (!matchesKey(data, "shift+tab")) return undefined;
			if (isKeyRepeat(data) || isKeyRelease(data)) return { consume: true };

			modeIndex = (modeIndex + 1) % modes.length;
			showMode(ctx);
			return { consume: true };
		});
	});

	pi.on("session_shutdown", (_event, ctx) => {
		removeTerminalInputListener?.();
		removeTerminalInputListener = undefined;
		ctx.ui.setWidget(WIDGET_KEY, undefined);
	});

	pi.on("input", (event) => {
		const [, text] = modes[modeIndex];
		const suffix = text === "" ? "" : `${SEPARATOR}${text}`;
		if (!suffix || event.source === "extension" || event.text.endsWith(suffix)) {
			return { action: "continue" };
		}

		return {
			action: "transform",
			text: `${event.text}${suffix}`,
			images: event.images,
		};
	});
}
