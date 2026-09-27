# Analog Canvas 完整符号表

基于 upstream-lock.json 锁定的 Analog Canvas 符号库，包含 Razavi 和 Extended Devices。上游存在符号不等于转换器已经支持。参数列只列转换器支持的映射参数。

| symbol | 名称 | 分类 | 引脚 | 转换支持 | 映射参数 |
| --- | --- | --- | --- | --- | --- |
| and-gate | AND Gate | logic | A, B, Y | 转换器尚未适配 | - |
| and-gate-3 | AND Gate (3 inputs) | logic | A, B, C, Y | 转换器尚未适配 | - |
| and-gate-4 | AND Gate (4 inputs) | logic | A, B, C, D, Y | 转换器尚未适配 | - |
| battery | Battery | source | +, - | 转换器尚未适配 | - |
| buffer | Buffer | logic | A, Y | 转换器尚未适配 | - |
| capacitor | Capacitor | passive | 1, 2 | 可直接映射 | c, m |
| closed-switch | Closed Switch | switch | 1, 2 | 转换器尚未适配 | - |
| comparator | Comparator | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| comparator-inputs-swapped | Comparator (swapped inputs) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| comparator-unmarked | Comparator (unmarked) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| comparator-unmarked-inputs-swapped | Comparator (unmarked) (swapped inputs) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| current-source | Independent Current Source | source | +, - | 可直接映射 | dc |
| vccs | Voltage-Controlled Current Source | source | +, - | 转换器尚未适配 | - |
| cccs | Current-Controlled Current Source | source | +, - | 转换器尚未适配 | - |
| d-flip-flop | D Flip-Flop | logic | D, CK, Q, QBAR | 转换器尚未适配 | - |
| d-flip-flop-reset | D Flip-Flop (Reset) | logic | D, CK, RST, Q, QBAR | 转换器尚未适配 | - |
| d-flip-flop-q | D Flip-Flop (Q) | logic | D, CK, Q | 转换器尚未适配 | - |
| delay-cell | Delay Cell | logic | A, Y | 转换器尚未适配 | - |
| adder | Adder | signal-flow | A, B, Y | 转换器尚未适配 | - |
| multiplier | Multiplier | signal-flow | A, B, Y | 转换器尚未适配 | - |
| transconductance | Transconductance (gₘ) | analog-block | A, Y | 转换器尚未适配 | - |
| differential-transconductance | Differential Transconductance (gₘ) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| differential-transconductance-inputs-swapped | Differential Transconductance (gₘ) (swapped inputs) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| integrator | Integrator (1/s) | signal-flow | A, Y | 转换器尚未适配 | - |
| unit-delay | Unit Delay (z⁻¹) | signal-flow | A, Y | 转换器尚未适配 | - |
| discrete-time-integrator | Discrete-Time Integrator (z⁻¹/(1−z⁻¹)) | signal-flow | A, Y | 转换器尚未适配 | - |
| quantizer | Quantizer | signal-flow | A, Y | 转换器尚未适配 | - |
| diode | Diode | passive | A, K | 转换器尚未适配 | - |
| externally-controlled-switch | Externally Controlled Switch | switch | P, N, CTRL | 转换器尚未适配 | - |
| ground | Ground | power | 0 | 可直接映射 | - |
| ideal-switch | Ideal Switch | switch | 1, 2 | 转换器尚未适配 | - |
| inductor | Large Inductor | passive | 1, 2 | 转换器尚未适配 | - |
| inductor-compact | Inductor | passive | 1, 2 | 转换器尚未适配 | - |
| tcoil | T-Coil | passive | 1, 2, 3 | 转换器尚未适配 | - |
| xfmr | XFMR | passive | P-, P+, S-, S+ | 转换器尚未适配 | - |
| inverter | Inverter | logic | A, Y | 转换器尚未适配 | - |
| nand-gate | NAND Gate | logic | A, B, Y | 转换器尚未适配 | - |
| nand-gate-3 | NAND Gate (3 inputs) | logic | A, B, C, Y | 转换器尚未适配 | - |
| nand-gate-4 | NAND Gate (4 inputs) | logic | A, B, C, D, Y | 转换器尚未适配 | - |
| nmos | NMOS | transistor | D, G, S, B | 可直接映射 | w, l, m, nf |
| nor-gate | NOR Gate | logic | A, B, Y | 转换器尚未适配 | - |
| nor-gate-3 | NOR Gate (3 inputs) | logic | A, B, C, Y | 转换器尚未适配 | - |
| nor-gate-4 | NOR Gate (4 inputs) | logic | A, B, C, D, Y | 转换器尚未适配 | - |
| npn | NPN Bipolar Transistor | transistor | C, B, E | 可直接映射 | - |
| opamp | Operational Amplifier | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-wide | Op Amp Wide | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-lettered | Operational Amplifier (lettered) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-wide-lettered | Op Amp Wide (lettered) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-lettered-inputs-swapped | Operational Amplifier (lettered) (swapped inputs) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-wide-lettered-inputs-swapped | Op Amp Wide (lettered) (swapped inputs) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-inputs-swapped | Operational Amplifier (swapped inputs) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-wide-inputs-swapped | Op Amp Wide (swapped inputs) | analog-block | IN+, IN-, OUT | 转换器尚未适配 | - |
| opamp-differential | Differential Op Amp | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide | FD Amp Wide | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-lettered | Differential Op Amp (lettered) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide-lettered | FD Amp Wide (lettered) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-lettered-inputs-swapped | Differential Op Amp (lettered) (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide-lettered-inputs-swapped | FD Amp Wide (lettered) (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-inputs-swapped | Differential Op Amp (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide-inputs-swapped | FD Amp Wide (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-crossed | Differential Op Amp (crossed outputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide-crossed | FD Amp Wide (crossed outputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-crossed-lettered | Differential Op Amp (crossed outputs, lettered) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide-crossed-lettered | FD Amp Wide (crossed outputs, lettered) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-crossed-lettered-inputs-swapped | Differential Op Amp (crossed outputs, lettered) (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide-crossed-lettered-inputs-swapped | FD Amp Wide (crossed outputs, lettered) (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-crossed-inputs-swapped | Differential Op Amp (crossed outputs) (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| opamp-differential-wide-crossed-inputs-swapped | FD Amp Wide (crossed outputs) (swapped inputs) | analog-block | IN+, IN-, OUT+, OUT- | 转换器尚未适配 | - |
| or-gate | OR Gate | logic | A, B, Y | 转换器尚未适配 | - |
| or-gate-3 | OR Gate (3 inputs) | logic | A, B, C, Y | 转换器尚未适配 | - |
| or-gate-4 | OR Gate (4 inputs) | logic | A, B, C, D, Y | 转换器尚未适配 | - |
| pmos | PMOS | transistor | D, G, S, B | 可直接映射 | w, l, m, nf |
| pnp | PNP Bipolar Transistor | transistor | C, B, E | 可直接映射 | - |
| port | Port | interface | P | 可直接映射 | - |
| port-filled | Bias Voltage Port | interface | P | 转换器尚未适配 | - |
| resistor | Resistor | passive | 1, 2 | 可直接映射 | r, m |
| simple-spdt-switch | Simple SPDT Switch | switch | COM, A, B | 转换器尚未适配 | - |
| simple-switch | Simple Switch | switch | 1, 2 | 转换器尚未适配 | - |
| spdt-switch | SPDT Switch | switch | COM, A, B | 转换器尚未适配 | - |
| variable-capacitor | Variable Capacitor | passive | P1, P2 | 转换器尚未适配 | - |
| variable-inductor | Variable Inductor | passive | P1, P2 | 转换器尚未适配 | - |
| variable-resistor | Variable Resistor | passive | P1, P2 | 转换器尚未适配 | - |
| vdd-port | VDD Power Port | power | P | 仅自动电源/地标记 | - |
| voltage-amplifier | Voltage Amplifier | analog-block | IN, OUT | 转换器尚未适配 | - |
| voltage-amplifier-lettered | Voltage Amplifier (lettered) | analog-block | IN, OUT | 转换器尚未适配 | - |
| pulse-voltage-source | Pulse Voltage Source | source | +, - | 可直接映射 | - |
| voltage-controlled-switch | Voltage-Controlled Switch | switch | P, N, CP, CN | 可直接映射 | - |
| voltage-source | Independent Voltage Source | source | +, - | 可直接映射 | dc |
| vcvs | Voltage-Controlled Voltage Source | source | +, - | 转换器尚未适配 | - |
| ccvs | Current-Controlled Voltage Source | source | +, - | 转换器尚未适配 | - |
| xnor-gate | XNOR Gate | logic | A, B, Y | 转换器尚未适配 | - |
| xnor-gate-3 | XNOR Gate (3 inputs) | logic | A, B, C, Y | 转换器尚未适配 | - |
| xnor-gate-4 | XNOR Gate (4 inputs) | logic | A, B, C, D, Y | 转换器尚未适配 | - |
| xor-gate | XOR Gate | logic | A, B, Y | 转换器尚未适配 | - |
| xor-gate-3 | XOR Gate (3 inputs) | logic | A, B, C, Y | 转换器尚未适配 | - |
| xor-gate-4 | XOR Gate (4 inputs) | logic | A, B, C, D, Y | 转换器尚未适配 | - |
| zener-diode | Zener Diode | passive | A, K | 转换器尚未适配 | - |
| adc | Analog-to-Digital Converter | analog-block | IN, OUT | 转换器尚未适配 | - |
| dac | Digital-to-Analog Converter | analog-block | IN, OUT | 转换器尚未适配 | - |
| depletion-nmos | Depletion NMOS | Extended Devices | D, G, S, B | 转换器尚未适配 | - |
| depletion-pmos | Depletion PMOS | Extended Devices | D, G, S, B | 转换器尚未适配 | - |
| ndmos | N-channel DMOS | Extended Devices | D, G, S, B | 转换器尚未适配 | - |
| pdmos | P-channel DMOS | Extended Devices | D, G, S, B | 转换器尚未适配 | - |

## 连接语义元素

- junction-dot：连接语义元素，不是器件映射目标。
