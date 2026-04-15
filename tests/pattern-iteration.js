/**
 * FiTI Pattern 迭代优化 v2
 * 目标：最高占比 < 15%，前2名合计 < 30%
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

// 迭代优化的 Pattern v2 - 目标：每个 pattern 的 M 数量控制在 4-6 个
const optimizedPatternsV2 = {
  // 精英表演者：高社交/情绪/边界，中等专注/策略
  POSER: "H-M-H-M-H-M-L-H-H-M-H-L",

  // 草根解构师：高学习/策略/情绪，低风险/边界
  SNOOP: "M-M-H-H-L-L-M-H-H-H-L-L",

  // 证书收割机：高专注/记忆/执行，低社交/冲突
  CRAM: "H-H-M-H-M-H-L-M-L-M-L-L",

  // 关系户：高社交/情绪/边界，低学习/记忆
  NEPOT: "L-L-L-M-M-H-H-H-H-H-L-M",

  // 面试PUA：高专注/决策/社交/冲突，低耐心/边界
  TOXIC: "H-M-L-H-H-H-H-L-H-H-L-L",

  // 加班战神：高专注/记忆/执行/决策，低耐心/边界
  GRINDER: "H-H-H-M-H-H-H-L-H-L-L-L",

  // 金融思维入侵者：高认知维度，低社交/情绪
  QUANT: "H-H-H-H-H-H-L-L-L-L-M-M",

  // 财务背锅侠：高专注/记忆，低风险/社交/情绪/冲突/边界
  BEAN: "H-H-M-L-H-L-L-L-L-L-M-L",

  // 社交收割机：高社交/情绪/冲突，低专注/学习
  BUTTERFLY: "L-M-L-M-L-M-H-H-H-M-H-M",

  // 跳槽套利者：高学习/策略/决策，低耐心/边界
  HOPPER: "M-M-H-M-H-H-M-L-M-H-L-L",

  // 炫富表演艺术家：高社交/情绪，低学习/风险/执行
  FLEX: "M-L-M-M-L-M-H-H-L-M-H-L",

  // 躺平哲学家：低专注/学习/风险/执行/社交/冲突，高耐心/边界
  SLACKER: "L-M-L-M-L-L-M-M-L-M-H-H",

  // 焦虑加速器：高专注/记忆/学习/决策，低耐心/边界
  FOMO: "H-H-M-M-H-H-H-L-L-H-M-L",

  // 简历整容师：高学习/策略/情绪，低耐心/边界
  PUFFER: "M-M-H-H-M-H-M-M-L-H-L-L",

  // 海归水学历代言人：中等维度，高社交/情绪，低学习/边界
  ROO: "M-L-M-M-L-M-H-H-M-M-L-L",

  // 职场老六：高学习/策略/情绪/冲突，低耐心/边界
  SNEAK: "M-M-H-H-M-L-M-H-H-M-L-L",
};

function createOptimizedTypes(patterns) {
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

function analyzePatterns(typesList) {
  return typesList.map(t => {
    const levels = t.pattern.split('-');
    return {
      code: t.code,
      h: levels.filter(l => l === 'H').length,
      m: levels.filter(l => l === 'M').length,
      l: levels.filter(l => l === 'L').length,
    };
  });
}

// 迭代优化
console.log('\n🔬 Pattern 迭代优化 v2\n');

const optimizedTypes = createOptimizedTypes(optimizedPatternsV2);
const analysis = analyzePatterns(optimizedTypes);

console.log('📊 新 Pattern H/M/L 分布:');
console.log('代码     | H | M | L');
console.log('-'.repeat(30));
analysis.sort((a, b) => b.m - a.m);
for (const a of analysis) {
  console.log(`${a.code.padEnd(8)} | ${a.h} | ${a.m} | ${a.l}`);
}

const results = runSimulation(optimizedTypes);

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
const minPercent = results[results.length - 1].percent;
const variance = results.reduce((s, r) => s + Math.pow(r.percent - 100/16, 2), 0) / results.length;

console.log('\n📈 评估指标:');
console.log(`  最高占比: ${top1.toFixed(2)}% ${top1 < 15 ? '✅' : '❌'}`);
console.log(`  前2名合计: ${(top1 + top2).toFixed(2)}% ${top1 + top2 < 30 ? '✅' : '❌'}`);
console.log(`  前5名合计: ${top5.toFixed(2)}%`);
console.log(`  最低占比: ${minPercent.toFixed(2)}% ${minPercent > 2 ? '✅' : '❌'}`);
console.log(`  分布方差: ${variance.toFixed(2)}`);

// 输出最终 Pattern JSON
console.log('\n📝 最终 Pattern JSON:');
console.log(JSON.stringify(optimizedPatternsV2, null, 2));
