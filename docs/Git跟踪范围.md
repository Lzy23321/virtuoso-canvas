# Git 跟踪范围

这份清单记录当前开发目录的实际用途。本地备份另存于 `/home/userone/backups/`；被 Git 忽略的本机文件没有因此删除。

## 应跟踪

| 路径 | 原因 |
| --- | --- |
| `skill/` | Virtuoso 提取与原生窗口代码 |
| `packages/virtuoso-import/` | 唯一的转换核心；`core/`、`adapter/`、`engine/` 都在正式调用链上 |
| `packages/cli/` | CLI 和 SKILL 窗口使用的本机命令入口 |
| `rules/builtin/` | 随程序分发的默认器件映射 |
| `schemas/` | 供外部工具使用的版本化 JSON Schema，虽可生成但需要作为接口审查 |
| `scripts/`、`tests/` | 构建、测试和辅助诊断；其中发布脚本不是日常转换前置步骤 |
| `docs/`、`README.md`、`README.en.md` | 使用及开发文档；英文 README 含旧流程参考 |
| `package.json`、`tsconfig.json`、`upstream-lock.json`、`.gitignore` | 构建配置及固定上游版本 |
| `analog-canvas/` | 固定上游 commit 的 Git submodule；外层仓库只记录引用，不提交上游源码或依赖 |

## 不应跟踪

| 路径 | 原因与处理 |
| --- | --- |
| `personal/` | 本机配置与个人映射，可能包含 PDK 信息；保留在本机，Git 忽略 |
| `work/` | 原理图快照、工程、诊断和测试输出，可能包含设计数据；Git 忽略 |
| `dist/`、任意 `node_modules/`、`__pycache__/` | 构建或安装生成，可重建；Git 忽略 |
| `analog-canvas-legacy-192438d/` | 旧上游检出，不在当前调用链；先保留本机供对照，Git 忽略，不删除 |
| `prototype/` | 早期界面原型含 StrongARM 电路预览图，当前运行不用；先保留本机，确认图片可提交后再决定是否纳入 |
| `*.log`、`*.tsbuildinfo`、`.env*`（示例文件除外） | 日志、编译缓存和本机环境配置；Git 忽略 |

## 当前上游目录

`analog-canvas/` 是当前运行依赖，固定在 `upstream-lock.json` 中的 commit `6fbacc229bd985b556693048aba628c3e29e30fa`。外层 Git 以 submodule 记录该 commit 和上游地址，不提交它的 `node_modules/`。从外层仓库克隆后还需初始化 submodule、安装依赖并构建，才能运行。
