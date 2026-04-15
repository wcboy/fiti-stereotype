# FiTI 人格模式逻辑审查 · Handoff 提示词

## 任务目标

逐个审查 `data/types.json` 中 16 个标准人格的 `pattern`（12维 L/M/H 向量），判断每个维度赋值是否与该人格的**刻板印象描述（desc/roast/intro）**自洽。不自洽的请给出修改建议并直接修正。

## 项目背景

这是一个金融人刻板印象人格测试（FiTI），用户答 30 道题后系统算出 12 个维度的 L/M/H 等级，然后与 16 个人格模板做曼哈顿距离匹配，选出最相似的人格。

**核心文件：**
- `data/types.json` — 16 个标准人格 + 3 个特殊人格，每个有 `pattern` 字段
- `data/dimensions.json` — 12 维度定义及 L/M/H 各等级的含义
- `data/questions.json` — 30 道题，每道测 2 个维度
- `src/engine.js` — 评分引擎（calcDimensionScores → scoresToLevels → matchType → determineResult）

## 12 维度顺序（pattern 中按此顺序排列）

```
位置 1:  FOCUS     专注力      L=易分心  M=看环境  H=深度心流
位置 2:  MEMORY    记忆力      L=记完忘  M=正常    H=过目不忘
位置 3:  LEARN     学习力      L=固守旧  M=能改进  H=举一反三
位置 4:  STRATEGY  策略思维    L=走一步  M=看2-3步 H=深谋远虑
位置 5:  RISK      风险偏好    L=极度保守 M=平衡   H=敢赌敢拼
位置 6:  DECISION  决策风格    L=犹豫纠结 M=适度   H=果断直觉
位置 7:  EXECUTE   执行模式    L=拖延症  M=稳定    H=执行机器
位置 8:  PATIENCE  耐心程度    L=急躁    M=有上限  H=延迟满足
位置 9:  SOCIAL    社交能量    L=内向耗电 M=看情况  H=社交充电
位置10:  EMOTION   情绪感知    L=迟钝    M=不精准  H=读心术
位置11:  CONFLICT  冲突风格    L=回避    M=该刚刚  H=主动出击
位置12:  BOUNDARY  边界意识    L=不懂拒绝 M=灵活   H=越界必反
```

## 当前 16 个人格的 pattern

```
代号          pattern                         中文名
POSER        H-H-H-H-H-H-H-H-M-H-H-H        金融精英表演者
SNOOP        M-M-M-M-H-M-M-M-H-H-H-H        草根解构师
CRAM         H-H-M-M-H-H-M-H-L-M-M-M        证书收割机
NEPOT        L-M-M-M-H-H-H-H-H-H-H-H        关系户收割者
TOXIC        H-M-M-H-H-H-M-H-H-H-M-M        面试PUA大师
GRINDER      H-H-H-H-L-H-H-H-L-L-M-L        加班战神
QUANT        H-M-H-H-M-H-H-M-M-M-H-M        金融思维入侵者
BEAN         H-H-M-H-H-M-M-H-L-M-L-L        财务背锅侠
BUTTERFLY    L-L-M-M-H-H-H-H-H-H-H-H        社交收割机
HOPPER       M-M-H-H-M-H-H-M-M-M-M-H        跳槽套利者
FLEX         M-M-M-H-H-H-H-H-H-M-H-H        炫富表演艺术家
SLACKER      L-L-L-L-L-L-L-L-H-H-H-L        躺平哲学家
FOMO         H-H-M-H-H-H-H-H-M-M-M-H        焦虑加速器
PUFFER       M-M-M-M-H-H-M-H-M-M-H-M        简历整容师
ROO          M-M-M-H-M-M-M-M-M-H-M-M        海归水学历代言人
SNEAK        M-H-M-M-M-H-M-H-H-M-H-M        职场老六
```

## 审查方法

对每个人格，请：

1. **阅读该人格的 `desc`、`roast`、`intro`、`title`**（在 types.json 中）
2. **对照 12 维度定义**（在 dimensions.json 中）
3. **逐个维度判断**：该刻板印象的人，这个维度应该是 L/M/H 中的哪一个？
4. **与当前 pattern 对比**，标记不自洽的维度
5. **提出修正建议**

### 判断原则

- 以**刻板印象**为准，不是"理想状态"。例如「关系户」学习力可能不高（因为不需要学），不是说他真的笨。
- 注意区分**表面行为 vs 底层特质**。例如「炫富」FLEX 不等于高风险偏好（可能是用消费来掩饰不安全感）。
- 允许 M 的存在。不是每个维度都要极端。16 个人格之间应该有**差异化**，避免多个几乎相同的 pattern。
- **检查差异化**：如果两个不同人格的 pattern 只有 1-2 个维度不同，考虑是否需要拉开差距。

### 特别关注

- POSER 全 H 只有 SOCIAL 为 M —— 是否过于"完美"？精英表演者的本质是"装"，底层是否真的全 H？
- SLACKER 除了 SOCIAL/EMOTION/CONFLICT 为 H 外全 L —— 一个躺平的人社交/情绪感知/冲突承受真的高吗？
- NEPOT 和 BUTTERFLY 后半段都是 H-H-H-H-H —— 关系户和社交达人是否过于相似？
- BEAN 边界意识 L-L（BOUNDARY=L）—— 合理（不会拒绝领导），但 CONFLICT 也是 L，这是否合理？
- CRAM 最后的 BOUNDARY=M —— 考证狂对"拒绝"的能力如何？考证本身是一种"不拒绝"考试压力的表现吗？

## 输出格式

请输出一个表格：

```
| 代号 | 维度 | 当前 | 建议 | 理由 |
|------|------|------|------|------|
| POSER | SOCIAL | M | ... | ... |
```

只列出自洽的（不用列全部 16×12=192 个），列出所有有疑问的维度，以及最终修改后的完整 pattern 列表。

修改后请直接更新 `data/types.json` 文件并验证 JSON 合法性。
