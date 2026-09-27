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

If you already cloned the repository but `analog-canvas/` is empty, run this in the project directory:

```bash
git submodule update --init --recursive
```

## 2. Install dependencies and build

The Linux machine needs Node.js **24+**, pnpm **11.16+**, Python **3.9+**, and an installed Virtuoso environment. Check the versions:

```bash
node --version
pnpm --version
python3 --version
```

Ask your administrator to provide any missing software. Then, from the `virtuoso-canvas` directory:

```bash
npm run setup
```

This command installs Analog Canvas dependencies, builds the converter, and runs the automated tests. Run it after a fresh clone or source update. Stop and inspect the terminal error if it fails. Dependency installation normally needs access to the npm registry or an internal mirror.

## 3. Load the Virtuoso menu

Set `VC_ROOT` **once**, before launching Virtuoso. If you start Virtuoso from a Bash terminal and installed the project in `$HOME/projects/virtuoso-canvas`, run this command once:

```bash
printf '%s\n' 'export VC_ROOT="$HOME/projects/virtuoso-canvas"' >> "$HOME/.bashrc"
```

For another location, replace the path with its absolute path **before** running the command. Running it repeatedly adds duplicate lines. Open a new terminal and check `echo "$VC_ROOT"`, then launch Virtuoso from that terminal.

If you launch Virtuoso from a desktop icon or a company script, `.bashrc` may not be read. Put `export VC_ROOT="the/absolute/project/path"` in the script that actually starts Virtuoso, before its launch command. Restart an already-open Virtuoso session after changing the environment.

In Virtuoso **CIW**, enter:

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_ui.il"))
```

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
