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

- [x] Import and use Node's native `globSync()` implementation.
- [x] Under each npm root, find:
  - `*/package.json`
  - `@*/*/package.json`
- [x] Under each Git root, find `**/package.json`.
- [x] Under each extension root, find `**/package.json`.
- [x] Exclude `**/node_modules/**` from recursive Git and extension scans.
- [x] Exclude `**/.git/**` from recursive Git and extension scans.
- [x] Sort matches from each scan lexically.
- [x] Normalize each manifest path.
- [x] Deduplicate manifest paths while preserving the first occurrence.
- [x] Do not scan other home, project, or system directories.

### Completion criteria

- [x] Unscoped npm packages are found.
- [x] Scoped npm packages are found.
- [x] Git-installed packages are found without scanning their dependencies.
- [x] Extension-directory packages are found without scanning their dependencies.
- [x] The current project package manifest is considered once.

## Work Unit 4: Read `pi.modes` Declarations

- [x] Read each discovered `package.json` as UTF-8.
- [x] Remove an optional UTF-8 byte-order mark before JSON parsing.
- [x] Skip malformed unrelated package manifests without stopping startup.
- [x] Skip packages that do not contain `pi.modes`.
- [x] Require `pi.modes` to be an array.
- [x] Require each `pi.modes` entry to be a non-empty string.
- [x] Report one clear error for an invalid `pi.modes` declaration.
- [x] Resolve each entry relative to the directory that contains its `package.json`.
- [x] Accept only paths ending in `.yml` or `.yaml`.
- [x] Treat each entry as an exact path.
- [x] Do not interpret globs, directories, `!`, `+`, or `-` in `pi.modes`.
- [x] Preserve package order and declaration order.
- [x] Normalize and deduplicate resolved mode file paths while preserving the first occurrence.

### Completion criteria

- [x] This declaration resolves `./AGENT_MODES.yml` from the package root:

  ```json
  {
    "pi": {
      "extensions": ["./index.ts"],
      "modes": ["./AGENT_MODES.yml"]
    }
  }
  ```

- [x] One bad package declaration does not block other package declarations.

## Work Unit 5: Reuse One YAML Mode Loader

- [x] Extract the current YAML read, parse, and validation logic into one local function.
- [x] Give the function these inputs:
  - mode file path;
  - destination `Map<string, string>`;
  - whether a missing file is optional;
  - extension context for error reporting.
- [x] Keep `parse(..., { mapAsMap: true })`.
- [x] Require the YAML document to be a map.
- [x] Require each mode name to be a non-empty string.
- [x] Require each mode value to be a string.
- [x] Keep an empty string as a valid mode value.
- [x] Validate the complete file before adding any entry to the destination map.
- [x] Skip only an optional missing file.
- [x] Report all other read, parse, and validation errors.
- [x] Continue with later files after an error.

### Completion criteria

- [x] Package, global, and project mode files use the same parser and validation rules.
- [x] An invalid entry cannot cause a partial file load.

## Work Unit 6: Apply Source Order and Overrides

- [x] Load package mode files from global scan roots first.
- [x] Load package mode files from project scan roots second.
- [x] Load `~/.pi/AGENT_MODES.yml` third.
- [x] Load `<cwd>/<CONFIG_DIR_NAME>/AGENT_MODES.yml` last when the existing project trust check permits it.
- [x] Mark package-declared files as required.
- [x] Mark the existing global and project files as optional.
- [x] Continue to use `configured.set(name, text)` for overrides.
- [x] Keep later mode values as the winners for duplicate names.
- [x] Do not add duplicate warnings or source metadata.

### Completion criteria

- [x] Project package modes replace global package modes with the same name.
- [x] The explicit global mode file replaces package modes with the same name.
- [x] The explicit project mode file has the highest priority.
- [x] Duplicate replacement does not add a second cycle entry.

## Work Unit 7: Preserve Existing Runtime Behavior

- [x] Keep `["exec", ""]` as the fallback when no valid mode is loaded.
- [x] Do not add `exec` when configured modes exist and do not define it.
- [x] Reset `modeIndex` to zero during each `session_start`.
- [x] Keep the existing widget key and placement.
- [x] Keep `Shift+Tab` mode cycling.
- [x] Keep key-repeat and key-release consumption.
- [x] Keep terminal input listener cleanup before reinitialization.
- [x] Keep terminal input listener cleanup during `session_shutdown`.
- [x] Keep the existing separator text.
- [x] Keep duplicate-suffix prevention.
- [x] Keep extension-source input exclusion.
- [x] Keep image forwarding in transformed input.

### Completion criteria

- [x] Package discovery changes only the set of available modes.
- [x] Existing global and project mode behavior remains unchanged.

## Work Unit 8: Update Package Documentation

- [x] Populate `README.md` with installation and configuration instructions.
- [x] Add a `pi.modes` package manifest example.
- [x] State that each `pi.modes` entry is an exact relative YAML file path.
- [x] List all package scan locations.
- [x] Document package, global, and project source priority.
- [x] State that package discovery does not use Pi trust or package filters.
- [x] Document error behavior.
- [x] Tell users to run `/reload` after a manifest or mode file change.
- [x] Verify `docs/global-skills/add-pi-mode/SKILL.md` instructs package owners to add exact files under `pi.modes`.
- [x] Keep the package description accurate for package, global, and project modes.
- [x] Keep version `0.2.0` for this feature.

## Work Unit 9: Validate the Implementation

- [x] Do not create a new test suite because this repository does not have one.
- [x] Run the available TypeScript or package validation command if the repository provides one.
- [x] Run `git diff --check`.
- [x] Start Pi with the local extension.
- [x] Verify an unscoped npm package mode.
- [x] Verify a scoped npm package mode.
- [x] Verify a Git package mode.
- [x] Verify an extension-directory package mode.
- [x] Verify a current project package mode.
- [x] Verify more than one mode file in one package.
- [x] Verify duplicate mode replacement across global and project package roots.
- [x] Verify global `AGENT_MODES.yml` overrides a package mode.
- [x] Verify project `AGENT_MODES.yml` overrides all earlier sources.
- [x] Verify malformed `package.json` does not stop startup.
- [x] Verify invalid `pi.modes` reports an error and does not stop other packages.
- [x] Verify a missing declared mode file reports an error.
- [x] Verify malformed YAML reports an error.
- [x] Verify the `exec` fallback when no valid mode exists.
- [x] Verify `/reload` finds manifest and YAML changes.
- [x] Verify `Shift+Tab` cycles through the final mode order.
- [x] Verify submitted input receives the selected suffix exactly once.

## Work Unit 10: Final Review and Commit

- [x] Confirm that no file outside `pi-just-answer` changed.
- [x] Confirm that no Pi source file changed.
- [x] Confirm that no dependency was added.
- [x] Confirm that package discovery contains no trust check.
- [x] Confirm that package discovery contains no settings parser or package manager implementation.
- [x] Confirm that the implementation follows the fixed scan locations and exact-path contract.
- [x] Review the final diff for unrelated edits.
- [x] Commit the completed implementation with a minimal, accurate message.
