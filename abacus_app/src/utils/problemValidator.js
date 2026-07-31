/**
 * @file problemValidator.js
 * @description 見取り算問題（20行×13列の盤面）が作問条件（桁数、特定の数字出現率、包み・挟み・連続桁、初口/最終口/答えの先頭・末尾桁など）を満たしているか検証し、各種統計情報を算出する検証・集計モジュールです。
 */

import { COL_COUNT } from '../constants/initialState.js';

/**
 * 盤面の各種統計情報および条件判定の成否を計算します。
 *
 * @param {Array<Array<number|null>>} grid - 問題の盤面データ（20x13セル）
 * @param {boolean[]} isMinusRows - 各行がマイナス（引き算）かどうかを表すフラグ配列
 * @param {number} rowCount - 有効な行数（口数）
 * @param {number} targetTotalDigits - 目標とする全体合計桁数（各数字平均出現数の計算等で使用）
 * @param {Object} conditions - 作問制約条件
 * @param {number|null} conditions.plusOneDigit - 出現数を1増やす数字
 * @param {number|null} conditions.minusOneDigit - 出現数を1減らす数字
 * @param {number|null} conditions.enclosedDigit - 包み（X_X）判定対象数字
 * @param {number|null} conditions.sandwichedDigit - 挟み（A X A）判定対象数字
 * @param {number|null} conditions.consecutiveDigit - 連続（X X）判定対象数字
 * @param {number|null} conditions.firstRowFirstDigit - 1口目の最上位桁の指定
 * @param {number|null} conditions.firstRowLastDigit - 1口目の最下位桁の指定
 * @param {number|null} conditions.lastRowFirstDigit - 最終口の最上位桁の指定
 * @param {number|null} conditions.lastRowLastDigit - 最終口の最下位桁の指定
 * @param {number|null} conditions.answerFirstDigit - 答えの最上位桁の指定
 * @param {number|null} conditions.answerLastDigit - 答えの最下位桁の指定
 * @returns {Object} 計算結果の統計データと条件検証フラグ
 */
export const calculateProblemStats = (grid, isMinusRows, rowCount, targetTotalDigits, conditions) => {
    const {
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit
    } = conditions;

    let totalSum = 0;                          // 見取り算の合計値（答え）
    let totalRowDigits = 0;                    // 問題全体の有効数字桁数合計
    const frequency = [];                      // 各行ごとの数字(0-9)出現頻度配列 [row][digit]
    const totalFrequency = Array(10).fill(0);  // 全行を通じた数字(0-9)の合計出現頻度
    const consecutive = Array(10).fill(null).map(() => Array(10).fill(0)); // 連続数字の出現回数マトリクス [d1][d2]
    const rowDigitCounts = [];                 // 各行の有効桁数配列

    // 1. 各行の有効桁数集計、数字出現度、連続数字のカウント
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        const row = grid[rowIndex];
        let rowValueString = "";
        let rowDigitCount = 0;
        let isLeading = true; // 前方ゼロ（数値の前の空セル/ゼロ）をスキップするためのフラグ
        const rowFreq = Array(10).fill(0);

        row.forEach((digit, colIndex) => {
            const currentDigit = digit === null ? 0 : digit;
            rowValueString += currentDigit;

            // 最初に出現した0以外の数字でleadingフラグをクリア
            if (currentDigit !== 0) isLeading = false;
            
            // 数値としての先頭のゼロは桁数・出現カウントに含めない
            if (isLeading) return;

            rowFreq[currentDigit]++;
            totalFrequency[currentDigit]++;
            rowDigitCount++;

            // 隣接する右側の数字との連続ペア (currentDigit -> nextDigit) の出現カウント
            if (colIndex < COL_COUNT - 1) {
                const nextDigit = row[colIndex + 1] === null ? 0 : row[colIndex + 1];
                consecutive[currentDigit][nextDigit]++;
            }
        });

        frequency.push(rowFreq);
        rowDigitCounts.push(rowDigitCount);
        totalRowDigits += rowDigitCount;

        // 行の数値を計算し、プラス・マイナスの符号に応じて総合計に加算
        const rowValue = (parseInt(rowValueString, 10) || 0) * (isMinusRows[rowIndex] ? -1 : 1);
        totalSum += rowValue;
    }

    // 2. 補数計算（途中で小計がマイナスになる繰り下がり等）のチェック
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
        
        // 計算途中で小計がマイナスに達した場合は補数計算（そろばん上の引き戻し・補数処理）が発生している
        if (runningTotal < 0) hasComplement = true;
    }

    const messages = [];
    if (hasComplement) messages.push("補数計算あり");
    if (totalSum < 0) messages.push("結果がマイナス");
    const complementStatus = messages.length > 0 ? messages.join("・") : "なし";

    // 3. 数字ごとの理想ベースライン出現数に対する過不足（差分）の計算
    const frequencyDiffs = Array(10).fill(0).map((_, digit) => {
        let baseline = targetTotalDigits / 10;
        if (plusOneDigit !== null && digit === Number(plusOneDigit)) baseline += 1;
        if (minusOneDigit !== null && digit === Number(minusOneDigit)) baseline -= 1;
        return totalFrequency[digit] - baseline;
    });

    // 4. 包み文字(包み桁)、挟み文字(挟み桁)、連続文字の条件充足チェック
    // --- 包み桁 (enclosedDigit): 対象数字Xが「X _ X」の配置で存在するか ---
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

    // --- 挟み桁 (sandwichedDigit): 対象数字Xが「A X A」の配置（両隣が同じ数字）で存在するか ---
    let isSandwichedUsed = sandwichedDigit == null;
    if (!isSandwichedUsed) {
        const target = Number(sandwichedDigit);
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const row = grid[rowIndex];
            const firstNonZeroIndex = row.findIndex(digit => digit !== null && digit !== 0);
            
            for (let colIndex = 1; colIndex < COL_COUNT - 1; colIndex++) {
                if (firstNonZeroIndex === -1 || colIndex < firstNonZeroIndex) continue;
                
                if (row[colIndex] !== null && row[colIndex] === target) {
                    // 両隣の数字が一致しているか (例: 3-5-3 の 5)
                    if (row[colIndex - 1] !== null && (colIndex - 1 >= firstNonZeroIndex) && row[colIndex - 1] === row[colIndex + 1]) {
                        isSandwichedUsed = true;
                        break;
                    }
                }
            }
            if (isSandwichedUsed) break;
        }
    }

    // --- 連続桁 (consecutiveDigit): 対象数字Xが「X X」の配置（同数字が隣接）で存在するか ---
    let isConsecutiveUsed = consecutiveDigit == null;
    if (!isConsecutiveUsed) {
        const target = Number(consecutiveDigit);
        // consecutive[d1][d2] は d1 の次に d2 が来る回数
        if (!isNaN(target) && consecutive[target] && consecutive[target][target] > 0) {
            isConsecutiveUsed = true;
        }
    }

    // 5. 各種位置指定条件（1口目・最終口・答えの先頭桁／末尾桁）の検証
    /**
     * 指定された目標値と実際の値が一致するかチェックします。
     * @param {number|string|null} target - 指定目標値
     * @param {number|string|null} actual - 実際の値
     * @returns {boolean} 一致していればtrue（未指定は常にtrue）
     */
    const checkMatch = (target, actual) => {
        if (target === null) return true;
        return Number(target) === Number(actual);
    };

    /**
     * 行の配列から最上位桁(MSD)と最下位桁(LSD)を取得します。
     * @param {Array<number|null>} rowArr - 行の数値配列
     * @returns {{msd: number|null, lsd: number|null}} 最上位桁と最下位桁
     */
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

    // 1口目（最初の行）の最上位・最下位桁を取得
    const firstRow = grid[0];
    const { msd: firstRowMsd, lsd: firstRowLsd } = getMostAndLeastSignificantDigit(firstRow);

    // 最終口（指定口数の最終行）の最上位・最下位桁を取得
    const lastRow = grid[rowCount - 1];
    const { msd: lastRowMsd, lsd: lastRowLsd } = getMostAndLeastSignificantDigit(lastRow);

    // 答え（合計値の絶対値）の最上位・最下位桁を取得
    const sumString = String(Math.abs(totalSum));
    const ansMsd = sumString[0];
    const ansLsd = sumString[sumString.length - 1];

    // 各位置制約の判定結果
    const isFirstMinValid = checkMatch(firstRowFirstDigit, firstRowMsd);
    const isFirstMaxValid = checkMatch(firstRowLastDigit, firstRowLsd);
    const isLastMinValid = checkMatch(lastRowFirstDigit, lastRowMsd);
    const isLastMaxValid = checkMatch(lastRowLastDigit, lastRowLsd);
    const isAnsMinValid = checkMatch(answerFirstDigit, ansMsd);
    const isAnsMaxValid = checkMatch(answerLastDigit, ansLsd);

    return {
        totalSum,                 // 答え（合計値）
        frequency,                // 行ごと・数字ごとの出現頻度
        totalFrequency,           // 全体の数字ごとの出現頻度
        frequencyDiffs,           // 理想頻度との差分
        consecutive,              // 連続桁出現数マトリクス
        rowDigitCounts,           // 行ごとの桁数配列
        totalRowDigits,           // 全体桁数
        complementStatus,         // 補数計算状態文字列
        isEnclosedUsed,           // 包み桁条件を満たしているか
        isSandwichedUsed,         // 挟み桁条件を満たしているか
        isConsecutiveUsed,        // 連続桁条件を満たしているか
        isFirstMinValid,          // 1口目先頭桁の条件判定
        isFirstMaxValid,          // 1口目末尾桁の条件判定
        isLastMinValid,           // 最終口先頭桁の条件判定
        isLastMaxValid,           // 最終口末尾桁の条件判定
        isAnsMinValid,            // 答え先頭桁の条件判定
        isAnsMaxValid             // 答え末尾桁の条件判定
    };
};

