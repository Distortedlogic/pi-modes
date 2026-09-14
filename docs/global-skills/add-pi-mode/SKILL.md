---
name: add-pi-mode
description: Use when the user asks to add a mode to the pi mode extension globally, for a project, or for a Pi package.
---

# Add a pi mode

1. Use the requested scope. If the scope is not clear, ask which scope:
   - Global: `~/.pi/AGENT_MODES.yml`
   - Project: `<cwd>/.pi/AGENT_MODES.yml`
   - Package: a package-owned YAML file declared in `package.json` under `pi.modes`
2. For a package mode, use an existing declared mode file when possible. Otherwise, create `AGENT_MODES.yml` in the package root and add `"./AGENT_MODES.yml"` to `pi.modes`. Preserve all other manifest fields and entries.
3. Read an existing mode file before you edit it. Create it only when it is missing.
4. Add or update one YAML entry: `mode-name: "text to append"`. Use the exact requested name and text, but omit a leading ` --- ` because the extension adds it. Quote YAML values correctly. Preserve other entries and their order. Do not duplicate keys.
5. Tell the user to run `/reload`.
