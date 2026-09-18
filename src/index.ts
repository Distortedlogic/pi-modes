import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	CONFIG_DIR_NAME,
	DefaultPackageManager,
	type ExtensionAPI,
	type ExtensionContext,
	SettingsManager,
} from "@earendil-works/pi-coding-agent";
import { isKeyRelease, isKeyRepeat, matchesKey } from "@earendil-works/pi-tui";
import { Value } from "typebox/value";
import { parse } from "yaml";
import { type Configuration, configurationSchema } from "../agents.ts";

const AGENTS_FILE = "AGENTS.yml";
const OWNED_SECTION_PATH = "pi-modes";
const SEPARATOR = " --- ";
const WIDGET_KEY = "pi-modes";

export const modeSuffix = (text: string): string => (text === "" ? "" : `${SEPARATOR}${text}`);

export interface ModePackageSource {
	scope: "user" | "project";
	installedPath?: string;
}

export function resolveModeSourcePaths(
	packageRoot: string,
	cwd: string,
	configuredPackages: readonly ModePackageSource[],
	projectTrusted: boolean,
): string[] {
	const packageAgentsPaths = (scope: ModePackageSource["scope"]) =>
		configuredPackages
			.filter(({ scope: packageScope }) => packageScope === scope)
			.flatMap(({ installedPath }) => {
				if (!installedPath) return [];
				const path = join(installedPath, AGENTS_FILE);
				return existsSync(path) ? [path] : [];
			});
	const paths = [
		join(packageRoot, AGENTS_FILE),
		...packageAgentsPaths("user"),
		...(projectTrusted ? packageAgentsPaths("project") : []),
	];
	const projectAgentsPath = join(cwd, AGENTS_FILE);
	if (projectTrusted && existsSync(projectAgentsPath)) paths.push(projectAgentsPath);
	return paths;
}

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

export async function loadModes(path: string): Promise<Configuration | undefined> {
	let source: string;
	try {
		source = await readFile(path, "utf8");
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`Cannot read ${path} at ${OWNED_SECTION_PATH}: ${detail}`, { cause: error });
	}

	let document: unknown;
	try {
		document = parse(source);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`Could not parse ${path} at ${OWNED_SECTION_PATH}: ${detail}`, { cause: error });
	}
	const value =
		typeof document === "object" && document !== null && !Array.isArray(document)
			? (document as Record<string, unknown>)[OWNED_SECTION_PATH]
			: undefined;
	if (value === undefined) return;

	try {
		return Value.Parse(configurationSchema, value);
	} catch (error) {
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid configuration in ${path} at ${OWNED_SECTION_PATH}: ${detail}`, { cause: error });
	}
}

export async function loadConfiguredModes(paths: readonly string[]): Promise<[string, string][]> {
	const configured = new Map<string, string>();
	for (const path of paths) {
		const configuration = await loadModes(path);
		if (!configuration) continue;
		for (const [name, text] of Object.entries(configuration)) configured.set(name, text);
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

		const agentDir = process.env.PI_CODING_AGENT_DIR ?? join(homedir(), CONFIG_DIR_NAME, "agent");
		const settingsManager = SettingsManager.create(ctx.cwd, agentDir);
		const packageManager = new DefaultPackageManager({
			cwd: ctx.cwd,
			agentDir,
			settingsManager,
		});
		const configuredPackages = packageManager.listConfiguredPackages();
		const projectTrusted = ctx.isProjectTrusted();
		const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
		const paths = resolveModeSourcePaths(packageRoot, ctx.cwd, configuredPackages, projectTrusted);
		modes = await loadConfiguredModes(paths);
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
