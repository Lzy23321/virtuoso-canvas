# Virtuoso Canvas Offline Backend

An offline backend for inspecting the devices used in one Virtuoso schematic,
reviewing reusable PDK mappings, and exporting editable Analog Canvas projects.
No Bridge, TCP command server, LLM, UI, or cloud account is required.

## Current boundaries

- New scanning, recommendation, approval, contracts, and CLI code are TypeScript.
- The canvas adapter currently runs an isolated copy of the validated Python
  geometry converter, plus upstream Node geometry/validation helpers. Python is
  still required. This compatibility implementation is private to the adapter;
  it can be replaced without changing the scan/confirm/convert interfaces.
- Six target device symbols are supported: NMOS, PMOS, resistor, capacitor,
  current source, and formal port. Ground/VDD markers are presentation additions.
  An upstream symbol existing does not automatically mean the adapter supports it.
- Single-level, scalar, orthogonal schematics only. No simulation-equivalence
  claim, ADE export, model-file execution, PDK callback execution, or bus expansion.
- Simulator metadata in the new SKILL exporter is best-effort. It has been
  implemented but has not yet been executed in a live Virtuoso session. Existing
  exported snapshots and synthetic metadata fixtures were used for backend tests.

## Layout

| Path                                   | Responsibility                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `analog-canvas/`                       | Unmodified pinned upstream checkout, retaining its Git history and licenses            |
| `upstream-lock.json`                   | Upstream revision and project schema compatibility                                     |
| `skill/export_schematic.il`            | Read-only export, including master pins, effective CDF and selected simulator metadata |
| `packages/virtuoso-import/core/contracts.ts`       | Runtime-validated, versioned input/output types                                        |
| `packages/virtuoso-import/core/index.ts`           | Scan, recommend, explicit confirmation, personal package resolution                    |
| `packages/virtuoso-import/adapter/index.ts` | Catalog boundary, isolated conversion, cancellation, final connectivity comparison     |
| `packages/virtuoso-import/engine/`      | Offline compatibility geometry implementation; contains no Bridge client               |
| `packages/cli/src/main.ts`             | File I/O, JSON responses, progress, output publication                                 |
| `rules/builtin/common.json`            | Common exact master/view rules; no foundry-specific rules                              |
| `schemas/`                             | Generated JSON Schemas for files and future tools                                      |
| `tests/`                               | Synthetic examples and automated tests, without PDK data                               |
| `work/`, `personal/`                   | Local/private output and reviewed packages, excluded from source control               |

## Runtime and offline build

Use Node.js 24 and Python 3.9 or newer. The current installation includes a local
copy of the upstream build and dependencies, so no network install is needed:

```bash
cd /home/userone/projects/virtuoso-canvas
node scripts/build.mjs
node scripts/schemas.mjs
node --test tests/backend.test.mjs
node dist/packages/cli/src/main.js --help
```

`dist/analog-canvas` is a relative link to the dependency checkout. Keep the root
installation together; copying only `dist/` is not a standalone release. For a
new machine without dependencies, prepare the pinned upstream dependency/build
tree beforehand on a compatible platform. It is not yet a cross-platform binary
installer. Do not attempt online npm installs from the company production host.
`VC_PYTHON` selects a Python executable; `VC_ROOT` selects an installation root.

## Export without Bridge

In a Virtuoso CIW, after selecting the intended schematic and checking its saved
connectivity yourself:

```lisp
load("/home/userone/projects/virtuoso-canvas/skill/export_schematic.il")
VCExportSchematic("/your/existing/output/directory/design.snapshot.json")
```

The directory must exist and the output must not exist. The function returns an
export summary. It neither saves nor checks/modifies the design. It can also take
an explicit cellView as its optional second argument, for a future menu callback
that captures the selected cellView before starting. No UI is installed now.

The extractor reads `spectre`, `hspiceD`, and `auCdl` simInfo when available,
including `termOrder`, `componentName`, and `modelName`. It exports effective CDF
parameter values too. This is metadata, not parsing the actual foundry models.
Older v1 snapshots without simulationInfo are accepted and explicitly marked as
missing that evidence. Use an unfiltered snapshot for scanning: filtering first
can remove useful recommendation evidence.

## CLI workflow

All `--out` values are new directories, not filenames. Existing results are never
overwritten. stdout is one JSON result; stderr carries progress or a structured
error. Inputs, proposals and packages can contain sensitive design information.

### 1. Scan

```bash
node dist/packages/cli/src/main.js scan /path/design.snapshot.json --out work/scan-1
```

`inventory.json` groups instances by library/cell only. Parameter values, pins
and views remain per-instance. Model evidence and property storage types do not
split groups. Conversion still validates each instance against the mapping.
Geometric source symbols remain in the original snapshot.

### 2. Recommend and inspect

```bash
node dist/packages/cli/src/main.js recommend work/scan-1/inventory.json --out work/review-1
# Reuse a previously reviewed personal package:
node dist/packages/cli/src/main.js recommend work/scan-1/inventory.json --personal personal/pdk/mapping-package.json --out work/review-2
```

Outputs are `proposal.json`, `preview.txt`, and `decisions.json`. Personal library/cell
rules take precedence over builtins. Builtins are candidates, not
automatic approvals. Four explicit D/G/S/B roles allow MOS candidates; absent
reliable polarity metadata both NMOS and PMOS are shown. Names alone do not
establish device identity. Two-terminal CDF component hints are also supported.
Unknown or extra-pin devices remain unresolved rather than losing terminals.

The preview is a text table/report of the source master, instance IDs, pins,
model clues, parameters, candidate target and pin/parameter mappings. It is not
yet a graphical source/target symbol comparison UI.

### 3. Confirm

Edit the generated `decisions.json`, not the proposal. Set `reviewedBy` and change
each reviewed item from `pending` to `approve`, choosing its `candidateId`.
For ambiguous items copy the desired candidate ID from the report. For a custom
mapping, remove `candidateId` and supply `mapping`, for example:

```json
{
  "itemId": "the-generated-item-id",
  "action": "approve",
  "mapping": {
    "symbol": "resistor",
    "pins": { "PLUS": "1", "MINUS": "2" },
    "parameters": { "r": "r", "m": "m" }
  }
}
```

Every master pin, including unconnected extra pins, must be accounted for. Pin
shorting or implicit B ties are not supported. Parameter maps specify exact source
names and target parameter names; unlisted parameters are omitted from conversion,
but never erased from the source snapshot/inventory.

```bash
node dist/packages/cli/src/main.js confirm work/review-1/proposal.json --decisions work/review-1/decisions.json --name my-pdk --out personal/pdk-1
```

To merge approved additions into your personal package, pass `--personal` with
the old package and use a new output directory. `reject` removes an existing
rule for that library/cell; `pending` does not approve a new rule. Partial review
saves the approved subset and returns exit code 2 with unresolved IDs. Conversion
requires a valid confirmed mapping for every used instance. Proposal/decision
digests prevent accidental use of stale files, not adversarial authorization;
local reviewers are trusted and these files are not cryptographically signed.

### 4. Convert

```bash
node dist/packages/cli/src/main.js convert /path/design.snapshot.json --package personal/pdk-1/mapping-package.json --out work/converted-1
```

Outputs: `project.icproj.json`, `filtered.snapshot.json`, `preview.svg`,
`report.json`, `validation.json`, and `refinement.json`. The filtered snapshot
keeps the diagram-relevant parameters selected by the confirmed mapping for
debugging; always scan the original snapshot when reusing a mapping package.
Validation precedes publication. Failures return structured
details (including native diagnostics when available), not a partially delivered
project. Each conversion has private temporary files and a timeout. CLI SIGINT
and SIGTERM cancel the converter process group on Linux.

Use `defaults` to inspect the presentation configuration and `--presentation FILE`
to supply a modified copy. Defaults hide B branches on configured power/ground
nets while retaining electrical B membership, use plain source labels, and add
native power/ground or hollow open-end markers. `--allow-label-overlap` permits
only residual label overlaps; other native checks still block export.

## API boundary for future MCP or tools

Core functions do not read files, write logs, call process.exit, run a server, or
request approval interactively. They accept plain data and throw `BackendError`
or schema errors. The API can be used independently from the CLI:

```javascript
import {
  scanDesign,
  recommendMappings,
  confirmMappings,
} from "./dist/packages/virtuoso-import/core/index.js";
import {
  loadCatalog,
  convertDesign,
} from "./dist/packages/virtuoso-import/adapter/index.js";
const runtime = { root: "/path/to/virtuoso-canvas", python: "python3" };
const catalog = await loadCatalog(runtime);
const inventory = scanDesign(snapshot);
const proposal = recommendMappings(
  inventory,
  builtinRules,
  catalog,
  personalPackage,
);
// decisions comes from an explicit human/tool review, not an inferred approval.
const reviewed = confirmMappings(proposal, decisions, catalog, {
  name: "my-pdk",
});
const result = await convertDesign(snapshot, reviewed.package, {
  runtime,
  signal: abortController.signal,
  onProgress: (event) => recordProgress(event),
});
```

Progress/cancellation hooks, structured diagnostics, versioned schemas and a
separate storage/CLI boundary are the extension points. No MCP SDK or remote API
has been introduced. Synchronous core work checks cancellation between items;
large interactive integrations may run it in a worker to keep their event loop free.

## Verification and contribution hygiene

`tests/backend.test.mjs` covers the full synthetic CLI loop, explicit approvals,
stale rules, missing pins, parameter expressions, source immutability, native
validation and overwrite protection. Local real-design regression is opt-in:

```bash
node scripts/regression.mjs /path/raw.snapshot.json /path/previously-reviewed-symbol_mapping.json work/regression-1
```

That helper uses prior reviewed mappings solely for regression. Its generated
report is explicitly labeled as a regression import, not a fresh user approval.
Do not commit its output. Only synthetic examples belong in a public repository.
Library/cell matching is not a proof of PDK model equivalence. Old packages with
multiple entries for the same library/cell require review into a single rule.
Regenerate scans and proposals after this grouping change.
Upstream and PDK/license permissions still require review before redistribution.
No files have been uploaded and no upstream files were modified.
