# Batch A/B i18n 领域验收（2026-10-06）

PR #7 已于 2026-10-04 合并。本轮从其合并提交 `856114ead4bc5e8cde465be3991280295b0526fa` 创建独立分支 `fix/i18n-domain-validation-ab`，base 为 `feat/restore-multiplier-breakdown`。没有追加到 PR #7，也没有修改 Pages 或合并分支。

本轮验收范围：Dimensions / Infinity / 直接相关 Autobuyers，两套 UI；ADE Endgame / Universes / Slabdrill 的主要页面和列明条件分支。其他 Celestials、结局和低频弹窗保留审核队列。完整逐项分类、定位、原英文/现中文及审核理由见 [机器可读台账](i18n-domain-validation-ab.json)。候选不等于 bug，关闭的是上述验收矩阵，而非宣称整个游戏已无文本问题。

## ADEC 翻译同步

对照 `2deeebc` → `b27d115bdd879b33673ab90963328074693bfa52`（15 个提交、31 个变化文件）；2026-10-06 再次确认该提交仍为 ADEC main 最新。只映射本轮领域的译文/术语，没有 merge/cherry-pick 或复制程序代码。

- 映射 20 个 key：16 个相对 PR #7 新的消息/完整词条，4 个既有中文缺项；另外修正 2 个既有薇扩展包上下文译文。
- 真际宇宙、超质量体、星流增幅体、湮灰之星，以及真际进入/退出/奖励、产量说明、AD9 宇宙极限提示。莱特拉扩展包按我们现有英文条件和参数顺序做完整段落映射。
- 保留本项目质量更好的 Collider 4/5、Slabdrill Core 进入/退出、流幻削弱参数译文。ADEC Collider 5 仍夹英文，不能自动覆盖。
- 未可靠映射的 6 类：Stelliferous Universe、Matter Universe、Celestial Dilated Time、Celestial Tachyon Particle、Null Particle，以及三种 Accelerator 名称。ADEC 后者也仍为英文；没有猜译或拆开多词资源名。
- ADEC 其他领域修订不在本轮导入范围；31 个文件不当作 31 条译文或“跳过条目”计数。删除/旧版片段不作无上下文的全局删除。
- 显式缺项从 8 降到 4：补齐 `analysis.state.infinityDisabled`、`navigation.universes.tangible`、`terms.molecularMass`、`terms.stellarAugmenter`。本轮新增的 `terms.tangibleUniverse` 同时已有完整中文。

## 基线候选分类及领域状态

158 项基线候选全部逐项分类：45 个已确认并修复的**候选位置**、22 个 intentional English、55 个 false positive、20 个 needs translation、16 个 needs contextual mapping。45 不是独立根因数，也不包含浏览器另行发现的尾巴和布局问题。20 项待译中 12 个位置已由本轮 ADEC 同步填补；原队列剩 24 项 P2。

| 审核桶 | 确认/已修复位置 | ADEC 补齐位置 | 保留英文 | 误报 | 原队列 P2 后延 | 状态 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Dimensions | 11 | 0 | 1 | 10 | 0 | 主要矩阵 validated / closed |
| Infinity | 10 | 1 | 2 | 10 | 0 | 主要矩阵 validated / closed |
| Autobuyers / Hotkeys | 4 | 0 | 12 | 2 | 0 | 主要矩阵 validated / closed |
| ADE Endgame / Universes | 19 | 11 | 3 | 23 | 7 | 主要矩阵 validated / closed |
| Slabdrill + Celestials 审核桶 | 1 | 0 | 4 | 10 | 17 | Slabdrill 主要矩阵 closed；其他 Celestials 留 Batch D |

Dimensions/Infinity 原 10 个 mixed 候选均已分类；其中错误已修复，保留 Shift、AD tier 和正式数学标识。Infinity 的 1 个 fallback 已补齐。B 原 18 个 mixed 候选均已分类；其 4 个原 fallback 中，真际导航补齐，其余 3 个完整资源词条仍后延。后来发现的 Null Particle 缺项与其消费者单独记录，不把消费者重复当成另一条缺译。

## 修复的共同根因

1. 句子分片与资源边界：两套无限/神性维度目标、锁定价格、买十/献祭组合、星系重置列表、购买次数、献祭禁用原因与被动 IP 说明缺少完整匹配，导致 English 尾巴或错误资源。局部补完整消息，保留原 formatter 和条件。
2. 上下文/语义：充能提示反向、终局购买权限、Shift 条件锁定、ANR/Void、宇宙物质目标、压缩退出与确认文字，以及薇扩展包“解锁”误写为“完成”。逐项修正条件与参数含义。Slabdrill 复制间隔和混沌核心概率明确使用“乘以”，不再误写成“提高至”。
3. 扩展包先按换行拆分，整段 ADEC 译文无法匹配。现在先翻译完整 canonical description，再分行；CSS 小字判断继续读取 canonical 英文行数，购买/配置 ID 不变。莱特拉段落手动对齐 7 个参数及重复 tier。
4. 短参数模板被现有匹配器保护规则合理拒绝。压缩升级“下一效果”和终局被动生成间隔在各自 UI 入口适配，用现有 `$t`，不削弱 matcher 或修改 core。
5. 完整资源遗漏：Endgame、Gray Stars、Perk Points、总强子、维度等被旧通用 capture 拆开。资源词条与完整领域句子集中在语言包，不复制资源译名到组件。
6. 实际渲染发现 Galactic Power 4 个百分比回调用 Number formatter 接收 Decimal，导致 locale-independent 异常。改用已有 Decimal formatter；effect 公式、购买和存档不动，实际回调新增 Decimal 1.25 / 12 回归。
7. 中文生产速率在移动端换行，固定维度行高造成重叠。行高改为内容驱动，保留原最小高度；真实 DOM 几何断言验证两套 UI，无稳定 CSS ID 改动。

没有确认新的 gameplay/name/ID 耦合；不作全仓 `.name` 重命名。i18n service、TextRef、locale loader、fallback、基本语言包格式、核心 API 均未改动，也未新增 ADE → generic i18n core 反向依赖。

## 当前静态审核队列

以下仍是 warning/candidate，非未修复 P1 总数。named/scoped slots 之前未被静态遍历；补上现有 visitor 后，全局硬编码候选从 294 增至 391。重复译文也会随局部稳定 key 增加；没有隐藏候选或添加计数清零例外。

| 领域 | Mixed 候选 | Fallback finding | Hardcoded 候选 | Dynamic key | 重复组 |
| --- | ---: | ---: | ---: | ---: | ---: |
| news-quotes-ending | 17 | 0 | 3 | 0 | 1 |
| ade2-progression | 16 | 2 | 16 | 0 | 20 |
| automator | 2 | 0 | 29 | 2 | 3 |
| eternity | 4 | 0 | 23 | 0 | 11 |
| shared | 32 | 1 | 127 | 8 | 17 |
| celestials | 5 | 2 | 24 | 1 | 20 |
| glyphs | 134 | 0 | 16 | 0 | 4 |
| pelle | 30 | 0 | 18 | 0 | 2 |
| options-save | 14 | 0 | 18 | 2 | 3 |
| automation | 6 | 0 | 8 | 0 | 2 |
| reality | 18 | 0 | 13 | 0 | 6 |
| dimensions | 4 | 0 | 0 | 6 | 5 |
| breakdown-statistics | 0 | 0 | 96 | 0 | 9 |
| infinity | 5 | 0 | 0 | 0 | 12 |
| h2p | 4 | 0 | 0 | 0 | 1 |

4 个显式 English fallback：`terms.celestialDilatedTime`、`terms.celestialTachyonParticle`、`terms.matterUniverse`、`terms.nullParticle`。静态 fallback finding 为 5，是 Null Particle 的消费者也被记录。

当前五个审核桶里，其他 Celestial 段落、低频结局/确认弹窗、预设菜单及加速器 tooltip 仍为 P2 待译/待上下文审核；机器台账逐项保留来源。Accelerator 名称和 Stelliferous 尚无可靠本轮映射。以上不扩大到 Batch C/D/E。

分类比例：原基线 hardcoded 68/294 = 23.1%，dynamic 6/18 = 33.3%，duplicate groups 44/96 = 45.8%。更新后的五桶分类为 hardcoded 48/391 = 12.3%，dynamic 7/19 = 36.8%，duplicate 59/116 = 50.9%；分母因 named-slot 扫描与新增消息改变，两套比例不可直接作质量下降/上升指标。

## 回归与实际运行

- 69 项 i18n 回归、39 项既有稳定性测试、strict static audit、catalog 参数/ICU/key 检查和 master build 全部通过。未新增项目依赖。
- 使用 **1 份既有真实后期存档**，完成 **13 组** en/zh-CN 玩法场景；每组比较完整 serialized player 和操作结果，**不忽略 player 字段**。语言切换本身也不得改变保存状态。测试时钟/随机流在 finally 恢复；只暂停计时调度，未 stub 掉购买、生产、重置或 Automator 真实逻辑。
- 沿用原 10 组压缩、宇宙、激能、Core、星体、强子、充能预算、存档/ticks、维度/复制器、Automator 场景；增加维度自动购买器 canonical 名称/模式、真际进入/生产/奖励/退出、Slabdrill 阶段/稳定 unlock ID。
- **618 次 UI 渲染 = 150 个实际 tab/layout/locale 渲染 + 468 个针对性 DOM 检查**；两套 UI、反复 locale roundtrip、EC9/物质 universe、0/非0退出奖励、Collider 两种模式/两种资源、11个 Slabdrill unlock、9 个 tier、9 个扩展包、真际三种按钮状态均覆盖。
- 针对性 fixture 使用真实组件，部分显示值设为可读数字以覆盖条件分支；不代表所有游戏阶段的 gameplay 验收。
- **12 次移动端检查**通过；维度文本没有越过本行边界，已人工查看中文 Modern Infinity / Classic Collider / 更新后维度截图。额外 CJK 字体仅用于隔离 QA 环境，未加入应用依赖。
- 194 个 runtime audit 批次，collector dropped = 0；parameter / TextRef / catalog / missing-base-key / stale-locale-cache / browser errors = 0。English fallback/mixed warnings 保留，且上下文重复出现会被各批次分别计数，不能与静态唯一 key 数混算。
- **验收覆盖内，未解决的确认 P0 = 0，确认 P1 = 0**。没有把尚未领域验收的候选算作确认 bug，也不把该结论外推到全部游戏。

可用既有 Playwright/Chromium 复跑：

```sh
ADE_TEST_DOMAIN_BATCH=AB \
ADE_TEST_SAVE=/path/to/private-export.txt \
ADE_TEST_URL="http://127.0.0.1:40765/?inspectSave=1" \
ADE_TEST_REPORT=/tmp/ade-ab-report.json npm run test:browser
```

完整私有导出、含玩家文本的 browser report 和截图不提交；本报告只保存归类与必要汇总。

## Audit 误报及边界

重复 EN/zh 消息但稳定 key 不同；Shift/Alt/CTRL、ANR/CIP/AD tier、log/Roman numeral、正式 Slabdrill 名称、GWh/C 和 Collider 公式标识均可产生 mixed 候选。`{value}` 是调用者替换的中间模板，不是最终英文；有限 tier/scaling/unlock 动态 key 不是 missing。本轮仅在台账分类，不添加白名单隐藏这些结果。
唯一 audit 改动是现有 Vue AST visitor 遍历 named/scoped slots，并附对应回归。它直接服务本轮实际漏扫入口，不增加 framework。
Audit 仍不能证明跨模块任意字符串流、所有旧存档 migration、所有未解锁条件和缓存都正确。新加入的 mobile geometry 只覆盖本轮维度路径；通用 audit 尚不会检测所有布局重叠。ADEC 可用性须人工对齐源语义，不能仅靠 English text 相等判断。

## 后续顺序

Batch C 已具备开始条件，但本 PR 停在 A/B，避免无限扩域。下一轮先抽样归类 Glyph 的 134 个 mixed 候选，再做 Reality / Glyphs 条件显示与 Automator template/block/preset 一致性，canonical syntax 保持英文。随后 Batch D（Pelle / Celestials / Eternity），最后 Batch E（Breakdown / Statistics、H2P、News / Quotes / Ending）。

复用本台账和测试入口，不新增基础架构，不为 AD:I18N 抽离性搬文件。未来可改进单位/中间模板的审核展示；没有必要为了候选数而扩大核心规则。
