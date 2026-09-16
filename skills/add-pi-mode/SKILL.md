---
name: add-pi-mode
description: Use when the user asks to add a mode to the pi-modes extension globally, for a project, or for a Pi package.
---

# Add a mode to pi-modes

1. Use the requested scope. If the scope is not clear, ask which scope:
   - Global: the `modes` map in the package-root `AGENTS.yml` of `pi-modes`
   - Project: the `modes` map in `<cwd>/AGENTS.yml`
   - Package: the `modes` map in the package-root `AGENTS.yml` next to `package.json`
2. For a global mode, edit the `modes` map in the `pi-modes` package-root `AGENTS.yml`.
3. For a project mode, edit the `modes` map in `<cwd>/AGENTS.yml`. The extension reads project modes only when Pi trusts the project.
4. For another package mode, edit the `modes` map in the package-root `AGENTS.yml` next to `package.json`.
5. Read `AGENTS.yml` before you edit it. Create it only when it is missing. Preserve unrelated `preload` and `prompts` keys.
6. Add or update one YAML entry: `mode-name: "text to append"`. Use the exact requested name and text, but omit a leading ` --- ` because the extension adds it. Quote YAML values correctly. Preserve other entries and their order. Do not duplicate keys.
7. Tell the user to run `/reload`.
