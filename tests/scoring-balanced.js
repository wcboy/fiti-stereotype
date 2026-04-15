/**
 * 测试新的评分算法：让 L/M/H 分布更均衡
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

/**
 * 新的评分算法：基于标准差而非固定阈值
 * 让 L/M/H 分布更均衡
 */
function scoresToLevelsBalanced(scores, hits) {
  const levels = {};

  for (const [dim, score] of Object.entries(scores)) {
    const n = hits[dim] || 1;
    const mean = n * 2; // 期望值
    const stdDev = Math.sqrt(n * 2/3); // 标准差（假设均匀分布）

    // 使用标准差划分：
    // L: score < mean - 0.5*stdDev
    // H: score > mean + 0.5*stdDev
    // M: 其他

    const lowThreshold = mean - 0.6 * stdDev;
    const highThreshold = mean + 0.6 * stdDev;

    if (score <= lowThreshold) {
      levels[dim] = 'L';
    } else if (score >= highThreshold) {
      levels[dim] = 'H';
    } else {
      levels[dim] = 'M';
    }
  }

  return levels;
}

// 模拟随机答题
function simulateRandomAnswers() {
  const answers = {};
  for (const q of mainQuestions) {
    answers[q.id] = Math.floor(Math.random() * 3) + 1;
  }
  return answers;
}

// 使用新算法运行模拟
function runSimulation(iterations = 50000) {
  const typeCounts = {};
  for (const t of standardTypes) typeCounts[t.code] = 0;
  for (const t of specialTypes) typeCounts[t.code] = 0;

  const levelCounts = { L: 0, M: 0, H: 0 };

  for (let i = 0; i < iterations; i++) {
    const answers = simulateRandomAnswers();
    const scores = calcDimensionScores(answers, mainQuestions);
    const levels = scoresToLevelsBalanced(scores, hits);

    // 统计 L/M/H
    for (const level of Object.values(levels)) {
      levelCounts[level]++;
    }

    const result = determineResult(levels, dimensions.order, standardTypes, specialTypes, {
      fallbackThreshold: 45,
    });

    if (result.primary?.code) {
      typeCounts[result.primary.code]++;
    }
  }

  const results = [];
  for (const t of [...standardTypes, ...specialTypes]) {
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

console.log('\n🔬 新评分算法测试（基于标准差）\n');

const { results, levelDist } = runSimulation();

console.log('📊 L/M/H 分布:');
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
const minPercent = results.filter(r => !['NPC', 'CHOSEN', 'UNCERT'].includes(r.code))[results.length - 4]?.percent || 0;

console.log('\n📈 评估指标:');
console.log(`  最高占比: ${top1.toFixed(2)}% ${top1 < 15 ? '✅' : '❌'}`);
console.log(`  前2名合计: ${(top1 + top2).toFixed(2)}% ${top1 + top2 < 30 ? '✅' : '❌'}`);
console.log(`  最低占比: ${minPercent.toFixed(2)}% ${minPercent > 2 ? '✅' : '❌'}`);
