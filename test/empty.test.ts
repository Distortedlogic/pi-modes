import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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

async function writeModes(path: string, modes: Record<string, unknown>): Promise<void> {
	await writeFile(path, JSON.stringify({ "pi-modes": modes, "other-extension": { enabled: true } }));
}

test("uses one strict schema for every top-level mode source", async (t) => {
	assert.equal(Value.Check(configurationSchema, { exec: "", review: "Review the change" }), true);
	assert.equal(Value.Check(configurationSchema, { review: 42 }), false);
	assert.equal(Value.Check(configurationSchema, { " ": "invalid name" }), false);

	const directory = await mkdtemp(join(tmpdir(), "pi-modes-schema-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const validPath = join(directory, "valid.yml");
	const invalidPath = join(directory, "invalid.yml");
	await writeModes(validPath, { review: "valid" });
	await writeModes(invalidPath, { review: 42 });

	await assert.rejects(loadConfiguredModes([validPath, invalidPath]), /Invalid configuration.*pi-modes/);
});

test("applies mode sources in package and project precedence order", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "pi-modes-sources-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const paths = ["owned", "user", "project-package", "project-root"].map((name) => join(directory, `${name}.yml`));
	await Promise.all([
		writeModes(paths[0], { review: "owned", "owned-only": "owned" }),
		writeModes(paths[1], { review: "user", "user-only": "user" }),
		writeModes(paths[2], { review: "project package", "package-only": "project package" }),
		writeModes(paths[3], { review: "project root", "root-only": "project root" }),
	]);

	assert.deepEqual(Object.fromEntries(await loadConfiguredModes(paths)), {
		review: "project root",
		"owned-only": "owned",
		"user-only": "user",
		"package-only": "project package",
		"root-only": "project root",
	});
});

test("includes project package and project root sources only when trusted", async (t) => {
	const directory = await mkdtemp(join(tmpdir(), "pi-modes-trust-"));
	t.after(() => rm(directory, { recursive: true, force: true }));
	const packageRoot = join(directory, "owned");
	const projectRoot = join(directory, "project");
	const userPackage = join(directory, "user-package");
	const projectPackage = join(directory, "project-package");
	await Promise.all([packageRoot, projectRoot, userPackage, projectPackage].map((path) => mkdir(path)));
	await Promise.all(
		[packageRoot, projectRoot, userPackage, projectPackage].map((path) => writeModes(join(path, "AGENTS.yml"), {})),
	);
	const packages = [
		{ scope: "user" as const, installedPath: userPackage },
		{ scope: "project" as const, installedPath: projectPackage },
	];

	assert.deepEqual(resolveModeSourcePaths(packageRoot, projectRoot, packages, false), [
		join(packageRoot, "AGENTS.yml"),
		join(userPackage, "AGENTS.yml"),
	]);
	assert.deepEqual(resolveModeSourcePaths(packageRoot, projectRoot, packages, true), [
		join(packageRoot, "AGENTS.yml"),
		join(userPackage, "AGENTS.yml"),
		join(projectPackage, "AGENTS.yml"),
		join(projectRoot, "AGENTS.yml"),
	]);
});

test("keeps mode cycling, suffix transformation, widget, and event-bus behavior", async (t) => {
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
	let terminalInput: ((data: string) => { consume?: boolean } | undefined) | undefined;
	let listenerRemoved = false;
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
			onTerminalInput: (handler: typeof terminalInput) => {
				terminalInput = handler;
				return () => {
					listenerRemoved = true;
				};
			},
		},
	} as unknown as ExtensionContext;

	await handlers.get("session_start")?.({ reason: "startup" }, context);
	setMode?.({ name: "test-review" });
	assert.equal(editorText, `draft${modeSuffix("Review changes")}`);
	assert.deepEqual(widget, ["test-review"]);

	setMode?.({ name: "test-plan" });
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

	assert.deepEqual(terminalInput?.("\u001b[Z"), { consume: true });
	assert.equal(editorText.includes(modeSuffix("Plan changes")), false);
	await handlers.get("session_shutdown")?.({ reason: "quit" }, context);
	assert.equal(widget, undefined);
	assert.equal(listenerRemoved, true);
});

test("loads the production extension entry", async () => {
	const manifest = JSON.parse(await readFile(resolve(projectDirectory, "package.json"), "utf8")) as {
		files: string[];
		pi: { extensions: string[] };
	};
	assert.deepEqual(manifest.pi.extensions, ["./src/index.ts"]);
	assert.ok(manifest.files.includes("src"));
	assert.equal(manifest.files.includes("index.ts"), false);

	const { stderr } = await execFileAsync(
		"pi",
		["--no-extensions", "--extension", resolve(projectDirectory, "src/index.ts"), "--list-models"],
		{
			cwd: projectDirectory,
			encoding: "utf8",
			env: { ...process.env, PI_OFFLINE: "1" },
			timeout: 30_000,
		},
	);
	assert.doesNotMatch(stderr, /Failed to load extension/);
});
