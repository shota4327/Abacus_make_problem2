/**
 * 問題（Grid）が各種条件を満たしているかを検証し、統計情報を計算するモジュール。
 * UI（React State）から独立しており、一括生成時などの検証にも利用できます。
 */
import { COL_COUNT } from '../constants/initialState.js';

/**
 * 盤面の統計情報と条件の一致状況を計算します。
 *
 * @param {Array<Array<number|null>>} grid - 問題の盤面データ
 * @param {Array<boolean>} isMinusRows - 各行がマイナス（引き算）かどうか
 * @param {number} rowCount - 有効な行数
 * @param {number} targetTotalDigits - 目標とする合計桁数
 * @param {Object} conditions - 作問条件（plusOneDigit, enclosedDigit など）
 * @returns {Object} 統計情報と条件判定結果を含むオブジェクト
 */
export const calculateProblemStats = (grid, isMinusRows, rowCount, targetTotalDigits, conditions) => {
    const {
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
    } = conditions;

    let totalSum = 0;
    let totalRowDigits = 0;
    const frequency = []; // 各行の数字ごとの出現回数
    const totalFrequency = Array(10).fill(0); // 全体の数字ごとの出現回数
    const consecutive = Array(10).fill(null).map(() => Array(10).fill(0)); // 連続文字の出現回数 (consecutive[d1][d2])
    const rowDigitCounts = []; // 各行の桁数

    // 1. 各行の集計と連続文字のカウント
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row = grid[rowIndex];
        let rowValueString = "";
        let rowDigitCount = 0;
        let isLeading = true; // 先頭のゼロをスキップするためのフラグ
        const rowFreq = Array(10).fill(0);

        row.forEach((digit, colIndex) => {
            const currentDigit = digit === null ? 0 : digit;
            rowValueString += currentDigit;

            // 先頭のゼロ以外が出たらフラグを折る
            if (currentDigit !== 0) isLeading = false;
            
            // 先頭のゼロは統計に含めない
            if (isLeading) return;

            rowFreq[currentDigit]++;
            totalFrequency[currentDigit]++;
            rowDigitCount++;

            // 連続文字（右隣の文字）のカウント
            if (colIndex < COL_COUNT - 1) {
                const nextDigit = row[colIndex + 1] === null ? 0 : row[colIndex + 1];
                consecutive[currentDigit][nextDigit]++;
            }
        });

        frequency.push(rowFreq);
        rowDigitCounts.push(rowDigitCount);
        totalRowDigits += rowDigitCount;

        // 行の値を計算して合計に加算
        const rowValue = (parseInt(rowValueString, 10) || 0) * (isMinusRows[rowIndex] ? -1 : 1);
        totalSum += rowValue;
    }

    // 2. 補数計算（途中でマイナスになるか）のチェック
    let hasComplement = false;
    let runningTotal = 0;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row = grid[rowIndex];
        let rowValueString = "";
        row.forEach(digit => {
            rowValueString += (digit === null ? 0 : digit);
        });
        
        const rowValue = (parseInt(rowValueString, 10) || 0) * (isMinusRows[rowIndex] ? -1 : 1);
        runningTotal += rowValue;
        
        // 途中計算でマイナスになれば補数計算が発生している
        if (runningTotal < 0) hasComplement = true;
    }

    const messages = [];
    if (hasComplement) messages.push("補数計算あり");
    if (totalSum < 0) messages.push("結果がマイナス");
    const complementStatus = messages.length > 0 ? messages.join("・") : "なし";

    // 3. 数字ごとの出現回数の過不足（ベースラインとの差分）
    const frequencyDiffs = Array(10).fill(0).map((_, digit) => {
        let baseline = targetTotalDigits / 10;
        if (plusOneDigit !== null && digit === Number(plusOneDigit)) baseline += 1;
        if (minusOneDigit !== null && digit === Number(minusOneDigit)) baseline -= 1;
        return totalFrequency[digit] - baseline;
    });

    // 4. 囲み文字、はさまれ文字、連続文字の条件チェック
    let isEnclosedUsed = enclosedDigit == null;
    if (!isEnclosedUsed) {
        const target = Number(enclosedDigit);
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const row = grid[rowIndex];
            const firstNonZeroIndex = row.findIndex(digit => digit !== null && digit !== 0);
            
            for (let colIndex = 0; colIndex < COL_COUNT; colIndex++) {
                if (firstNonZeroIndex === -1 || colIndex < firstNonZeroIndex) continue;
                
                if (row[colIndex] !== null && row[colIndex] === target) {
                    const hasGapLeft = colIndex > 1 && (colIndex - 2 >= firstNonZeroIndex) && row[colIndex - 2] === target;
                    const hasGapRight = colIndex < COL_COUNT - 2 && row[colIndex + 2] === target;
                    
                    if (hasGapLeft || hasGapRight) {
                        isEnclosedUsed = true;
                        break;
                    }
                }
            }
            if (isEnclosedUsed) break;
        }
    }

    let isSandwichedUsed = sandwichedDigit == null;
    if (!isSandwichedUsed) {
        const target = Number(sandwichedDigit);
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const row = grid[rowIndex];
            const firstNonZeroIndex = row.findIndex(digit => digit !== null && digit !== 0);
            
            for (let colIndex = 1; colIndex < COL_COUNT - 1; colIndex++) {
                if (firstNonZeroIndex === -1 || colIndex < firstNonZeroIndex) continue;
                
                if (row[colIndex] !== null && row[colIndex] === target) {
                    // 左右が同じ数字かどうか (例: 3-5-3 の 5)
                    if (row[colIndex - 1] !== null && (colIndex - 1 >= firstNonZeroIndex) && row[colIndex - 1] === row[colIndex + 1]) {
                        isSandwichedUsed = true;
                        break;
                    }
                }
            }
            if (isSandwichedUsed) break;
        }
    }

    let isConsecutiveUsed = consecutiveDigit == null;
    if (!isConsecutiveUsed) {
        const target = Number(consecutiveDigit);
        // consecutive[d1][d2] は d1 の次に d2 が来る回数
        if (!isNaN(target) && consecutive[target] && consecutive[target][target] > 0) {
            isConsecutiveUsed = true;
        }
    }

    // 5. 各種制限（1口目、最終口、答え）の判定
    const checkMatch = (target, actual) => {
        if (target === null) return true;
        return Number(target) === Number(actual);
    };

    const getMostAndLeastSignificantDigit = (rowArr) => {
        let msd = null; // 最上位桁 (Most Significant Digit)
        let lsd = null; // 最下位桁 (Least Significant Digit)
        for (let i = 0; i < rowArr.length; i++) {
            const cell = rowArr[i];
            if (cell !== null && cell !== "" && cell !== undefined) {
                if (msd === null) msd = cell;
                lsd = cell;
            }
        }
        return { msd, lsd };
    };

    const firstRow = grid[0];
    const { msd: firstRowMsd, lsd: firstRowLsd } = getMostAndLeastSignificantDigit(firstRow);

    const lastRow = grid[rowCount - 1];
    const { msd: lastRowMsd, lsd: lastRowLsd } = getMostAndLeastSignificantDigit(lastRow);

    const sumString = String(Math.abs(totalSum));
    const ansMsd = sumString[0];
    const ansLsd = sumString[sumString.length - 1];

    const isFirstMinValid = checkMatch(firstRowFirstDigit, firstRowMsd);
    const isFirstMaxValid = checkMatch(firstRowLastDigit, firstRowLsd);
    const isLastMinValid = checkMatch(lastRowFirstDigit, lastRowMsd);
    const isLastMaxValid = checkMatch(lastRowLastDigit, lastRowLsd);
    const isAnsMinValid = checkMatch(answerFirstDigit, ansMsd);
    const isAnsMaxValid = checkMatch(answerLastDigit, ansLsd);

    return {
        totalSum,
        frequency,
        totalFrequency,
        frequencyDiffs,
        consecutive,
        rowDigitCounts,
        totalRowDigits,
        complementStatus,
        isEnclosedUsed,
        isSandwichedUsed,
        isConsecutiveUsed,
        isFirstMinValid,
        isFirstMaxValid,
        isLastMinValid,
        isLastMaxValid,
        isAnsMinValid,
        isAnsMaxValid
    };
};
