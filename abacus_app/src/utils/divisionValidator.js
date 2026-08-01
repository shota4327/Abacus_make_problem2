/**
 * @file divisionValidator.js
 * @description 割り算問題(10問)における「割る数(divisor)」および「商・答え(answer)」の数字出現頻度、有効桁数、連続桁マトリクス等の統計情報を計算する集計・検証モジュールです。
 */

// 共通バリデーションユーティリティのインポート
import { calculateFrequency, calculateTotalFrequency, calculateRowDigitCounts } from './validatorUtils.js';

// 他ファイルからの参照用に再エクスポート
export { calculateFrequency, calculateTotalFrequency, calculateRowDigitCounts };

/**
 * 10問分の割り算問題オブジェクト配列から、割る数・商および全体の詳細統計情報を計算します。
 * 
 * @param {Array<Object>} problems - 10問分の割り算問題オブジェクト配列
 * @returns {Object} 集計結果オブジェクト（割る数・商・全体の出現頻度、桁数、目標差分、連続文字等）
 */
export const calculateDivisionStats = (problems) => {
    // 1. 全体（割る数 + 答え）の集計
    const allRows = problems.map(p => [...p.divisor, ...p.answer]);
    const frequencyAll = calculateFrequency(allRows);
    const totalFrequencyAll = calculateTotalFrequency(frequencyAll);
    const rowDigitCountsAll = calculateRowDigitCounts(allRows);
    const totalRowDigitsAll = rowDigitCountsAll.reduce((sum, count) => sum + count, 0);

    // 割り算（割る数＋答え）の場合、全体の目標合計桁数は110桁（各数字0-9が平均11回出現するのが理想）
    const targetTotalDigitsAll = 110;
    const frequencyDiffsAll = totalFrequencyAll.map(count => count - 11);

    // 2. 割る数（divisor）のみの統計
    const divisorRows = problems.map(p => p.divisor);
    const frequencyDivisor = calculateFrequency(divisorRows);
    const totalFrequencyDivisor = calculateTotalFrequency(frequencyDivisor);
    const rowDigitCountsDivisor = calculateRowDigitCounts(divisorRows);
    const totalRowDigitsDivisor = rowDigitCountsDivisor.reduce((sum, count) => sum + count, 0);

    // 3. 答え・商（answer）のみの統計
    const answerRows = problems.map(p => p.answer);
    const frequencyAnswer = calculateFrequency(answerRows);
    const totalFrequencyAnswer = calculateTotalFrequency(frequencyAnswer);
    const rowDigitCountsAnswer = calculateRowDigitCounts(answerRows);
    const totalRowDigitsAnswer = rowDigitCountsAnswer.reduce((sum, count) => sum + count, 0);

    // 4. 連続文字のチェック（割る数、答えそれぞれの内部で隣接する2数字ペアのカウント）
    const consecutive = Array(10).fill(null).map(() => Array(10).fill(0)); // [d1][d2] マトリクス

    const countConsecutivePairs = (row) => {
        let foundNonZero = false;
        let lastValid = null;
        for (let i = 0; i < row.length; i++) {
            const current = row[i];
            if (current !== null && current !== undefined && current !== '') {
                const num = Number(current);
                if (num === 0 && !foundNonZero) continue;
                foundNonZero = true;
                if (lastValid !== null) {
                    consecutive[lastValid][num]++;
                }
                lastValid = num;
            }
        }
    };

    problems.forEach(p => {
        // 割る数の連続チェック（先頭のゼロはスキップ）
        countConsecutivePairs(p.divisor);
        // 答えの連続チェック（先頭のゼロはスキップ）
        countConsecutivePairs(p.answer);
    });

    return {
        frequencyAll,           // 各問題の（割る数＋商）数字出現頻度
        totalFrequencyAll,      // 全問題通算の数字別出現頻度
        rowDigitCountsAll,      // 各問題の合計桁数
        totalRowDigitsAll,      // 全問題通算の総桁数
        frequencyDiffsAll,      // 理想平均(11回)との差分
        targetTotalDigitsAll,   // 目標総桁数 (110)
        frequencyDivisor,       // 割る数の問題・数字別出現頻度
        totalFrequencyDivisor,  // 割る数の全問題通算・数字別出現頻度
        rowDigitCountsDivisor,  // 割る数の問題別桁数
        totalRowDigitsDivisor,  // 割る数の総桁数
        frequencyAnswer,        // 商（答え）の問題・数字別出現頻度
        totalFrequencyAnswer,   // 商（答え）の全問題通算・数字別出現頻度
        rowDigitCountsAnswer,   // 商（答え）の問題別桁数
        totalRowDigitsAnswer,   // 商（答え）の総桁数
        consecutive             // 2数字ペア連続出現度マトリクス [d1][d2]
    };
};

