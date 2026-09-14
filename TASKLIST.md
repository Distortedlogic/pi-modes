# `pi-modes` and `pi-prompts` Implementation Task List

## Work Unit 1: Rename the Current Extension to `pi-modes`

- [ ] Confirm that the current worktree has no unrelated changes and keep all Pi source repositories unchanged.
- [ ] In `package.json`, set the package name to `pi-modes`, version to `0.3.0`, description to `A Pi extension that loads and cycles package and project modes from YAML.`, and repository URL to `git+https://github.com/Distortedlogic/pi-modes.git`.
- [ ] In `index.ts`, change the widget key from `just-answer-mode` to `pi-modes`.
- [ ] Update `README.md` and `skills/add-pi-mode/SKILL.md` so all names, repository links, and install commands use `pi-modes`.
- [ ] Keep the root `index.ts`, `AGENT_MODES.yml`, package mode discovery, YAML parsing, source order, Shift+Tab behavior, suffix transformation, dependencies, and package resource declarations unchanged.
- [ ] Search all tracked files and remove the remaining `pi-just-answer` and `just-answer` package identifiers.

## Work Unit 2: Validate and Release `pi-modes`

- [ ] Run the validation commands already present in the repository and run `git diff --check` without adding a test framework.
- [ ] Load the local extension through Pi and confirm that mode loading, Shift+Tab wraparound, widget display, and one-time suffix insertion still work.
- [ ] Commit the rename with the message `Rename to pi-modes`.
- [ ] Rename `Distortedlogic/pi-just-answer` to `Distortedlogic/pi-modes` on GitHub while preserving its history, tags, and visibility.
- [ ] Update the local `origin`, push the renamed package, remove the old Git package source, and install `git:github.com/Distortedlogic/pi-modes` in the old package scope.
- [ ] Reload Pi and confirm that one `pi-modes` extension loads and no `pi-just-answer` extension remains.
- [ ] After the active Pi session exits, rename the local repository directory from `pi-just-answer` to `pi-modes` under its current parent directory.

## Work Unit 3: Create the `pi-prompts` Repository

- [ ] Create an empty `~/repos/pi-prompts` directory and copy the complete Pi extension authoring template into it.
- [ ] Replace all template name and description placeholders with `pi-prompts` and `A Pi extension that cycles native prompt templates into the editor.`.
- [ ] Set `package.json` to version `0.1.0`, private visibility, repository URL `git+https://github.com/Distortedlogic/pi-prompts.git`, and the `pi-package` keyword.
- [ ] Declare `./src/index.ts` under `pi.extensions` and `./prompts` under `pi.prompts`.
- [ ] Keep only `@earendil-works/pi-coding-agent` with peer range `*` as the runtime peer dependency.
- [ ] Keep runtime code in `src/index.ts` and remove all template-only behavior.
- [ ] Do not add YAML parsing, direct TUI imports, a build step, a prompt scanner, or a prompt-order configuration format.
- [ ] Run `npm install` to create the package lock after package metadata is complete.

## Work Unit 4: Add the Preset Prompt Collection

- [ ] Put the existing preset prompt Markdown files in `prompts/` and keep prompt names, descriptions, and content in those native Pi resources.
- [ ] Use the prompt order returned by Pi and do not add custom sorting or duplicate prompt metadata to the extension.
- [ ] Let Pi load package, global, and trusted project prompt resources through its native package and resource system.
- [ ] Keep the copied `CONTEXT_PRELOAD.yml` baseline and do not preload prompt bodies, test files, or lock files.

## Work Unit 5: Implement Prompt Cycling

- [ ] In `src/index.ts`, define Ctrl+Shift+P as the shortcut and `pi-prompts` as the widget key.
- [ ] Keep the selected prompt name and editor draft as session-local in-memory state with no session persistence.
- [ ] On each shortcut action, call `pi.getCommands()`, keep every command whose `source` is `prompt`, and preserve the returned order.
- [ ] Select the first prompt on the first shortcut action and advance by one with modulo wraparound on each later action.
- [ ] When the available prompt list changes, continue after the selected prompt by name or select the first prompt when that name is absent.
- [ ] On the first cycle, save the complete current editor text as the draft.
- [ ] On later cycles, preserve the text after the generated `/<selected-prompt>` prefix as the updated draft.
- [ ] When the current editor no longer starts with the generated prompt prefix, use the complete current editor text as the new draft.
- [ ] Set the editor to `/<prompt-name>` for an empty draft and to `/<prompt-name> <draft>` for a non-empty draft.
- [ ] Show `prompt: <name> (<position>/<count>)` in the `pi-prompts` widget below the editor.
- [ ] When no prompt command exists, leave the editor unchanged and show `No prompt templates are available.` as a warning.
- [ ] Use `pi.registerShortcut()` and editor UI methods only, and do not use raw terminal input or submit a message from the shortcut.

## Work Unit 6: Implement Lifecycle Behavior

- [ ] On `session_start`, reset the selected prompt and draft and clear the `pi-prompts` widget.
- [ ] On `input`, clear the selected prompt, draft, and widget and return `continue` so Pi can perform native prompt expansion.
- [ ] On `session_shutdown`, clear the `pi-prompts` widget.
- [ ] Use no timer, watcher, process, socket, custom message, or background resource.
- [ ] Keep `pi-prompts` independent from `pi-modes` so Pi composes native prompt expansion with the existing mode input transform.

## Work Unit 7: Test and Document `pi-prompts`

- [ ] Replace the template unit-test behavior with tests for prompt filtering, returned order, first selection, wraparound, changed catalogues, empty catalogues, and single-prompt catalogues.
- [ ] Test draft capture, argument preservation, changed editor text, exact editor output, widget output, and lifecycle reset behavior.
- [ ] Test that the shortcut changes editor text without sending a message.
- [ ] Update the template end-to-end test so Pi loads `src/index.ts` through jiti without an LLM request.
- [ ] Run tests with `PI_OFFLINE=1`, `--no-extensions`, the explicit extension path, and `--no-session`.
- [ ] Use only the test files supplied by the template.
- [ ] Replace the template `README.md` with install, removal, prompt resource, Ctrl+Shift+P, editor argument, cycle order, reload, and `pi-modes` interaction documentation.
- [ ] Run the complete repository check script and `git diff --check`.

## Work Unit 8: Validate, Publish, and Install `pi-prompts`

- [ ] Load local `pi-modes` and `pi-prompts` together in one Pi TUI session without installed duplicate copies.
- [ ] Confirm that Shift+Tab changes only the mode and Ctrl+Shift+P changes only the prompt invocation.
- [ ] Confirm that both widgets remain visible under separate keys and that prompt submission clears only the prompt widget.
- [ ] Confirm that cycling preserves prompt arguments, wraps in Pi command order, and reflects prompt changes after reload.
- [ ] Confirm that Pi expands the selected native prompt and applies the active mode suffix exactly once.
- [ ] Confirm that reload, session replacement, shutdown, print mode, JSON mode, and RPC mode do not leave stale state or cause startup errors.
- [ ] Create `Distortedlogic/pi-prompts` as a private GitHub repository.
- [ ] Commit the implementation with the message `Add prompt cycling` and push the default branch.
- [ ] Install `git:github.com/Distortedlogic/pi-prompts` globally and reload Pi.
- [ ] Confirm that Pi lists one `pi-modes` package and one `pi-prompts` package and does not list `pi-just-answer`.
- [ ] Confirm that both worktrees are clean and record the two commit identifiers and completed checks.
