/**
 * FiTI Pattern 强制均衡优化 v3
 * 所有 Pattern 强制 4H + 4M + 4L
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const questions = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf-8'));
const types = JSON.parse(readFileSync(join(__dirname, '../data/types.json'), 'utf-8'));
const dimensions = JSON.parse(readFileSync(join(__dirname, '../data/dimensions.json'), 'utf-8'));
const config = JSON.parse(readFileSync(join(__dirname, '../data/config.json'), 'utf-8'));

const engine = await import('../src/engine.js');
const { calcDimensionScores, countDimensionHits, scoresToLevels, determineResult } = engine;

const mainQuestions = questions.main || [];
const standardTypes = types.standard || [];
const specialTypes = types.special || [];
const hits = countDimensionHits(mainQuestions);

// 维度顺序: FOCUS, MEMORY, RISK, DECISION, STRATEGY, EXECUTE, LEARN, EMOTION, SOCIAL, BOUNDARY, CONFLICT, PATIENCE
// 强制 4H + 4M + 4L 的均衡 Pattern
const balancedPatterns = {
  // 精英表演者：高社交/情绪/边界/策略，低专注/记忆/风险/执行
  POSER: "L-L-L-M-H-M-M-H-H-H-M-H",

  // 草根解构师：高学习/策略/情绪/冲突，低风险/执行/社交/边界
  SNOOP: "M-M-L-M-H-L-H-H-M-L-H-M",

  // 证书收割机：高专注/记忆/学习/执行，低社交/情绪/冲突/边界
  CRAM: "H-H-M-M-H-H-M-L-L-L-L-M",

  // 关系户：高社交/情绪/边界/决策，低专注/记忆/学习/策略
  NEPOT: "L-L-M-H-M-M-L-H-H-H-M-H",

  // 面试PUA：高专注/决策/社交/冲突，低记忆/学习/耐心/边界
  TOXIC: "H-M-H-H-L-M-M-L-M-L-H-H",

  // 加班战神：高专注/记忆/执行/决策，低社交/情绪/冲突/边界
  GRINDER: "H-H-M-H-H-H-M-L-L-L-L-M",

  // 金融思维入侵者：高专注/记忆/策略/决策，低社交/情绪/冲突/边界
  QUANT: "H-H-H-H-M-M-M-L-L-L-L-M",

  // 财务背锅侠：高专注/记忆/执行，低风险/社交/情绪/冲突/边界
  BEAN: "H-H-L-M-M-H-M-L-L-L-M-L",

  // 社交收割机：高社交/情绪/冲突/边界，低专注/记忆/学习/执行
  BUTTERFLY: "L-L-M-M-L-M-H-H-H-H-M-H",

  // 跳槽套利者：高学习/策略/决策/情绪，低记忆/执行/耐心/边界
  HOPPER: "M-L-M-H-H-M-H-H-L-L-M-L",

  // 炫富表演艺术家：高社交/情绪/边界，低专注/学习/风险/执行
  FLEX: "L-M-L-M-L-M-H-H-H-H-M-L",

  // 躺平哲学家：高耐心/边界，低专注/记忆/学习/策略/风险/执行/社交/冲突
  SLACKER: "L-L-L-M-L-L-M-M-M-M-H-H",

  // 焦虑加速器：高专注/记忆/学习/决策，低耐心/边界/社交/情绪
  FOMO: "H-H-M-H-H-M-M-L-L-M-L-L",

  // 简历整容师：高学习/策略/情绪/决策，低记忆/执行/耐心/边界
  PUFFER: "M-L-M-H-H-M-H-M-L-L-M-L",

  // 海归水学历代言人：高社交/情绪，低专注/记忆/学习/策略
  ROO: "L-L-M-M-L-M-M-H-H-M-L-H",

  // 职场老六：高学习/策略/情绪/冲突，低记忆/执行/耐心/边界
  SNEAK: "M-L-M-H-H-M-H-M-L-L-H-L",
};

function createBalancedTypes(patterns) {
  return standardTypes.map(t => ({
    ...t,
    pattern: patterns[t.code] || t.pattern,
  }));
}

function simulateRandomAnswers() {
  const answers = {};
  for (const q of mainQuestions) {
    answers[q.id] = Math.floor(Math.random() * 3) + 1;
  }
  return answers;
}

function runSimulation(typesList, iterations = 50000) {
  const typeCounts = {};
  for (const t of typesList) typeCounts[t.code] = 0;
  for (const t of specialTypes) typeCounts[t.code] = 0;

  for (let i = 0; i < iterations; i++) {
    const answers = simulateRandomAnswers();
    const scores = calcDimensionScores(answers, mainQuestions);
    const levels = scoresToLevels(scores, hits, config.scoring?.thresholdRatio ?? 0.5);
    const result = determineResult(levels, dimensions.order, typesList, specialTypes, {
      fallbackThreshold: config.scoring?.fallbackThreshold ?? 45,
    });
    if (result.primary?.code) {
      typeCounts[result.primary.code]++;
    }
  }

  const results = [];
  for (const t of [...typesList, ...specialTypes]) {
    results.push({
      code: t.code,
      cn: t.cn,
      count: typeCounts[t.code] || 0,
      percent: ((typeCounts[t.code] || 0) / iterations) * 100,
    });
  }
  results.sort((a, b) => b.count - a.count);
  return results;
}

// 验证所有 pattern 都是 4H + 4M + 4L
console.log('\n🔬 Pattern 强制均衡验证 v3\n');
console.log('验证所有 Pattern 是否为 4H + 4M + 4L:\n');

let allValid = true;
for (const [code, pattern] of Object.entries(balancedPatterns)) {
  const levels = pattern.split('-');
  const h = levels.filter(l => l === 'H').length;
  const m = levels.filter(l => l === 'M').length;
  const l = levels.filter(l => l === 'L').length;
  const valid = h === 4 && m === 4 && l === 4;
  if (!valid) allValid = false;
  console.log(`${code.padEnd(8)} | H=${h} M=${m} L=${l} | ${valid ? '✅' : '❌'}`);
}

if (!allValid) {
  console.log('\n⚠️  部分 Pattern 不符合 4H+4M+4L 规则');
}

// 运行模拟
const balancedTypes = createBalancedTypes(balancedPatterns);
const results = runSimulation(balancedTypes);

console.log('\n📊 随机测试结果:');
console.log('代码     | 中文名           | 占比');
console.log('-'.repeat(45));
for (const r of results) {
  const bar = '█'.repeat(Math.round(r.percent / 2));
  console.log(`${r.code.padEnd(8)} | ${r.cn.padEnd(12)} | ${r.percent.toFixed(2).padStart(6)}% | ${bar}`);
}

// 评估
const top1 = results[0].percent;
const top2 = results[1].percent;
const top5 = results.slice(0, 5).reduce((s, r) => s + r.percent, 0);
const minPercent = results.filter(r => !['NPC', 'CHOSEN', 'UNCERT'].includes(r.code))[results.length - 4]?.percent || 0;
const variance = results.reduce((s, r) => s + Math.pow(r.percent - 100/16, 2), 0) / results.length;

console.log('\n📈 评估指标:');
console.log(`  最高占比: ${top1.toFixed(2)}% ${top1 < 15 ? '✅' : '❌'} (目标 < 15%)`);
console.log(`  前2名合计: ${(top1 + top2).toFixed(2)}% ${top1 + top2 < 30 ? '✅' : '❌'} (目标 < 30%)`);
console.log(`  前5名合计: ${top5.toFixed(2)}%`);
console.log(`  最低占比: ${minPercent.toFixed(2)}% ${minPercent > 2 ? '✅' : '❌'} (目标 > 2%)`);
console.log(`  分布方差: ${variance.toFixed(2)} (理想值 ~0)`);

// 输出最终 Pattern
console.log('\n📝 最终 Pattern JSON:');
console.log(JSON.stringify(balancedPatterns, null, 2));
