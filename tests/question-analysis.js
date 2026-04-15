/**
 * 分析题目选项与维度定义的一致性
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const questions = JSON.parse(readFileSync(join(__dirname, '../data/questions.json'), 'utf-8'));
const dimensions = JSON.parse(readFileSync(join(__dirname, '../data/dimensions.json'), 'utf-8'));

const mainQuestions = questions.main || [];

console.log('\n🔬 题目选项与维度一致性分析\n');

// 维度定义摘要
const dimSummary = {
  FOCUS: { L: "易分心", M: "适度专注", H: "深度专注" },
  MEMORY: { L: "记完就忘", M: "正常水平", H: "过目不忘" },
  LEARN: { L: "固守旧法", M: "能改进", H: "快速迭代" },
  STRATEGY: { L: "直觉决策", M: "有规划", H: "深谋远虑" },
  RISK: { L: "极度保守", M: "平衡型", H: "敢赌敢拼" },
  DECISION: { L: "犹豫不决", M: "适度思考", H: "果断迅速" },
  EXECUTE: { L: "拖延症", M: "稳定输出", H: "执行机器" },
  PATIENCE: { L: "急躁", M: "能等待", H: "延迟满足" },
  SOCIAL: { L: "内向", M: "可内可外", H: "外向" },
  EMOTION: { L: "迟钝", M: "能感知", H: "敏锐" },
  CONFLICT: { L: "回避冲突", M: "该刚则刚", H: "主动出击" },
  BOUNDARY: { L: "边界模糊", M: "有边界", H: "边界清晰" },
};

// 分析每道题
const issues = [];

for (const q of mainQuestions) {
  const dims = q.dims || [];
  if (dims.length === 0) continue;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📋 ${q.id}: ${dims.join(' + ')}`);
  console.log(`   ${q.text.slice(0, 50)}...`);
  console.log(`${'─'.repeat(60)}`);

  for (const opt of q.options) {
    const val = opt.value;
    const level = val === 1 ? 'L' : val === 2 ? 'M' : 'H';

    console.log(`\n   [${level}] value=${val}: "${opt.label.slice(0, 40)}..."`);

    // 分析每个维度
    for (const dim of dims) {
      const def = dimSummary[dim];
      if (!def) continue;

      // 这里需要人工判断，我们输出期望的维度特征
      console.log(`      → ${dim}: 期望 "${def[level]}"`);
    }
  }

  // 检查潜在问题
  if (dims.length === 2) {
    const [dim1, dim2] = dims;

    // 检查两个维度是否可能冲突
    const conflictPairs = [
      ['RISK', 'STRATEGY'],  // 风险偏好和策略思维可能冲突
      ['RISK', 'DECISION'],  // 风险偏好和决策风格可能冲突
      ['SOCIAL', 'BOUNDARY'], // 社交和边界可能冲突
      ['CONFLICT', 'BOUNDARY'], // 冲突风格和边界可能冲突
    ];

    const hasConflict = conflictPairs.some(
      ([a, b]) => (dim1 === a && dim2 === b) || (dim1 === b && dim2 === a)
    );

    if (hasConflict) {
      issues.push({
        id: q.id,
        dims,
        reason: `${dim1} 和 ${dim2} 可能在同一选项上产生矛盾`
      });
    }
  }
}

// 输出问题汇总
console.log('\n\n' + '═'.repeat(60));
console.log('⚠️  潜在问题汇总');
console.log('═'.repeat(60));

if (issues.length === 0) {
  console.log('未发现明显的维度冲突问题');
} else {
  for (const issue of issues) {
    console.log(`\n❌ ${issue.id} (${issue.dims.join(' + ')}): ${issue.reason}`);
  }
}

// 统计
console.log('\n\n' + '═'.repeat(60));
console.log('📊 统计');
console.log('═'.repeat(60));

const dimCount = {};
for (const q of mainQuestions) {
  for (const dim of (q.dims || [])) {
    dimCount[dim] = (dimCount[dim] || 0) + 1;
  }
}

console.log('\n各维度被测次数:');
for (const [dim, count] of Object.entries(dimCount).sort((a, b) => b[1] - a[1])) {
  const def = dimensions.definitions[dim];
  console.log(`  ${dim.padEnd(10)} | ${count}次 | ${def?.name || '?'}`);
}

console.log(`\n总题目数: ${mainQuestions.length}`);
console.log(`双维度题目: ${mainQuestions.filter(q => (q.dims || []).length === 2).length}`);
console.log(`单维度题目: ${mainQuestions.filter(q => (q.dims || []).length === 1).length}`);
