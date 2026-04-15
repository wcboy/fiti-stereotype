/**
 * FiTI 人格分布测试
 * 模拟随机答题，统计各人格出现概率
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 手动读取 JSON 文件
const questions = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf-8'));
const types = JSON.parse(readFileSync(join(__dirname, '../data/types.json'), 'utf-8'));
const dimensions = JSON.parse(readFileSync(join(__dirname, '../data/dimensions.json'), 'utf-8'));
const config = JSON.parse(readFileSync(join(__dirname, '../data/config.json'), 'utf-8'));

// 动态导入 engine.js
const engine = await import('../src/engine.js');
const {
  calcDimensionScores,
  countDimensionHits,
  scoresToLevels,
  determineResult,
} = engine;

const mainQuestions = questions.main || [];
const standardTypes = types.standard || [];
const specialTypes = types.special || [];

// 统计每个维度的测量次数
const hits = countDimensionHits(mainQuestions);

/**
 * 模拟一次随机答题
 */
function simulateRandomAnswers() {
  const answers = {};
  for (const q of mainQuestions) {
    // 随机选择 1/2/3
    answers[q.id] = Math.floor(Math.random() * 3) + 1;
  }
  return answers;
}

/**
 * 计算一次测试结果
 */
function runSingleTest() {
  const answers = simulateRandomAnswers();
  const scores = calcDimensionScores(answers, mainQuestions);
  const levels = scoresToLevels(
    scores,
    hits,
    config.scoring?.thresholdRatio ?? 0.5
  );
  const result = determineResult(
    levels,
    dimensions.order,
    standardTypes,
    specialTypes,
    {
      fallbackThreshold: config.scoring?.fallbackThreshold ?? 45,
      showSecondary: true,
    }
  );
  return { result, levels, scores };
}

/**
 * 运行多次测试并统计
 */
function runSimulation(iterations = 10000) {
  const typeCounts = {};
  const patternCounts = {};
  const modeCounts = { normal: 0, fallback: 0 };
  const similarityDistribution = [];

  // 初始化计数
  for (const t of standardTypes) {
    typeCounts[t.code] = 0;
  }
  for (const t of specialTypes) {
    typeCounts[t.code] = 0;
  }

  console.log(`\n📊 运行 ${iterations} 次随机测试...\n`);

  for (let i = 0; i < iterations; i++) {
    const { result, levels } = runSingleTest();
    const code = result.primary?.code;
    if (code) {
      typeCounts[code] = (typeCounts[code] || 0) + 1;
    }
    modeCounts[result.mode]++;

    // 收集相似度分布
    if (result.primary?.similarity != null) {
      similarityDistribution.push(result.primary.similarity);
    }

    // 统计 pattern 分布
    const pattern = result.primary?.pattern;
    if (pattern) {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }
  }

  // 输出结果
  console.log('═'.repeat(60));
  console.log('📋 人格分布统计');
  console.log('═'.repeat(60));

  const results = [];
  for (const t of [...standardTypes, ...specialTypes]) {
    const count = typeCounts[t.code] || 0;
    const percent = ((count / iterations) * 100).toFixed(2);
    results.push({
      code: t.code,
      cn: t.cn,
      count,
      percent: parseFloat(percent),
      pattern: t.pattern,
    });
  }

  // 按出现次数排序
  results.sort((a, b) => b.count - a.count);

  for (const r of results) {
    const bar = '█'.repeat(Math.round(r.percent / 2));
    console.log(
      `${r.code.padEnd(8)} | ${r.cn.padEnd(12)} | ${r.percent.toString().padStart(6)}% | ${bar}`
    );
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📈 模式分布');
  console.log('═'.repeat(60));
  console.log(`Normal:   ${modeCounts.normal} (${((modeCounts.normal / iterations) * 100).toFixed(2)}%)`);
  console.log(`Fallback: ${modeCounts.fallback} (${((modeCounts.fallback / iterations) * 100).toFixed(2)}%)`);

  // 相似度分布分析
  console.log('\n' + '═'.repeat(60));
  console.log('📊 相似度分布分析');
  console.log('═'.repeat(60));
  const simAvg = similarityDistribution.reduce((a, b) => a + b, 0) / similarityDistribution.length;
  const simMin = Math.min(...similarityDistribution);
  const simMax = Math.max(...similarityDistribution);
  const simUnder45 = similarityDistribution.filter(s => s < 45).length;
  const simUnder50 = similarityDistribution.filter(s => s < 50).length;
  const simUnder55 = similarityDistribution.filter(s => s < 55).length;

  console.log(`平均相似度: ${simAvg.toFixed(2)}%`);
  console.log(`最小相似度: ${simMin}%`);
  console.log(`最大相似度: ${simMax}%`);
  console.log(`相似度 < 45%: ${simUnder45} (${((simUnder45 / iterations) * 100).toFixed(2)}%)`);
  console.log(`相似度 < 50%: ${simUnder50} (${((simUnder50 / iterations) * 100).toFixed(2)}%)`);
  console.log(`相似度 < 55%: ${simUnder55} (${((simUnder55 / iterations) * 100).toFixed(2)}%)`);

  // 分析 Pattern 分布
  console.log('\n' + '═'.repeat(60));
  console.log('🔮 Pattern 分布（前10）');
  console.log('═'.repeat(60));

  const patternList = Object.entries(patternCounts)
    .map(([pattern, count]) => ({ pattern, count, percent: (count / iterations) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  for (const p of patternList) {
    const typesWithPattern = [...standardTypes, ...specialTypes]
      .filter(t => t.pattern === p.pattern)
      .map(t => t.code)
      .join(', ');
    console.log(`${p.pattern.padEnd(35)} | ${p.percent.toFixed(2).padStart(6)}% | ${typesWithPattern}`);
  }

  // 分析为什么某些人格出现率高
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 高概率人格分析');
  console.log('═'.repeat(60));

  const topResults = results.slice(0, 5);
  for (const r of topResults) {
    const type = [...standardTypes, ...specialTypes].find(t => t.code === r.code);
    if (type) {
      console.log(`\n${r.code} - ${r.cn}`);
      console.log(`  Pattern: ${type.pattern}`);
      analyzePattern(type.pattern);
    }
  }

  return results;
}

/**
 * 分析一个 pattern 的特征
 */
function analyzePattern(pattern) {
  const levels = pattern.split('-');
  const hCount = levels.filter(l => l === 'H').length;
  const lCount = levels.filter(l => l === 'L').length;
  const mCount = levels.filter(l => l === 'M').length;

  console.log(`  H=${hCount}, M=${mCount}, L=${lCount}`);

  // 计算与随机选择的距离
  // 随机选择倾向于 M（中间值）
  // H-H-H-H... 需要持续选高分，概率低
  // L-L-L-L... 需要持续选低分，概率低
  // M-M-M-M... 随机选择最容易达到

  const distanceFromMiddle = levels.reduce((sum, l) => {
    if (l === 'H') return sum + 1;
    if (l === 'L') return sum + 1;
    return sum;
  }, 0);

  console.log(`  偏离中间值程度: ${distanceFromMiddle} (越高越难匹配)`);
}

// 运行测试
runSimulation(50000);
