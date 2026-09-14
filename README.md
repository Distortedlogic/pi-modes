# pi-modes

`pi-modes` is a Pi extension that loads named prompt modes from Pi packages and from an optional project YAML file. In TUI mode, press `Shift+Tab` to select the next mode. When you submit input, the extension appends ` --- <mode text>` once.

## Install

Install the package from Git:

```sh
pi install git:github.com/Distortedlogic/pi-modes
```

You can also install a local checkout:

```sh
pi install ./pi-modes
```

## Configure modes

A mode file must contain a YAML map. Each mode name must be a non-empty string. Each value must be a string. An empty string is valid and adds no text.

```yaml
exec: ""
brief: "Give a brief answer."
review: "Review the code and report defects."
```

If no valid mode is available, the extension uses `exec` with an empty value. If configured modes exist without `exec`, the extension does not add `exec`.

### Package modes

A package can declare one or more mode files in `package.json` under `pi.modes`:

```json
{
  "pi": {
    "extensions": ["./index.ts"],
    "modes": ["./AGENT_MODES.yml", "./modes/review.yaml"]
  }
}
```

Each entry must be an exact relative path from the directory that contains `package.json`. The path must end in `.yml` or `.yaml`. Do not use a glob, directory, `!`, `+`, or `-` as a filter marker. Each declared file is required.

### Project modes

You can also put project modes in `<cwd>/.pi/AGENT_MODES.yml`.

The project file is optional. The extension loads it only when Pi trusts the project.

## Select a mode from an extension

Another extension can select a configured mode through the shared event bus:

```ts
pi.events.emit("pi-modes:set", { name: "brief" });
```

The `pi-modes:set` event accepts `{ name: string }`. The name must match a configured mode name exactly. An unknown name does not change the current mode. In TUI mode, the widget changes immediately.

## Package scan locations

The Pi agent directory is `PI_CODING_AGENT_DIR` when that variable is set. Otherwise, it is `~/.pi/agent`.

The extension scans these global locations first:

- `<agentDir>/npm/node_modules`
- `<agentDir>/git`
- `<agentDir>/extensions`

It then scans these project locations:

- `<cwd>/.pi/npm/node_modules`
- `<cwd>/.pi/git`
- `<cwd>/.pi/extensions`
- `<cwd>/package.json`

The npm scans include direct unscoped and scoped packages. The Git and extension scans are recursive, but they exclude `node_modules` and `.git` directories.

Package discovery does not use Pi project trust or Pi package filters. It does not read Pi settings to select packages. This rule also applies to the project package locations. The separate project mode file still requires project trust.

## Source priority

The extension loads mode sources in this order:

1. Package mode files from global scan locations.
2. Package mode files from project scan locations, including `<cwd>/package.json`.
3. `<cwd>/.pi/AGENT_MODES.yml`, when Pi trusts the project.

A later value replaces an earlier value with the same mode name. The mode stays in one cycle position.

## Errors and reloads

The extension ignores malformed package manifests and packages without `pi.modes`. An invalid `pi.modes` declaration reports one error, and processing continues with later packages.

A missing declared mode file, malformed YAML, or invalid mode entry reports an error. The extension continues with later files. It validates a complete YAML file before it adds any mode from that file. A missing optional project mode file does not report an error.

Run `/reload` after you change a package manifest or mode file.
