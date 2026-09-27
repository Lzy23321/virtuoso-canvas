# UI Guide

[中文](UI使用说明.md) | English · [Installation](README.en.md)

This page describes the **Schematic to Canvas** dialog in Virtuoso. Install, build, and load the menu using the README first. The tool reads a schematic and creates an editable drawing; it does not modify the Virtuoso schematic or guarantee simulation equivalence.

## Export workflow

1. Open the target schematic and save changes. Open the dialog from the **Schematic to Canvas** menu.
2. Check **Library / Cell / View**. **Current** fills in the currently open schematic. Click **Scan devices**.
3. Review the device table. To change how a device class is drawn, select its row and click **Edit mapping...**.
4. Review the export options, choose a directory and filename, and click **Export project**.
5. After a successful export, open the resulting `.icproj.json` in Analog Canvas.

Scan uses the schematic's stored connectivity. Save and scan again after editing the schematic, switching library/cell/view, or when you want to clear a mapping used only for this scan. Export is blocked if you have not scanned or the selected source changed after scanning.

## Device table and mapping

Each row represents a Virtuoso `library/cell` pair. **Count** is its number of instances. **Canvas symbol** is the target drawing; **Rule** indicates whether the mapping came from built-in rules, personal rules, or this scan. An unmapped device defaults to `generic-box`: it keeps external pins and wires, but does not draw the module's internal circuit.

In **Edit mapping...**:

| Control | Effect |
| --- | --- |
| **Canvas symbol** | Choose the target device. `generic-box` keeps all source pins. **Skip device** omits every instance of this `library/cell`; it does not merely hide its name. |
| **Browse all symbols...** | Browse the Canvas symbol catalog. Entries marked `supported` can be selected; other entries are view-only for now. |
| **Source pin → Canvas pin** | Assign source pins to target pins. Explicitly choose **Ignore** for extra source pins; this drops their connections and does **not** short them to another pin. Each target pin must be assigned exactly once. |
| **Edit parameters...** | Optionally map source to target parameters, for example `W → w` and `L → l`. Source names must match the design. Unmapped parameters do not appear in the target device parameters. |
| **Use this run** | Validate and use the rule for the current scan only. A new scan clears it; no personal file is written. |
| **Save personal** | Validate and write to local `personal/mappings.json`. The rule applies now and on future scans; the dialog shows its path. |

For a device with extra pins, such as a seven-pin MOS drawn as a standard four-pin MOS, explicitly assign D/G/S/B and choose **Ignore** for pins you intend to drop. This deliberately simplifies the circuit and is not an electrical-equivalence claim. Use `generic-box` when uncertain.

## Export options

| Dialog item | Effect |
| --- | --- |
| **Save directory / Browse...** | Choose an existing, writable directory. Projects with different filenames can share it. |
| **Project filename** | Defaults to the cell name; `.icproj.json` is appended automatically. The dialog asks before replacing an existing project or report. |
| **Scale** | Sets the source-coordinate-to-canvas ratio. The dialog starts at `140`. Smaller values generally place devices closer together; they do not resize device symbols. |
| **Bus: Bundled / Reject** | **Bundled** draws a bus as one schematic bundle, without verifying per-bit connectivity or simulation equivalence. **Reject** errors on buses. The dialog initially selects Bundled. |
| **Disabled: Keep / Skip** | **Keep** draws instances marked disabled as ordinary symbols. **Skip** omits those instances and their dedicated connections. This is unrelated to name visibility. |
| **Show instance names** | Shows or hides names such as M0, R1, and I3. Devices and wires are unchanged. |
| **Skip unconnected pins** | Omits isolated top-level `ipin/opin/iopin` symbols. It does not remove pins belonging to devices. |
| **Power nets / Ground nets** | Enter net names **separated by spaces**, for example `VDD AVDD` and `GND VSS`. A name cannot belong to both groups. |
| **Save network settings** | Saves only the current power/ground names to `personal/config.json` for future windows. It does not save Scale, Bus, or other options. Unsaved names still apply to this export. |

Do not assume other values shown in the window were permanently saved. Only **Save personal** and **Save network settings** explicitly write the settings described above.

## After export

A successful export writes at least `<name>.icproj.json` and its `<name>.report.json` into the selected directory. **Open Analog Canvas** only starts or opens the local editor; you must still select the exported project file there.

The status area and Virtuoso **CIW** show success, warnings, or errors. A warning means a project was exported but simplifications or visual/connectivity observations need review. An error means no successful project was published. Choosing **No** in an overwrite prompt leaves existing files unchanged.

For stale scan results, save and scan again. If a mapping cannot be applied, look for **Unassigned** pins, missing target-pin assignments, or unsupported parameters. On export failure, read `*Error* VCExport [code]` and the diagnostics path in CIW.
