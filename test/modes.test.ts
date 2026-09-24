import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import extension, { loadConfiguredModes, modeSuffix } from "../src/index.ts";

async function writeModes(path: string, modes: Record<string, unknown>): Promise<void> {
	await writeFile(path, JSON.stringify({ "pi-modes": modes, "other-extension": { enabled: true } }));
}

test("validates every mode source with the strict schema", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "pi-modes-schema-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const validPath = join(directory, "valid.yml");
	const invalidPath = join(directory, "invalid.yml");
	await Promise.all([writeModes(validPath, { review: "valid" }), writeModes(invalidPath, { review: 42 })]);

	assert.deepEqual(Object.fromEntries(await loadConfiguredModes([validPath])), { review: "valid" });
	await assert.rejects(loadConfiguredModes([validPath, invalidPath]), /Invalid configuration.*pi-modes/);
});

test("applies source precedence over an ordered list of AGENTS.yml files", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "pi-modes-sources-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const packageRoot = join(directory, "owned");
	const userPackage = join(directory, "user-package");
	const projectPackage = join(directory, "project-package");
	const projectRoot = join(directory, "project");
	await Promise.all(
		[packageRoot, userPackage, projectPackage, projectRoot].map((path) => mkdir(path, { recursive: true })),
	);
	await Promise.all([
		writeModes(join(packageRoot, "AGENTS.yml"), { review: "owned", "owned-only": "owned" }),
		writeModes(join(userPackage, "AGENTS.yml"), { review: "user", "user-only": "user" }),
		writeModes(join(projectPackage, "AGENTS.yml"), {
			review: "project package",
			"package-only": "project package",
		}),
		writeModes(join(projectRoot, "AGENTS.yml"), { review: "project root", "root-only": "project root" }),
	]);

	const sourcePaths = [packageRoot, userPackage, projectPackage, projectRoot].map((path) => join(path, "AGENTS.yml"));
	assert.deepEqual(Object.fromEntries(await loadConfiguredModes(sourcePaths)), {
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
	const handlers = new Map<string, Handler>();
	let setMode: ((event: unknown) => void) | undefined;
	const api = {
		on(name: string, handler: Handler) {
			handlers.set(name, handler);
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
	type TerminalInputHandler = (data: string) => { consume?: boolean; data?: string } | undefined;
	let terminalInputHandler: TerminalInputHandler | undefined;
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
			onTerminalInput: (handler: TerminalInputHandler) => {
				terminalInputHandler = handler;
				return () => {
					if (terminalInputHandler === handler) terminalInputHandler = undefined;
				};
			},
			notify: () => {},
		},
	} as unknown as ExtensionContext;

	await handlers.get("session_start")?.({ reason: "startup" }, context);
	setMode?.({ name: "test-review" });
	assert.equal(editorText, `draft${modeSuffix("Review changes")}`);
	assert.deepEqual(widget, ["test-review"]);

	assert.deepEqual(terminalInputHandler?.("\x1b[Z"), { consume: true });
	assert.equal(editorText, `draft${modeSuffix("Plan changes")}`);
	assert.deepEqual(handlers.get("input")?.({ text: "question", images: [] }, context), {
		action: "transform",
		text: `question${modeSuffix("Plan changes")}`,
		images: [],
	});

	await writeModes(join(project, "AGENTS.yml"), { "test-reload": "Reloaded mode" });
	await handlers.get("session_start")?.({ reason: "reload" }, context);
	editorText = "draft";
	setMode?.({ name: "test-reload" });
	assert.equal(editorText, `draft${modeSuffix("Reloaded mode")}`);

	await handlers.get("session_shutdown")?.({ reason: "quit" }, context);
	assert.equal(widget, undefined);
	assert.equal(terminalInputHandler, undefined);
});
