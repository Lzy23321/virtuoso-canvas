# SKILL 前端适配协议（v1）

这一层用于 Virtuoso 原生窗口与本地 Node 后端交换扫描、映射和导出结果，不依赖 RAMIC Bridge。Bridge 仅用于开发时远程调试窗口。

## 调用

```bash
node dist/packages/cli/src/skill-ui.js scan /tmp/design.snapshot.json --out /tmp/scan-result.il
```

可选 `--mappings personal/mappings.json`；不指定时读取安装目录下的个人映射表。输入为现有 `VCExportCell` 导出的 snapshot。输出文件必须尚不存在，适配器不会覆盖已有文件。

映射提交使用同一适配器：

```bash
node dist/packages/cli/src/skill-ui.js apply /tmp/design.snapshot.json \
  --edit /tmp/edit.json --out /tmp/apply-result.il \
  --mode session --mappings personal/mappings.json
```

`edit.json` 只包含一个器件规则，例如 `{"version":1,"device":"myPDK/myMos","rule":{"symbol":"nmos","pins":{"D":"D","G":"G","S":"S","B":"B"},"omitPins":["ISO"],"parameters":{"w":"w","l":"l"}}}`。`session` 只校验并返回回执，不写个人表；`personal` 校验后加锁、原子替换个人表。两种模式都要求该 master 存在于当前 snapshot。

正式导出由窗口调用 `export` 子命令。`--session` 是当前扫描会话临时映射表；它只在内存合并表的临时副本中覆盖个人规则，不写 `personal/mappings.json`。`--result` 是供 SKILL `load()` 的回执，不是工程目录：

```bash
node dist/packages/cli/src/skill-ui.js export /tmp/design.snapshot.json \
  --out /tmp/design-canvas --project-file design.icproj.json \
  --result /tmp/export-result.il \
  --session /tmp/session-mappings.json --mappings personal/mappings.json \
  --scale 140 --bus-mode bundled --disabled-instances keep \
  --isolated-ports omit --show-instance-names true
```

适配器读取 `personal/config.json` 的电源、地等其余设置，再用窗口选项覆盖本次转换。它随后调用正式 CLI `convert`，所以工程格式、校验、发布和失败诊断与 CLI 完全一致。从 Virtuoso 环境启动时会清除 Cadence 注入的 Python 和动态库路径，避免污染离线转换器；显式设置的 `VC_PYTHON` 仍会保留。

## 标准输出

每行固定为 `VCUI|1|事件|阶段[|错误码]`，不包含库名、器件名、路径或任意用户文本。当前事件：

```text
VCUI|1|PROGRESS|scan
VCUI|1|DONE|scan
VCUI|1|ERROR|scan|ENOENT
VCUI|1|ERROR|apply|UNKNOWN_PARAMETER
VCUI|1|DONE|export
VCUI|1|ERROR|export|OUTPUT_EXISTS
```

进程退出码 0 代表工程和成功回执已写好，非 0 代表导出失败；失败时适配器尽量写出错误回执。详细诊断也写到 stderr。窗口将 stdout/stderr 合并进临时日志，同时把错误码、原因和可用的诊断内容打印到 CIW。

## 结果文件

结果是三条 SKILL 调用，不是 JSON：

```skill
VCUIAcceptCatalog(1 supportedTargets fullSymbolCatalog)
VCUIAcceptRules(1 deviceRuleDetails)
VCUIAcceptScan(1 instanceCount netCount list(
    list("library/cell" "2" "nmos" "D, G, S, B" "builtin" "ready")
))
VCUIAcceptMapping(1 "myPDK/myMos" "personal" "/home/userone/projects/virtuoso-canvas/personal/mappings.json")
VCUIAcceptExport(1 "success_with_warnings" "/tmp/design-canvas" "design.icproj.json"
    list(list("warning" "Disabled instances mode: keep; retained instances use ordinary symbols.")))
VCUIAcceptExportError(1 "BUS_UNSUPPORTED" "Bus conversion requires bundled mode"
    "/tmp/design-canvas.failed" list())
```

前三条是扫描结果，其余调用分别是映射提交、导出成功和导出失败回执。映射回执的最后一个参数是实际保存路径；仅用于本次运行时为空字符串。扫描表格的六列依次为 master、实例数、目标符号、源引脚、规则来源、校验状态。`VCUIAcceptCatalog` 提供当前转换器支持的 10 个目标、允许的参数及完整 61 个符号的支持状态；`VCUIAcceptRules` 提供每类器件的源引脚/参数、现有映射、省略引脚等细节。成功回执携带报告中的 warning、ERC 和视觉诊断，SKILL 会逐条打印到 CIW。动态文本先去掉控制字符并转义反斜杠、双引号，避免源设计中的名称被当作 SKILL 代码执行。

## 查看窗口

在 Virtuoso CIW 中运行：

```skill
load("/home/userone/projects/virtuoso-canvas/skill/virtuoso_canvas_ui.il")
VCUIShow()
```

窗口可以填写 library/cell/view，或按 **Current** 读取当前原理图。**Scan devices** 通过现有只读 SKILL 导出和 Node 适配器填充表格。选中器件后按 **Edit mapping...** 可以选择目标符号、逐个对应/忽略引脚；**Edit parameters...** 可添加、替换、删除参数对应。编辑窗的 **Browse all symbols...** 中点击 `supported` 符号，会立即回填 `Canvas symbol` 并重算引脚对应；其他条目仅可查看。主窗口的 **Symbol catalog...** 始终只读。

**Use this run** 经 Node 校验后只在当前扫描会话中保留规则；重新扫描会清除临时规则，并以磁盘上的规则刷新表格。**Save personal** 经同样校验后写入 `personal/mappings.json`，下次扫描可复用。同一器件保存个人规则时会移除它先前的临时规则。两者都会重新读取已保存的 schematic，未成功校验时不改变映射表。

加载脚本后，schematic 菜单栏的 **Schematic to Canvas → Export schematic...** 打开设置窗口；已有的 schematic 窗口也会立即更新该菜单。**Open Analog Canvas** 会启动或复用本机 `127.0.0.1:4173` 的 Canvas 服务并打开浏览器，不会自动导入工程文件。**Export project** 只接受最近一次成功扫描的同一个 library/cell/view。它再次只读导出已保存的 schematic，把临时映射、个人映射和窗口选项送入正式转换。**Browse...** 直接选择保存目录；`Project filename` 默认直接显示 cell 名，导出时自动补 `.icproj.json`，切换 cell 时也会同步更新默认文件名。文件名可写 `NAME` 或 `NAME.icproj.json`，不能包含路径分隔符。同一目录可保存多个不同文件名的工程，报告分别命名为 `NAME.report.json`。遇到同名工程或报告时会弹出 Yes/No 对话框；No 取消导出，Yes 在转换及校验成功后替换同名文件，其他工程不受影响。成功的可操作诊断以及失败原因打印到 CIW。失败不会生成工程或预览，详细诊断放在保存目录下的 `NAME.failed`（重复失败会编号）和窗口提示的临时日志中。当前转换同步运行，期间窗口会等待；进度和取消留给后续版本。

项目搬到其他目录时，在 Virtuoso 启动前设置 `VC_ROOT` 为安装目录；当前机器未设置时默认使用 `/home/userone/projects/virtuoso-canvas`。
如需使用另一份个人映射表，可在 Virtuoso 启动前设置 `VC_MAPPING_PATH`；不设置时使用项目内的 `personal/mappings.json`。
如需使用另一份个人配置，可设置 `VC_CONFIG_PATH`；不设置时使用项目内的 `personal/config.json`。
