# 2.0 分析页完整审查与修复记录

审查日期：2026-10-01。对照 2.0 引入前的 `942003ece^1`、上游 Chapter 3 的 `0a79a582c` 和当前工作区，逐项检查实际公式、倍率页数据源、来源树、状态显示及提前返回分支。本记录只评价当前仓库中已经实现的机制。

结论：原分析页缺少的内容主要集中在 Slabdrill、Compression、Universes 和新充能效果。有些会导致最终数值与实际游戏不一致，有些数值已经通过实际 getter 纳入，但页面无法解释状态变化。本次补齐了现有资源页的这些数值步骤和状态说明；新的资源体系仍有独立分析页缺口，列在后文。

## 1. 现有资源页原先遗漏、现已补齐的计算

以下步骤按游戏实际执行位置加入。倍率、幂、公式覆盖、软上限分别显示；后续上限仍会影响最终贡献，不能将单步百分比相加当作最终值。

| 页面 | 原先缺失或错误 | 本次处理 |
| --- | --- | --- |
| AD | Slabdrill 以 `log10(AM + 1) × 1666` 削弱共同倍率 | 加入独立除数来源 |
| AD | 诅咒下已完成 NC1–9，每个提供 ×6.66 | 加入完成挑战奖励来源 |
| AD | Slab Power 的 AD 倍率和 Infinity 阶段 AD 幂 | 在实际位置分别显示 |
| AD | 诅咒下 Sacrifice、未升阶 TS214 改为作用于 AD1 | 修正维度条件；Sacrifice 在该状态下不被原来的升阶条件排除 |
| AD | 诅咒下 IC8 奖励由部分维度倍率改为幂 | 修正来源类型与作用范围 |
| AD | 诅咒下 IC4 即使是当前购买维度仍削弱 | 修正触发条件 |
| AD | 诅咒下 NC10 的 ^0.75、NC12 的 `^(0.5 + chall2Pow / 2)` | 加入独立幂步骤 |
| AD | Slabdrill EC3 阶段 ^0.5、EC10 阶段 ^0.75 | 加入两个独立阶段步骤 |
| AD | 充能 NC2、偶数维度 NC12、AD1 的 NC3 dilation | 按实际顺序加入 |
| AD | Compression 的倍率压缩 | 在 Overflow 前加入，且在 TR 奖励前应用 |
| AD | 两个 TR 升级奖励在压缩外仍有效 | 无论是否正在压缩，都读取其实际有效奖励 |
| AD | Transient Universe 的 RP 相关 dilation | 在实际位置加入 |
| AD9 | 分析页、来源缓存和导航只支持 AD1–8 | 扩展为 AD1–9；处理 AD9 专属 log10、Duality 30 与诅咒时间幂；不为 AD9 计入 Tickspeed |
| ID | IC4 阶段 Slab Power 倍率 | 在购买倍率、ID1 特殊奖励之后加入 |
| ID | Slabdrill IC4、Eternity、EC10 三次 ^0.75 | 分别显示，保留连续执行顺序 |
| ID | 三个充能永恒升级和充能 NC2 | 在 Surge 后、Ethereal Stars 前加入独立幂来源 |
| ID | Compression、Transient Universe 的 RP 相关 dilation | 在两段 Overflow 前加入 |
| TD | Eternity 阶段 Slab Power 倍率 | 在共同倍率的 Null 升级之后加入 |
| TD | TS181 阶段 ^0.75 | 在 dilation 和天体削弱后加入 |
| TD | 三个充能永恒升级和充能 NC2 | 在 Surge 后、Ethereal Stars 前加入独立幂来源 |
| TD | Compression | 在两段 Overflow 前加入 |
| IP | Break Infinity 阶段 Slab Power 倍率 | 保留 Effarig Infinity 等提前返回条件，加入正常倍率分支 |
| IP | 诅咒下购买 Autobuyer Speed 奖励 ×666 | 加入独立奖励来源 |
| IP | TS181 阶段 ^0.9 | 在 Replicanti Surge 后、IP Ascension 前加入 |
| EP | TS181 阶段 Slab Power 倍率和 ^0.9 | 分别加入倍率分支和后续幂步骤 |
| EP | 诅咒下 `1e2000`、`1e2500`、`1e3000` 三段软上限 | 分别显示超额部分 ^0.25、^0.5、^0.75，连续执行；保留 Pelle 分支与 Ascension 的真实位置 |
| Infinities | 充能 NC1 | 正常与 Pelle 分支均加入，保留 EC4 的固定结果分支 |
| Infinities | Slabdrill EC10 的 /1e20 和 Slab Power 奖励 | 两个来源分别加入正常分支 |
| DT | Dilation 阶段 Slab Power 倍率和 ^0.25 | 分别加入倍率和后续幂位置 |
| DT | Ephemeral Light 的幂奖励 | 在 Replicanti Surge 后加入，显示实际原始幂 |
| DT | Transient Universe 的 `10^(log10(max(DT rate, 10))^0.1)` | 在主软上限后加入；Pelle 提前返回分支不应用 |
| Replicanti | Slab Power 外部速度奖励 | 加入独立来源 |
| Replicanti | Slabdrill EC10 恢复成就 134 的低于 cap ×2 | 修正 post-Reality 禁用状态下的例外 |
| Game speed | Compression 和宇宙的 1/1000 固定速度 | 与 EC12、Overcharge 一起处理提前返回；适用 Transient 和正偶数宇宙 |
| Game speed | Slabdrill core 的固定速度 1 | 优先处理 core 的提前返回 |
| Game speed | Ephemeral Light | 在正常非 Pelle 分支、历史最高速度与最终 clamp 之前加入 |

AD、ID、TD 的合并页与逐维度页共用这些来源，并映射到原有来源分类。新增充能永恒升级归入 Eternity Upgrades。Ethereal Stars 的来源识别同时支持 AD9。

## 2. 倍率乘积之外的状态与产量规则

这些规则不能简单伪装为一个 ×1 来源。新增状态说明显示禁产、购买限制和条件；AD1 产量说明则直接记录游戏实际计算步骤。

| 规则 | 原先问题 | 现在的显示 |
| --- | --- | --- |
| Transient Universe | TD 直接停止生产，单看 TD 倍率无法解释 | TD 页说明禁产状态 |
| Tangible Universe | ID、TD 停止生产；Singularity Milestone 效果禁用 | 对应页面说明禁产；AD、ID、TD、Game speed 说明里程碑禁用 |
| Slabdrill core | AD 的倍率与产量分支覆盖其他效果 | 显示实际覆盖，说明绕过 Tickspeed、产量幂和产量 cap |
| Slabdrill 逐步开放维度 | 高于当前开放范围的维度倍率固定为 1 | 显示目前开放的 AD 范围 |
| Slabdrill TS181 | ID1–7 基础购买上限改为 5000 | 显示实际基础上限；说明仍叠加 Tesseract，ID8 保留独立上限 |
| Replicanti interval | 外部速度倍率不等于完整复制速度 | 显示实际 interval 和每 tick chance |
| Slabdrill Replicanti | interval ×1000、chance 每次仅 +0.1 个百分点 | 显示规则；使用 Decimal 百分比格式 |
| Replicanti 超过 cap | interval 的递增倍率随状态改变，包括 Slabdrill 的 2 | 显示当前实际 scaleFactor 与数量级间隔 |
| Slabdrill galaxies | galaxy strength 减半后再应用 Slab Power | 补充状态说明；实际 Tickspeed 公式已读取完整 getter |
| Slabdrill TS223 / TS224 / EC5 | 从数量、延迟等奖励切换为 galaxy strength 修正 | 补充条件说明，实际值由原有 galaxy 公式纳入 |
| Slabdrill TS181 galaxies | AG、购买的 RG、TG 超过 100 的部分按 1/10 计数 | 显示适用范围，避免误读为所有 galaxy 来源都减至 1/10 |
| Slabdrill EC10 Free Tickspeed | softcap 起点 /10，cap 后成本系数 ×100 | 显示实际 softcap 和规则 |
| 充能 NC5 / NC6 / NC9 | galaxy strength、Continuum 购买数变化藏在 getter 内 | 补充条件说明；实际 count / strength 仍使用游戏 getter |
| Active Dilation 与 Slabdrill | Slab Power 倍率与幂奖励中性化，但阶段削弱继续生效 | 明确显示两者的不同条件 |
| C Hadron AM equalizer | 原先隐藏在 AD1 原始产量中 | 分离原始 amount × multiplier × Tickspeed 与 equalizer 步骤 |
| Compression AD1 | 跳过整个 AD1 产量幂、天体软上限区块 | 显示覆盖说明 |
| Overcharge Power Burst | 与前后产量变换合并，无法单独判断 | 增加独立产量步骤 |
| Transient / Tangible AD1 产量 | tetration 变换及 Molecular Mass 奖励未单列 | 分别显示实际产量变换 |
| 充能 NC12 的产量上限 | cap 标签只显示一般 challenge cap | 显示以 pre-Tickspeed 产量为上限，包含正在运行的 NC2 |
| NC2 后续产量记录 | NC3 的起始值沿用了 NC2 前 checkpoint | 修正记录位置，避免重复计入 NC2 |

现有来源仍会保留游戏最终值对照；未来公式变化造成不一致时，显示 `Untracked Formula Difference`，不会将差异默认为中性效果。

## 3. 仍缺少的独立资源分析页

这些资源当前没有导航页或完整的 ordered breakdown。它们是本次审查确认的剩余覆盖缺口，本次未新增整套资源页。

| 资源 / 体系 | 应新增的来源与状态分支 | 实际公式位置 |
| --- | --- | --- |
| TP 奖励公式 | `getBaseTP`、`tachyonGainMultiplier`、Slabdrill ^0.25、Ephemeral Light、Transient 的最终压缩，以及实际 gain 与当前 TP 的差额 | `src/core/dilation.js` |
| Hawking Radiation | 基础 AM 公式、HR 升级、成就 276、Power Burst 与 Serpent Power 的 ×10、当前已持有 HR 与增量 | `src/core/compression.js` |
| Thermal Radiation | HR 基础、TR 升级、Mastery 281/282/283、成就 276、Serpent Power ×10 | `src/core/compression.js` |
| Electromagnetic Waves | 阈值增长、阈值升级、上限以及相关升级重置规则 | `src/core/compression.js` 与游戏循环 |
| 压缩奖励的 ES 生成 | `esGenerator` 升级、生成条件及 ES 数量对各星奖励的影响 | 压缩升级数据库与游戏循环 |
| RP / Ephemeral Light / Molecular Mass / Stellar Augmenters | 各宇宙内或退出时的收益公式；RP 已在 AD/ID 削弱中显示，Light 已在 DT/Game speed 中显示，Mass 已在 AD1 产量中显示 | `src/core/universes.js` 与游戏循环 |
| Galactic Power | 实际 galaxy 基数、Mastery 291/292/293、Duality 29、充能 NC10 的幂以及 Pelle 禁产 | `src/core/galactic-power.js` |
| Celestial Dimensions / CM / CIP | Mastery 302，以及现有多段天界产量与转换机制 | `src/core/dimensions/celestial-dimension.js` 等 |
| Divine Dimensions / Divine Energy | Duality 26、Mastery 303、divinity 奖励与转换机制 | `src/core/dimensions/divine-dimension.js` 等 |
| RM / IM / Dual Machines | `entanglementSplit` 在不同公式中的倍率/幂、Dual Machines 的 `1e1000` cap | `src/core/machines.js` |
| Space Theorems | 压缩的 `stMultReplicanti` 及相关 Replicanti / Surge 来源 | `src/core/machines.js`、`src/core/replicanti.js` |
| Dark Matter / Dark Energy / Singularity | 总 Light/Dark/Exotic Hadron 替代当前数量；Serpent Power 的 Hadron 时间上限翻倍；成就 277、Power Burst、Serpent Power 对 Singularity 的幂；Tangible 禁用里程碑 | Lai'tela、Hadrons、Singularity 模块 |
| Serpentine Power / Chaos Cores | Slabdrill 自身资源的生产、cap、重置与阶段奖励 | `src/core/celestials/slabdrill.js` |

`TP_total` 原有数据表示当前 TP 对 DT 的作用，不是本次奖励公式；TP 也没有当前导航入口。因此它不能作为“TP 奖励分析已覆盖”的证据。已按用户指定的提交恢复被动 TP 奖励，未将这一请求解释为新增 TP 导航页。

## 4. 已计入，但仍合并显示的效果

这些项目的最终数值通过真实 getter 进入现有来源，不构成漏算；若要求每项升级、挑战都单独显示贡献，仍需继续细分。

- 充能 NC4 的 Dimension Boost / Surge 成本、NC6/NC9 的 Continuum、NC7 的 Buy OoM、NC8 的 Sacrifice 强化：目前表现为购买数量、Dimension Boost、Buy Ten / OoM 或 Sacrifice 来源的变化。
- Slabdrill 的 Dimension Boost、buy-ten、galaxy strength 和 galaxy count 变化：对应基础来源读取游戏实际公式；状态说明补足了触发条件。
- Stellar Augmenters 对 Gray Star 效率的奖励：现有 Ethereal Stars 来源使用实际星奖励，尚未把 augmenters 拆成独立来源。
- Slabdrill 的 Glyph level / rarity 与各状态下的 `disablePostReality`、Pelle、天体奖励可用性：按实际效果 getter 纳入；Glyph 本身不属于单独的资源倍率页。
- C Hadron 的 Tickspeed equalizer：原有 Tickspeed 页已经单列，本次保留。AM equalizer 则已从原始产量中拆出。
- Eternities：此次 2.0 公式对照没有发现该现有页需要补入同类新数值步骤。

这份清单不把解锁、购买成本、重置奖励和资源产速混成一类。充能 NC11 主要解锁 Tangible Universe，而充能 NC10 的收益目标为 Galactic Power，分别归入状态规则和缺失资源页。

## 5. 用户截图与日志对应的修复

1. **被动 TP 奖励**：`d975ac75854d79d07808fdc142cfefdaa1c356ba` 仅在 `rewardTP()` 条件前加了 `false &&`。本次移除该强制禁用，恢复 Teresa/Ra/Endgame milestone 原有条件以及 Pelle、post-Reality 禁用限制。
2. **Glyph cap 0**：实际 `getAdjustedGlyphLevel()` 已应用 cap；Tooltip 与背包标签却把 0 当成“没有覆盖等级”，继续用存档中的十亿级数值。将“未指定”改为 `null`，使用 `??` 读取等级，合法的 0 等级用于显示和效果预览。保留 Glyph 存档等级。
3. **Invalid effective Tesseract count**：C equalizer 在 bought/free 都为 0 且 C 生效时计算 `Infinity^C × 0` 得到 NaN。增加零数量分支，并以有界 Decimal 运算完成乘积，再显式返回有限 Number；极大输入也不会在中间乘法或最终转换处溢出。
4. **TS232 Decimal 隐式转换**：改为 Decimal 百分比格式。
5. **分析页 Replicanti 百分比报错**：本次新增状态说明最初误用了 Number 百分比格式，已改为 Decimal 格式，并增加回归检查。
6. **Singularity Milestone 首次 render**：初始化有效的 milestone mode 与 `isMetro`，避免首次 update 前渲染非法状态。
7. **distantStart.sub is not a function**：Slabdrill 的 galaxy scaling start 提前返回了 Number，而 bulk inverse 要求 Decimal。改为有界 Decimal 求和，保持阈值接口一致。

## 6. 验证与边界

- 138 项针对性自动检查通过：现有分析页、激活的 2.0 公式差分、AD9 来源分类、零等级 Glyph、TP 奖励条件、日志根因、诅咒银河购买与 Tesseract 边界。
- 完整应用的普通分析页浏览器检查通过，包含来源、贡献值、显示模式和页面布局。
- 使用隔离浏览器与测试存档检查 Compression、Transient、Tangible、Slabdrill 阶段、Slabdrill Dilation、Slabdrill core、Ephemeral Light、充能挑战/永恒升级、Slabdrill EP 三段软上限。检查实际公式一致性、数值有限性、来源去重、AD9 导航和状态显示。为维度设置非零购买数量，确认奖励与削弱真实生效；同时检查 EP 三段 softcap 和原始幂参数。
- 全量测试中的 48 个失败项，与将本次修改替换为 HEAD 版本的基线对照一致；现有未提交改动保留在两个对照环境中。本次没有引入新的失败项。既有失败主要涉及测试环境的旧依赖/导入处理及旧源码断言，不计为通过。
- 对比修改前后的静态检查错误，未新增错误；保留既有错误。本次没有修改正式存档，也没有提交或发布。

后续需要新增资源页时，可直接以第 3 节作为范围清单；需要更细的来源归因时，以第 4 节作为范围清单。
