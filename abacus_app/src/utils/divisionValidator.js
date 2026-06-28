/**
 * 除算の問題（problems）の統計情報（出現回数、連続文字など）を計算するモジュール。
 * UI（React State）から独立しています。
 */

/**
 * 渡された桁配列の集合（dataSets）から、各数字(0-9)の出現回数を各行ごとに計算します。
 * @param {Array<Array<number|null>>} dataSets - 桁データの配列
 * @returns {Array<Array<number>>} [行インデックス][数字(0-9)] -> 出現回数 の2次元配列
 */
const calculateFrequency = (dataSets) => {
    return dataSets.map(row => {
        const counts = Array(10).fill(0);
        row.forEach(digit => {
            if (digit !== null && digit !== undefined && digit !== '') {
                counts[digit]++;
            }
        });
        return counts;
    });
};

/**
 * 各行ごとの出現回数テーブルから、全体の数字ごとの出現回数を計算します。
 * @param {Array<Array<number>>} freqTable - calculateFrequency で計算された2次元配列
 * @returns {Array<number>} 全体の数字(0-9)ごとの出現回数
 */
const calculateTotalFrequency = (freqTable) => {
    const total = Array(10).fill(0);
    freqTable.forEach(rowCounts => {
        rowCounts.forEach((count, digit) => {
            total[digit] += count;
        });
    });
    return total;
};

/**
 * 各行ごとの実際の桁数（入力されている数字の数）を計算します。
 * @param {Array<Array<number|null>>} dataSets - 桁データの配列
 * @returns {Array<number>} 各行の桁数
 */
const calculateRowDigitCounts = (dataSets) => {
    return dataSets.map(row => row.filter(digit => digit !== null && digit !== undefined && digit !== '').length);
};

/**
 * 除算の全問題の統計情報を計算します。
 * 条件としてチェックするのは「割る数(divisor)」と「答え(answer)」のみ。
 * @param {Array<Object>} problems - 問題オブジェクトの配列
 * @returns {Object} 統計情報
 */
export const calculateDivisionStats = (problems) => {
    // 1. 全体（割る数 + 答え）の統計
    const allRows = problems.map(p => [...p.divisor, ...p.answer]);
    const frequencyAll = calculateFrequency(allRows);
    const totalFrequencyAll = calculateTotalFrequency(frequencyAll);
    const rowDigitCountsAll = calculateRowDigitCounts(allRows);
    const totalRowDigitsAll = rowDigitCountsAll.reduce((sum, count) => sum + count, 0);

    // 除算（割る数＋答え）の場合、全体の目標桁数は110（各数字11回）
    const targetTotalDigitsAll = 110;
    const frequencyDiffsAll = totalFrequencyAll.map(count => count - 11);

    // 2. 割る数（divisor）のみの統計
    const divisorRows = problems.map(p => p.divisor);
    const frequencyDivisor = calculateFrequency(divisorRows);
    const totalFrequencyDivisor = calculateTotalFrequency(frequencyDivisor);
    const rowDigitCountsDivisor = calculateRowDigitCounts(divisorRows);
    const totalRowDigitsDivisor = rowDigitCountsDivisor.reduce((sum, count) => sum + count, 0);

    // 3. 答え（answer）のみの統計
    const answerRows = problems.map(p => p.answer);
    const frequencyAnswer = calculateFrequency(answerRows);
    const totalFrequencyAnswer = calculateTotalFrequency(frequencyAnswer);
    const rowDigitCountsAnswer = calculateRowDigitCounts(answerRows);
    const totalRowDigitsAnswer = rowDigitCountsAnswer.reduce((sum, count) => sum + count, 0);

    // 4. 連続文字のチェック（割る数、答えそれぞれの中で連続している数字をカウント）
    const consecutive = Array(10).fill(null).map(() => Array(10).fill(0)); // [d1][d2] マトリクス

    problems.forEach(p => {
        // 割る数の連続チェック
        for (let i = 0; i < p.divisor.length - 1; i++) {
            const current = p.divisor[i];
            const next = p.divisor[i + 1];
            if (current !== null && next !== null) {
                consecutive[current][next]++;
            }
        }
        // 答えの連続チェック
        for (let i = 0; i < p.answer.length - 1; i++) {
            const current = p.answer[i];
            const next = p.answer[i + 1];
            if (current !== null && next !== null) {
                consecutive[current][next]++;
            }
        }
    });

    return {
        frequencyAll,
        totalFrequencyAll,
        rowDigitCountsAll,
        totalRowDigitsAll,
        frequencyDiffsAll,
        targetTotalDigitsAll,
        frequencyDivisor,
        totalFrequencyDivisor,
        rowDigitCountsDivisor,
        totalRowDigitsDivisor,
        frequencyAnswer,
        totalFrequencyAnswer,
        rowDigitCountsAnswer,
        totalRowDigitsAnswer,
        consecutive
    };
};
