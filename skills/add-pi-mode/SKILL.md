---
name: add-pi-mode
description: Use when the user asks to add a mode to the pi-modes extension globally, for a project, or for a Pi package.
---

# Add a mode to pi-modes

All scopes use one combined root `AGENTS.yml`. Edit only `pi.extensions.pi-modes` and preserve unrelated top-level keys and other `pi.extensions` entries:

```yaml
pi:
  extensions:
    pi-context-preload:
      files:
        - "src/**/*.ts"
    pi-modes:
      review: "Review the changes."
    pi-prompts:
      prompts:
        summarize:
          body: "Summarize the changes."
```

1. Use the requested scope. If the scope is not clear, ask which scope:
   - Global: `pi.extensions.pi-modes` in the package-root `AGENTS.yml` of `pi-modes`
   - Project: `pi.extensions.pi-modes` in `<cwd>/AGENTS.yml`
   - Package: `pi.extensions.pi-modes` in the package-root `AGENTS.yml` next to `package.json`
2. For a global mode, edit `pi.extensions.pi-modes` in the `pi-modes` package-root `AGENTS.yml`.
3. For a project mode, edit `pi.extensions.pi-modes` in `<cwd>/AGENTS.yml`. The extension reads project modes only when Pi trusts the project.
4. For another package mode, edit `pi.extensions.pi-modes` in the package-root `AGENTS.yml` next to `package.json`.
5. Read `AGENTS.yml` before you edit it. Create it only when it is missing. Preserve unrelated top-level keys and other `pi.extensions` entries.
6. Add or update one YAML entry: `mode-name: "text to append"`. Use the exact requested name and text, but omit a leading ` --- ` because the extension adds it. Quote YAML values correctly. Preserve other entries and their order. Do not duplicate keys.
7. Tell the user to run `/reload`.
