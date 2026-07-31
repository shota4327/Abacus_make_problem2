/**
 * @file testPerformance.js
 * @description 割り算自動生成アルゴリズムの実行パフォーマンステストおよび小数のパターン（0.0xxx など）が正常に生成されているかを検証するパフォーマンステストスクリプトです。
 */

import { generateDivisionProblems } from './divisionGenerator.js';

let foundZeroZero = false;
let attempts = 0;

console.log("Searching for 0.0xxx or smaller patterns...");
while (!foundZeroZero && attempts < 20) {
    attempts++;
    let start = Date.now();
    let problems = generateDivisionProblems();
    
    problems.forEach((p) => {
        if (p.decimalDivisor !== null) {
            const rightArr = p.divisor.map(d => d === null ? '' : d);
            const decIdx = p.decimalDivisor;
            const rStr = rightArr.slice(0, decIdx + 1).join('') + '.' + rightArr.slice(decIdx + 1).join('');
            const val = parseFloat(rStr);
            if (val < 1) {
                console.log(`Attempt ${attempts} (${Date.now() - start}ms): Found ${rStr} (Dividend: ${p.dividend.filter(d => d !== null).join('')})`);
                if (rStr.startsWith("0.0")) {
                    foundZeroZero = true;
                }
            }
        }
    });
}

