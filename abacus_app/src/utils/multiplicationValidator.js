/**
 * 掛け算の問題（problems）の統計情報（出現回数、連続文字など）を計算するモジュール。
 * UI（React State）から独立しています。
 */

/**
 * 渡された桁配列の集合（dataSets）から、各数字(0-9)の出現回数を各行ごとに計算します。
 * @param {Array<Array<number|null>>} dataSets - 桁データの配列（例: 左辺のみの配列、右辺のみの配列）
 * @returns {Array<Array<number>>} [行インデックス][数字(0-9)] -> 出現回数 の2次元配列
 */
const calculateFrequency = (dataSets) => {
    return dataSets.map(row => {
        const counts = Array(10).fill(0);
        let foundNonZero = false;
        row.forEach(digit => {
            if (digit !== null && digit !== undefined && digit !== '') {
                if (digit === 0 && !foundNonZero) {
                    // Skip leading zeros
                    return;
                }
                if (digit !== 0) {
                    foundNonZero = true;
                }
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
    return dataSets.map(row => {
        let count = 0;
        let foundNonZero = false;
        row.forEach(digit => {
            if (digit !== null && digit !== undefined && digit !== '') {
                if (digit === 0 && !foundNonZero) {
                    return; // Skip leading zeros
                }
                if (digit !== 0) {
                    foundNonZero = true;
                }
                count++;
            }
        });
        return count;
    });
};

/**
 * 掛け算の全問題の統計情報を計算します。
 * @param {Array<Object>} problems - 問題オブジェクトの配列
 * @returns {Object} 統計情報
 */
export const calculateMultiplicationStats = (problems) => {
    // 1. 左辺（かけられる数）のみの統計
    const leftRows = problems.map(p => p.left);
    const frequencyLeft = calculateFrequency(leftRows);
    const totalFrequencyLeft = calculateTotalFrequency(frequencyLeft);
    const rowDigitCountsLeft = calculateRowDigitCounts(leftRows);
    const totalRowDigitsLeft = rowDigitCountsLeft.reduce((sum, count) => sum + count, 0);

    // 2. 右辺（かける数）のみの統計
    const rightRows = problems.map(p => p.right);
    const frequencyRight = calculateFrequency(rightRows);
    const totalFrequencyRight = calculateTotalFrequency(frequencyRight);
    const rowDigitCountsRight = calculateRowDigitCounts(rightRows);
    const totalRowDigitsRight = rowDigitCountsRight.reduce((sum, count) => sum + count, 0);

    // 3. 全体（左辺 + 右辺）の統計
    // 行ごとの頻度は左右の和を取る（頭の0を除外した結果同士を足す）
    const frequencyAll = frequencyLeft.map((leftRowCounts, index) => {
        return leftRowCounts.map((count, digit) => count + frequencyRight[index][digit]);
    });
    const totalFrequencyAll = calculateTotalFrequency(frequencyAll);
    const rowDigitCountsAll = rowDigitCountsLeft.map((leftCount, index) => leftCount + rowDigitCountsRight[index]);
    const totalRowDigitsAll = totalRowDigitsLeft + totalRowDigitsRight;

    // 掛け算の場合、全体の目標桁数は110（各数字11回）
    const targetTotalDigitsAll = 110;
    const frequencyDiffsAll = totalFrequencyAll.map(count => count - 11);

    // 4. 連続文字のチェック（左辺、右辺それぞれの中で連続している数字をカウント）
    const consecutive = Array(10).fill(null).map(() => Array(10).fill(0)); // [d1][d2] マトリクス

    problems.forEach(p => {
        // 左辺の連続チェック（頭の0をスキップ）
        let foundNonZeroLeft = false;
        let lastValidLeft = null;
        for (let i = 0; i < p.left.length; i++) {
            const current = p.left[i];
            if (current !== null) {
                if (current === 0 && !foundNonZeroLeft) continue;
                foundNonZeroLeft = true;
                if (lastValidLeft !== null) {
                    consecutive[lastValidLeft][current]++;
                }
                lastValidLeft = current;
            }
        }
        
        // 右辺の連続チェック（頭の0をスキップ）
        let foundNonZeroRight = false;
        let lastValidRight = null;
        for (let i = 0; i < p.right.length; i++) {
            const current = p.right[i];
            if (current !== null) {
                if (current === 0 && !foundNonZeroRight) continue;
                foundNonZeroRight = true;
                if (lastValidRight !== null) {
                    consecutive[lastValidRight][current]++;
                }
                lastValidRight = current;
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
        frequencyLeft,
        totalFrequencyLeft,
        rowDigitCountsLeft,
        totalRowDigitsLeft,
        frequencyRight,
        totalFrequencyRight,
        rowDigitCountsRight,
        totalRowDigitsRight,
        consecutive
    };
};
