# Virtuoso to Analog Canvas

中文 | [English](README.en.md)

把 Cadence Virtuoso 中的 schematic 导出为可在 Analog Canvas 里继续编辑的工程文件。转换在本机完成，不需要大模型或 Virtuoso Bridge。它生成的是可编辑的图，不保证与原电路的仿真结果等价。当前只转换所选的单层 schematic，不自动展开子模块；未识别器件默认用保留外部引脚的方框表示。

下面的命令分两类：`bash` 代码块在 **Linux 终端**运行；`lisp` 代码块在 Virtuoso 的命令窗口 **CIW** 输入。日常使用只需按第 1 至第 4 步操作。

## 1. 在 Linux 下载项目

在准备运行 Virtuoso 的 Linux 机器上打开终端：

```bash
mkdir -p "$HOME/projects"
cd "$HOME/projects"
git clone --recurse-submodules https://github.com/Lzy23321/virtuoso-canvas.git
cd virtuoso-canvas
```

`--recurse-submodules` 会同时下载项目固定版本的 Analog Canvas。只下载 GitHub 页面上的 **Code → Download ZIP** 不够：那个 ZIP 不包含 Analog Canvas 的完整源码。

如果已经克隆过，但 `analog-canvas/` 是空的，在项目目录运行：

```bash
git submodule update --init --recursive
```

## 2. 安装依赖并构建

这台 Linux 机器需要 Node.js **24 或更高版本**、pnpm **11.16 或更高版本**、Python **3.9 或更高版本**，以及已安装的 Virtuoso。先在终端检查：

```bash
node --version
pnpm --version
python3 --version
```

缺少软件时，请先通过服务器管理员或本机的软件管理方式安装。然后在 `virtuoso-canvas` 项目目录运行：

```bash
npm run setup
```

这一个命令会安装 Analog Canvas 所需的依赖、构建项目并运行自动测试。首次安装或更新项目后运行即可；如果报错，先看终端末尾的错误信息，不要继续做下一步。安装依赖通常需要访问 npm 仓库或公司内部镜像。

## 3. 在 Virtuoso 中加载菜单

`VC_ROOT` 只需**配置一次**，不必每次手动输入。如果你平时从 Bash 终端启动 Virtuoso，且按第 1 步安装在 `$HOME/projects/virtuoso-canvas`，在 Linux 终端执行一次：

```bash
printf '%s\n' 'export VC_ROOT="$HOME/projects/virtuoso-canvas"' >> "$HOME/.bashrc"
```

如果项目不在这个位置，先把命令中的路径改成实际的**绝对路径**。只执行一次即可，重复执行会在 `.bashrc` 中添加重复的行。打开一个新终端，输入 `echo "$VC_ROOT"`，确认显示的是项目目录，然后从这个终端启动 Virtuoso。

如果你通过桌面图标或公司的脚本启动 Virtuoso，`.bashrc` 不一定会被读取。这时应把 `export VC_ROOT="项目的绝对路径"` 放在**实际启动 Virtuoso 的脚本中、启动命令之前**。已经打开的 Virtuoso 不会自动得到新设置；配置后需要重新启动。

在 Virtuoso 的 **CIW** 输入：

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_ui.il"))
```

打开 schematic 后，顶部应出现 **Schematic to Canvas** 菜单。也可以在 CIW 输入 `VCUIShow()` 打开导出窗口。确认手动加载正常后，可将下面一行加入你自己的 `.cdsinit`，以后启动时自动加载：

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_init.il"))
```

## 4. 导出第一个工程

1. 在 Virtuoso 打开并保存要转换的 schematic，从 **Schematic to Canvas** 菜单打开导出窗口。
2. 点击 **Scan devices**。已识别的器件会显示对应的 Canvas 符号；未识别的器件默认画成保留外部引脚的方框。
3. 如需修改某个器件的对应关系，选中它并点击 **Edit mapping...**。**Use this run** 只用于本次；**Save personal** 保存到本机，供下次复用。
4. 选择一个已有且可写的 **Output directory**，确认 **Project filename**，按需要调整电源、地、总线等选项，再点击 **Export project**。
5. 成功后，在 Analog Canvas 中打开生成的 `.icproj.json` 文件。窗口里的 **Open Analog Canvas** 只负责打开本机编辑器页面，**不会自动载入导出的工程**。

遇到同名文件时，窗口会询问是否覆盖。导出失败时查看 CIW 中的错误信息；失败不会发布一个“成功的工程”。

## 备选：在 Windows 下载完整源码包

仓库的 **Releases** 页面提供了标为 `Virtuoso Canvas v0.1.0` 的**完整源码包**，可以在其他电脑上下载它，再把解压后的整个目录复制到 Linux。这个包应包含 `analog-canvas/`；普通的 **Code → Download ZIP** 不可以替代它。到 Linux 后仍需完成上面的第 2 至第 4 步。

**下载源码不等于安装依赖。** 若 Linux 也不能访问 npm 或公司内部镜像，仅把源码从 Windows 拷过来仍不足以运行 `npm run setup`；请让管理员提供 Linux 可用的依赖镜像或同平台的预装环境。

## 常见问题

| 现象 | 先检查什么 |
| --- | --- |
| `analog-canvas` 缺失或版本不符 | 在项目目录执行 `git submodule update --init --recursive` |
| `npm run setup` 安装依赖失败 | 检查 Node/pnpm 版本以及 Linux 到 npm 或内部镜像的连接 |
| CIW 找不到脚本、窗口或 Node | 确认 `VC_ROOT` 在启动 Virtuoso **之前**设置，且第 2 步已成功 |
| 扫描结果不是刚修改的电路 | 先保存 schematic，再重新扫描 |
| 某个器件没有合适符号 | 在映射编辑窗查看可用符号；未映射器件可先用通用方框 |

个人配置默认保存在 `personal/config.json` 和 `personal/mappings.json`。它们不会自动上传到 Git，也不要把含公司 PDK 或设计信息的 `work/` 输出提交到公开仓库。

## 按需阅读

- [UI 使用说明](UI使用说明.md)：每个窗口设置的作用，以及哪些设置会保存。
- [CLI 使用说明](CLI使用说明.md)：批量转换、编辑映射文件和查看诊断；日常从菜单导出不需要 CLI。
