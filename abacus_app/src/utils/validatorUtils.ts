/**
 * @file validatorUtils.ts
 * @description かけ算・わり算バリデーター共通のユーティリティ関数
 */

/**
 * 渡された桁配列の集合（dataSets）から、各数字(0-9)の出現回数を各行（各問題）ごとに計算します。
 * 数値の先頭に存在するゼロ（leading zeros）はカウント対象から除外します。
 * 
 * @param dataSets - 各問題の桁数値配列のコレクション
 * @returns [行インデックス][数字(0-9)] -> 出現回数 の2次元配列
 */
export function calculateFrequency(dataSets: (number | null | string)[][]): number[][] {
    return dataSets.map(row => {
        const counts: number[] = Array(10).fill(0);
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
                counts[num] = (counts[num] ?? 0) + 1;
            }
        });
        return counts;
    });
}

/**
 * 各行ごとの出現回数テーブルを集計し、全体の数字(0-9)ごとの通算出現回数を算出します。
 * 
 * @param freqTable - calculateFrequencyで算出された行別出現回数テーブル
 * @returns 数字(0-9)ごとの合計出現回数配列
 */
export function calculateTotalFrequency(freqTable: number[][]): number[] {
    const total: number[] = Array(10).fill(0);
    freqTable.forEach(rowCounts => {
        rowCounts.forEach((count, digit) => {
            total[digit] = (total[digit] ?? 0) + count;
        });
    });
    return total;
}

/**
 * 各行ごとの実際の有効桁数（先頭ゼロを除く入力数字の個数）を計算します。
 * 
 * @param dataSets - 桁数値配列のコレクション
 * @returns 各行の有効桁数配列
 */
export function calculateRowDigitCounts(dataSets: (number | null | string)[][]): number[] {
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
}
