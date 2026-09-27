# Virtuoso → Analog Canvas

把 Virtuoso schematic 导出为 Analog Canvas 可编辑工程。每个人在自己的工作区安装，离线运行，不需要 Virtuoso Bridge、大模型或外部网络服务。提供 CLI 和 Virtuoso schematic 菜单。

先了解实现与输入输出：[代码结构、运行流程与中间文件说明](docs/代码与文件流程.md)。

准备建立 Git 仓库前，请先看 [Git 跟踪范围](docs/Git跟踪范围.md)；个人配置、测试设计和旧版上游检出不应直接提交。

发布目录和上游 PR 暂存方式见 [发布与上游集成](docs/发布与上游集成.md)。两个产物都从 `packages/virtuoso-import/` 这一份转换核心生成，不维护第二份算法。

## 第一次使用：只做这四步

### 1. 在 Virtuoso 的 CIW 导出

```lisp
load("/home/userone/projects/virtuoso-canvas/skill/export_schematic.il")
VCExportCell("你的库名" "你的cell名" "schematic" "/tmp/design.snapshot.json")
```

只替换库名、cell 名和输出文件路径。库需要在 Virtuoso 注册，输出目录必须存在，输出文件必须尚不存在。不需要打开原理图窗口，也不会自动 Check and Save。

脚本读取当前数据库中的连接；未检查的编辑可能尚未更新网络关系。若该 cellView 已在会话中打开，可能读取内存中的未保存修改，而不是磁盘旧版本。看到 `("exported" ...)` 表示快照已生成，不代表已经生成 Analog Canvas 工程。

### 2. 在 Linux 终端准备映射

以下命令都在 Linux 终端运行，不是在 CIW：

```bash
cd /home/userone/projects/virtuoso-canvas
node dist/packages/cli/src/main.js prepare /tmp/design.snapshot.json --out work/design-settings
```

打开这两个文件：

- `work/design-settings/preview.txt`：未匹配器件排在前面，显示源引脚和当前映射，不再输出 suggestions。
- `work/design-settings/mappings.json`：你需要编辑的映射表。

内置规则能匹配的已经填好，直接使用。没有规则的条目是 `null`，例如：

```json
{
  "version": 1,
  "devices": {
    "myPDK/nch": null,
    "basic/iopin": {
      "symbol": "port",
      "pins": { "iopin": "P" },
      "parameters": {},
      "omitPins": []
    }
  }
}
```

将 `myPDK/nch` 对应的 `null` 替换为实际映射，例如：

```json
{
  "symbol": "nmos",
  "pins": { "D": "D", "G": "G", "S": "S", "B": "B" },
  "parameters": { "w": "w", "l": "l" }
}
```

左边是源器件的真实名称，右边是目标名称，区分大小写。不要填写源器件没有的参数。没有审核人、批准状态或候选 ID。

可选符号、引脚和参数在 `work/design-settings/catalog.json`；详细说明见 [映射表指南](docs/mapping-packages.zh-CN.md)。推荐只是参考，不会因为名字像 NMOS 就自动决定极性。

### 3. 保存到自己的映射表

```bash
node dist/packages/cli/src/main.js save-mappings /tmp/design.snapshot.json --settings work/design-settings/mappings.json
```

自动合并到本安装目录下的 `personal/mappings.json`。新增规则直接保存，不修改随程序发布的内置文件。修改已有个人规则时会显示新旧差异；检查后重新执行并加 `--replace`。

没有匹配规则或保留 `null` 的器件会自动生成原生通用方框，保留外部引脚和连接，不再阻止转换。写错的显式映射仍会报错。

### 4. 生成工程

```bash
node dist/packages/cli/src/main.js convert /tmp/design.snapshot.json --out work/design-result
```

成功后在 Analog Canvas 中打开 `work/design-result/project.icproj.json`。
需要自定义文件名时，可在 `convert` 中添加 `--project-file design.icproj.json`；默认仍会和 `report.json` 一起放入 `--out` 指定的新目录。需要多个工程共用一个保存目录时，加 `--flat`：工程保存为 `design.icproj.json`，报告保存为 `design.report.json`。同名文件默认不会覆盖；CLI 可显式加 `--replace`。Virtuoso schematic 菜单中的 **Schematic to Canvas → Export schematic...** 打开导出窗口，**Project filename** 直接填当前 cell 名，导出时自动补 `.icproj.json`；同名文件会先弹出 Yes/No 覆盖确认。窗口中的 **Open Analog Canvas** 会启动或复用 `upstream-lock.json` 指定端口上的本机 Canvas 服务（当前为 `127.0.0.1:4175`）并打开浏览器，不会自动导入工程文件。

导出窗口中的 **Power nets** 和 **Ground nets** 用空格分隔网络名，例如 `VDD AVDD` 和 `GND VSS`。修改后直接导出会使用窗口当前值；点击 **Save network settings** 才会写入 `personal/config.json`（或 `VC_CONFIG_PATH` 指定的文件），下次打开窗口自动读取。保存仅更新这两组网络名，不清除其他个人配置；同一网络名不能同时属于 Power 和 Ground。

**以后遇到同一 lib/cell，直接导出快照并执行第 4 步。** 不需要再填写映射。

`prepare` 以及未加 `--flat` 的 `convert` 要求 `--out` 是新目录；加 `--flat` 后可复用现有目录，但工程文件名不能重复。终端 JSON 中 `"ok": false` 表示失败；请先看错误，不要继续下一步。

## 特殊器件怎么处理

### 总线和禁用实例

```bash
node dist/packages/cli/src/main.js convert /tmp/design.snapshot.json \
  --bus-mode bundled --disabled-instances omit --out work/design-result-new
```

- `--bus-mode bundled`：总线整束按一条网络绘制，不拆成逐位线路。保留总线名称，位宽和端子关系在 `report.json` 的 `bundledBuses` 中。这是可编辑的示意图抽象，不支持逐位仿真；不同范围的总线及分接关系没有因此自动建立。`bitConnectivityVerified` 为 false。默认 `reject` 仍拒绝总线。
- `--disabled-instances keep`：默认值，保留 `nlAction="ignore"` 实例，目前使用普通符号显示，禁用清单在报告中。
- `--disabled-instances omit`：按实例排除禁用器件，并处理其连接和专用支线，不影响同一 lib/cell 的其他实例。源快照不变。特定仿真器的 `nlIgnore` 暂不作为全局禁用处理。
- API 对应 `convertDesign(..., {runtime, busMode: 'bundled', disabledInstances: 'omit', isolatedPorts: 'omit', unmappedDevices: 'generic-box'})`；排除选项使用现代 `mappings.json` 流程。

新增基础映射包括 `tsmcN28` 的 MOS 和 MOM 电容、`analogLib` 的电压源/地/受控开关、`basic/ipin` 和 `basic/opin`。电压源和开关目前用于符号展示，不宣称仿真模型等价；正弦/脉冲波形参数仍保留在源快照中，尚未转换成目标激励模型。

完整器件清单见 [Analog Canvas 当前符号表](docs/analog-canvas-catalog.zh-CN.md)。`prepare` 输出的 `catalog.json` 和 `catalog.md` 也会列出全部符号，并区分当前转换器是否支持。`catalog` 命令返回完整清单；核心映射 API 的 catalog 仍仅包含可转换目标。

- 多引脚器件简化：映射保留引脚，并用 `omitPins` 明确列出省略引脚。程序不猜测哪个额外引脚可以丢弃。
- 整个器件不需要：填写 `{"omit": true}`，转换报告记录被省略的实例和受影响连接。
- 自动方框：保留 `null`，不是忽略指令。
- 强制方框：填写 `{ "symbol": "generic-box" }`，不填写 `pins` 或 `parameters`。保留全部外部引脚，不展开内部电路，也不提供仿真模型。

省略属于有意简化，不再保证与完整源设计电气等价。原始快照保留；保留部分仍做连接校验。专用支线按叶节点裁剪，在其他保留引脚或共享分支处停止，不删除共享网络。若省略后仍存在 ERC 或其他几何问题，转换依旧可能被阻止。

## 输出文件

### 方框布局

自定义模块使用紧凑方框：引脚间距固定为 40，框体不再随全局 `--scale` 放大；上下边的引脚名称旋转 90 度，左右边保持横排。框内为长名称预留空间。

无分叉、带空心端点的短支线可以对齐到引脚；共享交点不移动。局部补线先朝引脚外侧离开，再绕开器件接回线路，无法找到合适路径时仍保留诊断，不跳过校验。

当前使用未经修改的上游 Canvas。转换器先产生 schema 48 中间工程，再通过上游迁移器升级到当前内部 schema 58；导出的工程可由当前 Canvas 打开，保存时由上游写为当前工程文件格式。早期测试工程若含非上游字段 `pinNameOrientation`，应重新导出。

转换中的布局步骤会输出 `[refine:start]` / `[refine:done]`，成功报告的 `refinement.json.timings` 记录耗时；超时错误也保留已输出的日志，便于定位瓶颈。

器件名称及形式端口名称使用 Analog Canvas 共享的 `defaultInstanceLabelPlacement` 原生布局，保留源名称和语义绑定；自定义避让不再移动这些名称。其他网络标签仍使用原有避让。此步骤不改变器件位置、连线或交点。

默认 `plainLabels: false`，由 Analog Canvas 原生语义文本显示首字符斜体、后续字符下标，例如 M0、VINP。真实名称不变；需要普通文字时可在 `--presentation` 配置中设置 `plainLabels: true`。原生排版对电源下标、末尾正负号有专门处理。

斜线走线会保留，不强制改成直角折线。转换先在源坐标中识别线上连接点，再对齐目标网格；器件引脚位置不同的地方添加局部连接段。纯几何交叉不自动合并网络。目标网格取整仍可能使坐标有轻微变化。

`validation.json` 的 `diagonalSegments` 记录最终斜线段数。上游若仅凭斜线包围盒产生“穿过器件”的低置信度提示，转换器会做精确线段/矩形相交检测：确认不相交的提示保留在 `diagonalBoundsFalsePositives`，不计入阻断项；真实相交和其他校验仍保留。

默认 `convert` 只保存工程和精简报告，其他文件按需保存：

```bash
# 日常导出：project.icproj.json + report.json
node dist/packages/cli/src/main.js convert /tmp/design.snapshot.json --out work/design
# 增加 SVG 预览
node dist/packages/cli/src/main.js convert /tmp/design.snapshot.json --out work/design-preview --preview
# 排查问题：完整报告、输入、实际映射/配置和布局诊断，共 10 个文件
node dist/packages/cli/src/main.js convert /tmp/design.snapshot.json --out work/design-debug --debug
```

以下是调试模式的文件清单（默认报告不保留逐实例参数来源及布局修改明细）：

| 文件                     | 用途                               |
| ------------------------ | ---------------------------------- |
| `project.icproj.json`    | 最终可编辑工程                     |
| `source.snapshot.json`   | 未修改的源快照数据                 |
| `filtered.snapshot.json` | 按映射过滤、简化后的快照           |
| `preview.svg`            | 图形预览                           |
| `report.json`            | 转换结果、被省略内容和连接验证范围 |
| `validation.json`        | 原生 schema、ERC 和视觉检查        |
| `refinement.json`        | 走线和标签调整记录                 |
| `mappings.json`          | 本次实际使用的映射输入             |
| `config.json`            | 补齐默认值和 CLI 覆盖后的个人配置   |
| `presentation.json`      | 本次实际使用的显示配置             |

终端 JSON 的 `status` 有四种：`success`、`success_with_warnings`、`error`、`cancelled`。前两种才会发布工程；存在布局观察、源设计警告或明确选择的简化时为 `success_with_warnings`。无需用户处理的能力说明放在报告的 `information` 中，不会把正常转换降为带警告状态。

转换失败不会发布成功目录，也不会生成或展示预览图。结构化诊断保存到 `<输出目录>.failed`，再次失败自动编号。查看终端 JSON 的 `diagnosticsDirectory`：里面可能有 `error.json`、`process.log`、`validation.json` 和 `refinement.json`；`--debug` 还保存已经读取的输入、映射及显示配置。目录不可写时会额外报告 `diagnosticsWriteError`。取消不创建失败目录。

错误按 `code` 保留具体原因，并用 `category` 提供大类。常见大类包括 `INVALID_SOURCE`、`INVALID_MAPPING`、`VALIDATION_FAILED`、`OUTPUT`、`TIMEOUT` 和 `INTERNAL_ERROR`。例如缺少输入快照为 `INPUT_NOT_FOUND`，实例引用的 symbol 数据缺失为 `MASTER_MISSING`，映射中的引脚覆盖错误仍保留具体的 `PIN_COVERAGE`，同时归类为 `INVALID_MAPPING`。

`sourceConnectivityVerified` 只在未简化且连接校验通过时为 true；简化转换使用 `retainedConnectivityVerified` 表示保留部分校验通过。两者不是仿真正确性证明。

## 配置和共享

转换时可加 `--scale 140` 调整源坐标到目标画板的比例，默认 160。比例减小会压缩器件间距，目标符号大小不变；过小可能造成名称或器件拥挤。

配置入口详见 [配置参考](docs/配置参考.md)。`personal/config.json` 保存转换策略和显示偏好；器件知识仍只有 `rules/builtin/mappings.json` 内置常用表与 `personal/mappings.json` 个人表两层。个人规则优先；个人表里的 `null` 选择 fallback，默认生成自动方框。默认不会联网或共享。

需要使用其他文件时，给 `prepare`、`save-mappings`、`convert` 加 `--mappings /path/mappings.json`。共享、备份和复制由用户自己决定。已有个人规则不会被静默覆盖，写入有锁并使用临时文件原子替换。

`node dist/packages/cli/src/main.js config` 查看补齐默认值后的个人配置。`defaults` 和 `--presentation` 是旧显示配置入口，继续兼容已有脚本。默认隐藏电源/地上的 B 支线但保留电气连接，这不同于 `omitPins`。旧版 `--allow-label-overlap` 参数仍可接受，但视觉 warning 现在默认不会阻断导出。

`showInstanceNames` 控制器件/模块旁的实例名称（如 M0、C0、I3），默认 `true`。设为 `false` 隐藏名称；实例的真实 `reference` 和名称标注仍保留在工程中，仅设置原生 `visible: false`，不改变连接、pin 名称或 net 名称。日常使用修改 `personal/config.json`；`presentation_config.json` 与 `--presentation` 只保留给旧脚本。

模块引脚的边优先依据源 symbol 的引脚短线方向判断，并保留旋转、镜像。没有分支的模块外接端点会对齐到引脚出线方向，长度最多为显示配置中的 `boxStubLength`（默认 40 个画布单位）；共享节点不会被移动。单端普通 port 会在不跨越其他器件时对齐相邻引脚，单端 GND 也会旋转到朝向相邻器件；调整记录在 `report.json` 的 `routeRefinement.endMarkers`。非电源衬底虚线在首次接触同网络实线时接入，避免重复线段。

共享节点有一个局部修正例外：如果节点只连接同一模块同侧的两个或多个引脚，以及一个独立电源/地符号，且节点落在模块引脚内侧，会将节点、电源/地符号和支线一起移到框外。网络、引脚绑定和节点 ID 保持不变；连接其他模块或其他节点的主干不做这种移动。处理记录在 `routeRefinement.boxRoutes.sharedPowerBranches` 中。

使用当前映射表转换时，默认省略没有实际接线的 `basic/ipin`、`opin`、`iopin` 独立端口图形及名称。同名 net 在其他位置有线不算此处接线；接在线段端点、中间或直接接触器件引脚的端口保留，无法判断的几何也保留。器件引脚不因此删除；有名称的开放线端默认生成原生 `port` Cell Pin，而不是浮动空心圆，并会增加工程的形式接口。同一网络的多个开放线端会生成多个同名 port。

注意：Analog Canvas 的正式接口要求绑定可见 port 实例，因此省略独立端口后，原端口名称、方向和 net 存入 `report.json` 的 `omittedPortInterfaces`，不再是目标工程的正式接口声明。实际器件网络成员仍校验；目标工程不声称与源接口/仿真等价。仅由已记录的外部端口省略所产生的单端网络 `ERC_UNCONNECTED_PIN` / `ERC_FLOATING_GATE` 保留为 `omittedPortBoundaryWarnings`，不阻止绘图导出，其他 ERC 仍检查。

视觉诊断遵循 Analog Canvas 给出的严重度：`warning` 和 `info`（例如标签重叠、线路穿过符号、出线方向不理想）写入报告但不阻止导出；`error`（例如未解析符号或歧义连接）会阻止导出。ERC 同样只有 `error` 阻断，悬空引脚等 `warning` 会保留在报告中。`--allow-label-overlap`、`--allow-symbol-overlap` 及对应 API 参数暂时保留用于旧脚本兼容，不再改变这个判定。

## 代码入口

| 路径                                   | 用途                                                |
| -------------------------------------- | --------------------------------------------------- |
| `skill/export_schematic.il`            | Virtuoso 内只读提取                                 |
| `packages/virtuoso-import/core/mapping-table.ts`   | 准备、校验、合并映射和生成简化快照，纯数据 API      |
| `packages/virtuoso-import/core/index.ts`           | 源连接校验、器件扫描、推荐逻辑；旧审核 API 保留兼容 |
| `packages/virtuoso-import/adapter/index.ts` | 调用转换引擎并验证保留网络                          |
| `packages/virtuoso-import/engine/`      | 当前仍使用的 Python 几何转换及原生验证              |
| `packages/cli/src/main.ts`             | CLI、工作区文件读写                                 |
| `analog-canvas/`                       | `upstream-lock.json` 锁定的上游代码和依赖，未修改    |
| `analog-canvas-legacy-192438d/`        | 旧版检出，仅留作本机对照，不参与构建或发布          |
| `tests/`                               | 合成数据测试，不包含 PDK 文件                       |

前端或工具可以调用 `prepareMappings(snapshot, builtin, catalog, personal)`、`saveMappings(snapshot, edits, catalog, existing)`、`convertDesign(snapshot, effectiveTable, options)`。前两个不写文件；CLI 负责持久化。直接调用转换 API 时应传入 `prepareMappings(...).settings`，以包含内置规则。

现在不需要使用旧的 `scan → recommend → confirm` 流程。旧命令和 `--package` 仅为兼容已有脚本保留；`README.en.md` 为旧版参考，当前流程以本文件为准。

## 构建和测试

需要 Node.js 24+、pnpm 11.16+、Python 3.9+、Virtuoso。先在 `analog-canvas/` 执行 `pnpm install --frozen-lockfile`；本项目的 `npm run build` 会构建上游和转换器。Virtuoso 菜单通过 `scripts/node24.sh` 选择 Node 24，也可用 `VC_NODE_PATH` 明确指定 Node 路径。部署时预先准备依赖，不要求公司机器联网。

```bash
npm run build
node scripts/schemas.mjs
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_wire_geometry.py'
```

`VC_ROOT` 指定安装目录，`VC_PYTHON` 指定 Python。当前为单层 schematic 转换，不自动展开层次、总线或阵列。PDK 映射和源快照可能包含公司敏感信息，不随开源发布自动上传。
