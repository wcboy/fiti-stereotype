/**
 * 最终优化方案：新评分算法 + 优化 Pattern
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const questions = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf-8'));
const config = JSON.parse(readFileSync(join(__dirname, '../data/config.json'), 'utf-8'));
const dimensions = JSON.parse(readFileSync(join(__dirname, '../data/dimensions.json'), 'utf-8'));
const types = JSON.parse(readFileSync(join(__dirname, '../data/types.json'), 'utf-8'));

const engine = await import('../src/engine.js');
const { calcDimensionScores, countDimensionHits, determineResult } = engine;

const mainQuestions = questions.main || [];
const standardTypes = types.standard || [];
const specialTypes = types.special || [];
const hits = countDimensionHits(mainQuestions);

// 新评分算法
function scoresToLevelsBalanced(scores, hits) {
  const levels = {};
  for (const [dim, score] of Object.entries(scores)) {
    const n = hits[dim] || 1;
    const mean = n * 2;
    const stdDev = Math.sqrt(n * 2/3);
    const lowThreshold = mean - 0.6 * stdDev;
    const highThreshold = mean + 0.6 * stdDev;
    if (score <= lowThreshold) levels[dim] = 'L';
    else if (score >= highThreshold) levels[dim] = 'H';
    else levels[dim] = 'M';
  }
  return levels;
}

// 优化的 Pattern：每个 pattern 约 4H + 4M + 4L
const optimizedPatterns = {
  POSER: "H-M-H-M-H-M-L-H-L-M-H-L",  // 精英表演者
  SNOOP: "M-M-H-H-L-L-M-H-H-L-M-L",  // 草根解构师
  CRAM: "H-H-M-M-H-H-L-M-L-L-M-L",   // 证书收割机
  NEPOT: "L-L-M-M-M-H-H-H-H-L-M-L",  // 关系户
  TOXIC: "H-M-L-H-H-H-M-L-H-L-M-L",  // 面试PUA
  GRINDER: "H-H-H-M-H-H-M-L-M-L-L-L", // 加班战神
  QUANT: "H-H-H-H-M-M-M-L-L-L-M-L",  // 金融思维入侵者
  BEAN: "H-H-L-M-H-L-M-L-L-M-L-L",   // 财务背锅侠
  BUTTERFLY: "L-M-L-M-L-M-H-H-H-H-M-H", // 社交收割机
  HOPPER: "M-M-H-M-H-H-M-L-M-L-H-L", // 跳槽套利者
  FLEX: "M-L-M-M-L-M-H-H-M-M-L-H",   // 炫富表演艺术家
  SLACKER: "L-M-L-M-L-L-M-M-L-M-H-H", // 躺平哲学家
  FOMO: "H-H-M-M-H-H-M-L-L-H-M-L",   // 焦虑加速器
  PUFFER: "M-M-H-H-M-H-M-L-M-L-H-L", // 简历整容师
  ROO: "M-L-M-M-L-M-M-H-H-M-L-H",    // 海归水学历代言人
  SNEAK: "M-M-H-H-M-L-M-H-M-L-H-L",  // 职场老六
};

function createOptimizedTypes() {
  return standardTypes.map(t => ({
    ...t,
    pattern: optimizedPatterns[t.code] || t.pattern,
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

  const levelCounts = { L: 0, M: 0, H: 0 };

  for (let i = 0; i < iterations; i++) {
    const answers = simulateRandomAnswers();
    const scores = calcDimensionScores(answers, mainQuestions);
    const levels = scoresToLevelsBalanced(scores, hits);

    for (const level of Object.values(levels)) {
      levelCounts[level]++;
    }

    const result = determineResult(levels, dimensions.order, typesList, specialTypes, {
      fallbackThreshold: 45,
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

  const total = levelCounts.L + levelCounts.M + levelCounts.H;
  const levelDist = {
    L: (levelCounts.L / total * 100).toFixed(1),
    M: (levelCounts.M / total * 100).toFixed(1),
    H: (levelCounts.H / total * 100).toFixed(1),
  };

  return { results, levelDist };
}

console.log('\n🔬 最终优化方案：新评分算法 + 优化 Pattern\n');

const optimizedTypes = createOptimizedTypes();

// 验证 Pattern 分布
console.log('📊 Pattern H/M/L 分布:');
for (const [code, pattern] of Object.entries(optimizedPatterns)) {
  const levels = pattern.split('-');
  const h = levels.filter(l => l === 'H').length;
  const m = levels.filter(l => l === 'M').length;
  const l = levels.filter(l => l === 'L').length;
  console.log(`  ${code.padEnd(8)} | H=${h} M=${m} L=${l}`);
}

const { results, levelDist } = runSimulation(optimizedTypes);

console.log('\n📊 L/M/H 分布:');
console.log(`  L = ${levelDist.L}% | M = ${levelDist.M}% | H = ${levelDist.H}%\n`);

console.log('📊 人格分布:');
console.log('代码     | 中文名           | 占比');
console.log('-'.repeat(45));
for (const r of results) {
  const bar = '█'.repeat(Math.round(r.percent / 2));
  console.log(`${r.code.padEnd(8)} | ${r.cn.padEnd(12)} | ${r.percent.toFixed(2).padStart(6)}% | ${bar}`);
}

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
console.log(`  分布方差: ${variance.toFixed(2)}`);

const allPassed = top1 < 15 && (top1 + top2) < 30 && minPercent > 2;
console.log(`\n${allPassed ? '✅ 整体达标！' : '⚠️  仍需优化'}`);

if (allPassed) {
  console.log('\n📝 最终 Pattern JSON:');
  console.log(JSON.stringify(optimizedPatterns, null, 2));
}
