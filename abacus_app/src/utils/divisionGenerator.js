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
    
    while (attempts < 50) {
        attempts++;
        const problems = _generateDivisionProblems_internal();
        if (!problems) continue;

        // 割られる数(Dividend)の先頭桁(1-9)のバリエーション数を評価
        const firstDigitsSet = new Set();
        for (const p of problems) {
            let leftStr = p.answer.filter(d => d !== null).join('');
            let rightStr = p.divisor.filter(d => d !== null).join('');
            
            let leftVal = parseInt(leftStr, 10);
            let rightVal;
            if (p.decimalDivisor !== null) {
                const rightArr = p.divisor.map(d => d === null ? '' : d);
                const decIdx = p.decimalDivisor;
                const rStr = rightArr.slice(0, decIdx + 1).join('') + '.' + rightArr.slice(decIdx + 1).join('');
                rightVal = parseFloat(rStr);
            } else {
                rightVal = parseInt(rightStr, 10);
            }
            
            const ans = leftVal * rightVal;
            const ansStr = ans.toString().replace('.', '');
            let fd = null;
            for(let i=0; i<ansStr.length; i++) {
                if(ansStr[i] !== '0') {
                    fd = ansStr[i];
                    break;
                }
            }
            if (fd) firstDigitsSet.add(fd);
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
    let countsA, countsB;
    let countAttempts = 0;
    while (countAttempts < 1000) {
        countAttempts++;
        const generateCounts = () => {
            let array = Array(10).fill(0).map(() => Math.floor(Math.random() * 4) + 4);
            let sum = array.reduce((a, b) => a + b, 0);
            let safety = 0;
            while (sum !== 55 && safety < 100) {
                safety++;
                const index = Math.floor(Math.random() * 10);
                if (sum < 55 && array[index] < 7) { array[index]++; sum++; }
                else if (sum > 55 && array[index] > 4) { array[index]--; sum--; }
            }
            return (sum === 55) ? array : null;
        };
        const ca = generateCounts();
        if (!ca) continue;
        const cb = generateCounts();
        if (!cb) continue;
        let valid = true;
        for (let i = 0; i < 10; i++) {
            if (ca[i] + cb[i] < 10 || ca[i] + cb[i] > 12) { valid = false; break; }
        }
        if (valid) { countsA = ca; countsB = cb; break; }
    }
    if (!countsA || !countsB) return null;

    const possibleDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffle = (arr) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    };
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
        rowIndices.forEach((rIdx, i) => { rows[rIdx].digits[rows[rIdx].len - 1] = takeFromPool(basePool, lastDigits[i]); });

        const firstDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        firstDigits.push(Math.floor(Math.random() * 9) + 1);
        shuffle(firstDigits);
        shuffle(rowIndices);
        rowIndices.forEach((rIdx, i) => { rows[rIdx].digits[0] = takeFromPool(basePool, firstDigits[i]); });

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

    const getRowPatternScore = (rowDigits) => {
        let score = 0;
        for (let i = 0; i < rowDigits.length; i++) {
            const digit = rowDigits[i];
            if (digit === null) continue;
            if (i > 0 && rowDigits[i - 1] === digit) score++;
            if (i > 1 && rowDigits[i - 2] === digit) score++;
        }
        return score;
    };

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

    const calculateTotalScoreOriginal = (rA, rB) => {
        let score = 0;
        rA.forEach(r => score += getRowPatternScore(r.digits));
        rB.forEach(r => score += getRowPatternScore(r.digits));
        score += calculateTransitions(rA, rB);
        return score;
    };

    // 最適化ループ（重複パターンの削除）
    let currentScore = calculateTotalScoreOriginal(rowsA, rowsB);
    const startTime = Date.now();
    const DURATION = 2000;

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

        const val1 = targetRows[r1].digits[i1];
        const val2 = targetRows[r2].digits[i2];
        targetRows[r1].digits[i1] = val2;
        targetRows[r2].digits[i2] = val1;

        const newScore = calculateTotalScoreOriginal(rowsA, rowsB);
        if (newScore <= currentScore) {
            currentScore = newScore;
            if (newScore === 0) break;
        } else {
            targetRows[r1].digits[i1] = val1;
            targetRows[r2].digits[i2] = val2;
        }
    }
    
    if (currentScore > 0) return null;

    // 後処理：特定行への連続・挟み桁の組み立て
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
        while(pScore > 0 && loop < maxLoops) {
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

    if (!applyPatternsPostProcess(rowsB, targetsB, forbiddenB, 300000)) return null;

    // 割られる数の先頭数字が1〜9を網羅するペアリング探索
    let foundValidPairing = false;
    rowsB.forEach((row, idx) => {
        row.originalIdx = idx;
    });

    for (let shuffleAttempt = 0; shuffleAttempt < 50000; shuffleAttempt++) {
        for (let i = rowsB.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rowsB[i], rowsB[j]] = [rowsB[j], rowsB[i]];
        }

        let validLengths = true;
        for (let i = 0; i < 10; i++) {
            const sum = rowsA[i].len + rowsB[i].len;
            if (sum < 10 || sum > 12) {
                validLengths = false;
                break;
            }
        }
        if (!validLengths) continue;

        const firstDigitsSet = new Set();
        for (let i = 0; i < 10; i++) {
            const leftVal = parseInt(rowsA[i].digits.join(''), 10);
            const rightVal = parseInt(rowsB[i].digits.join(''), 10);
            const ans = leftVal * rightVal;
            const ansStr = ans.toString();
            let fd = null;
            for(let k = 0; k < ansStr.length; k++) {
                if(ansStr[k] !== '0') {
                    fd = ansStr[k];
                    break;
                }
            }
            if (fd) firstDigitsSet.add(fd);
        }

        if (firstDigitsSet.size === 9) {
            foundValidPairing = true;
            break;
        }
    }

    if (!foundValidPairing) return null;

    // 除算における小数の付与、四捨五入タイプ判定、および被除数(Dividend)の逆算構築
    const isPatternRow = (rIdx) => {
        const originalIdx = rowsB[rIdx].originalIdx;
        return (originalIdx === targetsB.consecutive || originalIdx === targetsB.sandwich);
    };

    const availableRowsForDecimal = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(r => !isPatternRow(r));
    shuffle(availableRowsForDecimal);

    // 1未満の小数行（0.xxx）用ゼロ個数決定
    const desiredZc = Math.floor(Math.random() * 3) + 1; // 1, 2, 3

    const possibleLessThanOneRows = availableRowsForDecimal.filter(r => rowsB[r].len + desiredZc <= 7);
    if (possibleLessThanOneRows.length === 0) return null;

    const lessThanOneRow = possibleLessThanOneRows[0];
    
    const remainingDecimalRows = availableRowsForDecimal.filter(r => r !== lessThanOneRow);
    if (remainingDecimalRows.length < 3) return null;

    const normalDecimalRows = remainingDecimalRows.slice(0, 3);
    const decimalRows = [lessThanOneRow, ...normalDecimalRows];
    const intRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(r => !decimalRows.includes(r));

    const finalProblems = [];
    let upCount = 0;
    let downCount = 0;

    const rowConfigs = Array(10).fill(null);

    // 1. 1未満の小数行の Dividend 逆算と四捨五入タイプ確定
    {
        const rIdx = lessThanOneRow;
        const A = parseInt(rowsA[rIdx].digits.join(''), 10);
        let B_val, B_str, decIdx, zc = desiredZc, newLen = rowsB[rIdx].len;
        
        B_str = "";
        for(let i=0; i<zc; i++) B_str += "0";
        B_str += rowsB[rIdx].digits.slice(0, newLen).join('');
        decIdx = zc - 1;
        
        let prefix = "0.";
        for(let i = 1; i < zc; i++) prefix += "0";
        B_val = parseFloat(prefix + rowsB[rIdx].digits.slice(0, newLen).join(''));
        
        let Dividend = Math.round(A * B_val);
        let actualA = Math.round(Dividend / B_val);
        let safety = 0;
        let direction = actualA < A ? 1 : -1;
        while (actualA !== A && safety < 100) {
            Dividend += direction;
            actualA = Math.round(Dividend / B_val);
            safety++;
        }
        if (actualA !== A) return null;

        const quotient = Dividend / B_val;
        let type = 'int';
        if (Math.abs(quotient - A) > 1e-9) {
            const decPart = (quotient % 1 + 1) % 1;
            if (decPart >= 0.5) type = 'up';
            else if (decPart > 1e-9) type = 'down';
        }
        
        if (type === 'up') upCount++;
        else if (type === 'down') downCount++;

        rowConfigs[rIdx] = { isDecimal: true, isLessThanOne: true, B_str, decIdx, zc, newLen, B_val, Dividend, type };
    }

    // 2. 通常小数行の Dividend 調整と切り上げ/切り捨て配分
    for (const rIdx of normalDecimalRows) {
        const A = parseInt(rowsA[rIdx].digits.join(''), 10);
        const B_str = rowsB[rIdx].digits.join('');
        const decIdx = Math.floor(Math.random() * (rowsB[rIdx].len - 1));
        const B_val = parseFloat(B_str.slice(0, decIdx + 1) + "." + B_str.slice(decIdx + 1));

        let neededType = 'int';
        if (upCount < 2) neededType = 'up';
        else if (downCount < 2) neededType = 'down';

        let Dividend = Math.round(A * B_val);
        let type = 'int';
        let actualA = Math.round(Dividend / B_val);
        
        if (neededType === 'up') {
            let safety = 0;
            while(safety < 100) {
                actualA = Math.round(Dividend / B_val);
                if (actualA !== A) { Dividend -= 1; break; }
                const q = Dividend / B_val;
                const decPart = (q % 1 + 1) % 1;
                if (decPart >= 0.5) { type = 'up'; break; }
                Dividend++;
                safety++;
            }
        } else if (neededType === 'down') {
            let safety = 0;
            while(safety < 100) {
                actualA = Math.round(Dividend / B_val);
                if (actualA !== A) { Dividend += 1; break; } 
                const q = Dividend / B_val;
                const decPart = (q % 1 + 1) % 1;
                if (decPart >= 0.01 && decPart < 0.5) { type = 'down'; break; }
                Dividend--;
                safety++;
            }
        }

        actualA = Math.round(Dividend / B_val);
        if (actualA !== A) return null;
        
        const q = Dividend / B_val;
        const decPart = (q % 1 + 1) % 1;
        if (Math.abs(q - A) > 1e-9) {
            if (decPart >= 0.5) type = 'up';
            else if (decPart > 1e-9) type = 'down';
        } else {
            type = 'int';
        }
        
        if (type === 'up') upCount++;
        else if (type === 'down') downCount++;

        rowConfigs[rIdx] = { isDecimal: true, isLessThanOne: false, B_str, decIdx, zc: 0, newLen: rowsB[rIdx].len, B_val, Dividend, type };
    }

    if (upCount > 2 || downCount > 2) return null;

    // 3. 整数行（あまりあり/なし）の構築と全体の還元商/確信商難易度バランスを揃える
    const neededUp = 2 - upCount;
    const neededDown = 2 - downCount;
    let assignIdx = 0;
    
    for (const rIdx of intRows) {
        const A = parseInt(rowsA[rIdx].digits.join(''), 10);
        const B_str = rowsB[rIdx].digits.join('');
        const B_val = parseInt(B_str, 10);
        
        let type = 'int';
        if (assignIdx < neededUp) type = 'up';
        else if (assignIdx < neededUp + neededDown) type = 'down';
        
        assignIdx++;
        
        let Dividend;
        if (type === 'up') {
            const fraction = 0.5 + Math.random() * 0.4;
            Dividend = (A - 1) * B_val + Math.floor(B_val * fraction);
        } else if (type === 'down') {
            const fraction = 0.1 + Math.random() * 0.3;
            Dividend = A * B_val + Math.floor(B_val * fraction);
        } else {
            Dividend = A * B_val;
        }

        rowConfigs[rIdx] = { isDecimal: false, isLessThanOne: false, B_str, decIdx: null, zc: 0, newLen: rowsB[rIdx].len, B_val, Dividend, type };
    }

    // 10問分のデータ構造に整形
    for (let i = 0; i < 10; i++) {
        const p = createInitialDivisionState();
        const rA = rowsA[i]; // Answer
        const rB = rowsB[i]; // Divisor
        const conf = rowConfigs[i];

        // 商 (Answer)
        for (let k = 0; k < rA.len; k++) p.answer[7 - rA.len + k] = rA.digits[k];

        // 割る数 (Divisor)
        if (conf.isLessThanOne) {
            const startIdx = 7 - (conf.newLen + conf.zc);
            for (let k = 0; k < conf.zc; k++) p.divisor[startIdx + k] = 0;
            for (let k = 0; k < conf.newLen; k++) p.divisor[startIdx + conf.zc + k] = rB.digits[k];
            p.decimalDivisor = startIdx;
        } else if (conf.isDecimal) {
            for (let k = 0; k < conf.newLen; k++) p.divisor[7 - conf.newLen + k] = rB.digits[k];
            p.decimalDivisor = 7 - conf.newLen + conf.decIdx;
        } else {
            for (let k = 0; k < conf.newLen; k++) p.divisor[7 - conf.newLen + k] = rB.digits[k];
        }

        // 被除数 (Dividend: 割られる数) 12桁右詰め配置
        const divStr = conf.Dividend.toString();
        const divLen = divStr.length;
        const divOffset = 12 - divLen;
        for (let j = 0; j < divLen; j++) {
            if (divOffset + j >= 0 && divOffset + j < 12) {
                p.dividend[divOffset + j] = parseInt(divStr[j], 10);
            }
        }
        // UI強調（還元商/確信商）用の属性
        p.roundType = conf.type;
        
        finalProblems.push(p);
    }
    
    return finalProblems;
};

