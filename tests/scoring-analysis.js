/**
 * 分析评分算法：随机答题时 L/M/H 的实际分布
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const questions = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf-8'));
const config = JSON.parse(readFileSync(join(__dirname, '../data/config.json'), 'utf-8'));
const dimensions = JSON.parse(readFileSync(join(__dirname, '../data/dimensions.json'), 'utf-8'));

const engine = await import('../src/engine.js');
const { calcDimensionScores, countDimensionHits, scoresToLevels } = engine;

const mainQuestions = questions.main || [];
const hits = countDimensionHits(mainQuestions);

console.log('\n🔬 评分算法分析\n');

// 1. 分析每个维度的阈值
console.log('📊 各维度的 L/M/H 阈值分析:');
console.log('维度        | 被测次数 | 分数范围 | L阈值 | H阈值 | M区间宽度');
console.log('-'.repeat(70));

const ratio = config.scoring?.thresholdRatio ?? 0.5;

for (const dim of dimensions.order) {
  const n = hits[dim] || 1;
  const minScore = n * 1;
  const maxScore = n * 3;
  const low = minScore + Math.floor(n * ratio);
  const high = maxScore - Math.floor(n * ratio);
  const mWidth = high - low - 1; // M 区间的分数数量

  console.log(
    `${dim.padEnd(11)} | ${String(n).padStart(7)} | ${minScore}-${maxScore} | ${String(low).padStart(4)} | ${String(high).padStart(4)} | ${mWidth > 0 ? mWidth + '个分数' : '几乎无M'}`
  );
}

// 2. 模拟随机答题，统计 L/M/H 分布
console.log('\n📊 随机答题时各维度的 L/M/H 分布 (100000次模拟):\n');

const iterations = 100000;
const levelCounts = {};

for (const dim of dimensions.order) {
  levelCounts[dim] = { L: 0, M: 0, H: 0 };
}

for (let i = 0; i < iterations; i++) {
  // 随机答题
  const answers = {};
  for (const q of mainQuestions) {
    answers[q.id] = Math.floor(Math.random() * 3) + 1;
  }

  const scores = calcDimensionScores(answers, mainQuestions);
  const levels = scoresToLevels(scores, hits, ratio);

  for (const dim of dimensions.order) {
    const level = levels[dim] || 'M';
    levelCounts[dim][level]++;
  }
}

console.log('维度        | L%    | M%    | H%    | 主要结果');
console.log('-'.repeat(60));

let totalL = 0, totalM = 0, totalH = 0;

for (const dim of dimensions.order) {
  const l = (levelCounts[dim].L / iterations * 100).toFixed(1);
  const m = (levelCounts[dim].M / iterations * 100).toFixed(1);
  const h = (levelCounts[dim].H / iterations * 100).toFixed(1);

  totalL += levelCounts[dim].L;
  totalM += levelCounts[dim].M;
  totalH += levelCounts[dim].H;

  const dominant = parseFloat(m) > 50 ? 'M主导' : parseFloat(l) > 40 ? 'L偏多' : parseFloat(h) > 40 ? 'H偏多' : '均衡';

  console.log(`${dim.padEnd(11)} | ${l.padStart(5)}% | ${m.padStart(5)}% | ${h.padStart(5)}% | ${dominant}`);
}

const total = totalL + totalM + totalH;
console.log('-'.repeat(60));
console.log(`总计        | ${(totalL/total*100).toFixed(1)}% | ${(totalM/total*100).toFixed(1)}% | ${(totalH/total*100).toFixed(1)}% |`);

// 3. 分析问题
console.log('\n🔍 问题诊断:');

const mPercent = totalM / total * 100;
const lPercent = totalL / total * 100;
const hPercent = totalH / total * 100;

if (mPercent > 50) {
  console.log(`⚠️  M 占比 ${mPercent.toFixed(1)}% 过高！随机答题天然倾向 M`);
  console.log('   这导致 M 多的 pattern（如 FLEX, ROO）匹配率极高');
}

if (lPercent < 20 || hPercent < 20) {
  console.log(`⚠️  L(${lPercent.toFixed(1)}%) 或 H(${hPercent.toFixed(1)}%) 占比过低`);
}

// 4. 建议的阈值调整
console.log('\n💡 建议调整 thresholdRatio:');
console.log(`   当前 ratio = ${ratio}`);
console.log('   - ratio 越大，M 区间越窄，L/H 越多');
console.log('   - ratio 越小，M 区间越宽，M 越多');
console.log('   - 建议 ratio = 0.3 ~ 0.4，让 L/M/H 更均衡');

// 测试不同 ratio 的效果
console.log('\n📊 不同 thresholdRatio 下的 L/M/H 分布:\n');

for (const testRatio of [0.3, 0.35, 0.4, 0.5]) {
  const testCounts = { L: 0, M: 0, H: 0 };

  for (let i = 0; i < iterations; i++) {
    const answers = {};
    for (const q of mainQuestions) {
      answers[q.id] = Math.floor(Math.random() * 3) + 1;
    }
    const scores = calcDimensionScores(answers, mainQuestions);
    const levels = scoresToLevels(scores, hits, testRatio);

    for (const dim of dimensions.order) {
      const level = levels[dim] || 'M';
      testCounts[level]++;
    }
  }

  const total = testCounts.L + testCounts.M + testCounts.H;
  console.log(`ratio = ${testRatio}: L=${(testCounts.L/total*100).toFixed(1)}% | M=${(testCounts.M/total*100).toFixed(1)}% | H=${(testCounts.H/total*100).toFixed(1)}%`);
}
