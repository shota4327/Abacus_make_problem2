import { createInitialMultiplicationState } from '../constants/initialState.js';

/**
 * 特定の問題の片辺（左辺か右辺）の数字を指定された桁数で再生成します。
 * @param {Object} currentProblem - 現在の問題データ
 * @param {string} side - 'left' または 'right'
 * @param {number|string} length - 桁数、または 'R'（ランダム: 4〜7）
 * @returns {Object} 更新された問題データ
 */
export const regenerateMultiplicationRow = (currentProblem, side, length) => {
    const updatedProblem = { ...currentProblem };
    
    let finalLength = length;
    if (length === 'R') {
        finalLength = Math.floor(Math.random() * 4) + 4; // 4〜7桁
    }

    // 0〜9の重複しない数字を生成
    const digitsPool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digitsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digitsPool[i], digitsPool[j]] = [digitsPool[j], digitsPool[i]];
    }
    const newDigits = digitsPool.slice(0, finalLength);

    // 先頭の数字が0にならないようにする
    if (newDigits[0] === 0) {
        [newDigits[0], newDigits[1]] = [newDigits[1], newDigits[0]];
    }

    // 右詰めで配列（長さ7）にセット
    const newArray = Array(7).fill(null);
    const startIndex = 7 - finalLength;
    for (let k = 0; k < finalLength; k++) {
        newArray[startIndex + k] = newDigits[k];
    }

    updatedProblem[side] = newArray;

    // 小数点のロジック（右辺のみランダムで付与）
    if (side === 'right') {
        if (Math.random() < 0.3) {
            const k = Math.floor(Math.random() * (finalLength - 1));
            updatedProblem.decimalRight = startIndex + k;
        } else {
            updatedProblem.decimalRight = null;
        }
    } else {
        updatedProblem.decimalLeft = null;
    }

    return updatedProblem;
};

/**
 * 全体の掛け算の問題をランダムに一括生成します。
 * @returns {Array<Object>} 生成された10問の問題配列
 */
export const generateMultiplicationProblems = () => {
    // 1. 各行の桁数を決定（左右それぞれ合計55桁になるように、各問は合計10〜12桁）
    let countsA, countsB;
    let countAttempts = 0;

    while (countAttempts < 1000) {
        countAttempts++;

        const generateCounts = () => {
            let array = Array(10).fill(0).map(() => Math.floor(Math.random() * 4) + 4); // 4-7桁
            let sum = array.reduce((a, b) => a + b, 0);
            let safety = 0;
            
            while (sum !== 55 && safety < 100) {
                safety++;
                const index = Math.floor(Math.random() * 10);
                if (sum < 55 && array[index] < 7) {
                    array[index]++;
                    sum++;
                } else if (sum > 55 && array[index] > 4) {
                    array[index]--;
                    sum--;
                }
            }
            return (sum === 55) ? array : null;
        };

        const ca = generateCounts();
        if (!ca) continue;

        const cb = generateCounts();
        if (!cb) continue;

        let valid = true;
        for (let i = 0; i < 10; i++) {
            const total = ca[i] + cb[i];
            if (total < 10 || total > 12) {
                valid = false;
                break;
            }
        }

        if (valid) {
            countsA = ca;
            countsB = cb;
            break;
        }
    }

    if (!countsA || !countsB) {
        console.error("掛け算の桁数の生成に失敗しました");
        // 安全のためのフォールバック
        return Array(10).fill(null).map(() => createInitialMultiplicationState());
    }

    // 2. 数字プールの作成
    const possibleDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = possibleDigits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleDigits[i], possibleDigits[j]] = [possibleDigits[j], possibleDigits[i]];
    }

    const poolA_Base = [];
    const usedCounts = Array(10).fill(0);

    for (let i = 0; i < 10; i++) {
        const digit = possibleDigits[i];
        const count = (i < 5) ? 6 : 5;
        usedCounts[digit] += count;
        for (let k = 0; k < count; k++) poolA_Base.push(digit);
    }

    const poolB_Base = [];
    for (let digit = 0; digit <= 9; digit++) {
        const remaining = 11 - usedCounts[digit];
        for (let k = 0; k < remaining; k++) poolB_Base.push(digit);
    }

    // 3. 最初の桁と最後の桁の制約を適用しつつ数値を割り当て
    const setupSide = (counts, basePool) => {
        const rows = counts.map(len => ({ len, digits: Array(len).fill(null) }));

        const takeFromPool = (pool, val) => {
            const idx = pool.indexOf(val);
            if (idx !== -1) {
                pool.splice(idx, 1);
                return val;
            }
            return null;
        };

        // 末尾の数字は0-9を必ず1回ずつ使用
        const lastDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const rowIndices = Array.from({ length: 10 }, (_, i) => i);
        for (let i = rowIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
        }

        rowIndices.forEach((rIdx, i) => {
            const val = lastDigits[i];
            rows[rIdx].digits[rows[rIdx].len - 1] = takeFromPool(basePool, val);
        });

        // 先頭の数字はゼロ以外（1-9を1回ずつ + ランダムな非ゼロ1回）
        const firstDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const extra = Math.floor(Math.random() * 9) + 1;
        firstDigits.push(extra);

        for (let i = firstDigits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [firstDigits[i], firstDigits[j]] = [firstDigits[j], firstDigits[i]];
        }
        for (let i = rowIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
        }

        rowIndices.forEach((rIdx, i) => {
            const val = firstDigits[i];
            const got = takeFromPool(basePool, val);
            if (got === null) console.error("Pool exhausted for", val);
            rows[rIdx].digits[0] = got;
        });

        // 残りの真ん中の数字を埋める
        for (let i = basePool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [basePool[i], basePool[j]] = [basePool[j], basePool[i]];
        }

        rows.forEach(row => {
            for (let k = 0; k < row.len; k++) {
                if (row.digits[k] === null) {
                    row.digits[k] = basePool.pop();
                }
            }
        });

        return rows;
    };

    const rowsA = setupSide(countsA, [...poolA_Base]);
    const rowsB = setupSide(countsB, [...poolB_Base]);

    // 4. 最適化ループ（連続する同じ数字などを減らす）
    const startTime = Date.now();
    const DURATION = 5000;

    const getRowPatternScore = (rowDigits) => {
        let score = 0;
        for (let i = 0; i < rowDigits.length; i++) {
            const digit = rowDigits[i];
            if (digit === null) continue;
            // 連続・はさまれ
            if (i > 0 && rowDigits[i - 1] === digit) score++;
            if (i > 1 && rowDigits[i - 2] === digit) score++;
        }
        return score;
    };

    const calculateTotalScore = (rA, rB) => {
        let score = 0;
        rA.forEach(r => score += getRowPatternScore(r.digits));
        rB.forEach(r => score += getRowPatternScore(r.digits));

        const transitions = Array(10).fill(null).map(() => Array(10).fill(0));
        const tally = (rows) => {
            rows.forEach(r => {
                for (let i = 0; i < r.digits.length - 1; i++) {
                    const d1 = r.digits[i];
                    const d2 = r.digits[i + 1];
                    if (d1 !== null && d2 !== null) transitions[d1][d2]++;
                }
            });
        };
        tally(rA);
        tally(rB);

        // 全体で同じ遷移が3回以上あればペナルティ
        for (let d1 = 0; d1 < 10; d1++) {
            for (let d2 = 0; d2 < 10; d2++) {
                if (transitions[d1][d2] >= 3) {
                    score += (transitions[d1][d2] - 2) * 1000;
                }
            }
        }
        return score;
    };

    let currentScore = calculateTotalScore(rowsA, rowsB);

    while (Date.now() - startTime < DURATION) {
        const isA = Math.random() < 0.5;
        const targetRows = isA ? rowsA : rowsB;
        
        const r1 = Math.floor(Math.random() * 10);
        const r2 = Math.floor(Math.random() * 10);
        
        const getMiddles = (len) => {
            const idxs = [];
            for (let k = 1; k < len - 1; k++) idxs.push(k);
            return idxs;
        };

        const mids1 = getMiddles(targetRows[r1].len);
        const mids2 = getMiddles(targetRows[r2].len);
        if (mids1.length === 0 || mids2.length === 0) continue;

        const i1 = mids1[Math.floor(Math.random() * mids1.length)];
        const i2 = mids2[Math.floor(Math.random() * mids2.length)];

        // スワップ
        const val1 = targetRows[r1].digits[i1];
        const val2 = targetRows[r2].digits[i2];
        targetRows[r1].digits[i1] = val2;
        targetRows[r2].digits[i2] = val1;

        const newScore = calculateTotalScore(rowsA, rowsB);
        if (newScore <= currentScore) {
            currentScore = newScore;
            if (newScore === 0) break;
        } else {
            // 元に戻す
            targetRows[r1].digits[i1] = val1;
            targetRows[r2].digits[i2] = val2;
        }
    }

    // 5. 小数点のロジック
    const finalDecimals = Array(10).fill(null);
    const getDecimalResultType = (valsA, valsB, decIdx) => {
        const valA = parseInt(valsA.join(''), 10);
        const valB = parseFloat(valsB.slice(0, decIdx + 1).join('') + "." + valsB.slice(decIdx + 1).join(''));
        const res = valA * valB;
        if (Number.isInteger(res)) return 'int';
        const frac = res % 1;
        return (frac >= 0.5) ? 'up' : 'down';
    };

    const upCandidates = [];
    const downCandidates = [];

    for (let i = 0; i < 10; i++) {
        const rA = rowsA[i].digits;
        const rB = rowsB[i].digits;
        const len = rowsB[i].len;
        for (let pos = 0; pos < len - 1; pos++) {
            const type = getDecimalResultType(rA, rB, pos);
            if (type === 'up') upCandidates.push({ rIdx: i, pos });
            if (type === 'down') downCandidates.push({ rIdx: i, pos });
        }
    }

    const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    };
    shuffle(upCandidates);
    shuffle(downCandidates);

    let selectedUp = 0;
    let selectedDown = 0;
    const usedRows = new Set();

    for (const cand of upCandidates) {
        if (selectedUp >= 2) break;
        if (!usedRows.has(cand.rIdx)) {
            finalDecimals[cand.rIdx] = cand.pos;
            usedRows.add(cand.rIdx);
            selectedUp++;
        }
    }
    for (const cand of downCandidates) {
        if (selectedDown >= 2) break;
        if (!usedRows.has(cand.rIdx)) {
            finalDecimals[cand.rIdx] = cand.pos;
            usedRows.add(cand.rIdx);
            selectedDown++;
        }
    }

    // 6. 最終的な問題配列の組み立て
    const finalProblems = [];
    for (let i = 0; i < 10; i++) {
        const p = createInitialMultiplicationState();
        const rA = rowsA[i];
        const rB = rowsB[i];

        // 右詰めで配置
        for (let k = 0; k < rA.len; k++) p.left[6 - (rA.len - 1) + k] = rA.digits[k];
        for (let k = 0; k < rB.len; k++) p.right[6 - (rB.len - 1) + k] = rB.digits[k];

        if (finalDecimals[i] !== null) {
            p.decimalRight = 6 - (rB.len - 1) + finalDecimals[i];
        }
        finalProblems.push(p);
    }

    return finalProblems;
};
