# `pi-modes` and `pi-prompts` Implementation Task List

## Work Unit 1: Rename the Current Extension to `pi-modes`

- [ ] In `package.json`, set the package name to `pi-modes`, version to `0.3.0`, description to `A Pi extension that loads and cycles package and project modes from YAML.`, and repository URL to `git+https://github.com/Distortedlogic/pi-modes.git`.
- [ ] In `index.ts`, set the widget key to `pi-modes`.
- [ ] Update `README.md` so its name, repository links, install commands, and examples use `pi-modes`.
- [ ] Update `skills/add-pi-mode/SKILL.md` so its package references and instructions use `pi-modes`.

## Work Unit 2: Release the Renamed `pi-modes` Package

- [ ] Search tracked files for obsolete package identifiers, remove each obsolete identifier, and run `git diff --check`.
- [ ] Load `index.ts` as a local Pi extension and test package mode loading, trusted project mode loading, Shift+Tab wraparound, widget output, and exact one-time suffix insertion.
- [ ] Commit the rename with the message `Rename to pi-modes`.
- [ ] Rename the current GitHub repository to `Distortedlogic/pi-modes`.
- [ ] Set `origin` to the renamed GitHub repository and push the rename commit.
- [ ] Remove the superseded global package and install global `git:github.com/Distortedlogic/pi-modes`.
- [ ] Reload Pi and test that one `pi-modes` extension loads with the existing mode behavior.
- [ ] After this Pi session exits, rename the local repository directory to `pi-modes` under its current parent directory.

## Work Unit 3: Create the `pi-prompts` Package

- [ ] Create `~/repos/pi-prompts` from the complete Pi extension authoring template.
- [ ] Replace the template placeholders with package name `pi-prompts` and description `A Pi extension that cycles native prompt templates into the editor.`.
- [ ] Set `package.json` to version `0.1.0`, private package status, repository URL `git+https://github.com/Distortedlogic/pi-prompts.git`, and keyword `pi-package`.
- [ ] Declare `./src/index.ts` under `pi.extensions` and `./prompts` under `pi.prompts`.
- [ ] Declare `@earendil-works/pi-coding-agent` with peer range `*` as the only runtime peer dependency.
- [ ] Replace the template runtime code with the prompt cycle implementation in `src/index.ts`.
- [ ] Run `npm install` to create `package-lock.json`.

## Work Unit 4: Add the Native Prompt Collection

- [ ] Copy the existing preset prompt Markdown files into `prompts/` without changing their names, descriptions, or prompt text.
- [ ] Use the native prompt order returned by Pi for package, global, and trusted project prompt resources.

## Work Unit 5: Implement Prompt Cycling

- [ ] Define Ctrl+Shift+P as the registered shortcut and `pi-prompts` as the widget key in `src/index.ts`.
- [ ] Store the selected prompt name and current editor draft as session-local variables.
- [ ] On each shortcut action, call `pi.getCommands()`, filter for `source === "prompt"`, and keep the returned order.
- [ ] Select the first prompt on the first shortcut action and advance with modulo wraparound on each later action.
- [ ] After a prompt catalogue change, advance from the selected prompt name or restart at the first prompt when that name is absent.
- [ ] On the first cycle, store the complete current editor text as the draft.
- [ ] On later cycles, store the text after the generated `/<selected-prompt>` prefix as the updated draft.
- [ ] If the editor no longer starts with the generated prompt prefix, store the complete editor text as the new draft.
- [ ] Set the editor to `/<prompt-name>` when the draft is empty and `/<prompt-name> <draft>` when the draft is not empty.
- [ ] Set the below-editor widget text to `prompt: <name> (<position>/<count>)` after each selection.
- [ ] Leave the editor unchanged and show a warning with text `No prompt templates are available.` when the filtered list is empty.
- [ ] Use `pi.registerShortcut()`, `ctx.ui.getEditorText()`, `ctx.ui.setEditorText()`, and `ctx.ui.setWidget()` without raw terminal handling or automatic submission.

## Work Unit 6: Implement Prompt Lifecycle Reset

- [ ] On `session_start`, reset the selected prompt and draft and clear the `pi-prompts` widget.
- [ ] On `input`, reset the selected prompt and draft, clear the widget, and return `continue` for native prompt expansion.
- [ ] On `session_shutdown`, clear the `pi-prompts` widget.

## Work Unit 7: Test and Document `pi-prompts`

- [ ] Replace the template unit tests with prompt filtering, returned order, first selection, wraparound, changed catalogue, empty catalogue, single prompt, draft preservation, exact editor output, widget output, and lifecycle reset cases.
- [ ] Test that Ctrl+Shift+P changes the editor without sending a message.
- [ ] Update the template end-to-end test to load `src/index.ts` through Pi with `PI_OFFLINE=1`, `--no-extensions`, the explicit extension path, and `--no-session` without an LLM request.
- [ ] Replace the template `README.md` with installation, removal, native prompt resource, Ctrl+Shift+P, editor argument, cycle order, reload, and `pi-modes` interaction instructions.
- [ ] Run the repository check script and `git diff --check`.

## Work Unit 8: Integrate and Release `pi-prompts`

- [ ] Load local `pi-modes` and `pi-prompts` together and test Shift+Tab mode cycling, Ctrl+Shift+P prompt cycling, separate widgets, draft preservation, prompt wraparound, and lifecycle resets.
- [ ] Submit a selected prompt and test native prompt expansion, prompt widget cleanup, persistent mode selection, and exact one-time mode suffix insertion.
- [ ] Start Pi in print, JSON, and RPC modes with `pi-prompts` and test successful extension startup.
- [ ] Create the private GitHub repository `Distortedlogic/pi-prompts`.
- [ ] Commit `pi-prompts` with the message `Add prompt cycling` and push the default branch.
- [ ] Install global `git:github.com/Distortedlogic/pi-prompts` and reload Pi.
- [ ] Run `pi list` and verify that `pi-modes` and `pi-prompts` each occur once and no superseded package occurs.
