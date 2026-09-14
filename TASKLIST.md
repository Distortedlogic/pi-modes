# `pi-modes` and `pi-prompts` Implementation Task List

## Work Unit 1: Establish the Change Baseline

- [ ] Confirm that the current `pi-just-answer` worktree has no unrelated changes before the rename starts.
- [ ] Record the current branch, Git remote, repository visibility, release tags, and installed Pi package source so the rename preserves them.
- [ ] Confirm that the current repository has no test suite and do not add new test files only for the rename.
- [ ] Keep all Pi source repositories unchanged because both features must use the published extension API.
- [ ] Limit the current repository to mode loading and mode application, and put all prompt cycling behavior in the new repository.

## Work Unit 2: Rename the Current Package to `pi-modes`

- [ ] Change the package name in `package.json` from `pi-just-answer` to `pi-modes`.
- [ ] Change the package description so it states that the extension loads and cycles package and project modes from YAML.
- [ ] Change the repository URL in `package.json` to `git+https://github.com/Distortedlogic/pi-modes.git`.
- [ ] Advance the package version from `0.2.0` to `0.3.0` for the renamed release.
- [ ] Keep `./index.ts` as the extension entry point and do not restructure the existing repository during the rename.
- [ ] Keep `yaml` as a runtime dependency because `index.ts` parses mode files with it.
- [ ] Keep both Pi peer dependencies because `index.ts` imports the coding-agent and TUI packages directly.
- [ ] Keep `pi.modes` and `pi.skills` in the package manifest without changing their current resource paths.

## Work Unit 3: Rename Mode-Specific Runtime Identifiers

- [ ] Change the mode widget key in `index.ts` from `just-answer-mode` to `pi-modes`.
- [ ] Keep `AGENT_MODES.yml`, the `exec` fallback, source precedence, YAML validation, and duplicate-name replacement unchanged.
- [ ] Keep Shift+Tab as the mode cycle key and preserve key-repeat and key-release handling.
- [ ] Keep mode suffix insertion, image forwarding, duplicate-suffix prevention, and extension-source exclusion unchanged.
- [ ] Keep terminal input listener cleanup on session restart, reload, replacement, and shutdown unchanged.
- [ ] Search tracked source files for `pi-just-answer`, `just-answer`, and old repository URLs, and replace only identifiers that belong to this package.

## Work Unit 4: Update `pi-modes` Documentation and Skill Content

- [ ] Rewrite `README.md` names, repository links, install commands, examples, and descriptions to use `pi-modes`.
- [ ] Keep the `README.md` contract for package `pi.modes` declarations, trusted project mode files, source order, and reload behavior accurate.
- [ ] Update `skills/add-pi-mode/SKILL.md` so all package names, paths, links, and install instructions use `pi-modes`.
- [ ] Keep the `add-pi-mode` skill focused on adding modes to global, project, or package scope.
- [ ] Update `CONTEXT_PRELOAD.yml` only if the existing repository gains one through a separate approved change, and do not add it as part of this rename.

## Work Unit 5: Validate and Prepare the `pi-modes` Rename

- [ ] Run every validation command already provided by the current repository without adding a new test framework.
- [ ] Run `git diff --check` and correct all whitespace errors.
- [ ] Load the local extension through Pi and confirm that it starts without a modified Pi build.
- [ ] Confirm that package modes and the trusted project `AGENT_MODES.yml` still load in the established order.
- [ ] Confirm that Shift+Tab cycles every configured mode and wraps to the first mode.
- [ ] Confirm that submitted input receives the active mode suffix exactly once.
- [ ] Review the complete diff and confirm that all functional changes are limited to rename identifiers.

## Work Unit 6: Rename and Reinstall the `pi-modes` Repository

- [ ] Rename the GitHub repository from `Distortedlogic/pi-just-answer` to `Distortedlogic/pi-modes` while preserving its history, tags, and visibility.
- [ ] Update the local `origin` remote to the new `Distortedlogic/pi-modes` URL.
- [ ] Commit the tracked rename changes with the message `Rename to pi-modes`.
- [ ] Push the renamed branch and applicable tags to the renamed GitHub repository.
- [ ] Remove `git:github.com/Distortedlogic/pi-just-answer` from the Pi package settings before installing the new source identity.
- [ ] Install `git:github.com/Distortedlogic/pi-modes` in the same Pi scope that held the old package.
- [ ] Reload or restart Pi and confirm that only one copy of the modes extension loads.
- [ ] Leave the active Pi session before renaming the local directory from `pi-just-answer` to `pi-modes` under its current parent directory.

## Work Unit 7: Create the `pi-prompts` Repository from the Extension Template

- [ ] Confirm that `~/repos/pi-prompts` does not exist or is empty, and stop if the target directory contains files.
- [ ] Copy all content from the Pi extension authoring template into `~/repos/pi-prompts`, including `.gitignore`, tests, and `CONTEXT_PRELOAD.yml`.
- [ ] Replace every `__NAME__` value with `pi-prompts` and every `__DESCRIPTION__` value with a short prompt-cycling description.
- [ ] Keep all runtime TypeScript in `src/` and start with only `src/index.ts`.
- [ ] Remove all template-only runtime behavior while preserving the template test and configuration structure.
- [ ] Set the package repository URL to `git+https://github.com/Distortedlogic/pi-prompts.git` and keep the package private.
- [ ] Include the `pi-package` keyword and declare `./src/index.ts` under `pi.extensions`.
- [ ] Add only `@earendil-works/pi-coding-agent` as a runtime peer dependency unless the final source directly imports another Pi package.
- [ ] Do not add `yaml`, `@earendil-works/pi-tui`, Vite, a build step, or a custom prompt parser.
- [ ] Run `npm install` after the package metadata is complete so the repository has a current `package-lock.json`.

## Work Unit 8: Add Native Pi Prompt Resources

- [ ] Create a top-level `prompts/` directory for the supplied preset Markdown prompt files.
- [ ] Add each supplied preset as one native Pi Markdown prompt without copying its body into TypeScript.
- [ ] Declare the prompt files under `pi.prompts` in the required cycle order instead of implementing a second resource scanner.
- [ ] Give each prompt a unique command name that does not conflict with an extension command or a built-in interactive command.
- [ ] Keep prompt descriptions and other supported prompt metadata in the Markdown files so Pi remains the source of prompt metadata.
- [ ] Use Pi package and project resource loading for trust, filtering, reload, and prompt expansion behavior.
- [ ] Add only the prompt files needed by this package to `CONTEXT_PRELOAD.yml`, and do not preload lock files or test files.

## Work Unit 9: Implement Prompt Discovery and Cycle State

- [ ] Import only the extension types required by `src/index.ts` from `@earendil-works/pi-coding-agent`.
- [ ] Obtain the current command catalogue with `pi.getCommands()` when the user cycles prompts so reload and project changes are visible.
- [ ] Select only command entries whose `source` is `prompt` and preserve their Pi resource order.
- [ ] Exclude prompt names that are shadowed by registered extension commands because Pi dispatches extension commands before prompt expansion.
- [ ] Keep the current prompt index, selected prompt name, and editor draft as session-local in-memory state.
- [ ] Initialize the prompt index so the first cycle selects the first available prompt.
- [ ] Reconcile the selected prompt by name when the command catalogue changes, and restart from the first prompt if the selected prompt no longer exists.
- [ ] Wrap from the final available prompt to the first available prompt.
- [ ] Leave prompt selection unpersisted because it is temporary editor state and not conversation state.

## Work Unit 10: Implement Native Shortcut and Editor Behavior

- [ ] Register Ctrl+Shift+P with `pi.registerShortcut()` and describe it as cycling native Pi prompts.
- [ ] Do not register Ctrl+P because Pi reserves it for model controls.
- [ ] Do not use `ctx.ui.onTerminalInput()` because native shortcut registration supplies conflict detection and Pi key handling.
- [ ] Read the current editor text on the first cycle and preserve it as the prompt argument draft.
- [ ] Set the editor to `/<prompt-name>` when the saved draft is empty.
- [ ] Set the editor to `/<prompt-name> <draft>` when the saved draft is not empty.
- [ ] On later cycles, replace only the selected prompt invocation and preserve user changes to the prompt arguments.
- [ ] Treat editor text that no longer starts with the selected prompt invocation as a new draft before the next cycle.
- [ ] Do not call `pi.sendUserMessage()` from the shortcut because selecting a prompt must not submit it.
- [ ] Leave the slash command in the editor so Pi expands the current Markdown template only after the user submits it.
- [ ] Leave the editor unchanged and show one warning notification when no native prompt commands are available.

## Work Unit 11: Implement Prompt UI and Lifecycle Cleanup

- [ ] Use `pi-prompts` as the prompt widget key so it cannot replace the `pi-modes` widget.
- [ ] Show the selected prompt name and its cycle position in a one-line widget below the editor.
- [ ] Reset the prompt index, selected prompt name, and saved draft during each `session_start` event.
- [ ] Clear the prompt widget during each `session_start` event before new prompt state is used.
- [ ] Clear the prompt cycle state and widget when selected input is submitted, while returning `continue` from the `input` handler.
- [ ] Clear the prompt widget during `session_shutdown` so reload and session replacement do not leave stale UI.
- [ ] Use no timer, watcher, process, socket, or other background resource.
- [ ] Keep the extension inactive outside normal Pi resource discovery and shortcut events.

## Work Unit 12: Update the Template Tests for `pi-prompts`

- [ ] Replace the template unit-test behavior with tests for prompt filtering, stable order, first selection, wraparound, and catalogue changes.
- [ ] Test that extension-command name collisions are excluded from the prompt cycle.
- [ ] Test empty and single-prompt catalogues.
- [ ] Test editor draft capture, prompt invocation replacement, argument edits, and new-draft detection.
- [ ] Test state reset after input submission, session start, and session shutdown.
- [ ] Test that prompt selection changes editor text without submitting a user message.
- [ ] Update the existing end-to-end test so Pi loads `src/index.ts` through jiti without an LLM request.
- [ ] Run behavior tests with `PI_OFFLINE=1`, `--no-extensions`, one explicit `--extension` path, and `--no-session` unless persistence is under test.
- [ ] Inspect extension registration, command data, editor UI requests, or state directly instead of asking a model to confirm hidden behavior.
- [ ] Do not create additional test files unless an existing template test file cannot hold a required test category.

## Work Unit 13: Document `pi-prompts`

- [ ] Replace the template `README.md` with installation, prompt resource, shortcut, editor, reload, and removal instructions for `pi-prompts`.
- [ ] Document that Ctrl+Shift+P cycles prompts and Ctrl+P remains assigned to Pi model controls.
- [ ] Document that the extension cycles native commands with `source: prompt` instead of reading Markdown files itself.
- [ ] Document the prompt cycle order and how package manifest order controls package-owned presets.
- [ ] Document how existing editor text becomes prompt arguments and remains editable before submission.
- [ ] Document the no-prompt warning and command-name collision limits.
- [ ] Document that prompt templates are one-time tasks while `pi-modes` supplies persistent per-message instructions.
- [ ] Add a native `add-pi-prompt` skill only if its content gives a distinct workflow for adding global, project, and package prompt templates.
- [ ] If `add-pi-prompt` is included, declare `./skills` under `pi.skills` and remove all template-only skill content.

## Work Unit 14: Validate Both Extensions Together

- [ ] Run the complete `pi-prompts` check script and correct all type, format, lint, unit, and end-to-end failures.
- [ ] Run `git diff --check` in both repositories.
- [ ] Load both local extensions in one Pi TUI session without installed duplicate copies.
- [ ] Confirm that Shift+Tab changes only the current mode and Ctrl+Shift+P changes only the prompt invocation in the editor.
- [ ] Confirm that the `pi-modes` and `pi-prompts` widgets can appear without replacing each other.
- [ ] Confirm that repeated prompt cycling preserves the current editor arguments.
- [ ] Confirm that submitting a selected prompt clears only the prompt widget and leaves the current mode active.
- [ ] Confirm that Pi expands the selected native prompt and that `pi-modes` applies its suffix exactly once.
- [ ] Confirm that `/reload`, `/new`, `/resume`, and shutdown do not retain stale prompt state or widgets.
- [ ] Confirm that print, JSON, and RPC startup do not fail even though prompt cycling is a TUI shortcut feature.

## Work Unit 15: Publish and Install `pi-prompts`

- [ ] Review the final `pi-prompts` diff and remove all unrelated files, dependencies, comments, and template behavior.
- [ ] Commit the completed `pi-prompts` implementation with the message `Add prompt cycling`.
- [ ] Create `Distortedlogic/pi-prompts` as a private GitHub repository.
- [ ] Push the default branch to the private repository.
- [ ] Install `git:github.com/Distortedlogic/pi-prompts` in the required Pi scope.
- [ ] Reload or restart Pi after both Git package sources are installed.
- [ ] Confirm with the Pi package list that `pi-modes` and `pi-prompts` each load once and `pi-just-answer` is absent.
- [ ] Confirm the final working trees are clean and report the two commit identifiers, repository URLs, installed package sources, checks, and manual verification results.
