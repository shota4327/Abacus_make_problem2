/* eslint-disable no-unused-vars */
/**
 * @file problemGenerator.js
 * @description 見取り算問題（20行×13列の盤面）を各種作問条件（口数、最小・最大桁数、目標総桁数、数字出現率、包み・挟み・連続文字、初口/最終口/答え桁指定、マイナス口、補数計算など）を満たすように自動生成するモジュールです。
 */

import { createInitialGrid, ROW_COUNT, COL_COUNT } from '../constants/initialState.js';

/**
 * 指定された桁数のランダムな行（1口分の数値データ）を生成します。
 * 右詰め（13列目の方向）で配置され、先頭桁は1〜9の範囲、それ以降の桁は0〜9の範囲でランダム設定されます。
 * 
 * @param {number} length - 生成する桁数 (1〜13)
 * @returns {Array<number|null>} 13要素の配列（空セルはnull、数値セルは0-9）
 */
export const generateRandomRow = (length) => {
    const row = Array(COL_COUNT).fill(null);
    for (let i = 0; i < length; i++) {
        const isFirstDigit = (i === length - 1);
        let val;
        if (isFirstDigit) {
            val = Math.floor(Math.random() * 9) + 1; // 先頭桁は 1-9
        } else {
            val = Math.floor(Math.random() * 10);    // それ以降は 0-9
        }
        row[COL_COUNT - 1 - i] = val;
    }
    return row;
};

/**
 * 盤面の条件達成度およびペナルティ（不要な出現やルールの不一致など）を評価します。
 * 指定された囲み文字・はさまれ文字・連続文字が「ピッタリ1回」発生しているかなどを検証します。
 * 
 * @param {Array<Array<number|null>>} grid - 評価対象の盤面データ
 * @param {Object} [conditions={}] - 作問条件オブジェクト
 * @param {Set<string>|null} [lockedCells=null] - 固定セルインデックスのSet ("row,col"形式)
 * @returns {Object} 評価結果
 * @returns {number} return.condScore - 条件達成スコア (0が最良、未達成項目ごとに負の値)
 * @returns {number} return.penaltyScore - 余分な条件発生に対するペナルティ数
 * @returns {Array<{r: number, c: number}>} return.penaltyCells - ペナルティが発生しているセル位置リスト
 * @returns {number} return.transitionPenalty - 同じ2数字の遷移ペア過多に対するペナルティ
 */
export const evaluateConditions = (grid, conditions = {}, lockedCells = null) => {
    const { enclosedDigit, sandwichedDigit, consecutiveDigit } = conditions;
    let enclosedCount = 0;
    let sandwichedCount = 0;
    let consecutiveCount = 0;
    let penaltyScore = 0; // 不要なパターン発生数
    let penaltyCells = [];

    const transitionCounts = Array(10).fill(null).map(() => Array(10).fill(0));
    const n = grid.length;

    for (let rowIndex = 0; rowIndex < n; rowIndex++) {
        const row = grid[rowIndex];
        let firstNonZeroIndex = -1;

        // 各行の有効数字の先頭位置（最上位桁）を探す
        for (let c = 0; c < COL_COUNT; c++) {
            if (row[c] !== null && row[c] !== 0) {
                firstNonZeroIndex = c;
                break;
            }
        }

        for (let colIndex = 0; colIndex < COL_COUNT; colIndex++) {
            if (colIndex < firstNonZeroIndex || colIndex === 0) continue;
            const currentDigit = row[colIndex];
            if (currentDigit === null) continue;

            // 数字の遷移ペア (d1 -> d2) のカウント
            if (colIndex > 0 && colIndex - 1 >= firstNonZeroIndex) {
                let leftDigit = row[colIndex - 1];
                if (leftDigit !== null && currentDigit !== null) {
                    transitionCounts[leftDigit][currentDigit]++;
                }
            }

            // 連続文字チェック (左の数字と同じか)
            let isConsecutive = (colIndex > 0 && colIndex - 1 >= firstNonZeroIndex && row[colIndex - 1] === currentDigit);
            
            // 囲み文字チェック (2つ左の数字と同じか) X _ X の右側の X で検知
            let isEnclosed = (colIndex > 1 && colIndex - 2 >= firstNonZeroIndex && row[colIndex - 2] === currentDigit);
            
            // はさまれ文字チェック (両隣が同じ数字か) A X A の中央の X で検知
            let isSandwiched = (colIndex > 0 && colIndex < COL_COUNT - 1 && colIndex - 1 >= firstNonZeroIndex && row[colIndex - 1] === row[colIndex + 1] && row[colIndex - 1] !== null);

            let cellPenalty = 0;
            let isLocked = lockedCells ? lockedCells.has(`${rowIndex},${colIndex}`) : false;

            let isEnclosedPenalty = false;
            let isSandwichedPenalty = false;

            // 連続文字のペナルティ判定
            if (isConsecutive) {
                if (consecutiveDigit != null && currentDigit === Number(consecutiveDigit)) {
                    consecutiveCount++;
                    // 指定文字の場合、2回目以降はペナルティ。
                    if (consecutiveCount > 1) cellPenalty++;
                } else {
                    // 指定文字以外の連続は無条件ペナルティ
                    cellPenalty++;
                }
            }

            // 囲み文字のペナルティ判定
            if (isEnclosed) {
                if (enclosedDigit != null && currentDigit === Number(enclosedDigit)) {
                    enclosedCount++;
                    if (enclosedCount > 1) cellPenalty++;
                } else {
                    isEnclosedPenalty = true;
                }
            }

            // はさまれ文字のペナルティ判定
            if (isSandwiched) {
                if (sandwichedDigit != null && currentDigit === Number(sandwichedDigit)) {
                    sandwichedCount++;
                    if (sandwichedCount > 1) cellPenalty++;
                } else {
                    isSandwichedPenalty = true;
                }
            }

            // はさまれ文字と囲み文字が重なった場合のペナルティ重複を避けるための調整
            // A B A というパターンがある時、B(はさまれ) と 右のA(囲み) の両方でペナルティにならないよう、
            // どちらか一方のペナルティとして加算します。
            if (isEnclosedPenalty || isSandwichedPenalty) {
                cellPenalty++;
            }

            // ペナルティがある場合、セル情報を記録（ロックされているセルはペナルティ解消の対象外）
            if (cellPenalty > 0) {
                penaltyScore += cellPenalty;
                if (!isLocked) {
                    penaltyCells.push({ r: rowIndex, c: colIndex });
                }
            }
        }
    }

    // 各条件の達成度判定スコア（ピッタリ1回以外ならペナルティ）
    let condScore = 0;
    if (enclosedDigit != null) {
        if (enclosedCount !== 1) condScore -= Math.abs(enclosedCount - 1) + 1;
    }
    if (sandwichedDigit != null) {
        if (sandwichedCount !== 1) condScore -= Math.abs(sandwichedCount - 1) + 1;
    }
    if (consecutiveDigit != null) {
        if (consecutiveCount !== 1) condScore -= Math.abs(consecutiveCount - 1) + 1;
    }

    // 同じ2数字ペアの連続過多に対するペナルティ
    let transitionPenalty = 0;
    for (let d1 = 0; d1 < 10; d1++) {
        for (let d2 = 0; d2 < 10; d2++) {
            if (transitionCounts[d1][d2] >= 3) {
                transitionPenalty += (transitionCounts[d1][d2] - 2) * 10;
            }
        }
    }

    return {
        condScore,
        penaltyScore,
        penaltyCells,
        transitionPenalty
    };
};

/**
 * 設定された全作問条件を満たす見取り算問題盤面を自動生成します。
 * 山登り法（Hill Climbing）および模擬焼きなまし法（Simulated Annealing）を組み合わせた確率的最適化アルゴリズムを用いています。
 * 
 * @param {Object} params - 生成用パラメータ
 * @param {number} params.rowCount - 行数（口数）
 * @param {number} params.minDigit - 1口あたりの最小桁数
 * @param {number} params.maxDigit - 1口あたりの最大桁数
 * @param {number} params.targetTotalDigits - 目標とする全体合計桁数
 * @param {boolean} params.hasMinus - マイナス口（引き算）を含むかどうか
 * @param {boolean} params.complementStatus - 補数計算（小計が一時的にマイナスになる計算）を含むかどうか
 * @param {Object} params.conditions - 特殊条件（初口/最終口/答え桁指定、特定数字加減、包み・挟み・連続文字など）
 * @returns {{grid: Array<Array<number|null>>, isMinusRows: boolean[]}} 生成された盤面データと行別マイナスフラグ配列
 */
export const generateProblemGrid = ({
    rowCount,
    minDigit,
    maxDigit,
    targetTotalDigits,
    hasMinus,
    complementStatus,
    conditions = {}
}) => {
    const {
        firstRowFirstDigit, firstRowLastDigit,
        lastRowFirstDigit, lastRowLastDigit,
        answerFirstDigit, answerLastDigit,
        plusOneDigit, minusOneDigit,
        enclosedDigit, sandwichedDigit, consecutiveDigit
    } = conditions;

    const n = rowCount;

    // 試行回数内のベストな盤面を記録する変数
    let bestGrid = null;
    let bestMinusRows = null;
    let bestBalanceScore = -Infinity;
    let bestCondScore = -Infinity;
    let bestPenaltyScore = -Infinity;
    let bestAnswerMatch = false;

    // 問題生成のマルチ試行ループ (Best-of-N Loop)
    for (let attempt = 0; attempt < 30; attempt++) {
        const nextGrid = createInitialGrid();

        // 1. 各行の桁数を分配
        const rowLengths = Array(n).fill(minDigit);
        let currentTotal = minDigit * n;

        if (minDigit !== maxDigit) {
            let safety = 0;
            while (currentTotal < targetTotalDigits && safety < 1000) {
                safety++;
                const randIndex = Math.floor(Math.random() * n);
                if (rowLengths[randIndex] < maxDigit) {
                    rowLengths[randIndex]++;
                    currentTotal++;
                }
            }
        }

        // 行ごとの有効桁数の最上位インデックス
        const msdIndices = rowLengths.map(len => COL_COUNT - len);

        // 2. マイナス行（引き算口）の割り当て
        const nextMinusRows = Array(ROW_COUNT).fill(false);
        if (hasMinus) {
            let numMinus = 2; // デフォルトでマイナス2口
            if (n >= 15) numMinus = Math.floor(Math.random() * 2) + 2; // 15口以上の場合は2〜3口
            
            const indices = [];
            // マイナス行は2口目以降かつ最終口以外の行から選択
            for (let i = 1; i < n - 1; i++) indices.push(i);
            
            // ランダムにマイナス行を抽出
            for (let i = 0; i < numMinus && indices.length > 0; i++) {
                const randIdx = Math.floor(Math.random() * indices.length);
                const selectedRow = indices.splice(randIdx, 1)[0];
                nextMinusRows[selectedRow] = true;
            }
        }

        // 3. 盤面の初期数値を充填
        for (let r = 0; r < n; r++) {
            const rowArr = generateRandomRow(rowLengths[r]);
            nextGrid[r] = rowArr;
        }

        // 固定セルの記録 ("r,c" の形式で保存)
        const lockedCells = new Set();

        // 位置指定条件（1口目・最終口の先頭／末尾桁）を適用し固定
        if (firstRowFirstDigit != null) {
            nextGrid[0][msdIndices[0]] = Number(firstRowFirstDigit);
            lockedCells.add(`0,${msdIndices[0]}`);
        }
        if (firstRowLastDigit != null) {
            nextGrid[0][COL_COUNT - 1] = Number(firstRowLastDigit);
            lockedCells.add(`0,${COL_COUNT - 1}`);
        }
        if (lastRowFirstDigit != null) {
            nextGrid[n - 1][msdIndices[n - 1]] = Number(lastRowFirstDigit);
            lockedCells.add(`${n - 1},${msdIndices[n - 1]}`);
        }
        if (lastRowLastDigit != null) {
            nextGrid[n - 1][COL_COUNT - 1] = Number(lastRowLastDigit);
            lockedCells.add(`${n - 1},${COL_COUNT - 1}`);
        }

        /** 行の数値を符号込みで計算するインナー関数 */
        const calculateSum = (g, minusRows) => {
            let sum = 0;
            for (let r = 0; r < n; r++) {
                let str = "";
                for (let c = 0; c < COL_COUNT; c++) {
                    str += (g[r][c] === null ? 0 : g[r][c]);
                }
                const val = parseInt(str, 10) || 0;
                sum += val * (minusRows[r] ? -1 : 1);
            }
            return sum;
        };

        // 答え末尾桁の制約調整
        if (answerLastDigit != null) {
            const targetLast = Number(answerLastDigit);
            let freeRowIndex = -1;
            // 最終桁が固定されていない自由な行を探索
            for (let r = 0; r < n; r++) {
                if (!lockedCells.has(`${r},${COL_COUNT - 1}`)) {
                    freeRowIndex = r;
                    break;
                }
            }

            if (freeRowIndex !== -1) {
                const currentSum = calculateSum(nextGrid, nextMinusRows);
                const currentLast = Math.abs(currentSum) % 10;
                const diff = (targetLast - currentLast + 10) % 10;

                if (diff !== 0) {
                    const sign = nextMinusRows[freeRowIndex] ? -1 : 1;
                    const oldDigit = nextGrid[freeRowIndex][COL_COUNT - 1];
                    let newDigit = (oldDigit + diff * sign) % 10;
                    if (newDigit < 0) newDigit += 10;
                    nextGrid[freeRowIndex][COL_COUNT - 1] = newDigit;
                }
            }
        }

        // 近接チェック関数（強制配置するセルの上下左右に同じ数字がないか確認）
        const checkAdjacency = (r, c, digit) => {
            const up = r > 0 ? nextGrid[r - 1][c] : null;
            const down = r < n - 1 ? nextGrid[r + 1][c] : null;
            const left = c > 0 ? nextGrid[r][c - 1] : null;
            const right = c < COL_COUNT - 1 ? nextGrid[r][c + 1] : null;
            return up === digit || down === digit || left === digit || right === digit;
        };

        // 連続文字 (22など)
        if (consecutiveDigit != null) {
            let r, c;
            for (let attempt = 0; attempt < 100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - rowLengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 1 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 1) continue;
                if (lockedCells.has(`${r},${c}`) || lockedCells.has(`${r},${c + 1}`)) continue;
                
                let target = Number(consecutiveDigit);
                if (checkAdjacency(r, c, target) || checkAdjacency(r, c + 1, target)) continue;
                
                nextGrid[r][c] = target;
                nextGrid[r][c + 1] = target;
                lockedCells.add(`${r},${c}`);
                lockedCells.add(`${r},${c + 1}`);
                break;
            }
        }

        // はさまれ文字と囲み文字の配置
        if (enclosedDigit != null && sandwichedDigit != null) {
            // 同時指定の場合は、統合して配置（例: 9 3 9）
            let r, c;
            for (let attempt = 0; attempt < 100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - rowLengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 2 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 2) continue;
                if (lockedCells.has(`${r},${c}`) || lockedCells.has(`${r},${c + 1}`) || lockedCells.has(`${r},${c + 2}`)) continue;
                
                let encTarget = Number(enclosedDigit);
                let sanTarget = Number(sandwichedDigit);
                
                if (checkAdjacency(r, c, encTarget) || checkAdjacency(r, c + 2, encTarget) || checkAdjacency(r, c + 1, sanTarget)) continue;
                if (encTarget === sanTarget) continue; // 同じ数字が指定された場合は統合不可
                
                nextGrid[r][c] = encTarget;
                nextGrid[r][c + 1] = sanTarget;
                nextGrid[r][c + 2] = encTarget;
                
                lockedCells.add(`${r},${c}`);
                lockedCells.add(`${r},${c + 1}`);
                lockedCells.add(`${r},${c + 2}`);
                break;
            }
        } else if (enclosedDigit != null) {
            // 囲み文字単独
            let r, c;
            for (let attempt = 0; attempt < 100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - rowLengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 2 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 2) continue;
                if (lockedCells.has(`${r},${c}`) || lockedCells.has(`${r},${c + 1}`) || lockedCells.has(`${r},${c + 2}`)) continue;
                
                let target = Number(enclosedDigit);
                if (checkAdjacency(r, c, target) || checkAdjacency(r, c + 2, target)) continue;
                
                nextGrid[r][c] = target;
                nextGrid[r][c + 2] = target;
                let center = nextGrid[r][c + 1];
                if (center === Number(enclosedDigit) || center === null) {
                    center = (Number(enclosedDigit) + 1) % 10;
                    if (center === 0) center = 1;
                    nextGrid[r][c + 1] = center;
                }
                lockedCells.add(`${r},${c}`);
                lockedCells.add(`${r},${c + 1}`);
                lockedCells.add(`${r},${c + 2}`);
                break;
            }
        } else if (sandwichedDigit != null) {
            // はさまれ文字単独
            let r, c;
            for (let attempt = 0; attempt < 100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - rowLengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 2 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 2) continue;
                if (lockedCells.has(`${r},${c}`) || lockedCells.has(`${r},${c + 1}`) || lockedCells.has(`${r},${c + 2}`)) continue;
                
                let target = Number(sandwichedDigit);
                if (checkAdjacency(r, c + 1, target)) continue;

                let side = (target + 1) % 10;
                if (side === 0) side = 1;
                if (checkAdjacency(r, c, side) || checkAdjacency(r, c + 2, side)) continue;

                nextGrid[r][c + 1] = target;
                nextGrid[r][c] = side;
                nextGrid[r][c + 2] = side;
                lockedCells.add(`${r},${c}`);
                lockedCells.add(`${r},${c + 1}`);
                lockedCells.add(`${r},${c + 2}`);
                break;
            }
        }

        // 3. 盤面の数値微調整（数字出現率均等化ループ）
        const newGrid = nextGrid.map(row => [...row]);

        for (let iter = 0; iter < 50; iter++) {
            const counts = Array(10).fill(0);
            let totalDigitsCount = 0;

            for (let r = 0; r < n; r++) {
                for (let c = 0; c < COL_COUNT; c++) {
                    if (newGrid[r][c] !== null) {
                        counts[newGrid[r][c]]++;
                        totalDigitsCount++;
                    }
                }
            }

            // 理想の各数字出現数
            const targetsFreq = Array(10).fill(totalDigitsCount / 10);
            if (plusOneDigit !== null) targetsFreq[Number(plusOneDigit)] += 1;
            if (minusOneDigit !== null) targetsFreq[Number(minusOneDigit)] -= 1;

            let maxOverDigit = -1;
            let maxOver = 0;
            let maxUnderDigit = -1;
            let maxUnder = 0;

            for (let d = 0; d < 10; d++) {
                const diff = counts[d] - targetsFreq[d];
                if (diff > maxOver) {
                    maxOver = diff;
                    maxOverDigit = d;
                }
                if (-diff > maxUnder) {
                    maxUnder = -diff;
                    maxUnderDigit = d;
                }
            }

            if (maxOverDigit === -1 || maxUnderDigit === -1) break;

            // 出現数が過剰な数字セルを探し、出現数が不足している数字に置換
            const candidates = [];
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < COL_COUNT; c++) {
                    if (lockedCells.has(`${r},${c}`)) continue;
                    if (c === COL_COUNT - 1 && answerLastDigit != null) continue;
                    if (c === msdIndices[r] && maxUnderDigit === 0) continue; // 先頭桁を0にはできない

                    if (newGrid[r][c] === maxOverDigit) {
                        candidates.push({ r, c });
                    }
                }
            }

            if (candidates.length === 0) break;

            let bestCand = null;
            let maxScore = -Infinity;

            // 候補をシャッフルして探索の偏りをなくす（局所解への収束を防ぐ）
            candidates.sort(() => Math.random() - 0.5);

            const currentEval = evaluateConditions(newGrid, conditions, lockedCells);

            for (const cand of candidates) {
                const original = newGrid[cand.r][cand.c];
                newGrid[cand.r][cand.c] = maxUnderDigit;

                const newEval = evaluateConditions(newGrid, conditions, lockedCells);
                // まずは condScore（条件達成度）を優先、次に penaltyScore の削減
                const score = (newEval.condScore - currentEval.condScore) * 1000 + (currentEval.penaltyScore - newEval.penaltyScore);

                if (score > maxScore) {
                    maxScore = score;
                    bestCand = cand;
                }
                newGrid[cand.r][cand.c] = original;
            }

            if (bestCand) {
                newGrid[bestCand.r][bestCand.c] = maxUnderDigit;
            } else {
                const rand = candidates[Math.floor(Math.random() * candidates.length)];
                newGrid[rand.r][rand.c] = maxUnderDigit;
            }
        }

        // 3.5 ペナルティ解消ループ（局所スワップ探索）
        let currentEval = evaluateConditions(newGrid, conditions, lockedCells);
        for (let iter = 0; iter < 2000; iter++) {
            if (currentEval.penaltyScore === 0 && currentEval.transitionPenalty === 0 && currentEval.condScore === 0) break;

            let r1, c1, r2, c2;
            
            // ペナルティ（不要パターン）が発生しているセルを優先的に選択
            if (currentEval.penaltyCells && currentEval.penaltyCells.length > 0 && Math.random() < 0.8) {
                let errCell = currentEval.penaltyCells[Math.floor(Math.random() * currentEval.penaltyCells.length)];
                r1 = errCell.r;
                c1 = errCell.c;
            } else {
                r1 = Math.floor(Math.random() * n);
                c1 = Math.floor(Math.random() * COL_COUNT);
            }
            
            r2 = Math.floor(Math.random() * n);
            c2 = Math.floor(Math.random() * COL_COUNT);

            if (newGrid[r1][c1] === null || newGrid[r2][c2] === null) continue;
            if (newGrid[r1][c1] === newGrid[r2][c2]) continue; // 同一数字ならスワップ不要
            if (lockedCells.has(`${r1},${c1}`) || lockedCells.has(`${r2},${c2}`)) continue;

            // 答えの最終桁制約がある場合、末尾列と他列のスワップは制限
            if (answerLastDigit != null) {
                let isRight1 = (c1 === COL_COUNT - 1);
                let isRight2 = (c2 === COL_COUNT - 1);
                if (isRight1 !== isRight2) continue;
                
                if (isRight1 && isRight2) {
                    let sign1 = nextMinusRows[r1] ? -1 : 1;
                    let sign2 = nextMinusRows[r2] ? -1 : 1;
                    if (sign1 !== sign2) {
                        let diff = 0;
                        diff -= newGrid[r1][c1] * sign1;
                        diff += newGrid[r2][c2] * sign1;
                        diff -= newGrid[r2][c2] * sign2;
                        diff += newGrid[r1][c1] * sign2;
                        if (diff % 10 !== 0) continue;
                    }
                }
            }

            // 最上位桁がゼロにならないようガード
            if (newGrid[r1][c1] === 0 && c2 === msdIndices[r2]) continue;
            if (newGrid[r2][c2] === 0 && c1 === msdIndices[r1]) continue;

            // スワップ実行
            let temp = newGrid[r1][c1];
            newGrid[r1][c1] = newGrid[r2][c2];
            newGrid[r2][c2] = temp;

            const newEval = evaluateConditions(newGrid, conditions, lockedCells);

            const currentTotalPenalty = currentEval.penaltyScore + currentEval.transitionPenalty;
            const newTotalPenalty = newEval.penaltyScore + newEval.transitionPenalty;

            // 模擬焼きなまし法（温度パラメータによる確率的許容）
            let revert = false;
            if (newEval.condScore < currentEval.condScore) {
                revert = true; // 条件達成スコアの悪化は即リバート
            } else if (newEval.condScore === currentEval.condScore && newTotalPenalty > currentTotalPenalty) {
                const tempProb = 0.05 * (1.0 - iter / 2000);
                if (Math.random() > tempProb) {
                    revert = true;
                }
            }

            if (revert) {
                let tempBack = newGrid[r1][c1];
                newGrid[r1][c1] = newGrid[r2][c2];
                newGrid[r2][c2] = tempBack;
            } else {
                currentEval = newEval;
            }
        }

        // 4. 最終的な生成盤面の総合スコア評価
        const evalResult = evaluateConditions(newGrid, conditions);
        const currentCondScore = evalResult.condScore;
        const currentPenaltyScore = -evalResult.penaltyScore;

        // 答えの制約を満たしているか
        let isAnsMinOk = true;
        let isAnsLastOk = true;
        const currentSumFinal = calculateSum(newGrid, nextMinusRows);
        const s = String(Math.abs(currentSumFinal));
        
        if (answerFirstDigit != null) {
            if (s[0] !== String(answerFirstDigit)) isAnsMinOk = false;
        }
        if (answerLastDigit != null) {
            if (s[s.length - 1] !== String(answerLastDigit)) isAnsLastOk = false;
        }

        // 補数計算の発生制約を満たしているか
        const isComplementOccurred = (currentSumFinal < 0);
        let isComplementOk = (isComplementOccurred === complementStatus);

        const freqs = Array(10).fill(0);
        let totalD = 0;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < COL_COUNT; c++) {
                if (newGrid[r][c] !== null) { freqs[newGrid[r][c]]++; totalD++; }
            }
        }
        
        const diff2 = freqs.map((f, digit) => {
            let t = totalD / 10;
            if (plusOneDigit !== null && digit === Number(plusOneDigit)) t += 1;
            if (minusOneDigit !== null && digit === Number(minusOneDigit)) t -= 1;
            return f - t;
        });

        // 総合バランススコア
        const currentBalanceScore = -diff2.reduce((acc, val) => acc + Math.abs(val), 0);
        let currentIsBetter = false;
        const currentAnswerMatch = isAnsMinOk && isAnsLastOk && isComplementOk;

        if (bestGrid === null) {
            currentIsBetter = true;
        } else {
            if (currentBalanceScore > bestBalanceScore) {
                currentIsBetter = true;
            } else if (currentBalanceScore === bestBalanceScore) {
                if (currentCondScore > bestCondScore) {
                    currentIsBetter = true;
                } else if (currentCondScore === bestCondScore) {
                    if (currentAnswerMatch && !bestAnswerMatch) {
                        currentIsBetter = true;
                    } else if (currentAnswerMatch === bestAnswerMatch) {
                        if (currentPenaltyScore > bestPenaltyScore) {
                            currentIsBetter = true;
                        }
                    }
                }
            }
        }

        if (currentIsBetter) {
            bestGrid = newGrid.map(row => [...row]);
            bestMinusRows = [...nextMinusRows];
            bestBalanceScore = currentBalanceScore;
            bestCondScore = currentCondScore;
            bestPenaltyScore = currentPenaltyScore;
            bestAnswerMatch = currentAnswerMatch;
        }

        // 全条件クリア時は早期脱出
        if (currentBalanceScore === 0 && currentCondScore === 0 && currentPenaltyScore === 0 && currentAnswerMatch) {
            break;
        }
    } // End Best-of-N Loop

    const finalGrid = bestGrid ? bestGrid : createInitialGrid();

    return { grid: finalGrid, isMinusRows: bestMinusRows };
};
