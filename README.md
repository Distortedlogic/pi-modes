# pi-modes

`pi-modes` is a Pi extension that loads named prompt modes from package-root and trusted project `AGENTS.yml` files. In TUI mode, press `Shift+Tab` to select the next mode. When you submit input, the extension appends ` --- <mode text>` once.

## Install

Install the package from Git:

```sh
pi install git:github.com/Distortedlogic/pi-modes
```

## Configure modes

Put modes in the top-level `pi-modes` section in `AGENTS.yml`. Each mode name must contain a non-whitespace character. Each value must be a string. An empty string is valid and adds no text.

```yaml
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

Edit only `pi-modes` and preserve unrelated top-level keys and other extension-owned sections.

If no valid mode is available, the extension uses `exec` with an empty value. If configured modes exist without `exec`, the extension does not add `exec`.

### Package modes

A package provides modes in the top-level `pi-modes` section in the `AGENTS.yml` file next to its `package.json`. Other sections are ignored by `pi-modes`.

### Project modes

Put project modes in the top-level `pi-modes` section in `<cwd>/AGENTS.yml`.

The project file and its owned section are optional. The extension reads the file only when Pi trusts the project.

## Select a mode from an extension

Another extension can select a configured mode through the shared event bus:

```ts
pi.events.emit("pi-modes:set", { name: "brief" });
```

The `pi-modes:set` event accepts `{ name: string }`. The name must match a configured mode name exactly. An unknown name does not change the current mode. In TUI mode, the widget changes immediately.

## Package discovery

The Pi agent directory is `PI_CODING_AGENT_DIR` when that variable is set. Otherwise, it is `~/.pi/agent`.

At session start, the extension calls `SettingsManager.create(ctx.cwd, agentDir)`. It gives that settings manager to `DefaultPackageManager`, then uses `DefaultPackageManager.listConfiguredPackages()` to get the configured packages.

The extension filters packages by user or project scope. It uses only entries that have an installed path and an `AGENTS.yml` file at that path. It does not scan package directories or load unconfigured packages.

User-package configuration is always eligible. Project-package configuration and `<cwd>/AGENTS.yml` are eligible only when Pi trusts the project.

## Source priority

The extension loads mode sources in this order:

1. The package-root `AGENTS.yml` of `pi-modes`.
2. Configured user-package `AGENTS.yml` files, in package-manager order.
3. Configured project-package `AGENTS.yml` files, in package-manager order, when Pi trusts the project.
4. `<cwd>/AGENTS.yml`, when Pi trusts the project.

A later value replaces an earlier value with the same mode name. The mode stays in one cycle position.

## Errors and reloads

The extension ignores package roots without `AGENTS.yml` and `AGENTS.yml` files without a top-level `pi-modes` section.

Malformed YAML or an invalid `pi-modes` map reports an error. The extension continues with later files. It validates the complete owned section before it adds any mode from that source. A missing optional project `AGENTS.yml` file does not report an error.

Run `/reload` after you change an `AGENTS.yml` file.
