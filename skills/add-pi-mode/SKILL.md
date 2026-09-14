---
name: add-pi-mode
description: Use when the user asks to add a mode to the pi-modes extension globally, for a project, or for a Pi package.
---

# Add a mode to pi-modes

1. Use the requested scope. If the scope is not clear, ask which scope:
   - Global: the package-owned `AGENT_MODES.yml` in `pi-modes`, declared in its `package.json` under `pi.modes`
   - Project: `<cwd>/.pi/AGENT_MODES.yml`
   - Package: a package-owned YAML file declared in `package.json` under `pi.modes`
2. For a global mode, edit the declared `AGENT_MODES.yml` in `pi-modes`.
3. For another package mode, use an existing declared mode file when possible. Each `pi.modes` entry must be an exact relative `.yml` or `.yaml` file path. Do not use a glob or directory. Otherwise, create `AGENT_MODES.yml` in the package root and add `"./AGENT_MODES.yml"` to `pi.modes`. Preserve all other manifest fields and entries.
4. Read an existing mode file before you edit it. Create it only when it is missing.
5. Add or update one YAML entry: `mode-name: "text to append"`. Use the exact requested name and text, but omit a leading ` --- ` because the extension adds it. Quote YAML values correctly. Preserve other entries and their order. Do not duplicate keys.
6. Tell the user to run `/reload`.
