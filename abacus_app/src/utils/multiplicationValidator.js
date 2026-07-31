/**
 * @file multiplicationValidator.js
 * @description 掛け算問題(10問)の各項（被乗数・乗数）および全体の数字出現頻度、有効桁数、連続桁マトリクス等の統計情報を計算する集計・検証ユーティリティです。
 */

/**
 * 渡された桁配列の集合（dataSets）から、各数字(0-9)の出現回数を各行（各問題）ごとに計算します。
 * 数値の先頭に存在するゼロ（leading zeros）はカウント対象から除外します。
 * 
 * @param {Array<Array<number|null>>} dataSets - 各問題の桁数値配列のコレクション
 * @returns {Array<Array<number>>} [行インデックス][数字(0-9)] -> 出現回数 の2次元配列
 */
const calculateFrequency = (dataSets) => {
    return dataSets.map(row => {
        const counts = Array(10).fill(0);
        let foundNonZero = false;
        row.forEach(digit => {
            if (digit !== null && digit !== undefined && digit !== '') {
                const num = Number(digit);
                // 先頭のゼロはスキップ
                if (num === 0 && !foundNonZero) {
                    return;
                }
                if (num !== 0) {
                    foundNonZero = true;
                }
                counts[num]++;
            }
        });
        return counts;
    });
};

/**
 * 各行ごとの出現回数テーブルを集計し、全体の数字(0-9)ごとの通算出現回数を算出します。
 * 
 * @param {Array<Array<number>>} freqTable - calculateFrequencyで算出された行別出現回数テーブル
 * @returns {Array<number>} 数字(0-9)ごとの合計出現回数配列
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
 * 各行ごとの実際の有効桁数（先頭ゼロを除く入力数字の個数）を計算します。
 * 
 * @param {Array<Array<number|null>>} dataSets - 桁数値配列のコレクション
 * @returns {Array<number>} 各行の有効桁数配列
 */
const calculateRowDigitCounts = (dataSets) => {
    return dataSets.map(row => {
        let count = 0;
        let foundNonZero = false;
        row.forEach(digit => {
            if (digit !== null && digit !== undefined && digit !== '') {
                const num = Number(digit);
                if (num === 0 && !foundNonZero) {
                    return; // 先頭のゼロをスキップ
                }
                if (num !== 0) {
                    foundNonZero = true;
                }
                count++;
            }
        });
        return count;
    });
};

/**
 * 10問分の掛け算問題オブジェクト配列から、左辺・右辺および全体の詳細統計情報を計算します。
 * 
 * @param {Array<Object>} problems - 10問分の掛け算問題オブジェクト配列
 * @returns {Object} 集計結果オブジェクト（各辺および全体の頻度、桁数、目標差分、連続文字等）
 */
export const calculateMultiplicationStats = (problems) => {
    // 1. 左辺（被乗数）の統計集計
    const leftRows = problems.map(p => p.left);
    const frequencyLeft = calculateFrequency(leftRows);
    const totalFrequencyLeft = calculateTotalFrequency(frequencyLeft);
    const rowDigitCountsLeft = calculateRowDigitCounts(leftRows);
    const totalRowDigitsLeft = rowDigitCountsLeft.reduce((sum, count) => sum + count, 0);

    // 2. 右辺（乗数）の統計集計
    const rightRows = problems.map(p => p.right);
    const frequencyRight = calculateFrequency(rightRows);
    const totalFrequencyRight = calculateTotalFrequency(frequencyRight);
    const rowDigitCountsRight = calculateRowDigitCounts(rightRows);
    const totalRowDigitsRight = rowDigitCountsRight.reduce((sum, count) => sum + count, 0);

    // 3. 全体（左辺 ＋ 右辺）の合計統計
    // 行ごとの頻度は左右の和（頭の0を除外した集計結果の加算）
    const frequencyAll = frequencyLeft.map((leftRowCounts, index) => {
        return leftRowCounts.map((count, digit) => count + frequencyRight[index][digit]);
    });
    const totalFrequencyAll = calculateTotalFrequency(frequencyAll);
    const rowDigitCountsAll = rowDigitCountsLeft.map((leftCount, index) => leftCount + rowDigitCountsRight[index]);
    const totalRowDigitsAll = totalRowDigitsLeft + totalRowDigitsRight;

    // 掛け算の場合、全10問の目標合計桁数は110桁（各数字0-9が平均11回出現するのが理想）
    const targetTotalDigitsAll = 110;
    const frequencyDiffsAll = totalFrequencyAll.map(count => count - 11);

    // 4. 連続文字のチェック（左辺、右辺それぞれの内部で隣接して出現する2数字ペアのカウント）
    const consecutive = Array(10).fill(null).map(() => Array(10).fill(0)); // [d1][d2] マトリクス

    problems.forEach(p => {
        // 左辺の連続文字チェック（先頭のゼロはスキップ）
        let foundNonZeroLeft = false;
        let lastValidLeft = null;
        for (let i = 0; i < p.left.length; i++) {
            const current = p.left[i];
            if (current !== null && current !== undefined && current !== '') {
                const num = Number(current);
                if (num === 0 && !foundNonZeroLeft) continue;
                foundNonZeroLeft = true;
                if (lastValidLeft !== null) {
                    consecutive[lastValidLeft][num]++;
                }
                lastValidLeft = num;
            }
        }
        
        // 右辺の連続文字チェック（先頭のゼロはスキップ）
        let foundNonZeroRight = false;
        let lastValidRight = null;
        for (let i = 0; i < p.right.length; i++) {
            const current = p.right[i];
            if (current !== null && current !== undefined && current !== '') {
                const num = Number(current);
                if (num === 0 && !foundNonZeroRight) continue;
                foundNonZeroRight = true;
                if (lastValidRight !== null) {
                    consecutive[lastValidRight][num]++;
                }
                lastValidRight = num;
            }
        }
    });

    return {
        frequencyAll,            // 問題ごとの全数字出現頻度
        totalFrequencyAll,       // 全問題通算の数字別出現頻度
        rowDigitCountsAll,       // 問題ごとの左右合計桁数
        totalRowDigitsAll,       // 全問題通算の総桁数
        frequencyDiffsAll,       // 理想平均(11回)との差分
        targetTotalDigitsAll,    // 目標総桁数 (110)
        frequencyLeft,           // 左辺の各問題・数字別出現頻度
        totalFrequencyLeft,      // 左辺の全問題通算・数字別出現頻度
        rowDigitCountsLeft,      // 左辺の各問題桁数
        totalRowDigitsLeft,      // 左辺の総桁数
        frequencyRight,          // 右辺の各問題・数字別出現頻度
        totalFrequencyRight,     // 右辺の全問題通算・数字別出現頻度
        rowDigitCountsRight,     // 右辺の各問題桁数
        totalRowDigitsRight,     // 右辺の総桁数
        consecutive              // 2数字ペア連続出現度マトリクス [d1][d2]
    };
};

