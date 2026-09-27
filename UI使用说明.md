# UI 使用说明

中文 | [English](UI-Guide.en.md) · [返回安装说明](README.md)

本页只讲 Virtuoso 中的 **Schematic to Canvas** 窗口。请先按 README 完成安装、构建和菜单加载。此工具读取 schematic 并生成可编辑图；它不会修改 Virtuoso 原理图，也不保证导出图与原设计仿真等价。

## 一次导出的顺序

1. 打开目标 schematic，保存修改。从顶部 **Schematic to Canvas** 菜单打开窗口。
2. 检查 **Library / Cell / View**；按 **Current** 可填入当前打开的 schematic。点击 **Scan devices**。
3. 检查器件表。若需要改变某类器件的画法，选中一行，点击 **Edit mapping...**。
4. 检查导出选项，选好保存目录与文件名，点击 **Export project**。
5. 看到成功状态后，在 Analog Canvas 中打开生成的 `.icproj.json`。

扫描读取的是 schematic 中已存储的连接关系。如果修改了 schematic、切换了 library/cell/view，或者想清除仅用于本次的映射，请保存并重新扫描。未扫描或扫描后切换来源时，窗口不会允许直接导出。

## 器件表与映射

器件表每行代表一种 Virtuoso `library/cell`，**Count** 是这种器件在当前图中的实例数。**Canvas symbol** 是目标画法；**Rule** 表示来自内置规则、个人规则还是本次编辑。没有合适规则的器件默认使用 `generic-box`：保留外部引脚和连线，但不绘制模块内部电路。

在 **Edit mapping...** 中：

| 控件 | 做什么 |
| --- | --- |
| **Canvas symbol** | 选择要画成的目标器件；`generic-box` 保留所有源引脚；**Skip device** 省略该 `library/cell` 的所有实例，不是隐藏名称。 |
| **Browse all symbols...** | 查看 Canvas 符号目录。标为 `supported` 的符号可回填选择；其他符号目前仅供查看。 |
| **Source pin → Canvas pin** | 将每个源引脚对应到目标引脚。额外源引脚可明确选 **Ignore**；这会丢弃对应连接，**不会**自动短接到其他引脚。每个目标引脚必须恰好对应一个源引脚。 |
| **Edit parameters...** | 可选择把源参数映射到目标参数，例如 `W → w`、`L → l`；名称必须与源设计实际参数一致。不映射的参数不会显示在目标器件参数中。 |
| **Use this run** | 校验后只在当前扫描会话中使用；重新扫描会清除，不写个人文件。 |
| **Save personal** | 校验并写入本机的 `personal/mappings.json`，本次和以后的扫描均可使用；窗口会显示保存路径。 |

对于有额外引脚的器件，例如希望把七引脚 MOS 画成标准四引脚 MOS，必须明确对应 D/G/S/B，并对不需要的源引脚选择 **Ignore**。这是一种有意简化，不保证与源电路电气等价。若不确定，应先用 `generic-box`。

## 导出选项

| 界面项 | 作用 |
| --- | --- |
| **Save directory / Browse...** | 选择已有、可写的保存目录。不同文件名的工程可以放在同一目录。 |
| **Project filename** | 默认使用 cell 名；导出时自动补 `.icproj.json`。同名工程或报告已存在时会先询问是否覆盖。 |
| **Scale** | 控制源图坐标到目标画布的比例，窗口初始值为 `140`。数值越小，器件之间通常越紧凑；它不是器件尺寸缩放。 |
| **Bus: Bundled / Reject** | **Bundled** 把总线画成一束示意线；不验证每一位的连接或仿真等价。**Reject** 遇到总线就报错。窗口初始选择 Bundled。 |
| **Disabled: Keep / Skip** | **Keep** 保留被标记为禁用的实例，并按普通符号画出；**Skip** 省略这些实例及其专用连接。不是控制实例名称显示。 |
| **Show instance names** | 只控制 M0、R1、I3 等实例名称是否可见，不改变器件及连线。 |
| **Skip unconnected pins** | 省略未接线的独立顶层 `ipin/opin/iopin`，不删除器件自身的引脚。 |
| **Power nets / Ground nets** | 填写要按电源或地处理的网络名，**用空格分隔**，例如 `VDD AVDD`、`GND VSS`。同一个名称不能同时属于两类。 |
| **Save network settings** | 只将当前电源/地网络名写入 `personal/config.json`，供以后窗口自动读取；不保存 Scale、Bus 等其他选项。未点击保存时，当前网络名仍用于这次导出。 |

除 **Save personal** 和 **Save network settings** 明确写盘的内容外，不要把窗口当前显示的其他选项当作已经永久保存。

## 导出后去哪里看

成功后，保存目录中至少有 `<文件名>.icproj.json` 和相应的 `<文件名>.report.json`。窗口的 **Open Analog Canvas** 只启动或打开本机编辑器，仍需在编辑器中自行选择刚导出的工程文件。

状态栏和 Virtuoso **CIW** 会显示成功、警告或错误。警告表示工程已经导出，但有简化或视觉/连接事项需要人工检查；错误表示没有发布成功工程。同名文件的覆盖对话框选择 **No** 时不会修改原文件。

常见处理：扫描结果过旧就保存并重新扫描；映射无法提交时检查是否有 **Unassigned** 引脚、遗漏的目标引脚或不支持的参数；导出失败时先看 CIW 的 `*Error* VCExport [代码]` 与诊断路径。
