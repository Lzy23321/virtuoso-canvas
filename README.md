# Virtuoso → Analog Canvas

此项目为 将Cadence Virtuoso 中的 schematic 转换为 可以在Analog Canvas中继续编辑的工程文件。转换不需要使用大模型，可以离线部署。前端 UI 界面内嵌在了Virtuoso Schematic菜单栏中。

## 项目安装

登录服务器后，先确认软件版本：

```bash
node --version       # 查看 Node.js 版本；项目要求 24 或更高
pnpm --version       # 查看 pnpm 版本；项目要求 11.16 或更高
python3 --version    # 查看 Python 版本；项目要求 3.9 或更高
```

如果服务器还没有 Node.js、pnpm 或 Python，请先联系服务器管理员或自行安装。项目不会替你安装系统软件。

### 方式 A：下载完整源码包（推荐给 Windows 用户）

在 GitHub 仓库的 **Releases** 页面下载带有 `standalone` 或 `source-bundle` 名称的压缩包。这个压缩包已经把当前锁定版本的 `analog-canvas` 源码一并放入，不需要在 Windows 安装 Git，也不需要执行 submodule 命令：

1. 登录 GitHub，打开本项目的 **Releases** 页面；
2. 下载最新的完整源码包（通常是 `.zip` 或 `.tar.gz`）；
3. 解压后把整个 `virtuoso-canvas-*` 文件夹复制到 Linux 服务器；
4. 按下面“首次安装依赖并构建”的步骤，在 Linux 上运行 `npm run setup`。

源码包包含锁定版本的 Analog Canvas 源码，但不包含 Linux 专用的 `node_modules/` 和 `dist/`。这些内容必须在 Linux 上安装或构建，不能从 Windows 直接复制使用。

### 方式 B：Git 下载源码和 submodule

```bash
cd /path/where/you/keep/projects  # 进入你要存放项目的目录
git clone --recurse-submodules https://github.com/Lzy23321/virtuoso-canvas.git  # 下载项目和锁定版本的 Analog Canvas
cd virtuoso-canvas  # 进入项目根目录
```

其中 `/path/where/you/keep/projects` 换成你自己的目录，例如 `$HOME/projects`。锁定版本的 Analog Canvas 是为了避免上游更新后与转换器不兼容，因此必须使用项目指定的兼容版本。

GitHub 项目首页的 **Code → Download ZIP** 只包含外层仓库，里面的 `analog-canvas` 只是一个 submodule 引用，不能作为完整安装包使用。除非你另外取得匹配的 Analog Canvas 源码，否则不要使用这个 ZIP。

如果当前仓库还没有发布完整源码包，维护者可以在联网环境执行下面的命令生成它，再把生成的目录压缩后上传到 GitHub Release：

```bash
node scripts/package_standalone.mjs --out /tmp/virtuoso-canvas-release
```

这个命令会复制当前锁定版本的 Analog Canvas 源码、转换器、SKILL、脚本、测试和文档，不会复制个人配置、真实设计数据、`node_modules` 或 Git 历史。

## 二、首次安装依赖并构建

进入刚下载的项目目录，执行：

```bash
cd /path/to/virtuoso-canvas  # 进入项目根目录
npm run setup  # 安装依赖、构建项目并运行自动测试
```

这两行的作用不同：

- `cd /path/to/virtuoso-canvas` 只负责进入项目根目录；请把路径替换成实际安装位置。
- `npm run setup` 是项目提供的统一安装命令。它在脚本内部依次执行依赖安装、项目构建和自动测试，用户不需要分别输入这些命令。

`npm run setup` 只在首次安装、重新 clone 或更新项目代码后执行。它内部完成的步骤是：安装锁定版本的 Analog Canvas 依赖、生成 Virtuoso 窗口和转换器需要的 `dist/`，以及检查安装是否正常。

如果 Linux 服务器不能访问互联网，可以先在 Windows 电脑上下载完整源码，再复制到 Linux。Windows 只负责下载文件，不要在 Windows 上运行构建命令：

1. 在 Windows 安装 Git，打开 PowerShell，执行：

   ```powershell
   cd C:\Users\你的用户名\Downloads
   git clone --recurse-submodules https://github.com/Lzy23321/virtuoso-canvas.git
   ```

   `--recurse-submodules` 会同时下载仓库锁定的 `analog-canvas` 源码。
2. 将整个 `virtuoso-canvas` 文件夹复制到 Linux 服务器，例如使用 scp、SFTP 或服务器管理平台。不要只复制 `packages/`、`skill/` 或 `dist/`。
3. 在 Linux 服务器进入项目目录。如果服务器有内部 npm/pnpm 镜像，执行正常安装：

   ```bash
   cd /path/to/virtuoso-canvas
   npm run setup
   ```

   如果依赖和构建产物已经从同版本 Linux 环境一起复制过来，才使用离线检查：

```bash
cd /path/to/virtuoso-canvas  # 进入项目根目录
node scripts/setup.mjs --offline --skip-tests  # 不访问网络，使用已有依赖完成检查和构建
```

`--offline` 要求 pnpm 依赖已经在 Linux 服务器的缓存中，或者项目中已经携带同平台生成的 `analog-canvas/node_modules/` 和 `dist/`。Windows 上生成的 `node_modules/` 不能直接当作 Linux 依赖使用。Node.js、Python 和 Virtuoso 本身仍需由服务器管理员预先安装，项目脚本不能离线替你安装系统软件。

测试通过后，才进行下一节的 Virtuoso 配置。

安装阶段命令的区别如下：

| 命令 | 作用 | 什么时候执行 |
| --- | --- | --- |
| `git clone --recurse-submodules ...` | 下载本项目，并同时取出仓库锁定的 Analog Canvas 版本 | 第一次安装 |
| `git submodule update --init --recursive` | 补齐缺失的 submodule；不会自动切换到最新版 | 普通 clone 或 submodule 缺失时 |
| `npm run setup` | 安装上游依赖、构建 `dist/`、运行测试 | 第一次安装或更新源码后 |
| `node scripts/setup.mjs --offline --skip-tests` | 使用本机已有依赖进行离线构建，不联网、不运行测试 | 离线服务器部署时 |
| `npm run build` | 只重新构建，不重新安装依赖 | 修改代码后快速重建 |
| `npm test` | 运行自动化测试，不修改用户映射和设计 | 构建后检查环境时 |

## 三、告诉 Virtuoso 项目在哪里

必须在**启动 Virtuoso 之前**设置 `VC_ROOT`：

```bash
export VC_ROOT=/path/to/virtuoso-canvas  # 告诉 UI 项目安装在哪里
```

然后从这个终端启动 Virtuoso，或者把这行加入你启动 Virtuoso 使用的环境脚本。UI 会从 `VC_ROOT` 查找已经构建好的 `dist/`、SKILL 文件和上游目录。

如果服务器上有多个 Node.js 或 Python，再设置对应的可执行文件：

```bash
export VC_NODE_PATH=/path/to/node      # 可选：指定 Node.js 可执行文件
export VC_PYTHON=/path/to/python3      # 可选：指定 Python 可执行文件
```

个人映射和显示配置默认保存在：

```text
$VC_ROOT/personal/mappings.json
$VC_ROOT/personal/config.json
```

这两个文件是本机配置，不需要提交到 Git。若要放在其他目录，在启动 Virtuoso 前设置 `VC_MAPPING_PATH` 和 `VC_CONFIG_PATH`。

## 四、在 Virtuoso 中打开窗口

在 Virtuoso CIW 中执行下面两行。路径要改成你的实际项目路径：

```lisp
load("/path/to/virtuoso-canvas/skill/virtuoso_canvas_ui.il")  ; 加载 UI 和菜单代码
VCUIShow()  ; 显示 Virtuoso Canvas 窗口
```

如果希望每次启动 Virtuoso 自动加载 UI，把下面一行加入你自己的 `.cdsinit`（不要修改项目目录中的文件）：

```lisp
load("/path/to/virtuoso-canvas/skill/virtuoso_canvas_init.il")  ; 启动时自动加载 UI
```

启动 Virtuoso 前必须已经设置 `VC_ROOT`。这个初始化脚本只加载窗口和菜单，不会自动扫描或导出设计。

加载成功后会出现 **Virtuoso Canvas** 窗口。已有的 schematic 窗口还会出现 **Schematic to Canvas** 菜单；也可以从该菜单打开导出界面。

## 五、第一次转换

1. 在 Virtuoso 中打开目标 schematic。
2. 在 Virtuoso Canvas 窗口点击 **Scan devices**，读取器件和网络。
3. 检查扫描表。对没有自动匹配的器件，点击 **Edit mapping...**，选择目标符号并对应引脚、参数。
4. 点击 **Use this run** 只在本次转换使用设置；确认无误后点击 **Save personal**，以后相同的 library/cell 可以自动复用。
5. 打开 **Schematic to Canvas → Export schematic...**，选择输出目录和工程文件名。
6. 按需要设置电源网络、地网络、总线和禁用实例选项，点击 **Export project**。
7. 导出成功后，用 Analog Canvas 打开生成的 `.icproj.json` 文件。点击 **Open Analog Canvas** 只会打开本机 Canvas 页面，不会自动导入工程。

输出目录需要提前存在，并且用户对它有写权限。同名工程或报告出现时，窗口会询问是否覆盖。失败原因和可操作的警告会显示在 Virtuoso CIW 中。

## 六、遇到问题时先检查

- **找不到文件或 Node**：确认 `VC_ROOT` 已在启动 Virtuoso 前设置，并确认已经执行 `npm run build`。
- **提示缺少上游模块**：确认 clone 时使用了 `--recurse-submodules`，或执行 `git submodule update --init --recursive`。
- **窗口能打开但扫描失败**：确认目标 schematic 已保存，并检查服务器用户对项目目录、`/tmp` 和输出目录有读写权限。
- **器件没有匹配**：在 UI 中编辑 mapping；未匹配器件默认会生成通用方框，也可以查看 [映射表指南](docs/mapping-packages.zh-CN.md)。
- **需要换机器或换目录**：重新设置 `VC_ROOT`，并在新目录重新执行依赖安装和构建。

## 文档导航

普通用户主要需要阅读：

- [配置参考](docs/配置参考.md)：个人配置、映射文件和环境变量；
- [映射表指南](docs/mapping-packages.zh-CN.md)：器件、引脚和参数如何对应；
- [Analog Canvas 符号表](docs/analog-canvas-catalog.zh-CN.md)：可用目标符号及支持状态；
- [SKILL 前端协议](docs/SKILL前端协议.md)：UI 与本地后端的调用和回执。

维护者或贡献者再阅读：

- [代码与文件流程](docs/代码与文件流程.md)：转换核心、临时文件和校验流程；
- [发布与上游集成](docs/发布与上游集成.md)：源码包、上游暂存包和许可证要求；
- [默认映射来源](docs/builtin-mapping-sources.zh-CN.md)：内置映射的证据和适用范围；
- [Git 跟踪范围](docs/Git跟踪范围.md)：哪些本机目录应忽略、哪些源码应提交。

这些文档都不包含个人 PDK 文件或真实设计数据，因此可以随源码发布。开发流程说明不是 UI 使用必读内容；如果只面向普通用户，可以保留它们在仓库中但不放入首页操作步骤。

## CLI：批处理和调试入口

CLI 适合无 Virtuoso 窗口的批处理、回归测试和问题诊断。它使用与 UI 相同的转换核心。

从 CIW 导出快照后，可以在终端执行：

```bash
node dist/packages/cli/src/main.js prepare /tmp/design.snapshot.json --out work/design-settings  # 扫描器件并生成可编辑的映射设置
# 编辑 work/design-settings/mappings.json 后：
node dist/packages/cli/src/main.js save-mappings /tmp/design.snapshot.json \
  --settings work/design-settings/mappings.json  # 把映射保存到 personal/mappings.json
node dist/packages/cli/src/main.js convert /tmp/design.snapshot.json --out work/design-result  # 生成工程和报告
```

普通转换输出 `project.icproj.json` 和 `report.json`；加 `--preview` 保存 SVG 预览，`--debug` 保存完整诊断。映射指南、输出文件和失败诊断分别见 [映射表指南](docs/mapping-packages.zh-CN.md) 和 [代码与文件流程](docs/代码与文件流程.md)。

CLI 命令说明：

| 命令 | 作用 | 主要输入/输出 |
| --- | --- | --- |
| `prepare` | 读取 Virtuoso 导出的快照，列出器件并生成映射编辑文件 | 输入 `snapshot.json`；输出 `mappings.json`、预览和符号目录 |
| `save-mappings` | 校验并保存用户确认的器件映射 | 输入编辑后的 `mappings.json`；更新个人映射表 |
| `convert` | 按映射把快照转换成 Analog Canvas 工程 | 输入快照和映射；输出 `.icproj.json` 与报告 |
| `config` | 查看补齐默认值后的个人配置 | 输出配置内容，不修改设计 |
| `catalog` | 查看当前转换器支持的目标符号 | 输出符号目录 |

普通用户不需要直接运行这些 CLI 命令；Virtuoso 窗口会自动调用同一套功能。CLI 主要用于没有 Virtuoso 图形界面时的批处理和排查问题。

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
