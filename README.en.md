# Virtuoso to Analog Canvas

[中文](README.md) | English

Export a Cadence Virtuoso schematic as an editable Analog Canvas project. Conversion runs locally; it does not need an LLM or Virtuoso Bridge. The result is a drawing, **not a guarantee of simulation equivalence**. The current converter handles the selected schematic level only. Unmapped devices become boxes that retain their external pins.

Run `bash` examples in a **Linux terminal**. Run `lisp` examples in the Virtuoso **CIW** command window. For normal use, follow steps 1 through 4.

## 1. Download on Linux

On the Linux machine where you run Virtuoso:

```bash
mkdir -p "$HOME/projects"
cd "$HOME/projects"
git clone --recurse-submodules https://github.com/Lzy23321/virtuoso-canvas.git
cd virtuoso-canvas
```

`--recurse-submodules` also downloads the compatible Analog Canvas revision. GitHub's **Code → Download ZIP** does not include the full submodule and is not a complete installation.

For another location, first enter a directory you can write to, then run `git clone --recurse-submodules ...`. For example, to install under `/data/my-tools`:

```bash
mkdir -p /data/my-tools
cd /data/my-tools
git clone --recurse-submodules https://github.com/Lzy23321/virtuoso-canvas.git
cd virtuoso-canvas
```

Run the later commands from that `virtuoso-canvas` directory. The project does not have to be under `$HOME`.

If you already cloned the repository but `analog-canvas/` is empty, run this in the project directory:

```bash
git submodule update --init --recursive
```

## 2. Install dependencies and build

Building from source and running the local Analog Canvas currently require Node.js **24+**, the upstream-pinned pnpm **11.16.0**, Python **3.9+**, and an installed Virtuoso environment. You do not need to upgrade the system-wide Node installation: Node 24 can be installed alongside it in your home directory. From the project directory, check:

```bash
node --version
(cd analog-canvas && pnpm --version)
python3 --version
```

If `node --version` shows 22 but Node 24 is already installed with nvm in your home directory, switch **this terminal** to it:

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 24
node --version
(cd analog-canvas && pnpm --version)
```

`nvm use 24` does not change the system-wide Node. If Node 24 is not installed, obtain it first. If pnpm is still missing, run `corepack enable pnpm` under Node 24 and check again. That step and dependency installation may need the npm registry or a company mirror; for an offline machine, ask your administrator for a mirror or prepared environment. **Retrying `npm run setup` with Node 22 will not work**: the build and local-editor launch scripts check the Node version.

If Node 24 is installed **elsewhere**, replace the first path below with the actual path to the Node executable, then run in the current terminal:

```bash
export VC_NODE_PATH="/absolute/path/to/node"
export PATH="$(dirname "$VC_NODE_PATH"):$PATH"
node --version
(cd analog-canvas && pnpm --version)
```

`/absolute/path/to/node` is a placeholder, not a literal path to use. If pnpm is still missing, install or enable pnpm 11.16.0 for this Node environment; setting `VC_NODE_PATH` alone does not replace dependency installation.

Once the versions are correct, from the `virtuoso-canvas` directory run:

```bash
npm run setup
```

This command installs Analog Canvas dependencies, builds the converter, and runs the automated tests. Run it after a fresh clone or source update. Stop and inspect the terminal error if it fails. The menu script can also select an nvm-installed Node 24 automatically. For another installation location, set `VC_NODE_PATH` to the absolute path of the Node 24 executable before starting Virtuoso.

## 3. Load the Virtuoso menu

`VC_ROOT` points to the project directory, **wherever you installed it**. Choose one of the following based on whether Virtuoso is already open.

**Virtuoso is already open:** enter these lines in its **CIW**, replacing the path on the first line with your actual project directory:

```lisp
setShellEnvVar("VC_ROOT=/absolute/path/to/virtuoso-canvas")
getShellEnvVar("VC_ROOT")
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_ui.il"))
```

The second line must return the project path, not `nil`. If Node 24 is outside the default nvm location, also enter `setShellEnvVar("VC_NODE_PATH=/absolute/path/to/node")` in CIW before loading the menu. These settings affect only the current Virtuoso session. If you previously loaded the menu from **another project location**, restart Virtuoso and use the startup instructions below to avoid retaining the old path.

**Virtuoso is not open:** enter your actual `virtuoso-canvas` directory in a Linux terminal, then run:

```bash
cd /absolute/path/to/virtuoso-canvas
export VC_ROOT="$(pwd -P)"
echo "$VC_ROOT"
```

Replace the first line with your real project directory; do not use the placeholder literally. `echo` should print its absolute path. **Start Virtuoso from this terminal** (use `virtuoso &` if that command is in `PATH`, or your company's launch command), then enter in CIW:

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_ui.il"))
```

To make new Bash terminals load this setting, run **once**:

```bash
printf 'export VC_ROOT=%q\n' "$VC_ROOT" >> "$HOME/.bashrc"
```

Running this repeatedly adds duplicate lines to `.bashrc`. Launch Virtuoso from a terminal with `VC_ROOT` set. If Node 24 is not managed by nvm and you set `VC_NODE_PATH` above, run `printf 'export VC_NODE_PATH=%q\n' "$VC_NODE_PATH" >> "$HOME/.bashrc"` once to make it available in new terminals.

If you launch Virtuoso from a desktop icon or a company script, `.bashrc` may not be read. Put `export VC_ROOT="the/absolute/project/path"` (and, if needed, `export VC_NODE_PATH="the/absolute/path/to/node"`) in the script that actually starts Virtuoso, before its launch command. Setting a variable in a terminal does not change an already-running Virtuoso process; use the CIW commands above for that session, or restart Virtuoso.

The **Schematic to Canvas** menu should appear in an open schematic editor. You can also enter `VCUIShow()` in CIW. After manual loading works, optionally add this line to your own `.cdsinit` to load the menu at startup:

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_init.il"))
```

## 4. Export a project

1. Open and save the target schematic in Virtuoso. Open the dialog from **Schematic to Canvas**.
2. Click **Scan devices**. Recognized devices show a Canvas symbol; unmapped devices use a box that retains their external pins.
3. To change a device mapping, select its row and click **Edit mapping...**. **Use this run** applies only to this scan; **Save personal** saves the mapping locally for future scans.
4. Select an existing, writable **Save directory**, review **Project filename**, set power/ground and other options as needed, then click **Export project**.
5. Open the resulting `.icproj.json` file in Analog Canvas. **Open Analog Canvas** opens the local editor page; it does **not** import the exported file automatically.

The dialog asks before replacing a file with the same name. If export fails, read the error in CIW; a failed export does not publish a successful project.

## Alternative: transfer a complete source bundle from Windows

The repository's **Releases** page provides a `Virtuoso Canvas v0.1.0` complete source bundle. You may download it on another computer and copy the entire extracted directory to Linux. Check that it contains `analog-canvas/`; the ordinary **Code → Download ZIP** is not a substitute. Complete steps 2 through 4 on Linux.

**Having the source is not the same as having dependencies.** If Linux cannot access npm or an internal mirror, copying the bundle from Windows will not make `npm run setup` work by itself. Ask your administrator for a Linux-compatible dependency mirror or a prepared Linux environment.

## Troubleshooting

| Symptom | First check |
| --- | --- |
| `analog-canvas` is missing or at the wrong revision | Run `git submodule update --init --recursive` in the project directory. |
| `npm run setup` cannot install dependencies | Check Node/pnpm versions and access to npm or your internal mirror. |
| CIW cannot find a file, window, or Node | Set `VC_ROOT` before launching Virtuoso and complete step 2 first. |
| Scan does not show a recent schematic edit | Save the schematic, then scan again. |
| No matching device symbol | Review the symbol list in **Edit mapping...**; an unmapped device can use a generic box. |

Personal settings are stored in `personal/config.json` and `personal/mappings.json`. They are not uploaded to Git automatically. Do not commit `work/` outputs containing company PDK or design data to a public repository.

## More help

- [UI guide](UI-Guide.en.md): window controls and which settings persist.
- [CLI guide](CLI-Guide.en.md): batch conversion, mapping files, and diagnostics. Normal menu-based export does not require the CLI.

## License

The original converter code is licensed under the [MIT License](LICENSE.md). Analog Canvas is a separate upstream project under its own [AGPL-3.0-only license](analog-canvas/LICENSE.md), included as a Git submodule; complete source bundles include its source and original license. MIT licensing of the converter does not change the upstream license: distributing or operating the combined software remains subject to applicable AGPL terms. Keep the upstream copyright, license, and third-party notices when redistributing those bundles. See [NOTICE.md](NOTICE.md) for attribution and scope. Cadence Virtuoso and PDKs are not included.

For research, teaching, or another publication using Analog Canvas, cite the upstream authors and project as described in [NOTICE.md](NOTICE.md). Ordinary installation and use do not require a publication citation.
