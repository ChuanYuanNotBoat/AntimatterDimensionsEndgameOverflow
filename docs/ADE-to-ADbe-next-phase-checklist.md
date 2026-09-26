# ADE → ADbe 下一阶段执行清单

目标：用最小、可丢弃的 PoC 验证真实存档可在候选架构中安全完成 `decode → migrate → load → tick → export → reload`，不实施大规模迁移。

固定输入：

- ADE 行为真源：`ab358cf39a766e8c4c0e8b8fc44a95f185d82a41`
- ADE 对照基线：`b7d4bfd2fbd66a3c4f8b73a6a9a7f79536165745`
- ADbe 候选：`14fcf1156011a36240e23c712dcf1e54fa01782f`

## Gate 0：先做产品决定

- [ ] 明确 `d975ac75` 中被动 TP 的 `false &&` 是临时诊断还是正式行为。
- [ ] 明确“迁到 ADbe”的最低要求：只要 BE 2.1.3/数值安全，还是必须包含 Vite、Vue 2.7、i18n 与 ADbe Git ancestry。
- [ ] 明确必须支持的旧存档范围：仅当前 late-game save，还是全部 ADE v100–106。

## Gate 1：可复现与只读导入

- [ ] 为 SHA、依赖版本和 fixture 哈希建立 manifest。
- [ ] 新建独立 localStorage key；禁止覆盖 ADE key。
- [ ] 解码器识别 vanilla、ADbe、ADE 三种前缀。
- [ ] 添加 `sourceFormat` 和独立 `migrationSchemaVersion`。
- [ ] inspect 模式禁用 autosave、backup、offline 和 intervals。

验收：当前 golden save 可只读解码；未知格式明确失败；原 save 哈希不变。

## Gate 2：schema 与数值契约

- [ ] 建立 player 字段类型清单：Decimal / finite Number / safe integer / Set / Array / sentinel。
- [ ] 显式合并 BE83 和 ADE100–106 的迁移语义，禁止按数字大小跳过。
- [ ] 迁移函数幂等；运行两次输出相同。
- [ ] 未知 ADE 字段暂时保留，不由 deep merge 删除。
- [ ] 所有写入点在赋值前验证 NaN、Infinity、整数安全和允许的饱和边界。

验收：迁移后的 schema 全部通过类型与不变量检查。

## Gate 3：最小 runtime PoC

- [ ] load，不保存。
- [ ] 运行 1 tick、20 ticks、250 ticks。
- [ ] 测试 `diff=0`、正常 diff、长 offline diff。
- [ ] 若存档 ready，运行一次 autoReality；否则明确返回 not-ready。
- [ ] export 到新格式并 reload。
- [ ] 比较语义投影：货币、解锁、购买计数、记录、glyph、Endgame/Celestial 状态。

验收：无未捕获异常、无 NaN/意外 Infinity、无安全整数越界、旧存档和旧 key 不变。

## Gate 4：决定迁移路线

- [ ] 若 Gate 1–3 可在本地 Fork 上完成，采用“本地 Fork 宿主 + ADbe 供体”。
- [ ] 若必须 ADbe ancestry，冻结 refactor SHA，按本地 HEAD 垂直功能切片迁移；不要先搬 ADE 上游再重放用户提交。
- [ ] 把 Vite/Vue/i18n 与数值迁移拆成独立里程碑。

## Gate 5：功能切片顺序

1. Currency、player setter、`finite-decimal`。
2. `gameLoop`、offline simulation、IP/EP/TP。
3. AD/ID/TD/CD/DD 与 Tickspeed。
4. Ra、Laitela、Pelle、Alpha、Endgame。
5. Machines、hybrid rebuyables、autobuyers。
6. Glyph、Replicanti、Singularity。
7. format/notations。
8. multiplier breakdown 与 Statistics UI。
9. build、Steam/cloud、部署。

每个切片的退出条件：单元测试全绿、对应 golden save 流程全绿、没有新增无说明的 `.toNumber()` 或 Decimal→`Math.*` 收窄。

## 已有基线

- [x] 原 ADE 工作树已快照并保持干净。
- [x] 远端 heads 与 SHA 已实时核实。
- [x] 本地差异规模与模块已分类。
- [x] ADbe 全量 `src` 已做静态扫描。
- [x] ADE save 前缀解码 PoC 已通过。
- [x] 本地补丁对 ADbe 的纯 apply-check 已完成：31/97 文件可直接应用。
- [x] 本地隔离测试 280/280 通过。
