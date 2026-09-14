# Package Mode Loading Task List

## Scope

- [ ] Change only the `pi-just-answer` repository.
- [ ] Do not change the Pi source repository.
- [ ] Load package mode files from `package.json` entries under `pi.modes`.
- [ ] Keep package discovery independent from Pi trust and package filtering.
- [ ] Preserve all existing global, project, TUI, and input behavior.
- [ ] Do not add package installation, update, settings parsing, event registration, file watching, or inline package modes.

## Work Unit 1: Remove the Invalid Pi Integration

- [x] In `index.ts`, remove all use of `event.modePaths`.
- [x] Change the `session_start` event parameter back to `_event` when the event data is not used.
- [x] Keep the existing `session_start` lifecycle as the package scan entry point.
- [x] Remove imports that become unused after `event.modePaths` is removed.
- [x] Confirm that the extension uses only APIs available in `@earendil-works/pi-coding-agent >=0.85.1 <1`.

### Completion criteria

- [x] `index.ts` has no dependency on a modified Pi build.
- [x] The extension starts when `session_start` does not contain `modePaths`.

## Work Unit 2: Define Package Discovery Locations

- [x] Determine the Pi agent directory with this priority:
  1. `PI_CODING_AGENT_DIR` when it is set.
  2. `join(homedir(), CONFIG_DIR_NAME, "agent")` otherwise.
- [x] Build the global scan roots:
  - `<agentDir>/npm/node_modules`
  - `<agentDir>/git`
  - `<agentDir>/extensions`
- [x] Build the project scan roots without a trust check:
  - `<cwd>/<CONFIG_DIR_NAME>/npm/node_modules`
  - `<cwd>/<CONFIG_DIR_NAME>/git`
  - `<cwd>/<CONFIG_DIR_NAME>/extensions`
- [x] Add `<cwd>/package.json` as a direct package manifest candidate.
- [x] Keep global roots before project roots so project package modes load later.
- [x] Ignore scan roots that do not exist.

### Completion criteria

- [x] Package discovery does not read Pi settings.
- [x] Package discovery does not call `ctx.isProjectTrusted()`.
- [x] Package discovery does not install, update, enable, or disable packages.

## Work Unit 3: Discover Package Manifests

- [ ] Import and use Node's native `globSync()` implementation.
- [ ] Under each npm root, find:
  - `*/package.json`
  - `@*/*/package.json`
- [ ] Under each Git root, find `**/package.json`.
- [ ] Under each extension root, find `**/package.json`.
- [ ] Exclude `**/node_modules/**` from recursive Git and extension scans.
- [ ] Exclude `**/.git/**` from recursive Git and extension scans.
- [ ] Sort matches from each scan lexically.
- [ ] Normalize each manifest path.
- [ ] Deduplicate manifest paths while preserving the first occurrence.
- [ ] Do not scan other home, project, or system directories.

### Completion criteria

- [ ] Unscoped npm packages are found.
- [ ] Scoped npm packages are found.
- [ ] Git-installed packages are found without scanning their dependencies.
- [ ] Extension-directory packages are found without scanning their dependencies.
- [ ] The current project package manifest is considered once.

## Work Unit 4: Read `pi.modes` Declarations

- [ ] Read each discovered `package.json` as UTF-8.
- [ ] Remove an optional UTF-8 byte-order mark before JSON parsing.
- [ ] Skip malformed unrelated package manifests without stopping startup.
- [ ] Skip packages that do not contain `pi.modes`.
- [ ] Require `pi.modes` to be an array.
- [ ] Require each `pi.modes` entry to be a non-empty string.
- [ ] Report one clear error for an invalid `pi.modes` declaration.
- [ ] Resolve each entry relative to the directory that contains its `package.json`.
- [ ] Accept only paths ending in `.yml` or `.yaml`.
- [ ] Treat each entry as an exact path.
- [ ] Do not interpret globs, directories, `!`, `+`, or `-` in `pi.modes`.
- [ ] Preserve package order and declaration order.
- [ ] Normalize and deduplicate resolved mode file paths while preserving the first occurrence.

### Completion criteria

- [ ] This declaration resolves `./AGENT_MODES.yml` from the package root:

  ```json
  {
    "pi": {
      "extensions": ["./index.ts"],
      "modes": ["./AGENT_MODES.yml"]
    }
  }
  ```

- [ ] One bad package declaration does not block other package declarations.

## Work Unit 5: Reuse One YAML Mode Loader

- [ ] Extract the current YAML read, parse, and validation logic into one local function.
- [ ] Give the function these inputs:
  - mode file path;
  - destination `Map<string, string>`;
  - whether a missing file is optional;
  - extension context for error reporting.
- [ ] Keep `parse(..., { mapAsMap: true })`.
- [ ] Require the YAML document to be a map.
- [ ] Require each mode name to be a non-empty string.
- [ ] Require each mode value to be a string.
- [ ] Keep an empty string as a valid mode value.
- [ ] Validate the complete file before adding any entry to the destination map.
- [ ] Skip only an optional missing file.
- [ ] Report all other read, parse, and validation errors.
- [ ] Continue with later files after an error.

### Completion criteria

- [ ] Package, global, and project mode files use the same parser and validation rules.
- [ ] An invalid entry cannot cause a partial file load.

## Work Unit 6: Apply Source Order and Overrides

- [ ] Load package mode files from global scan roots first.
- [ ] Load package mode files from project scan roots second.
- [ ] Load `~/.pi/AGENT_MODES.yml` third.
- [ ] Load `<cwd>/<CONFIG_DIR_NAME>/AGENT_MODES.yml` last when the existing project trust check permits it.
- [ ] Mark package-declared files as required.
- [ ] Mark the existing global and project files as optional.
- [ ] Continue to use `configured.set(name, text)` for overrides.
- [ ] Keep later mode values as the winners for duplicate names.
- [ ] Do not add duplicate warnings or source metadata.

### Completion criteria

- [ ] Project package modes replace global package modes with the same name.
- [ ] The explicit global mode file replaces package modes with the same name.
- [ ] The explicit project mode file has the highest priority.
- [ ] Duplicate replacement does not add a second cycle entry.

## Work Unit 7: Preserve Existing Runtime Behavior

- [ ] Keep `["exec", ""]` as the fallback when no valid mode is loaded.
- [ ] Do not add `exec` when configured modes exist and do not define it.
- [ ] Reset `modeIndex` to zero during each `session_start`.
- [ ] Keep the existing widget key and placement.
- [ ] Keep `Shift+Tab` mode cycling.
- [ ] Keep key-repeat and key-release consumption.
- [ ] Keep terminal input listener cleanup before reinitialization.
- [ ] Keep terminal input listener cleanup during `session_shutdown`.
- [ ] Keep the existing separator text.
- [ ] Keep duplicate-suffix prevention.
- [ ] Keep extension-source input exclusion.
- [ ] Keep image forwarding in transformed input.

### Completion criteria

- [ ] Package discovery changes only the set of available modes.
- [ ] Existing global and project mode behavior remains unchanged.

## Work Unit 8: Update Package Documentation

- [ ] Populate `README.md` with installation and configuration instructions.
- [ ] Add a `pi.modes` package manifest example.
- [ ] State that each `pi.modes` entry is an exact relative YAML file path.
- [ ] List all package scan locations.
- [ ] Document package, global, and project source priority.
- [ ] State that package discovery does not use Pi trust or package filters.
- [ ] Document error behavior.
- [ ] Tell users to run `/reload` after a manifest or mode file change.
- [ ] Verify `docs/global-skills/add-pi-mode/SKILL.md` instructs package owners to add exact files under `pi.modes`.
- [ ] Keep the package description accurate for package, global, and project modes.
- [ ] Keep version `0.2.0` for this feature.

## Work Unit 9: Validate the Implementation

- [ ] Do not create a new test suite because this repository does not have one.
- [ ] Run the available TypeScript or package validation command if the repository provides one.
- [ ] Run `git diff --check`.
- [ ] Start Pi with the local extension.
- [ ] Verify an unscoped npm package mode.
- [ ] Verify a scoped npm package mode.
- [ ] Verify a Git package mode.
- [ ] Verify an extension-directory package mode.
- [ ] Verify a current project package mode.
- [ ] Verify more than one mode file in one package.
- [ ] Verify duplicate mode replacement across global and project package roots.
- [ ] Verify global `AGENT_MODES.yml` overrides a package mode.
- [ ] Verify project `AGENT_MODES.yml` overrides all earlier sources.
- [ ] Verify malformed `package.json` does not stop startup.
- [ ] Verify invalid `pi.modes` reports an error and does not stop other packages.
- [ ] Verify a missing declared mode file reports an error.
- [ ] Verify malformed YAML reports an error.
- [ ] Verify the `exec` fallback when no valid mode exists.
- [ ] Verify `/reload` finds manifest and YAML changes.
- [ ] Verify `Shift+Tab` cycles through the final mode order.
- [ ] Verify submitted input receives the selected suffix exactly once.

## Work Unit 10: Final Review and Commit

- [ ] Confirm that no file outside `pi-just-answer` changed.
- [ ] Confirm that no Pi source file changed.
- [ ] Confirm that no dependency was added.
- [ ] Confirm that package discovery contains no trust check.
- [ ] Confirm that package discovery contains no settings parser or package manager implementation.
- [ ] Confirm that the implementation follows the fixed scan locations and exact-path contract.
- [ ] Review the final diff for unrelated edits.
- [ ] Commit the completed implementation with a minimal, accurate message.
