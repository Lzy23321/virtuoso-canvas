<img width="721" height="644" alt="image" src="https://github.com/user-attachments/assets/128d1c6a-c59a-414b-95b8-031549c88ef6" /># Virtuoso to Analog Canvas

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

`--recurse-submodules` 会同时下载项目固定版本的 Analog Canvas。`$HOME/projects`为自己选择此项目存放的目录。如果不想放在 `$HOME/projects`，也可以自行制定，例如

```bash
mkdir -p "/home/userone/Projects/test"
```

<img width="478" height="109" alt="image" src="https://github.com/user-attachments/assets/09cc93a4-c841-4132-ba90-ae3da6acc890" />

先进入你有写入权限的目录，再执行 `git clone --recurse-submodules ...`。

```bash
cd /home/userone/Projects/virtuoso_canvas_test
git clone --recurse-submodules https://github.com/Lzy23321/virtuoso-canvas.git
cd virtuoso-canvas
```

安装和构建命令在这个 `virtuoso-canvas` 目录执行；**日常启动 Virtuoso 时仍使用你原来的工作目录**。工具仓库不需要放在 Virtuoso 的启动目录，建议与电路设计目录分开，避免混入项目文件。

如果已经克隆过，但 `analog-canvas/` 是空的，在项目目录运行：

```bash
git submodule update --init --recursive
```

<img width="1160" height="415" alt="image" src="https://github.com/user-attachments/assets/5b95a996-d371-4c55-8cdd-94964a9fb7c3" />

## 2. 安装依赖并构建

当前源码构建和本机 Analog Canvas 运行需要 Node.js **24 或更高版本**、上游锁定的 pnpm **11.16.0**、Python **3.9 或更高版本**，以及已安装的 Virtuoso。这不要求升级公司的系统 Node：可以在个人目录并装 Node 24。先在项目目录检查：

```bash
node --version
(cd analog-canvas && pnpm --version)
python3 --version
```

如果 `node --version` 显示 22，但已经通过 nvm 在个人目录安装了 Node 24，在**当前终端**执行：

```bash
source "$HOME/.nvm/nvm.sh"
nvm use 24
node --version
(cd analog-canvas && pnpm --version)
```

`nvm use 24` 只切换当前终端，不修改系统 Node。如果它提示没有安装 24，需要先取得 Node 24；若 pnpm 仍找不到，可在该 Node 24 环境执行 `corepack enable pnpm`，再检查版本。这一步及首次安装依赖可能需要访问 npm 仓库或公司镜像；断网时请让管理员提供可用镜像或预装环境。**直接用 Node 22 重试 `npm run setup` 不会成功**，因为构建和本机编辑器启动脚本会检查 Node 版本。

如果 Node 24 安装在**其他位置**，把下一段第一行的路径换成实际的 Node 可执行文件路径，在当前终端执行：

```bash
export VC_NODE_PATH="/absolute/path/to/node"
export PATH="$(dirname "$VC_NODE_PATH"):$PATH"
node --version
(cd analog-canvas && pnpm --version)
```

这里的 `/absolute/path/to/node` 是示例占位符，不要原样输入。如果 `pnpm` 仍找不到，需要在该 Node 环境安装或启用 pnpm 11.16.0；不能仅靠设置 `VC_NODE_PATH` 跳过依赖安装。

确认版本后，在 `virtuoso-canvas` 项目目录运行：

```bash
npm run setup
```
<img width="1249" height="414" alt="image" src="https://github.com/user-attachments/assets/c63545b3-9495-4e8a-8628-529f7277bc95" />

这一个命令会安装 Analog Canvas 所需的依赖、构建项目并运行自动测试。首次安装或更新项目后运行即可；如果报错，先看终端末尾的错误信息，不要继续做下一步。通过 nvm 安装的 Node 24 也可供菜单脚本自动选择；从其他位置安装时，可在启动 Virtuoso 前设置 `VC_NODE_PATH` 为 Node 24 可执行文件的绝对路径。

安装完成后会显示：
<img width="763" height="201" alt="image" src="https://github.com/user-attachments/assets/78662952-50f2-4c9d-aaa8-0b9f2b2b2a8b" />

## 3. 在 Virtuoso 中加载菜单

`VC_ROOT` 指向项目目录，**不要求在 `$HOME` 下**。根据 Virtuoso 是否已经打开，选择下面一种做法。

1. Virtuoso 已经打开：在它的 **CIW** 中逐行输入，把第一行的路径换成实际项目目录：

```lisp
setShellEnvVar("VC_ROOT=/absolute/path/to/virtuoso-canvas")
getShellEnvVar("VC_ROOT")
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_ui.il"))
```

第二行应返回项目目录字符串，而不是 `nil`。如果 Node 24 不在 nvm 默认位置，还要在加载前于 CIW 输入 `setShellEnvVar("VC_NODE_PATH=/absolute/path/to/node")`。这些设置只作用于当前 Virtuoso 会话。如果此前已从**另一个项目路径**加载过本菜单，请重启 Virtuoso 后按下面的启动方式操作，避免沿用旧路径。

2. Virtuoso 尚未启动：在平常用于启动 Virtuoso 的终端执行下面的命令，把路径换成工具仓库的实际位置；**不需要切换当前目录**：

```bash
export VC_ROOT="/absolute/path/to/virtuoso-canvas"
test -f "$VC_ROOT/skill/virtuoso_canvas_ui.il" && echo "VC_ROOT OK: $VC_ROOT"
```
<img width="661" height="180" alt="image" src="https://github.com/user-attachments/assets/bab42497-4233-4e06-9370-dad2446cbd38" />

不要原样输入占位符；第二行应显示 `VC_ROOT OK`。保持你平常启动 Virtuoso 的目录和方式，**从这个已经设置变量的终端启动**（若 `virtuoso` 命令在 `PATH` 中，可输入 `virtuoso &`；否则使用公司提供的启动命令），然后在 CIW 输入：

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_ui.il"))
```

要让以后新开的 Bash 终端自动获得这个设置，再执行**一次**：

```bash
printf 'export VC_ROOT=%q\n' "$VC_ROOT" >> "$HOME/.bashrc"
```

重复执行会在 `.bashrc` 中添加重复的行。之后从已设置 `VC_ROOT` 的终端启动 Virtuoso。如果你使用上面非 nvm 的 Node 24，且已经设置了 `VC_NODE_PATH`，可再执行一次 `printf 'export VC_NODE_PATH=%q\n' "$VC_NODE_PATH" >> "$HOME/.bashrc"`，让新终端也能找到它。

如果你通过桌面图标或公司的脚本启动 Virtuoso，`.bashrc` 不一定会被读取。这时应把 `export VC_ROOT="项目的绝对路径"`（以及需要时的 `export VC_NODE_PATH="Node 可执行文件的绝对路径"`）放在**实际启动 Virtuoso 的脚本中、启动命令之前**。在终端设置变量不会改变已经打开的 Virtuoso；这种情况使用上面的 CIW 即时设置命令，或重启 Virtuoso。

打开 schematic 后，顶部应出现 **Schematic to Canvas** 菜单。也可以在 CIW 输入 `VCUIShow()` 打开导出窗口。确认手动加载正常后，可将下面一行加入你自己的 `.cdsinit`，以后启动时自动加载：

```lisp
load(strcat(getShellEnvVar("VC_ROOT") "/skill/virtuoso_canvas_init.il"))
```

## 4. 导出第一个工程
<img width="2260" height="1243" alt="image" src="https://github.com/user-attachments/assets/0cb86e3d-0bb2-4a40-9262-df52be2b482b" />
<img width="2260" height="1280" alt="image" src="https://github.com/user-attachments/assets/63dc6cde-3042-48a8-a5d2-13eea58017c1" />
<img width="1285" height="57" alt="image" src="https://github.com/user-attachments/assets/30b1e43c-9774-49fb-8f9a-47d701da62d1" />
<img width="2260" height="1280" alt="image" src="https://github.com/user-attachments/assets/544502dd-665c-4a8c-b659-2b520334af64" />

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

## 开源协议

本项目原创的转换代码采用 [MIT 协议](LICENSE.md)。Analog Canvas 是独立的上游项目，仍采用其自身的 [AGPL-3.0-only](analog-canvas/LICENSE.md) 协议，通过 Git 子模块提供；完整源码包也会包含其源码及原有协议。MIT 不会改变 Analog Canvas 的协议：分发或运行两者的组合时仍须遵守适用的 AGPL 条款。重新分发完整源码包时，请保留上游的版权、协议和第三方声明。范围及来源见 [NOTICE.md](NOTICE.md)。Cadence Virtuoso 和 PDK 不包含在本项目中。

使用 Analog Canvas 开展研究、教学或发表作品时，请按上游要求引用其作者和项目；引用格式见 [NOTICE.md](NOTICE.md)。普通安装和使用不需要在文稿中添加引用。
