# Finance Bro Type Indicator (FBTI)

基于 670 段金融调侃视频内容分析提炼的金融人刻板印象人格测试。

[English Version](./README.md)

## 项目背景

从 670 段金融梗视频里抽取到的原材料：
- 14 个高频金融梗（学历鄙视链 / 面试 PUA / 会计两千五 / 薛定谔证书 / 赛道信徒 …）
- 12 个独立人格维度（认知 / 行为 / 社交三组）
- 17 个主人格刻板印象 + 2 个彩蛋档案
- 高频刻板语言信号（中英混搭 / 赋能闭环颗粒度 / Loro Piana / 一百块钱需要多久）

把这些素材转化为一个可答题、可交易、可生成分享卡的互动测试。

## 功能速览

- **21 道情景主题目 + 1 道身份锚题 + 1 道彩蛋**
- **12 维雷达图**画出你的认知 / 行为 / 社交画像
- **数据驱动阈值**评分（题库改动自动重标定，Shannon 均匀度 ~93%）
- **K 线 + 仓位交易**：答题期间用连续滑杆（0%-100%，步长 10%）决定今日仓位，一日一次锁定，回退不改
- **真实账户 P&L** 在结果页与分享卡中结算
- **彩蛋附加段**：选到彩蛋触发时，主人格不被覆盖，而是在 File 03 插入一段隐藏身份注脚

## 技术栈

- Vite 6 + 原生 JavaScript（无框架）
- Canvas 雷达图 / K 线 / 分享卡
- Firebase Firestore 结果存档（规则见 `firestore.rules`，仅允许 create）

## 项目结构

```
finance-bro-type-indicator/
├── data/
│   ├── config.json               # 运行配置（阈值 / 彩蛋开关 / 文案）
│   ├── dimensions.json           # 12 维度定义 + H/M/L 行为解读
│   ├── questions.json            # 1 身份 + 21 主题 + 1 彩蛋
│   ├── types.json                # 17 标准 + 2 彩蛋人格档案
│   └── interpretations/          # 认知 / 行为 / 社交维度解读
├── src/
│   ├── main.js                   # 入口 + 答题流程 + 交易面板
│   ├── engine.js                 # 评分 + 阈值计算 + 匹配
│   ├── quiz.js                   # 答题状态机（answer / finalize 分离）
│   ├── portfolio.js              # 仓位账户（纯函数式，rebuild 可回放）
│   ├── validate.js               # 启动期 Schema 校验
│   ├── history.js                # 本地历史记录
│   ├── modal.js                  # 回退提示弹窗
│   ├── result.js                 # 结果页渲染
│   ├── chart.js                  # 12 维雷达图
│   ├── poster.js                 # 分享卡生成
│   ├── firebaseConfig.js         # Firestore 上传
│   ├── utils.js                  # 小工具
│   └── style.css                 # 样式
├── firestore.rules               # Firestore 安全规则（仅允许 create）
├── firebase.json                 # 规则部署配置
├── .firebaserc                   # 项目绑定
└── index.html                    # 入口页
```

## 人格类型列表

### 标准类型 (17)

| 代号 | 人格 | 副标题 |
|------|------|--------|
| POSER | 金融精英表演者 | 陆家嘴行走的 PPT · 精英主义代言人 |
| SNOOP | 草根解构师 | 金融圈卧底记者 · 神话粉碎机 |
| CRAM | 证书收割机 | 考证界永动机 · 薛定谔的含金量 |
| NEPOT | 关系户收割者 | 资源变现大师 · 背景即正义 |
| CLOSER | 签单杀手 | 关单执念者 · 酒桌终结者 |
| GRINDER | 加班战神 | 不眠不休永动机 · 凌晨四点陆家嘴 |
| QUANT | 金融思维入侵者 | 万物皆可估值 · 恋爱 ROI 分析师 |
| BEAN | 财务背锅侠 | 提篮桥预备役 · 会计两千五传奇 |
| BUTTERFLY | 社交收割机 | 人脉资源兑换商 · 咖啡局专业户 |
| HOPPER | 跳槽套利者 | 简历迭代专家 · 及时止损教科书 |
| FLEX | 炫富表演艺术家 | 朋友圈富豪 · 私人飞机打卡员 |
| SLACKER | 躺平哲学家 | 国企养老专业户 · 准点下班祖师爷 |
| FOMO | 焦虑加速器 | FOMO 综合症患者 · 内卷永动机 |
| PUFFER | 简历整容师 | 百万调研制造机 · 注水艺术家 |
| ROO | 海归水学历代言人 | QS 前 50 守门员 · 袋鼠战神 |
| SNEAK | 职场老六 | 潜规则猎人 · 制度漏洞收割机 |
| TREND | 赛道信徒 | 风口追随者 · 国家规划收藏家 |

### 特殊类型 (2)

| 代号 | 人格 | 触发方式 |
|------|------|---------|
| NPC | 金融路人甲 | 12 维匹配相似度低于 45% 时兜底触发 |
| CHOSEN | 天选关系户 | 彩蛋题选"家里介绍的"—— 不覆盖主人格，作为 File 03 的隐藏身份附加段 |

## 仓位交易规则

- 起始账户 ¥30,000、起始股价 ¥50
- 仓位为 0%–100% 连续值，步长 10%（共 11 档）
- **一日一次决策**：每道题提交答案前可拖滑杆，答完即锁定
- 回退到已决题：滑杆置灰显示锁定仓位，**回退不改变结果**
- 调仓计价：
  - 升仓 `Δ` → 按 `Δ × 30000` 元在当日开盘价买入
  - 降仓 `Δ` → 按 `|Δ| / prev` 比例卖出现有持仓（即"重仓回 0 就是清仓"）
- K 线方向由选项的态度值驱动（value 1 偏跌，value 4 偏涨）+ 随机波动 + 市场情绪 + 均值回归 + 5% 黑天鹅

## 数据驱动阈值

`engine.js` 启动时从题库算出每个维度的期望分与标准差，按 μ ± 0.6σ 自动标定 L/M/H 阈值。改题库后无需手调——50k 次随机答题蒙特卡洛验证，17 个 standard 人格全部可达，Shannon 均匀度 ~93%。

## 运行项目

```bash
# 安装依赖
npm install

# 开发模式（默认 http://localhost:5173/finance-bro-type-indicator/）
npm run dev

# 构建
npm run build

# 预览构建产物
npm run preview
```

### 部署 Firestore 安全规则（仅首次）

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## 致谢

- 原始项目：https://github.com/niuniu-869/fiti
- SBTI 项目：https://github.com/pingfanfan/SBTI

## 免责声明

本测试为娱乐项目，人格档案基于网络流传的金融圈刻板印象做艺术加工，不构成投资建议、职业咨询或招聘依据。

## 许可证

MIT
