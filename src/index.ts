import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONFIG_DIR_NAME, type ExtensionAPI, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import { isKeyRelease, isKeyRepeat, matchesKey } from "@earendil-works/pi-tui";
import { discoverAgentsSources, loadAgentsSection } from "pi-agents-yaml";
import { configurationSchema } from "../agents.ts";

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const OWNED_SECTION_PATH = "pi-modes";
const SEPARATOR = " --- ";
const WIDGET_KEY = "pi-modes";

export const modeSuffix = (text: string): string => (text === "" ? "" : `${SEPARATOR}${text}`);

export function replaceModeSuffix(input: string, previousText: string, nextText: string): string {
	const previousSuffix = modeSuffix(previousText);
	const nextSuffix = modeSuffix(nextText);
	return previousSuffix !== "" && input.includes(previousSuffix)
		? input.replace(previousSuffix, nextSuffix)
		: `${input}${nextSuffix}`;
}

export function transformModeInput(text: string, modeText: string): string {
	const suffix = modeSuffix(modeText);
	return !suffix || text.endsWith(suffix) ? text : `${text}${suffix}`;
}

export async function loadConfiguredModes(paths: readonly string[]): Promise<[string, string][]> {
	const configured = new Map<string, string>();
	for (const path of paths) {
		const section = await loadAgentsSection(path, OWNED_SECTION_PATH, configurationSchema);
		if (!section) continue;
		for (const [name, text] of Object.entries(section.value)) configured.set(name, text);
	}
	return configured.size > 0 ? [...configured] : [["exec", ""]];
}

export default function (pi: ExtensionAPI) {
	let modes: [string, string][] = [["exec", ""]];
	let modeIndex = 0;
	let activeContext: ExtensionContext | undefined;
	let removeTerminalInputListener: (() => void) | undefined;

	const showMode = (ctx: ExtensionContext): void => {
		const [name, text] = modes[modeIndex];
		const content = name === "exec" && text === "" ? undefined : [name];
		ctx.ui.setWidget(WIDGET_KEY, content, { placement: "belowEditor" });
	};

	const changeMode = (nextModeIndex: number, ctx: ExtensionContext): void => {
		if (nextModeIndex === modeIndex) return;

		if (ctx.mode === "tui") {
			const input = ctx.ui.getEditorText();
			const nextInput = replaceModeSuffix(input, modes[modeIndex][1], modes[nextModeIndex][1]);
			if (nextInput !== input) ctx.ui.setEditorText(nextInput);
		}

		modeIndex = nextModeIndex;
		showMode(ctx);
	};

	pi.events.on("pi-modes:set", (event) => {
		if (typeof event !== "object" || event === null || !("name" in event) || typeof event.name !== "string") return;
		const nextModeIndex = modes.findIndex(([name]) => name === event.name);
		if (nextModeIndex === -1 || !activeContext) return;
		changeMode(nextModeIndex, activeContext);
	});

	pi.on("session_start", async (_event, ctx) => {
		activeContext = ctx;
		removeTerminalInputListener?.();
		removeTerminalInputListener = undefined;

		const sources = discoverAgentsSources({
			cwd: ctx.cwd,
			projectTrusted: ctx.isProjectTrusted(),
			packageRoot: PACKAGE_ROOT,
			agentDirectory: process.env.PI_CODING_AGENT_DIR ?? join(homedir(), CONFIG_DIR_NAME, "agent"),
		});
		modes = await loadConfiguredModes(
			sources.filter((source) => source.hasAgentsFile).map((source) => source.sourcePath),
		);
		modeIndex = 0;
		showMode(ctx);

		if (ctx.mode !== "tui") return;

		removeTerminalInputListener = ctx.ui.onTerminalInput((data) => {
			if (!matchesKey(data, "shift+tab")) return undefined;
			if (isKeyRepeat(data) || isKeyRelease(data)) return { consume: true };

			changeMode((modeIndex + 1) % modes.length, ctx);
			return { consume: true };
		});
	});

	pi.on("session_shutdown", (_event, ctx) => {
		activeContext = undefined;
		removeTerminalInputListener?.();
		removeTerminalInputListener = undefined;
		ctx.ui.setWidget(WIDGET_KEY, undefined);
	});

	pi.on("input", (event) => {
		const text = transformModeInput(event.text, modes[modeIndex][1]);
		if (text === event.text) return { action: "continue" };
		return { action: "transform", text, images: event.images };
	});
}
