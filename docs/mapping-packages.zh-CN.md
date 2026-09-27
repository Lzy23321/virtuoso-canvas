# 映射表指南

新流程只需编辑 `prepare` 生成的 `mappings.json`，再执行 `save-mappings`。不需要 candidateId、approve 或 reviewedBy。

## 文件格式

```json
{
  "version": 1,
  "devices": {
    "myPDK/nch": {
      "symbol": "nmos",
      "pins": { "D": "D", "G": "G", "S": "S", "B": "B" },
      "parameters": { "W": "w", "L": "l" }
    },
    "myPDK/unknown": null,
    "myPDK/unwanted": { "omit": true }
  }
}
```

`库名/cell名` 是器件分类键，与 view、实例参数值、模型证据无关。名称区分大小写。`pins`、`parameters` 左侧为源名称，右侧为目标名称；参数不进行表达式执行或单位转换。未映射的参数不进入绘图结果，原快照不变。

## 当前能转换的标准符号

| symbol           | 目标引脚           | 目标参数            |
| ---------------- | ------------------ | ------------------- |
| `nmos`、`pmos`   | `D`、`G`、`S`、`B` | `w`、`l`、`m`、`nf` |
| `resistor`       | `1`、`2`           | `r`、`m`            |
| `capacitor`      | `1`、`2`           | `c`、`m`            |
| `current-source` | `+`、`-`           | `dc`                |
| `port`           | `P`                | 无                  |
| `voltage-source` | `+`、`-`           | `dc`（仅保存参数，不建立仿真绑定） |
| `pulse-voltage-source` | `+`、`-`      | 无，当前仅符号转换 |
| `ground` | `0` | 无，使用原生电源标记语义 |
| `voltage-controlled-switch` | `P`、`N`、`CP`、`CN` | 无，当前仅符号转换 |

以 `catalog` 命令或准备结果中的 `catalog.json` 为准。这是当前适配器的能力，不代表上游全部符号都已支持。另支持 `{ "symbol": "generic-box" }`，使用原生外部子电路方框，不需要填写引脚映射。

## 七引脚 MOS 简化示例

假设源引脚实际为 `D/G/S/B/ISO/PW/NW`，且用户决定不画额外三根引脚：

```json
{
  "symbol": "nmos",
  "pins": { "D": "D", "G": "G", "S": "S", "B": "B" },
  "omitPins": ["ISO", "PW", "NW"],
  "parameters": { "w": "w", "l": "l" }
}
```

必须根据真实引脚名称填写。每个源引脚必须映射或明确省略，不能重复或同时出现在两处；不能用省略来自动短接端子。参数映射必须能应用到每个保留实例。

原始连接留在 `source.snapshot.json`，简化电路在 `filtered.snapshot.json`。`report.json` 中记录省略的实例、引脚、网络以及形式端口。只裁剪专用叶支线，保护共享主干；剩余连接仍验证。省略后的图不是完整源设计的电气等价表示。

`omitPins` 不同于显示配置里的隐藏 B：隐藏仅改变绘图，omit 会从目标电路移除该端子。

## 未知与省略

- `null`：自动生成通用方框，保留外部引脚及其连接。
- `{"omit": true}`：明确省略该类型的所有实例。不是只省略某一个实例；需逐实例例外时当前应先停止，不要误用类型级规则。
- 通用方框：没有个人或内置规则时自动使用；错误的显式规则仍然报错。根据原引脚坐标推断边及排列，不能保证原图案一致。最多 128 个外部引脚；内部电路、复杂图形与仿真模型不在本次支持范围。
- 原图本来悬空的方框引脚仍保留，未连接警告记录在 `validation.sourceUnconnectedBoxPins` 中，不阻止导出；不会自动添加“故意不连接”标记。其他 ERC 错误继续阻止导出。

## 保存、修改与复用

```bash
node dist/packages/cli/src/main.js save-mappings /tmp/design.snapshot.json --settings work/design-settings/mappings.json
node dist/packages/cli/src/main.js convert /tmp/design.snapshot.json --out work/design-result
```

规则保存到本安装目录的 `personal/mappings.json`。已有同名规则变化时，命令给出新旧差异，检查后加 `--replace` 再保存；新增规则自动合并。没有出现在此次编辑文件中的个人规则会保留。`null` 明确选择自动方框，不删除旧条目或回退到默认规则。

使用 `--mappings FILE` 可自行选择映射表位置。每个人默认独立维护，不会自动共享或上传。内置表不会被用户设置覆盖，更新程序也不应覆盖个人文件。旧版带 `entries/signature` 的审核包不是这种格式，可继续通过旧 `--package` 使用；新流程请重新 `prepare` 并填写可读映射。
