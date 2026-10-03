# 首批本地化术语与来源

首批参考现有中文项目的常用术语，消息结构和玩法语义以本 fork 当前英文源码为准。未确认的译名可以先省略中文 key，运行时回退到英文。不要为填满语言包而改变原句的条件、数值或机制。

| 英文 | 中文 | 约定 |
| --- | --- | --- |
| Antimatter / Matter | 反物质 / 物质 | 两种宇宙状态分别处理，不将全部维度写死为反物质 |
| Infinity / Eternity / Reality | 无限 / 永恒 / 现实 | 区分重置层级、资源、次数与运行状态 |
| Multiplier / Power | 倍数加成 / 指数加成 | 公式决定语义；不能混为同一种加成 |
| Teresa | 特蕾莎 | 界面译名；内部 `teresa` 不变 |
| Time Dilation | 时间膨胀 | 对应原版既有术语 |
| Notation / Large Notation | 记数法 / 大数记数法 | 实例 `.name` 仍是旧存档使用的规范英文名称 |
| Classic / Modern | 经典 / 现代 | 界面模式 |
| Real time / Game time | 现实时间 / 游戏时间 | 保留模拟与现实经过时间的区别 |
| The Ethereal | 缥缈 | 后续领域迁移沿用 ADEChinese 的显示译名，规范 key 为 `ethereal` |
| Divinity / Resurgence | 神性 / 复苏 | 后续领域迁移参考 ADEChinese；不改动相关对象键 |
| Slabdrill | Slabdrill | 当前参考项目也保留英文，暂不自造译名 |
| Tangible / Transient Universe | 暂回退英文 | 参考项目中新内容未全部汉化，后续语义确认后补齐 |

记数法的 22 个普通标签和 9 个大数标签参考 ADEChinese，例如科学、混合科学、对数、扩展科学计数法、指数塔计数法。英文标签从本 fork 实际使用的 Notation 实例读取后记录，保持现有大小写；中文只改变 `displayName`。

来源固定为：

- [mushduck/ADEChinese exp](https://github.com/mushduck/ADEChinese/tree/27fc05ba8c57aa1f476b3bc156b7895ad0568943)：GameSpeedDisplay、OptionsVisualTab、notations、infinity-upgrades、tabs、Slabdrill 显示名。
- [aquamarine309/ADChinese](https://github.com/aquamarine309/ADChinese/tree/4a05364c8f12e3484f6cc003e1d2ff874f66bfe8)：Infinity 升级中的“游玩时间”“倍数加成”“特蕾莎”“指数加成”等术语。

以上作为术语与短文案参考。带有旧版本条件或缺失新状态的翻译，必须重新对照当前源码，例如诅咒状态和物质维度分支。
