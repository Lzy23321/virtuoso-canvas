# CLI 使用说明

中文 | [English](CLI-Guide.en.md) · [返回安装说明](README.md)

CLI 用于批量转换或排查问题。日常从 Virtuoso 菜单导出时不需要使用它。请先按 README 安装并运行 `npm run setup`。下文的 `lisp` 命令在 **Virtuoso CIW** 输入，`bash` 命令在 **Linux 终端**运行；不要把终端命令输入 CIW。

## 1. 从 Virtuoso 导出快照

选一个存在的 schematic，以及一个**尚不存在**的输出文件名。在 CIW 输入，替换示例库名和 cell 名：

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/export_schematic.il"))
VCExportCell("myLib" "myCell" "schematic" "/tmp/myCell.snapshot.json")
```

看到 `("exported" ...)` 表示原理图快照已写入 `/tmp/myCell.snapshot.json`，**还不是 Canvas 工程**。再次提取时要换一个快照文件名；提取器不会覆盖已有文件。建议先保存 Virtuoso 原理图，确保读到预期的连接关系。快照可能含 PDK 参数和设计信息，不要上传到公开仓库。

## 2. 先直接尝试转换

在 Linux 终端进入安装目录：

```bash
cd "$VC_ROOT"
node dist/packages/cli/src/main.js convert /tmp/myCell.snapshot.json --out work/myCell-canvas
```

成功时，在 `work/myCell-canvas/` 中打开 `project.icproj.json`；`report.json` 是本次转换报告。内置规则和已保存的个人规则会自动使用。没有映射的器件默认生成保留外部引脚的通用方框，所以**不必每次先运行 prepare**。`--out` 在这种模式下必须是尚不存在的新目录；重复测试请换目录名。

如需同时保存 SVG 预览，加 `--preview`；排查转换问题时加 `--debug`，会额外保留输入、实际映射、配置和校验文件。

## 3. 需要自定义器件时

只有当内置映射或通用方框不符合需求时，才准备映射文件：

```bash
node dist/packages/cli/src/main.js prepare /tmp/myCell.snapshot.json --out work/myCell-settings
```

`work/myCell-settings/` 是新目录，主要看三个文件：

| 文件 | 用途 |
| --- | --- |
| `preview.txt` | 按器件列出当前映射；先找没有正确匹配的项。 |
| `mappings.json` | 可编辑的 `library/cell` 到 Canvas 器件的规则。 |
| `catalog.json` | 可用目标符号、引脚和支持状态；目录中的符号不一定都能由当前转换器映射。 |

例如，把实际名为 `myLib/myMos` 的四引脚器件映射成 NMOS，可在 `mappings.json` 的 `devices` 中写：

```json
{
  "version": 1,
  "devices": {
    "myLib/myMos": {
      "symbol": "nmos",
      "pins": { "D": "D", "G": "G", "S": "S", "B": "B" },
      "parameters": { "W": "w", "L": "l" },
      "omitPins": []
    }
  }
}
```

左边是快照里**真实的源名称**，右边是 Canvas 名称，区分大小写。请以 `prepare` 生成的文件为基础修改，不要把上面示例的 `myLib/myMos` 原样用于真实电路。没有对应目标器件时保留 `null`，会画通用方框；`{"omit":true}` 会省略该 `library/cell` 的所有实例。额外源引脚必须在 `omitPins` 中明确列出；省略引脚或器件会改变目标图的连接/内容。

只想用这份文件转换一次，不改个人规则：

```bash
node dist/packages/cli/src/main.js convert /tmp/myCell.snapshot.json \
  --mappings work/myCell-settings/mappings.json --out work/myCell-custom
```

想在以后复用，就保存到本安装目录的 `personal/mappings.json`：

```bash
node dist/packages/cli/src/main.js save-mappings /tmp/myCell.snapshot.json \
  --settings work/myCell-settings/mappings.json
```

已有同名个人规则需要改变时，命令会提示冲突；检查差异后再加 `--replace`。个人映射不会自动共享，也不会修改内置规则。

## 常用转换选项

```bash
node dist/packages/cli/src/main.js convert /tmp/myCell.snapshot.json \
  --out work/myCell-options --scale 140 --bus-mode bundled \
  --disabled-instances keep --isolated-ports omit
```

| 选项 | 含义 |
| --- | --- |
| `--scale 140` | 调整器件间距；数字越小通常越紧凑。CLI 默认 `160`。 |
| `--bus-mode reject\|bundled` | 默认 `reject`；`bundled` 用一束示意线画总线，不保证逐位连接或仿真等价。 |
| `--disabled-instances keep\|omit` | 默认 `keep`；`omit` 省略被标记禁用的实例。 |
| `--isolated-ports keep\|omit` | 默认 `omit`；控制未接线的独立顶层 pin 是否绘制。 |
| `--unmapped-devices generic-box\|error` | 默认用通用方框；选 `error` 时，无映射器件会阻止转换。 |
| `--config FILE` / `--mappings FILE` | 指定另一份个人配置或器件映射表；默认读取安装目录的 `personal/`。 |

查看当前解析后的配置：`node dist/packages/cli/src/main.js config`。查看完整符号目录：`node dist/packages/cli/src/main.js catalog`。电源/地名称等长期设置在 `personal/config.json`，也可从 Virtuoso 窗口保存网络名称。

若要把多个不同文件名的工程放进同一目录，使用 `--flat --project-file myCell.icproj.json --out 保存目录`；报告会命名为 `myCell.report.json`。已有同名文件默认拒绝覆盖；只有显式添加 `--replace` 才会在转换成功后替换，且 `--replace` 必须与 `--flat` 一起使用。

## 如何判断成功或失败

CLI 最后输出 JSON：`"ok": true` 且 `status` 为 `success` 或 `success_with_warnings` 才表示工程已生成。后者需要阅读报告中的警告；它不代表仿真等价。`"ok": false` 表示失败，不要把此前生成的旧工程当作本次结果。

转换失败时不会发布成功工程或预览。错误 JSON 中若有 `diagnosticsDirectory`，请到该路径查看 `error.json` 等诊断文件。`OUTPUT_EXISTS` 通常是输出目录或同名文件已经存在；`INVALID_MAPPING`、`PIN_COVERAGE` 等应检查映射表的真实器件名和引脚名。
