# Virtuoso → Analog Canvas

Offline tools for exporting a Virtuoso schematic snapshot and converting it into an editable Analog Canvas project. The repository provides a TypeScript CLI and a Virtuoso SKILL window. Conversion runs locally and does not require Bridge, an LLM, or a cloud service.

## Repository and dependency

`analog-canvas/` is a Git submodule pinned by `upstream-lock.json`. Clone it with:

```bash
git clone --recurse-submodules https://github.com/Lzy23321/virtuoso-canvas.git
cd virtuoso-canvas
```

Requirements: Node.js 24+, pnpm 11.16+, and Python 3.9+. Build the pinned upstream checkout and this project:

```bash
cd analog-canvas
pnpm install --frozen-lockfile
cd ..
npm run build
npm run schemas
npm test
python3 -m unittest discover -s tests -p 'test_wire_geometry.py'
```

The generated `dist/` directory is a build output. Do not copy only `dist/` to another machine. `VC_ROOT` selects the installation root and `VC_PYTHON` selects the Python executable.

## Current CLI workflow

First export an unmodified snapshot from Virtuoso CIW:

```lisp
load("/path/to/virtuoso-canvas/skill/export_schematic.il")
VCExportCell("library" "cell" "schematic" "/tmp/design.snapshot.json")
```

The output directory must already exist and the snapshot file must not exist. The exporter reads the saved database and does not check, save, or modify the schematic.

Prepare a readable mapping table:

```bash
node dist/packages/cli/src/main.js prepare /tmp/design.snapshot.json --out work/design-settings
```

Edit `work/design-settings/mappings.json`, then save the rules for reuse:

```bash
node dist/packages/cli/src/main.js save-mappings \
  /tmp/design.snapshot.json \
  --settings work/design-settings/mappings.json
```

Finally convert the snapshot:

```bash
node dist/packages/cli/src/main.js convert \
  /tmp/design.snapshot.json --out work/design-result
```

The normal result contains `project.icproj.json` and `report.json`. Add `--preview` for an SVG preview or `--debug` for complete intermediate diagnostics. Use `--mappings FILE` and `--config FILE` to select alternate personal files. Conversion options include `--scale`, `--bus-mode`, `--disabled-instances`, `--isolated-ports`, and `--unmapped-devices`.

The default mapping table is in `rules/builtin/mappings.json`. Personal configuration and mappings belong in `personal/`, which is intentionally ignored by Git. Unmapped devices use an embedded generic box by default; explicit mappings are validated against the source pins and supported Analog Canvas symbols.

## Virtuoso window

In CIW, load:

```lisp
load("/path/to/virtuoso-canvas/skill/virtuoso_canvas_ui.il")
VCUIShow()
```

The window can scan the current schematic, edit mappings for the current session, save personal mappings, and export a project. **Open Analog Canvas** starts or reuses the local Canvas service at `127.0.0.1:4173`; it does not import a project automatically.

For the fixed SKILL/Node protocol, see [docs/SKILL前端协议.md](docs/SKILL前端协议.md). For configuration and mapping details, see [docs/配置参考.md](docs/配置参考.md) and [docs/mapping-packages.zh-CN.md](docs/mapping-packages.zh-CN.md).

## Output and source-control boundaries

Do not commit `personal/`, `work/`, `dist/`, `node_modules/`, logs, environment files, PDK data, or real design snapshots. Synthetic tests and source code belong in the repository; real design data stays local.

The main implementation is in `packages/virtuoso-import/`; `packages/cli/` and `skill/` are entry points. See [docs/代码与文件流程.md](docs/代码与文件流程.md), [docs/Git跟踪范围.md](docs/Git跟踪范围.md), and [docs/发布与上游集成.md](docs/发布与上游集成.md).

The pinned Analog Canvas upstream is licensed under AGPL-3.0. Preserve its license and notices when redistributing the source or a modified build. PDK mappings and snapshots may contain sensitive information and are not included in the public repository.

The old `scan → recommend → confirm` and `--package` commands remain only for compatibility with existing scripts. New users should use `prepare → save-mappings → convert`.
