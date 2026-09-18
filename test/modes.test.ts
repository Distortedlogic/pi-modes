import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Value } from "typebox/value";
import { configurationSchema } from "../agents.ts";
import extension, {
	loadConfiguredModes,
	modeSuffix,
	replaceModeSuffix,
	resolveModeSourcePaths,
	transformModeInput,
} from "../src/index.ts";

const execFileAsync = promisify(execFile);
const projectDirectory = fileURLToPath(new URL("..", import.meta.url));
const codingAgentEntry = fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"));
const cliPath = join(dirname(codingAgentEntry), "cli.js");

async function writeModes(path: string, modes: Record<string, unknown>): Promise<void> {
	await writeFile(path, JSON.stringify({ "pi-modes": modes, "other-extension": { enabled: true } }));
}

test("validates every mode source with the strict schema", async (t) => {
	assert.equal(Value.Check(configurationSchema, { exec: "", review: "Review the change" }), true);
	assert.equal(Value.Check(configurationSchema, { review: 42 }), false);
	assert.equal(Value.Check(configurationSchema, { " ": "invalid name" }), false);

	const directory = await mkdtemp(join(tmpdir(), "pi-modes-schema-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const validPath = join(directory, "valid.yml");
	const invalidPath = join(directory, "invalid.yml");
	await Promise.all([writeModes(validPath, { review: "valid" }), writeModes(invalidPath, { review: 42 })]);

	await assert.rejects(loadConfiguredModes([validPath, invalidPath]), /Invalid configuration.*pi-modes/);
});

test("selects trusted sources and applies source precedence", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "pi-modes-sources-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const packageRoot = join(directory, "owned");
	const projectRoot = join(directory, "project");
	const userPackage = join(directory, "user-package");
	const projectPackage = join(directory, "project-package");
	await Promise.all([packageRoot, projectRoot, userPackage, projectPackage].map((path) => mkdir(path)));
	await Promise.all([
		writeModes(join(packageRoot, "AGENTS.yml"), { review: "owned", "owned-only": "owned" }),
		writeModes(join(userPackage, "AGENTS.yml"), { review: "user", "user-only": "user" }),
		writeModes(join(projectPackage, "AGENTS.yml"), {
			review: "project package",
			"package-only": "project package",
		}),
		writeModes(join(projectRoot, "AGENTS.yml"), { review: "project root", "root-only": "project root" }),
	]);
	const packages = [
		{ scope: "user" as const, installedPath: userPackage },
		{ scope: "project" as const, installedPath: projectPackage },
	];

	const untrustedPaths = resolveModeSourcePaths(packageRoot, projectRoot, packages, false);
	assert.deepEqual(untrustedPaths, [join(packageRoot, "AGENTS.yml"), join(userPackage, "AGENTS.yml")]);
	assert.deepEqual(Object.fromEntries(await loadConfiguredModes(untrustedPaths)), {
		review: "user",
		"owned-only": "owned",
		"user-only": "user",
	});

	const trustedPaths = resolveModeSourcePaths(packageRoot, projectRoot, packages, true);
	assert.deepEqual(trustedPaths, [
		join(packageRoot, "AGENTS.yml"),
		join(userPackage, "AGENTS.yml"),
		join(projectPackage, "AGENTS.yml"),
		join(projectRoot, "AGENTS.yml"),
	]);
	assert.deepEqual(Object.fromEntries(await loadConfiguredModes(trustedPaths)), {
		review: "project root",
		"owned-only": "owned",
		"user-only": "user",
		"package-only": "project package",
		"root-only": "project root",
	});
});

test("replaces modes and cleans up runtime UI state", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "pi-modes-runtime-"));
	const agentDirectory = join(directory, "agent");
	const project = join(directory, "project");
	await Promise.all([mkdir(agentDirectory), mkdir(project)]);
	await writeModes(join(project, "AGENTS.yml"), {
		"test-review": "Review changes",
		"test-plan": "Plan changes",
	});
	const previousAgentDirectory = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = agentDirectory;
	t.after(async () => {
		if (previousAgentDirectory === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previousAgentDirectory;
		await rm(directory, { recursive: true, force: true });
	});

	type Handler = (event: unknown, ctx: ExtensionContext) => unknown;
	type ShortcutHandler = (ctx: ExtensionContext) => Promise<void> | void;
	const handlers = new Map<string, Handler>();
	let cycleMode: ShortcutHandler | undefined;
	let setMode: ((event: unknown) => void) | undefined;
	const api = {
		on(name: string, handler: Handler) {
			handlers.set(name, handler);
		},
		registerShortcut(_shortcut: string, options: { handler: ShortcutHandler }) {
			cycleMode = options.handler;
		},
		events: {
			on(name: string, handler: (event: unknown) => void) {
				if (name === "pi-modes:set") setMode = handler;
				return () => {};
			},
		},
	} as unknown as ExtensionAPI;
	extension(api);

	let editorText = "draft";
	let widget: string[] | undefined;
	let listenerRemovals = 0;
	const context = {
		cwd: project,
		mode: "tui",
		isProjectTrusted: () => true,
		ui: {
			getEditorText: () => editorText,
			setEditorText: (text: string) => {
				editorText = text;
			},
			setWidget: (_key: string, content: string[] | undefined) => {
				widget = content;
			},
			onTerminalInput: () => () => {
				listenerRemovals++;
			},
			notify: () => {},
		},
	} as unknown as ExtensionContext;

	await handlers.get("session_start")?.({ reason: "startup" }, context);
	assert.equal(typeof cycleMode, "function");
	await cycleMode?.(context);
	assert.equal(editorText, `draft${modeSuffix("Review changes")}`);
	assert.deepEqual(widget, ["test-review"]);

	await cycleMode?.(context);
	assert.equal(editorText, `draft${modeSuffix("Plan changes")}`);
	assert.deepEqual(widget, ["test-plan"]);
	assert.deepEqual(handlers.get("input")?.({ text: "question", images: [] }, context), {
		action: "transform",
		text: `question${modeSuffix("Plan changes")}`,
		images: [],
	});
	assert.equal(
		transformModeInput(`question${modeSuffix("Plan changes")}`, "Plan changes"),
		`question${modeSuffix("Plan changes")}`,
	);
	assert.equal(replaceModeSuffix("draft", "", "Review changes"), `draft${modeSuffix("Review changes")}`);

	await writeModes(join(project, "AGENTS.yml"), { "test-reload": "Reloaded mode" });
	await handlers.get("session_start")?.({ reason: "reload" }, context);
	editorText = "draft";
	setMode?.({ name: "test-review" });
	assert.equal(editorText, "draft");
	setMode?.({ name: "test-reload" });
	assert.equal(editorText, `draft${modeSuffix("Reloaded mode")}`);
	assert.deepEqual(widget, ["test-reload"]);

	await handlers.get("session_shutdown")?.({ reason: "quit" }, context);
	assert.equal(widget, undefined);
	assert.ok(listenerRemovals > 0);
});

test("loads the production extension in Pi", async (t) => {
	const agentDirectory = await mkdtemp(join(tmpdir(), "pi-modes-e2e-"));
	t.after(() => rm(agentDirectory, { recursive: true, force: true }));

	const { stderr } = await execFileAsync(
		process.execPath,
		[
			cliPath,
			"--no-session",
			"--no-extensions",
			"--extension",
			resolve(projectDirectory, "src/index.ts"),
			"--list-models",
		],
		{
			cwd: projectDirectory,
			encoding: "utf8",
			env: {
				HOME: process.env.HOME,
				PATH: process.env.PATH,
				PI_CODING_AGENT_DIR: agentDirectory,
				PI_OFFLINE: "1",
				USERPROFILE: process.env.USERPROFILE,
			},
			timeout: 30_000,
		},
	);

	assert.doesNotMatch(stderr, /Failed to load extension/);
});
