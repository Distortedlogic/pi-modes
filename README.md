# pi-modes

`pi-modes` is a Pi extension that loads named prompt modes from package-root and trusted project `AGENTS.yml` files. In TUI mode, press `Shift+Tab` to select the next mode. When you submit input, the extension appends ` --- <mode text>` once.

## Install

Install the package from Git:

```sh
pi install git:github.com/Distortedlogic/pi-modes
```

## Configure modes

Put modes in `pi.extensions.pi-modes` in `AGENTS.yml`. Each mode name must contain a non-whitespace character. Each value must be a string. An empty string is valid and adds no text.

```yaml
pi:
  extensions:
    pi-context-preload:
      files:
        - "src/**/*.ts"
    pi-modes:
      exec: ""
      brief: "Give a brief answer."
      review: "Review the code and report defects."
    pi-prompts:
      prompts:
        summarize:
          body: "Summarize the changes."
```

Edit only `pi.extensions.pi-modes` and preserve unrelated top-level keys and other `pi.extensions` entries.

If no valid mode is available, the extension uses `exec` with an empty value. If configured modes exist without `exec`, the extension does not add `exec`.

### Package modes

A package provides modes in `pi.extensions.pi-modes` in the `AGENTS.yml` file next to its `package.json`. Other sections are ignored by `pi-modes`.

### Project modes

Put project modes in `pi.extensions.pi-modes` in `<cwd>/AGENTS.yml`.

The project file and its owned section are optional. The extension reads the file only when Pi trusts the project.

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

The npm scans include direct unscoped and scoped packages. The Git and extension scans are recursive, but they exclude `node_modules` and `.git` directories.

Package discovery uses `package.json` files only to identify package roots. It reads each sibling `AGENTS.yml` file when present. Project package locations and the separate `<cwd>/AGENTS.yml` source require project trust. Package discovery does not read Pi settings to select packages.

## Source priority

The extension loads mode sources in this order:

1. Package-root `AGENTS.yml` files from global scan locations.
2. Package-root `AGENTS.yml` files from project scan locations.
3. `<cwd>/AGENTS.yml`, when Pi trusts the project.

A later value replaces an earlier value with the same mode name. The mode stays in one cycle position.

## Errors and reloads

The extension ignores package roots without `AGENTS.yml` and `AGENTS.yml` files without `pi.extensions.pi-modes`.

Malformed YAML or an invalid `pi.extensions.pi-modes` map reports an error. The extension continues with later files. It validates the complete owned section before it adds any mode from that source. A missing optional project `AGENTS.yml` file does not report an error.

Run `/reload` after you change an `AGENTS.yml` file.
