/**
 * verify_1000_runs.js
 * 
 * 要件 R4 を満たす 1,000回連続問題生成自動検証テストスクリプト (E2E)
 * 
 * 【検証仕様要求】
 * 1. 実行モデル: generateDivisionProblems() を 1,000回連続呼び出し（合計10,000問題）
 * 2. R1 (数学的整合性): Dividendが正の整数、計算整合性(確信商/還元商/整数商)、null/フォールバック非発生
 * 3. R2 (出現回数完全均等配分): 除数55桁＋商55桁＝全110桁で0〜9が正確に各11回出現
 * 4. R3 (既存品質制約): 末尾数字網羅(0〜9各1回)、先頭数字制限/Dividend先頭1〜9網羅、不要なAA/ABA非検出
 * 5. 集計・ログ出力と終了コード: 詳細内訳の出力とパス時0/違反時非0での終了
 */

import { generateDivisionProblems } from './abacus_app/src/utils/divisionGenerator.js';

// console.warn をフックしてフォールバック発生を検出
let warnOccurred = false;
let lastWarnMessage = '';
const originalWarn = console.warn;
console.warn = (...args) => {
    warnOccurred = true;
    lastWarnMessage = args.join(' ');
};

function runVerification() {
    console.log("==================================================");
    console.log(" 1000回連続問題生成 自動検証テスト (R4 / E2E)");
    console.log("==================================================");
    console.log("開始時間:", new Date().toLocaleString('ja-JP'));
    console.log("対象関数: generateDivisionProblems()\n");

    // CLI引数または環境変数からの回数取得（デフォルト 1000）
    let TOTAL_RUNS = 1000;
    const runsArgIdx = process.argv.indexOf('--runs');
    if (runsArgIdx !== -1 && process.argv[runsArgIdx + 1]) {
        const parsed = parseInt(process.argv[runsArgIdx + 1], 10);
        if (!isNaN(parsed) && parsed > 0) TOTAL_RUNS = parsed;
    } else if (process.env.RUNS) {
        const parsed = parseInt(process.env.RUNS, 10);
        if (!isNaN(parsed) && parsed > 0) TOTAL_RUNS = parsed;
    }
    
    let stats = {
        totalRuns: TOTAL_RUNS,
        successRuns: 0,
        fallbackRuns: 0,
        r1MathErrors: 0,
        r2DistributionErrors: 0,
        zcCounts: { 1: 0, 2: 0, 3: 0 },
        zcDistributionErrors: 0,
        r3QualityErrors: {
            tailDigitErrors: 0,
            headDigitErrors: 0,
            patternErrors: 0,
            total: 0
        }
    };

    const errorDetails = [];
    const startTime = performance.now();

    for (let run = 1; run <= TOTAL_RUNS; run++) {
        warnOccurred = false;
        lastWarnMessage = '';

        let runPassed = true;
        const runErrors = [];

        // 1. 問題生成呼び出し
        let problems;
        try {
            problems = generateDivisionProblems();
        } catch (e) {
            runPassed = false;
            stats.r1MathErrors++;
            runErrors.push(`[R1 Error] 例外発生: ${e.message}`);
            errorDetails.push({ run, errors: runErrors, isFallback: false });
            continue;
        }

        // null/undefined 返却チェック
        if (!problems || !Array.isArray(problems) || problems.length !== 10) {
            runPassed = false;
            stats.r1MathErrors++;
            runErrors.push(`[R1 Error] 不正な問題配列の返却: ${problems}`);
            errorDetails.push({ run, errors: runErrors, isFallback: false });
            continue;
        }

        // フォールバックチェック
        let isFallback = warnOccurred;

        // --- R1: 数学的整合性の詳細検証 ---
        for (let i = 0; i < 10; i++) {
            const p = problems[i];
            if (!p || !p.dividend || !p.answer || !p.divisor) {
                runPassed = false;
                stats.r1MathErrors++;
                runErrors.push(`[R1 Error] 問${i + 1}: 不正な問題構造`);
                break;
            }

            // Dividend (割られる数) が正の整数か
            const divDigits = p.dividend.filter(d => d !== null);
            const divStr = divDigits.join('');
            const divVal = Number(divStr);

            if (!Number.isInteger(divVal) || divVal <= 0) {
                runPassed = false;
                stats.r1MathErrors++;
                runErrors.push(`[R1 Error] 問${i + 1}: Dividendが正の整数でない (${divStr})`);
            }

            // 商 (Answer, A)
            const ansDigits = p.answer.filter(d => d !== null);
            const aVal = parseInt(ansDigits.join(''), 10);

            // 除数 (Divisor, B)
            let bVal;
            if (p.decimalDivisor !== null && p.decimalDivisor !== undefined) {
                const decIdx = p.decimalDivisor;
                const divRawWithZero = p.divisor.map(d => (d === null ? '0' : String(d)));
                const bStr = divRawWithZero.slice(0, decIdx + 1).join('') + '.' + divRawWithZero.slice(decIdx + 1).join('');
                bVal = parseFloat(bStr);
            } else {
                const bStr = p.divisor.filter(d => d !== null).join('');
                bVal = parseInt(bStr, 10);
            }

            if (bVal < 1) {
                if (bVal >= 0.1 - 1e-9) stats.zcCounts[1]++;
                else if (bVal >= 0.01 - 1e-9) stats.zcCounts[2]++;
                else if (bVal >= 0.001 - 1e-9) stats.zcCounts[3]++;
            }

            if (isNaN(bVal) || bVal <= 0 || isNaN(aVal) || aVal <= 0) {
                runPassed = false;
                stats.r1MathErrors++;
                runErrors.push(`[R1 Error] 問${i + 1}: 除数(${bVal}) または 商(${aVal}) が不正`);
            } else {
                // 四捨五入計算の整合性検証
                const calcA = Math.round(divVal / bVal);
                if (calcA !== aVal) {
                    runPassed = false;
                    stats.r1MathErrors++;
                    runErrors.push(`[R1 Error] 問${i + 1}: 計算整合性違反 div(${divVal}) / B(${bVal}) = ${divVal / bVal}, Math.round=${calcA}, expected Ans=${aVal}`);
                }

                // roundType ('up', 'down', 'int') の検証
                const q = divVal / bVal;
                const remainderFraction = q - Math.floor(q);
                if (p.roundType === 'int') {
                    if (Math.abs(q - aVal) > 1e-7) {
                        runPassed = false;
                        stats.r1MathErrors++;
                        runErrors.push(`[R1 Error] 問${i + 1}: roundType 'int' 違反 (q=${q}, aVal=${aVal})`);
                    }
                } else if (p.roundType === 'up') {
                    if (remainderFraction < 0.5 - 1e-7) {
                        runPassed = false;
                        stats.r1MathErrors++;
                        runErrors.push(`[R1 Error] 問${i + 1}: roundType 'up' 違反 (fraction=${remainderFraction} < 0.5)`);
                    }
                } else if (p.roundType === 'down') {
                    if (remainderFraction <= 1e-7 || remainderFraction >= 0.5) {
                        runPassed = false;
                        stats.r1MathErrors++;
                        runErrors.push(`[R1 Error] 問${i + 1}: roundType 'down' 違反 (fraction=${remainderFraction})`);
                    }
                }
            }
        }

        // --- R2: 出現回数完全均等配分の検証 ---
        // 10問1セット全体の全桁（除数55桁＋商55桁＝合計110桁）で 0〜9 の数字が各11回
        const digitCounts = Array(10).fill(0);
        let totalDigitsCount = 0;

        for (let i = 0; i < 10; i++) {
            const p = problems[i];
            const ansDigits = p.answer.filter(d => d !== null);
            const divDigits = p.divisor.filter(d => d !== null);

            for (const d of ansDigits) {
                digitCounts[d]++;
                totalDigitsCount++;
            }
            for (const d of divDigits) {
                digitCounts[d]++;
                totalDigitsCount++;
            }
        }

        let r2Passed = true;
        if (totalDigitsCount !== 110) {
            r2Passed = false;
            runErrors.push(`[R2 Error] 全桁数が110桁でない (${totalDigitsCount}桁)`);
        }
        for (let d = 0; d <= 9; d++) {
            if (digitCounts[d] !== 11) {
                r2Passed = false;
                runErrors.push(`[R2 Error] 数字 '${d}' の出現回数が11回でない (${digitCounts[d]}回)`);
            }
        }
        if (!r2Passed) {
            runPassed = false;
            stats.r2DistributionErrors++;
        }

        // --- R3: 既存品質制約の検証 ---
        let r3Passed = true;

        // 1. 末尾数字網羅 (商側、除数側それぞれの末尾桁に0〜9が各1回)
        const ansTails = new Set();
        const divTails = new Set();

        for (let i = 0; i < 10; i++) {
            const ansDigits = problems[i].answer.filter(d => d !== null);
            const divDigits = problems[i].divisor.filter(d => d !== null);

            if (ansDigits.length > 0) ansTails.add(ansDigits[ansDigits.length - 1]);
            if (divDigits.length > 0) divTails.add(divDigits[divDigits.length - 1]);
        }

        if (ansTails.size !== 10 || divTails.size !== 10) {
            r3Passed = false;
            stats.r3QualityErrors.tailDigitErrors++;
            runErrors.push(`[R3 Error] 末尾数字網羅違反 (商末尾種類:${ansTails.size}, 除数末尾種類:${divTails.size})`);
        }

        // 2. 先頭数字制限 & Dividend 先頭 1〜9 網羅
        const dividendFirstDigits = new Set();
        for (let i = 0; i < 10; i++) {
            const ansDigits = problems[i].answer.filter(d => d !== null);
            const divDigits = problems[i].divisor.filter(d => d !== null);
            const dividendDigits = problems[i].dividend.filter(d => d !== null);

            if (ansDigits[0] === 0) {
                r3Passed = false;
                stats.r3QualityErrors.headDigitErrors++;
                runErrors.push(`[R3 Error] 問${i + 1}: 商の先頭桁に 0 が出現`);
            }
            if (divDigits[0] === 0) {
                r3Passed = false;
                stats.r3QualityErrors.headDigitErrors++;
                runErrors.push(`[R3 Error] 問${i + 1}: 除数の先頭桁に 0 が出現`);
            }

            if (dividendDigits.length > 0) {
                const firstNonZero = dividendDigits.find(d => d !== 0);
                if (firstNonZero !== undefined) {
                    dividendFirstDigits.add(firstNonZero);
                }
            }
        }

        if (dividendFirstDigits.size < 9) {
            r3Passed = false;
            stats.r3QualityErrors.headDigitErrors++;
            runErrors.push(`[R3 Error] Dividend先頭1〜9網羅違反 (網羅数:${dividendFirstDigits.size}/9)`);
            isFallback = true;
        }

        // 3. 連続 (AA)・挟み (ABA) 数字の発生パターン検証
        let ansAACount = 0, ansABACount = 0;
        let divAACount = 0, divABACount = 0;
        let ansNonTargetPatternCount = 0;
        let divNonTargetPatternCount = 0;

        for (let i = 0; i < 10; i++) {
            const ansDigits = problems[i].answer.filter(d => d !== null);
            const divDigits = problems[i].divisor.filter(d => d !== null);

            // 商 (Answer) 側
            let aAA = 0, aABA = 0;
            for (let k = 1; k < ansDigits.length; k++) {
                if (ansDigits[k] === ansDigits[k - 1]) aAA++;
            }
            for (let k = 2; k < ansDigits.length; k++) {
                if (ansDigits[k] === ansDigits[k - 2]) aABA++;
            }
            if (aAA > 0) ansAACount++;
            if (aABA > 0) ansABACount++;
            if (aAA > 1 || aABA > 1 || (aAA > 0 && aABA > 0)) {
                ansNonTargetPatternCount++;
            }

            // 除数 (Divisor) 側
            let dAA = 0, dABA = 0;
            for (let k = 1; k < divDigits.length; k++) {
                if (divDigits[k] === divDigits[k - 1]) dAA++;
            }
            for (let k = 2; k < divDigits.length; k++) {
                if (divDigits[k] === divDigits[k - 2]) dABA++;
            }
            if (dAA > 0) divAACount++;
            if (dABA > 0) divABACount++;
            if (dAA > 1 || dABA > 1 || (dAA > 0 && dABA > 0)) {
                divNonTargetPatternCount++;
            }
        }

        if (ansAACount !== 1 || ansABACount !== 1 || divAACount !== 1 || divABACount !== 1 ||
            ansNonTargetPatternCount > 0 || divNonTargetPatternCount > 0) {
            r3Passed = false;
            stats.r3QualityErrors.patternErrors++;
            runErrors.push(`[R3 Error] AA/ABAパターン構成違反 (Ans AA:${ansAACount}, ABA:${ansABACount} / Div AA:${divAACount}, ABA:${divABACount})`);
        }

        if (!r3Passed) {
            runPassed = false;
            stats.r3QualityErrors.total++;
        }

        // フォールバック集計
        if (isFallback) {
            stats.fallbackRuns++;
        }

        // 総括
        if (runPassed && !isFallback) {
            stats.successRuns++;
        } else {
            if (errorDetails.length < 50) {
                errorDetails.push({ run, errors: runErrors, isFallback });
            }
        }

        // 進捗ログ (50回毎)
        if (run % 50 === 0 || run === TOTAL_RUNS) {
            const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(1);
            const avgPerRun = (elapsedSec / run).toFixed(2);
            const remainingSec = ((TOTAL_RUNS - run) * avgPerRun).toFixed(0);
            console.log(`[進捗] ${run} / ${TOTAL_RUNS} 回完了 | 経過: ${elapsedSec}s (平均 ${avgPerRun}s/run, 予測残り: ${remainingSec}s) | 成功: ${stats.successRuns}, フォールバック: ${stats.fallbackRuns}, エラー(R1:${stats.r1MathErrors}, R2:${stats.r2DistributionErrors}, R3:${stats.r3QualityErrors.total})`);
        }
    }

    const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
    const totalLessThanOne = stats.zcCounts[1] + stats.zcCounts[2] + stats.zcCounts[3];
    const rZc1 = totalLessThanOne > 0 ? stats.zcCounts[1] / totalLessThanOne : 0;
    const rZc2 = totalLessThanOne > 0 ? stats.zcCounts[2] / totalLessThanOne : 0;
    const rZc3 = totalLessThanOne > 0 ? stats.zcCounts[3] / totalLessThanOne : 0;

    // zc分布アサート (各 30%〜36.6% の範囲内)
    if (totalLessThanOne === 0 || rZc1 < 0.30 || rZc1 > 0.366 || rZc2 < 0.30 || rZc2 > 0.366 || rZc3 < 0.30 || rZc3 > 0.366) {
        stats.zcDistributionErrors++;
    }

    // 集計結果ログ出力
    console.log("\n==================================================");
    console.log(" 1,000回自動検証テスト 結果サマリー");
    console.log("==================================================");
    console.log(`総実行数        : ${stats.totalRuns} 回 (合計 10,000 問題)`);
    console.log(`実行所要時間    : ${totalTime} 秒 (${(totalTime / 60).toFixed(2)} 分)`);
    console.log(`完全成功数      : ${stats.successRuns} / 1,000 回`);
    console.log(`フォールバック数: ${stats.fallbackRuns} / 1,000 回`);
    console.log(`--------------------------------------------------`);
    console.log(`[zc 分布 (1未満の小数 0.xxx / 0.0xxx / 0.00xxx)]`);
    console.log(`  - zc=1 (0.xxx)   : ${stats.zcCounts[1]} 回 (${(rZc1 * 100).toFixed(2)}%)`);
    console.log(`  - zc=2 (0.0xxx)  : ${stats.zcCounts[2]} 回 (${(rZc2 * 100).toFixed(2)}%)`);
    console.log(`  - zc=3 (0.00xxx) : ${stats.zcCounts[3]} 回 (${(rZc3 * 100).toFixed(2)}%)`);
    console.log(`  - zc分布エラー   : ${stats.zcDistributionErrors}`);
    console.log(`--------------------------------------------------`);
    console.log(`[R1] 数学的整合性エラー数   : ${stats.r1MathErrors}`);
    console.log(`[R2] 桁数配分ズレエラー数   : ${stats.r2DistributionErrors}`);
    console.log(`[R3] 品質制約違反数 (合計)  : ${stats.r3QualityErrors.total}`);
    console.log(`     - 末尾数字網羅エラー   : ${stats.r3QualityErrors.tailDigitErrors}`);
    console.log(`     - 先頭桁/網羅エラー    : ${stats.r3QualityErrors.headDigitErrors}`);
    console.log(`     - AA/ABAパターン違反   : ${stats.r3QualityErrors.patternErrors}`);
    console.log("==================================================");

    if (errorDetails.length > 0) {
        console.log("\n【検出されたエラー・違反のサンプル (最大50件)】");
        errorDetails.slice(0, 50).forEach(e => {
            console.log(`▶ Run #${e.run}: ${e.isFallback ? '[FALLBACK] ' : ''}${e.errors.join(' | ')}`);
        });
    }

    const hasAnyError = (
        stats.successRuns !== TOTAL_RUNS ||
        stats.fallbackRuns > 0 ||
        stats.r1MathErrors > 0 ||
        stats.r2DistributionErrors > 0 ||
        stats.zcDistributionErrors > 0 ||
        stats.r3QualityErrors.total > 0
    );

    // 元の console.warn を復元
    console.warn = originalWarn;

    if (!hasAnyError) {
        console.log("\n✨ 【PASS】全1,000回の試行がすべての要件(R1, R2, R3)を完全クリアしました！");
        process.exit(0);
    } else {
        console.error("\n❌ 【FAIL】要件を満たさない試行またはエラー・フォールバックが検出されました。");
        process.exit(1);
    }
}

// 実行
runVerification();
