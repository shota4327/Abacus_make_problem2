/**
 * @file divisionGenerator.js
 * @description 割り算問題(10問分)の自動生成アルゴリズムを提供するユーティリティです。
 * 除数・商の桁数配分（合計10〜12桁）、数字(0-9)の均等出現配分、割られる数(Dividend)の先頭桁1〜9の重複なし網羅、還元商/確信商（切り上げ2問・切り捨て2問）の四捨五入バランス生成、および1未満の小数の配置制御を行います。
 */

import { createInitialDivisionState } from '../constants/initialState.js';

/**
 * 割り算問題の1口（除数または商）を指定した桁数で再生成します。
 * 
 * @param {Object} currentProblem - 現在の割り算問題データ
 * @param {'divisor'|'answer'} side - 対象項目（divisor:割る数 / answer:商・答え）
 * @param {number|'R'} length - 桁数（'R'の場合は4〜7桁からランダム選定）
 * @returns {Object} 更新された問題オブジェクト
 */
export const regenerateDivisionRow = (currentProblem, side, length) => {
    const updatedProblem = { ...currentProblem };
    let finalLength = length;
    if (length === 'R') finalLength = Math.floor(Math.random() * 4) + 4;

    const digitsPool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digitsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digitsPool[i], digitsPool[j]] = [digitsPool[j], digitsPool[i]];
    }
    const newDigits = digitsPool.slice(0, finalLength);
    if (newDigits[0] === 0) [newDigits[0], newDigits[1]] = [newDigits[1], newDigits[0]];

    const newArray = Array(7).fill(null);
    const startIndex = 7 - finalLength;
    for (let k = 0; k < finalLength; k++) newArray[startIndex + k] = newDigits[k];
    updatedProblem[side] = newArray;

    if (side === 'divisor') {
        if (Math.random() < 0.3) {
            const k = Math.floor(Math.random() * (finalLength - 1));
            updatedProblem.decimalDivisor = startIndex + k;
        } else {
            updatedProblem.decimalDivisor = null;
        }
    } else {
        updatedProblem.decimalAnswer = null;
    }
    return updatedProblem;
};

/**
 * 条件を満たす10問の割り算問題を全自動で生成します。
 * 割られる数の先頭桁（1〜9）網羅率を高めるため最大50回の生成試行を行い、最も網羅率の高い問題セットを返します。
 * 
 * @returns {Array<Object>} 10問分の割り算問題オブジェクト配列
 */
export const generateDivisionProblems = () => {
    let attempts = 0;
    let bestProblems = null;
    let bestScore = 0;
    
    while (attempts < 100) {
        attempts++;
        const problems = _generateDivisionProblems_internal();
        if (!problems) continue;

        // 割られる数(Dividend)の先頭桁(1-9)のバリエーション数を評価
        const firstDigitsSet = new Set();
        for (const p of problems) {
            const dividendDigits = p.dividend.filter(d => d !== null);
            if (dividendDigits.length > 0) {
                const firstNonZero = dividendDigits.find(d => d !== 0);
                if (firstNonZero !== undefined) {
                    firstDigitsSet.add(String(firstNonZero));
                }
            }
        }
        
        if (firstDigitsSet.size > bestScore) {
            bestScore = firstDigitsSet.size;
            bestProblems = problems;
        }

        // 1〜9の全数字が出現した理想形であれば即座に返却
        if (firstDigitsSet.size === 9) {
            return problems;
        }
    }
    console.warn("フォールバックとして最も網羅率の高い(" + bestScore + ")結果を返します");
    return bestProblems || Array(10).fill(null).map(() => createInitialDivisionState());
};

/**
 * 割り算問題自動生成の内部処理メイン関数
 * 1. 除数(divisor)・商(answer)の桁数割り当て（4〜7桁、合計10〜12桁）
 * 2. 0〜9の数字出現度均等割り当てプール構成
 * 3. 連続桁・挟み桁の単一出現制御
 * 4. 割られる数の先頭桁重複防止組み合わせ
 * 5. 還元商・確信商（切り上げ2問、切り捨て2問）の四捨五入難易度構成および1未満の小数の組み立て
 * 
 * @private
 * @returns {Array<Object>|null} 10問分の割り算問題配列
 */
const _generateDivisionProblems_internal = () => {
    const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    };

    // Step 1: 桁数配分 countsA, countsB (商: 55桁, 除数: 55桁, 各問和 10〜12桁)
    let countsA, countsB;
    let countAttempts = 0;
    while (countAttempts < 1000) {
        countAttempts++;
        const ca = [4, 5, 5, 5, 6, 6, 6, 6, 6, 6];
        // zc=3 に適合する4桁行を確実に確保するため cb に [4, 4, 5, 6, 6, 6, 6, 6, 6, 6] を採用
        const cb = [4, 4, 5, 6, 6, 6, 6, 6, 6, 6];
        shuffle(ca);
        shuffle(cb);
        let valid = true;
        for (let i = 0; i < 10; i++) {
            const sum = ca[i] + cb[i];
            if (sum < 10 || sum > 12) { valid = false; break; }
        }
        if (valid) { countsA = ca; countsB = cb; break; }
    }
    if (!countsA || !countsB) return null;

    // Step 2: 数字 0〜9 の均等配分プール構成 (合計 110桁で各11回)
    const possibleDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffle(possibleDigits);

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

    // Step 3: setupSide (末尾桁0-9網羅、先頭桁1-9網羅、中間桁充填)
    const pickTargets = () => {
        const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffle(arr);
        return { consecutive: arr[0], sandwich: arr[1] };
    };
    const targetsA = pickTargets();
    const targetsB = pickTargets();

    const setupSide = (counts, basePool) => {
        const rows = counts.map(len => ({ len, digits: Array(len).fill(null) }));
        const takeFromPool = (pool, val) => {
            const idx = pool.indexOf(val);
            if (idx !== -1) { pool.splice(idx, 1); return val; }
            return null;
        };

        const lastDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const rowIndices = Array.from({ length: 10 }, (_, i) => i);
        shuffle(rowIndices);
        rowIndices.forEach((rIdx, i) => {
            rows[rIdx].digits[rows[rIdx].len - 1] = takeFromPool(basePool, lastDigits[i]);
        });

        const firstDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        firstDigits.push(Math.floor(Math.random() * 9) + 1);
        shuffle(firstDigits);
        shuffle(rowIndices);
        rowIndices.forEach((rIdx, i) => {
            rows[rIdx].digits[0] = takeFromPool(basePool, firstDigits[i]);
        });

        shuffle(basePool);
        rows.forEach(row => {
            for (let k = 0; k < row.len; k++) {
                if (row.digits[k] === null) row.digits[k] = basePool.pop();
            }
        });
        return rows;
    };

    const rowsA = setupSide(countsA, [...poolA_Base]);
    const rowsB = setupSide(countsB, [...poolB_Base]);

    // Step 4 & 5: パターン制御 (AA, ABA の単一出現と不要パターンの排除)
    const calculateTransitions = (rA, rB) => {
        let score = 0;
        const transitions = Array(10).fill(null).map(() => Array(10).fill(0));
        rA.forEach(r => { for (let i = 0; i < r.digits.length - 1; i++) transitions[r.digits[i]][r.digits[i + 1]]++; });
        rB.forEach(r => { for (let i = 0; i < r.digits.length - 1; i++) transitions[r.digits[i]][r.digits[i + 1]]++; });
        for (let d1 = 0; d1 < 10; d1++) {
            for (let d2 = 0; d2 < 10; d2++) {
                if (transitions[d1][d2] >= 3) score += (transitions[d1][d2] - 2) * 1000;
            }
        }
        return score;
    };

    const applyPatternsPostProcess = (sideRows, targets, forbidden = { consecutiveDigit: null, sandwichOuter: null, sandwichInner: null }, maxLoops = 100000) => {
        const evaluateSwap = () => {
            let pScore = 0;
            sideRows.forEach((r, idx) => {
                let c = 0, s = 0;
                for (let i = 0; i < r.digits.length; i++) {
                    if (r.digits[i] === null) continue;
                    if (i > 0 && r.digits[i - 1] === r.digits[i]) {
                        c++;
                        if (forbidden.consecutiveDigit !== null && forbidden.consecutiveDigit === r.digits[i]) {
                            pScore += 1000;
                        }
                    }
                    if (i > 1 && r.digits[i - 2] === r.digits[i]) {
                        s++;
                        if (forbidden.sandwichOuter !== null || forbidden.sandwichInner !== null) {
                            if (r.digits[i] === forbidden.sandwichOuter || r.digits[i] === forbidden.sandwichInner ||
                                r.digits[i - 1] === forbidden.sandwichOuter || r.digits[i - 1] === forbidden.sandwichInner) {
                                pScore += 1000;
                            }
                        }
                    }
                }
                if (idx === targets.consecutive) {
                    if (c !== 1) pScore += 100;
                    if (s > 0) pScore += 100;
                } else if (idx === targets.sandwich) {
                    if (s !== 1) pScore += 100;
                    if (c > 0) pScore += 100;
                } else {
                    if (c > 0) pScore += 100;
                    if (s > 0) pScore += 100;
                }
            });
            const transScore = calculateTransitions(rowsA, rowsB);
            return pScore + transScore;
        };

        let pScore = evaluateSwap();
        let loop = 0;
        while (pScore > 0 && loop < maxLoops) {
            loop++;
            const r1 = Math.floor(Math.random() * 10);
            const r2 = Math.floor(Math.random() * 10);
            if (r1 === r2) continue;
            
            const i1 = Math.floor(Math.random() * (sideRows[r1].len - 2)) + 1;
            const i2 = Math.floor(Math.random() * (sideRows[r2].len - 2)) + 1;
            
            const val1 = sideRows[r1].digits[i1];
            const val2 = sideRows[r2].digits[i2];
            sideRows[r1].digits[i1] = val2;
            sideRows[r2].digits[i2] = val1;
            
            const newScore = evaluateSwap();
            if (newScore <= pScore) {
                pScore = newScore;
            } else {
                sideRows[r1].digits[i1] = val1;
                sideRows[r2].digits[i2] = val2;
            }
        }
        return pScore === 0;
    };

    if (!applyPatternsPostProcess(rowsA, targetsA, { consecutiveDigit: null, sandwichOuter: null, sandwichInner: null }, 100000)) return null;

    const extractPatternDigits = (sideRows, targets) => {
        let consecutiveDigit = null;
        let sandwichOuter = null;
        let sandwichInner = null;

        const cRow = sideRows[targets.consecutive].digits;
        for (let i = 1; i < cRow.length; i++) {
            if (cRow[i] !== null && cRow[i] === cRow[i - 1]) consecutiveDigit = cRow[i];
        }
        
        const sRow = sideRows[targets.sandwich].digits;
        for (let i = 2; i < sRow.length; i++) {
            if (sRow[i] !== null && sRow[i] === sRow[i - 2]) {
                sandwichOuter = sRow[i];
                sandwichInner = sRow[i - 1];
            }
        }
        return { consecutiveDigit, sandwichOuter, sandwichInner };
    };

    const forbiddenB = extractPatternDigits(rowsA, targetsA);
    if (!applyPatternsPostProcess(rowsB, targetsB, forbiddenB, 200000)) return null;

    // Step 6 & 7: Dividend 先頭1〜9網羅ペアリングおよび1未満小数行(zc=1,2,3均等)の統合決定
    let foundValidPairing = false;
    let selectedLessThanOneRow = null;
    let selectedLessThanOneConfig = null;

    rowsB.forEach((row, idx) => { row.originalIdx = idx; });

    const isPatternRow = (rIdx) => {
        const originalIdx = rowsB[rIdx].originalIdx;
        return (originalIdx === targetsB.consecutive || originalIdx === targetsB.sandwich);
    };

    // AA/ABAパターン維持チェック
    const checkRowsAPatternsValid = (rowsAArr, tA) => {
        let ansAACount = 0, ansABACount = 0;
        let ansNonTargetPatternCount = 0;

        for (let i = 0; i < 10; i++) {
            const ansDigits = rowsAArr[i].digits;
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
        }
        return (ansAACount === 1 && ansABACount === 1 && ansNonTargetPatternCount === 0);
    };

    // 中間桁スワップによる数字配分維持補正関数
    const applyNewADigitsAndBalance = (rowsAArr, candRow, newADigits, availableRowsArr) => {
        const oldDigits = [...rowsAArr[candRow].digits];
        rowsAArr[candRow].digits = [...newADigits];

        const diff = Array(10).fill(0);
        for (let k = 1; k < oldDigits.length - 1; k++) {
            diff[oldDigits[k]]++;
            diff[newADigits[k]]--;
        }

        const surplus = [];
        const deficit = [];
        for (let d = 0; d <= 9; d++) {
            if (diff[d] < 0) {
                for (let c = 0; c < -diff[d]; c++) surplus.push(d);
            } else if (diff[d] > 0) {
                for (let c = 0; c < diff[d]; c++) deficit.push(d);
            }
        }

        if (surplus.length === 0) return checkRowsAPatternsValid(rowsAArr, targetsA);

        const otherRows = availableRowsArr.filter(r => r !== candRow);
        const otherIndices = [...otherRows];
        shuffle(otherIndices);

        for (let sIdx = 0; sIdx < surplus.length; sIdx++) {
            const targetSurplus = surplus[sIdx];
            const targetDeficit = deficit[sIdx];

            let swapped = false;
            for (const rIdx of otherIndices) {
                const rDigits = rowsAArr[rIdx].digits;
                for (let k = 1; k < rDigits.length - 1; k++) {
                    if (rDigits[k] === targetSurplus) {
                        rDigits[k] = targetDeficit;
                        swapped = true;
                        break;
                    }
                }
                if (swapped) break;
            }
            if (!swapped) return false;
        }

        return checkRowsAPatternsValid(rowsAArr, targetsA);
    };

    // zc (1, 2, 3) の確率的完全均等（約33.3%ずつ）を保証するため、目標 zc を 1, 2, 3 から1つ選択
    const targetZc = [1, 2, 3][Math.floor(Math.random() * 3)];

    for (let shuffleAttempt = 0; shuffleAttempt < 50000; shuffleAttempt++) {
        for (let i = rowsB.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rowsB[i], rowsB[j]] = [rowsB[j], rowsB[i]];
        }

        let validLengths = true;
        for (let i = 0; i < 10; i++) {
            const sum = rowsA[i].len + rowsB[i].len;
            if (sum < 10 || sum > 12) { validLengths = false; break; }
        }
        if (!validLengths) continue;

        const availableRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(r => !isPatternRow(r));
        const validRows = availableRows.filter(r => rowsB[r].len <= 7 - targetZc);
        if (validRows.length === 0) continue;

        let candFound = false;
        let bestCandRow = null;
        let bestCandConfig = null;

        for (const rIdx of validRows) {
            const digitsStr = rowsB[rIdx].digits.join('');
            let bPrefix = "0.";
            if (targetZc === 2) bPrefix = "0.0";
            else if (targetZc === 3) bPrefix = "0.00";

            const B_val = parseFloat(bPrefix + digitsStr);
            const rA = rowsA[rIdx];
            const head = rA.digits[0];
            const tail = rA.digits[rA.len - 1];

            const minA = head * Math.pow(10, rA.len - 1);
            const maxA = (head + 1) * Math.pow(10, rA.len - 1) - 1;

            const X_start = Math.max(1, Math.floor(minA * B_val));
            const X_end = Math.ceil(maxA * B_val);

            const candidates = [];
            for (let X = X_start; X <= X_end; X++) {
                const calcA = Math.round(X / B_val);
                if (calcA >= minA && calcA <= maxA && calcA % 10 === tail) {
                    const q = X / B_val;
                    let type = 'int';
                    const rem = q - Math.floor(q);
                    if (Math.abs(q - calcA) > 1e-7) {
                        if (rem >= 0.5 - 1e-7) type = 'up';
                        else if (rem > 1e-7) type = 'down';
                    }
                    candidates.push({ Dividend: X, calcA, type });
                }
            }

            if (candidates.length > 0) {
                shuffle(candidates);
                for (const cand of candidates) {
                    const newADigits = cand.calcA.toString().split('').map(Number);
                    const rowsABackup = rowsA.map(r => ({ ...r, digits: [...r.digits] }));
                    if (applyNewADigitsAndBalance(rowsA, rIdx, newADigits, availableRows)) {
                        candFound = true;
                        bestCandRow = rIdx;
                        bestCandConfig = { B_val, Dividend: cand.Dividend, type: cand.type, zc: targetZc };
                        break;
                    } else {
                        rowsA.forEach((r, idx) => { r.digits = [...rowsABackup[idx].digits]; });
                    }
                }
                if (candFound) break;
            }
        }

        if (!candFound) continue;

        const firstDigitsSet = new Set();
        for (let i = 0; i < 10; i++) {
            let ans;
            if (i === bestCandRow) {
                ans = bestCandConfig.Dividend;
            } else {
                const leftVal = parseInt(rowsA[i].digits.join(''), 10);
                const rightVal = parseInt(rowsB[i].digits.join(''), 10);
                ans = leftVal * rightVal;
            }
            const ansStr = ans.toString();
            let fd = null;
            for (let k = 0; k < ansStr.length; k++) {
                if (ansStr[k] !== '0') { fd = ansStr[k]; break; }
            }
            if (fd) firstDigitsSet.add(fd);
        }

        if (firstDigitsSet.size === 9) {
            foundValidPairing = true;
            selectedLessThanOneRow = bestCandRow;
            selectedLessThanOneConfig = bestCandConfig;
            break;
        }
    }
    if (!foundValidPairing) return null;

    const lessThanOneRow = selectedLessThanOneRow;
    const lessThanOneConfig = selectedLessThanOneConfig;

    const availableRowsForDecimal = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(r => !isPatternRow(r));

    const remainingDecimalRows = availableRowsForDecimal.filter(r => r !== lessThanOneRow);
    if (remainingDecimalRows.length < 3) return null;
    const normalDecimalRows = remainingDecimalRows.slice(0, 3);
    const decimalRows = [lessThanOneRow, ...normalDecimalRows];
    const intRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(r => !decimalRows.includes(r));

    const rowConfigs = Array(10).fill(null);
    let upCount = 0;
    let downCount = 0;

    // 【追加】小数点位置の重複判定用の履歴
    const usedDecimals = [];

    // 1未満の小数行の設定
    rowConfigs[lessThanOneRow] = {
        isDecimal: true,
        isLessThanOne: true,
        decIdx: null,
        B_val: lessThanOneConfig.B_val,
        Dividend: lessThanOneConfig.Dividend,
        type: lessThanOneConfig.type,
        zc: lessThanOneConfig.zc
    };
    if (lessThanOneConfig.type === 'up') upCount++;
    else if (lessThanOneConfig.type === 'down') downCount++;

    // 1未満の小数の特徴を履歴に登録（整数部: 0桁, 小数部: len + zc桁）
    usedDecimals.push({
        intLen: 0,
        fracLen: rowsB[lessThanOneRow].len + lessThanOneConfig.zc
    });

    // O(1) 区間算出ユーティリティ（通常小数用）
    const getExactDividendForDecimal = (A, B_val, preferredType = 'any') => {
        const X_base = Math.round(A * B_val);
        const candidates = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5];
        let best = null;
        for (const offset of candidates) {
            const X = X_base + offset;
            if (X <= 0) continue;
            if (Math.round(X / B_val) === A) {
                const q = X / B_val;
                let type = 'int';
                const rem = q - Math.floor(q);
                if (Math.abs(q - A) > 1e-7) {
                    if (rem >= 0.5 - 1e-7) type = 'up';
                    else if (rem > 1e-7) type = 'down';
                }
                if (preferredType !== 'any' && type === preferredType) {
                    return { X, type };
                }
                if (!best) best = { X, type };
            }
        }
        return best;
    };

    // 通常小数行の設定
    for (const rIdx of normalDecimalRows) {
        const A = parseInt(rowsA[rIdx].digits.join(''), 10);
        const B_str = rowsB[rIdx].digits.join('');
        const lenB = rowsB[rIdx].len;
        
        // decIdx をスコアベースで決定（重複の最小化）
        let bestDecIdx = -1;
        let bestScore = Infinity;
        const candidatesIdx = [];
        for (let i = 0; i < lenB - 1; i++) candidatesIdx.push(i);
        
        // 候補のシャッフル（同スコア時にばらけるように）
        for (let i = candidatesIdx.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidatesIdx[i], candidatesIdx[j]] = [candidatesIdx[j], candidatesIdx[i]];
        }

        for (const cIdx of candidatesIdx) {
            const intLen = cIdx + 1;
            const fracLen = lenB - intLen;
            let score = 0;
            // A案ベース: いずれかが一致していればペナルティ
            for (const used of usedDecimals) {
                if (used.intLen === intLen && used.fracLen === fracLen) {
                    score += 100; // 形状完全一致は重いペナルティ
                } else if (used.intLen === intLen) {
                    score += 10;  // 整数部一致ペナルティ
                } else if (used.fracLen === fracLen) {
                    score += 10;  // 小数部一致ペナルティ
                }
            }
            if (score < bestScore) {
                bestScore = score;
                bestDecIdx = cIdx;
            }
        }
        
        const decIdx = bestDecIdx;
        usedDecimals.push({ intLen: decIdx + 1, fracLen: lenB - (decIdx + 1) });

        const B_val = parseFloat(B_str.slice(0, decIdx + 1) + "." + B_str.slice(decIdx + 1));

        let preferredType = 'any';
        if (upCount < 2) preferredType = 'up';
        else if (downCount < 2) preferredType = 'down';

        const result = getExactDividendForDecimal(A, B_val, preferredType);
        if (!result) return null;

        rowConfigs[rIdx] = {
            isDecimal: true,
            isLessThanOne: false,
            decIdx,
            B_val,
            Dividend: result.X,
            type: result.type
        };

        if (result.type === 'up') upCount++;
        else if (result.type === 'down') downCount++;
    }

    if (upCount > 2 || downCount > 2) return null;

    // 整数行の設定 (不足分 neededUp, neededDown を確定制御)
    const neededUp = 2 - upCount;
    const neededDown = 2 - downCount;
    let assignIdx = 0;

    for (const rIdx of intRows) {
        const A = parseInt(rowsA[rIdx].digits.join(''), 10);
        const B_val = parseInt(rowsB[rIdx].digits.join(''), 10);
        let type = 'int';
        if (assignIdx < neededUp) type = 'up';
        else if (assignIdx < neededUp + neededDown) type = 'down';
        assignIdx++;

        let Dividend;
        if (type === 'up') {
            Dividend = A * B_val - Math.floor(B_val * 0.25);
        } else if (type === 'down') {
            Dividend = A * B_val + Math.floor(B_val * 0.25);
        } else {
            Dividend = A * B_val;
        }

        rowConfigs[rIdx] = {
            isDecimal: false,
            isLessThanOne: false,
            decIdx: null,
            B_val,
            Dividend,
            type
        };
    }

    // 最終問題データの構築
    const finalProblems = [];
    for (let i = 0; i < 10; i++) {
        const p = createInitialDivisionState();
        const rA = rowsA[i];
        const rB = rowsB[i];
        const conf = rowConfigs[i];

        // 商 (Answer) - 右詰
        for (let k = 0; k < rA.len; k++) {
            p.answer[7 - rA.len + k] = rA.digits[k];
        }

        // 除数 (Divisor) - 右詰 (野良0注入なし、桁数は rB.len そのまま)
        for (let k = 0; k < rB.len; k++) {
            p.divisor[7 - rB.len + k] = rB.digits[k];
        }

        // 小数点位置設定
        if (conf.isLessThanOne) {
            p.decimalDivisor = 7 - rB.len - conf.zc;
        } else if (conf.isDecimal) {
            p.decimalDivisor = 7 - rB.len + conf.decIdx;
        } else {
            p.decimalDivisor = null;
        }

        // 割られる数 (Dividend) - 12桁右詰
        const divStr = conf.Dividend.toString();
        const divLen = divStr.length;
        if (divLen > 12) {
            console.error(`被除数が12桁を超えています（${divLen}桁: ${conf.Dividend}）。`);
        }
        const divOffset = 12 - divLen;
        for (let j = 0; j < divLen; j++) {
            if (divOffset + j >= 0 && divOffset + j < 12) {
                p.dividend[divOffset + j] = parseInt(divStr[j], 10);
            }
        }
        p.roundType = conf.type;
        finalProblems.push(p);
    }

    return finalProblems;
};


