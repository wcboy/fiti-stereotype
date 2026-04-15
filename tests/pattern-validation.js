/**
 * FiTI Pattern 优化验证测试
 * 对比新旧 Pattern 的随机答题分布
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
const hits = countDimensionHits(mainQuestions);

// 新的 Pattern 设计
const newPatterns = {
  POSER: "H-M-H-M-H-M-M-H-H-M-H-H",
  SNOOP: "M-M-H-H-L-L-M-H-H-H-M-L",
  CRAM: "H-H-M-H-M-H-L-M-L-M-M-L",
  NEPOT: "M-L-M-M-M-H-H-H-H-H-L-M",
  TOXIC: "H-M-L-H-M-H-H-L-H-H-H-M",
  GRINDER: "H-H-H-M-H-H-H-L-H-M-L-M",
  QUANT: "H-H-H-H-H-H-L-M-M-L-L-M",
  BEAN: "H-H-M-L-H-L-M-M-L-L-M-L",
  BUTTERFLY: "L-M-L-M-M-M-H-H-H-M-H-M",
  HOPPER: "M-M-H-M-H-H-M-L-M-H-M-L",
  FLEX: "M-L-M-M-L-M-H-H-M-M-H-L",
  SLACKER: "L-M-L-M-L-L-M-M-L-M-L-H",
  FOMO: "H-H-M-M-H-H-H-L-L-H-M-M",
  PUFFER: "M-M-H-H-M-H-M-M-L-H-M-L",
  ROO: "M-L-M-M-M-M-M-M-H-H-L-M",
  SNEAK: "M-M-H-H-M-L-M-H-H-M-M-L",
};

/**
 * 创建使用新 Pattern 的类型列表
 */
function createNewTypes() {
  return standardTypes.map(t => ({
    ...t,
    pattern: newPatterns[t.code] || t.pattern,
  }));
}

/**
 * 模拟随机答题
 */
function simulateRandomAnswers() {
  const answers = {};
  for (const q of mainQuestions) {
    answers[q.id] = Math.floor(Math.random() * 3) + 1;
  }
  return answers;
}

/**
 * 运行单次测试
 */
function runSingleTest(typesList) {
  const answers = simulateRandomAnswers();
  const scores = calcDimensionScores(answers, mainQuestions);
  const levels = scoresToLevels(scores, hits, config.scoring?.thresholdRatio ?? 0.5);
  const result = determineResult(levels, dimensions.order, typesList, specialTypes, {
    fallbackThreshold: config.scoring?.fallbackThreshold ?? 45,
    showSecondary: true,
  });
  return { result, levels, scores };
}

/**
 * 运行模拟
 */
function runSimulation(typesList, label, iterations = 30000) {
  const typeCounts = {};
  const similarityDistribution = [];

  for (const t of typesList) {
    typeCounts[t.code] = 0;
  }
  for (const t of specialTypes) {
    typeCounts[t.code] = 0;
  }

  for (let i = 0; i < iterations; i++) {
    const { result } = runSingleTest(typesList);
    const code = result.primary?.code;
    if (code) {
      typeCounts[code] = (typeCounts[code] || 0) + 1;
    }
    if (result.primary?.similarity != null) {
      similarityDistribution.push(result.primary.similarity);
    }
  }

  const results = [];
  for (const t of [...typesList, ...specialTypes]) {
    const count = typeCounts[t.code] || 0;
    const percent = ((count / iterations) * 100).toFixed(2);
    results.push({ code: t.code, cn: t.cn, count, percent: parseFloat(percent) });
  }
  results.sort((a, b) => b.count - a.count);

  const simAvg = similarityDistribution.reduce((a, b) => a + b, 0) / similarityDistribution.length;
  const simMin = Math.min(...similarityDistribution);
  const simMax = Math.max(...similarityDistribution);

  return { results, simAvg, simMin, simMax, typeCounts };
}

/**
 * 分析 Pattern 分布
 */
function analyzePatterns(typesList) {
  console.log('\n📊 Pattern H/M/L 分布分析');
  console.log('═'.repeat(70));

  const analysis = typesList.map(t => {
    const levels = t.pattern.split('-');
    const h = levels.filter(l => l === 'H').length;
    const m = levels.filter(l => l === 'M').length;
    const l = levels.filter(l => l === 'L').length;
    const distFromM = h + l; // 与全M的距离
    return { code: t.code, cn: t.cn, h, m, l, distFromM, pattern: t.pattern };
  });

  analysis.sort((a, b) => b.m - a.m);

  console.log('代码     | 中文名           | H  | M  | L  | 与M距离 | Pattern');
  console.log('-'.repeat(70));
  for (const a of analysis) {
    console.log(
      `${a.code.padEnd(8)} | ${a.cn.padEnd(14)} | ${String(a.h).padStart(2)} | ${String(a.m).padStart(2)} | ${String(a.l).padStart(2)} | ${String(a.distFromM).padStart(6)} | ${a.pattern}`
    );
  }

  return analysis;
}

// ============ 主程序 ============
console.log('\n' + '═'.repeat(70));
console.log('🔬 FiTI Pattern 优化验证测试');
console.log('═'.repeat(70));

// 1. 分析旧 Pattern
console.log('\n📌 【旧 Pattern 分析】');
const oldAnalysis = analyzePatterns(standardTypes);

// 2. 运行旧 Pattern 模拟
console.log('\n📌 【旧 Pattern 随机测试结果】');
const oldResult = runSimulation(standardTypes, '旧 Pattern');

console.log('\n人格分布（前10）:');
for (let i = 0; i < 10; i++) {
  const r = oldResult.results[i];
  const bar = '█'.repeat(Math.round(r.percent / 2));
  console.log(`  ${r.code.padEnd(8)} | ${r.percent.toString().padStart(6)}% | ${bar}`);
}

console.log(`\n相似度: 平均 ${oldResult.simAvg.toFixed(1)}% | 最小 ${oldResult.simMin}% | 最大 ${oldResult.simMax}%`);

// 计算分布指标
const oldTop1 = oldResult.results[0].percent;
const oldTop2 = oldResult.results[1].percent;
const oldTop5Sum = oldResult.results.slice(0, 5).reduce((s, r) => s + r.percent, 0);
const oldVariance = calculateVariance(oldResult.results);

console.log(`\n分布指标:`);
console.log(`  最高占比: ${oldTop1.toFixed(2)}%`);
console.log(`  前2名合计: ${(oldTop1 + oldTop2).toFixed(2)}%`);
console.log(`  前5名合计: ${oldTop5Sum.toFixed(2)}%`);
console.log(`  分布方差: ${oldVariance.toFixed(2)} (越小越均匀)`);

// 3. 分析新 Pattern
console.log('\n\n' + '═'.repeat(70));
console.log('📌 【新 Pattern 分析】');
const newTypes = createNewTypes();
const newAnalysis = analyzePatterns(newTypes);

// 4. 运行新 Pattern 模拟
console.log('\n📌 【新 Pattern 随机测试结果】');
const newResult = runSimulation(newTypes, '新 Pattern');

console.log('\n人格分布（前10）:');
for (let i = 0; i < 10; i++) {
  const r = newResult.results[i];
  const bar = '█'.repeat(Math.round(r.percent / 2));
  console.log(`  ${r.code.padEnd(8)} | ${r.percent.toString().padStart(6)}% | ${bar}`);
}

console.log(`\n相似度: 平均 ${newResult.simAvg.toFixed(1)}% | 最小 ${newResult.simMin}% | 最大 ${newResult.simMax}%`);

const newTop1 = newResult.results[0].percent;
const newTop2 = newResult.results[1].percent;
const newTop5Sum = newResult.results.slice(0, 5).reduce((s, r) => s + r.percent, 0);
const newVariance = calculateVariance(newResult.results);

console.log(`\n分布指标:`);
console.log(`  最高占比: ${newTop1.toFixed(2)}%`);
console.log(`  前2名合计: ${(newTop1 + newTop2).toFixed(2)}%`);
console.log(`  前5名合计: ${newTop5Sum.toFixed(2)}%`);
console.log(`  分布方差: ${newVariance.toFixed(2)} (越小越均匀)`);

// 5. 对比总结
console.log('\n\n' + '═'.repeat(70));
console.log('📈 【优化效果对比】');
console.log('═'.repeat(70));

console.log('\n指标对比:');
console.log('┌─────────────────┬──────────┬──────────┬──────────┐');
console.log('│ 指标            │ 旧Pattern│ 新Pattern│ 改善幅度 │');
console.log('├─────────────────┼──────────┼──────────┼──────────┤');
console.log(`│ 最高占比        │ ${oldTop1.toFixed(2).padStart(7)}% │ ${newTop1.toFixed(2).padStart(7)}% │ ${((oldTop1 - newTop1) / oldTop1 * 100).toFixed(0).padStart(6)}% ↓ │`);
console.log(`│ 前2名合计       │ ${(oldTop1 + oldTop2).toFixed(2).padStart(7)}% │ ${(newTop1 + newTop2).toFixed(2).padStart(7)}% │ ${(((oldTop1 + oldTop2) - (newTop1 + newTop2)) / (oldTop1 + oldTop2) * 100).toFixed(0).padStart(6)}% ↓ │`);
console.log(`│ 前5名合计       │ ${oldTop5Sum.toFixed(2).padStart(7)}% │ ${newTop5Sum.toFixed(2).padStart(7)}% │ ${((oldTop5Sum - newTop5Sum) / oldTop5Sum * 100).toFixed(0).padStart(6)}% ↓ │`);
console.log(`│ 分布方差        │ ${oldVariance.toFixed(2).padStart(7)} │ ${newVariance.toFixed(2).padStart(7)} │ ${((oldVariance - newVariance) / oldVariance * 100).toFixed(0).padStart(6)}% ↓ │`);
console.log(`│ 平均相似度      │ ${oldResult.simAvg.toFixed(1).padStart(7)}% │ ${newResult.simAvg.toFixed(1).padStart(7)}% │ ${((oldResult.simAvg - newResult.simAvg) / oldResult.simAvg * 100).toFixed(0).padStart(6)}% ↓ │`);
console.log('└─────────────────┴──────────┴──────────┴──────────┘');

// 判断是否达标
console.log('\n🎯 达标评估:');
const targets = {
  '最高占比 < 15%': newTop1 < 15,
  '前2名合计 < 30%': (newTop1 + newTop2) < 30,
  '最低占比 > 2%': newResult.results[newResult.results.length - 1].percent > 2,
  '分布方差降低': newVariance < oldVariance,
};

for (const [target, passed] of Object.entries(targets)) {
  console.log(`  ${passed ? '✅' : '❌'} ${target}`);
}

const allPassed = Object.values(targets).every(v => v);
console.log(`\n${allPassed ? '✅ 整体达标，建议采用新 Pattern' : '⚠️  部分指标未达标，需要进一步优化'}`);

function calculateVariance(results) {
  const mean = results.reduce((s, r) => s + r.percent, 0) / results.length;
  return results.reduce((s, r) => s + Math.pow(r.percent - mean, 2), 0) / results.length;
}
