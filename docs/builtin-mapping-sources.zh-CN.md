# 默认映射的来源与范围

默认表：`rules/builtin/mappings.json`。这是一组绘图模板，不是完整的代工厂 PDK 支持清单，也不提供模型文件或模型等价性保证。

| 映射键                                                           | 依据                                                                                                                                                                                                                                                                                                                     | 验证范围                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `tsmcN40/nch_mac`、`tsmcN40/pch_mac`                             | 本工作区用户导出的 cross_couple 原始快照                                                                                                                                                                                                                                                                                 | 已核对库名、cell、D/G/S/B、w/l/m/nf；没有把快照或模型文件复制进默认表                       |
| `tsmc18/nmos2v`、`tsmc18/pmos2v`                                 | [Virginia Tech 原理图教程](https://www.mics.ece.vt.edu/content/dam/mics_ece_vt_edu/ICDesign/Tutorials/tsmc180/n01_Schematic_Creation.pdf)明确给出库名、cell 名和极性                                                                                                                                                     | 名称有公开依据；D/G/S/B 与 w/l 为四端绘图模板，未在该 PDK 实机验证                          |
| `smic18mmrf/n18`、`smic18mmrf/p18`                               | [Cadence 用户的 SMIC 0.18 实际网表及讨论](https://community.cadence.com/cadence_technology_forums/f/custom-ic-skill/11731/a-problem-in-spectre-netlist-generation/15179)出现 n18/p18；[Silvaco 官方 PDK 摘要](https://silvaco.com/wp-content/uploads/product/pdf/smic-smic18mmrf_pdksummary.pdf)确认 SMIC18MMRF 工艺系列 | `smic18mmrf` 是配置模板中的库别名，不是官方保证的所有安装库名；具体引脚、参数需实际快照校验 |
| `gpdk045/nmos1v`、`gpdk045/pmos1v`                               | [NUS Cadence 实验手册](https://cde.nus.edu.sg/ece/wp-content/uploads/sites/3/2024/09/SimulationManualWithCadenceTools.pdf)给出库、cell、极性和 w/l                                                                                                                                                                       | 基础四端模板；GPDK 是通用教学工艺，不是 TSMC 或 SMIC 工艺                                   |
| `analogLib/res`、`analogLib/cap`、`analogLib/idc`、`basic/iopin` | 项目原有常用规则                                                                                                                                                                                                                                                                                                         | 保留现有支持范围                                                                            |

## 使用限制

- 只有 lib/cell 精确匹配才选用默认条目。用户自行改名的库需要在个人表中用真实库名保存对应条目，不猜库别名。
- 默认条目直接写入生成的 `mappings.json`，保留表中指定的参数，不再被启发式推荐暗中改写。用户可直接修改。
- 名称匹配但实际引脚或参数不符时，条目保留并显示 `invalid`，由用户修正。不静默换符号、不自动忽略额外引脚。
- 公开资料常混用 SPICE 模型名和 OA cell 名。[Columbia 的 TSMC018 页面](https://www.ee.columbia.edu/~kinget/TOOLS/technology.html)列出的是模型名，不能据此批量构造确定的 lib/cell 映射。因此没有把全部模型名、RF、DNW、ISO 和继承衬底变体批量加入。
- 尚未覆盖全部 SMIC/TSMC 节点、RF 器件和工艺电阻电容。补充这些条目需要明确的 cell/引脚证据；几何参数型电阻电容也不能把长度误当作电阻值。
- 搜集时间：2026-09-13。网上资料可见不代表拥有 PDK 再分发授权；本次只维护器件名称与绘图对应关系，没有下载或分发代工厂模型。
