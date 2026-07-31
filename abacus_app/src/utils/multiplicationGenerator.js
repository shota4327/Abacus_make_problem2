/**
 * @file multiplicationGenerator.js
 * @description 掛け算問題(10問分)の自動生成アルゴリズムを提供するユーティリティです。
 * 桁数の配分(合計10〜12桁)、各数字(0-9)の全問題を通じた出現頻度の均等化、1未満の小数の割り振りと四捨五入（切り上げ2・切り捨て2）のバランス生成などを制御します。
 */

import { createInitialMultiplicationState } from '../constants/initialState.js';

/**
 * 掛け算問題の1つの口（左辺または右辺）を指定桁数でランダムに再生成します。
 * 
 * @param {Object} currentProblem - 現在の掛け算問題データ
 * @param {'left'|'right'} side - 再生成対象（left:被乗数 / right:乗数）
 * @param {number|'R'} length - 再生成する桁数（'R'の場合は4〜7桁からランダム）
 * @returns {Object} 更新された掛け算問題データ
 */
export const regenerateMultiplicationRow = (currentProblem, side, length) => {
    const updatedProblem = { ...currentProblem };
    let finalLength = length;
    // 'R'が指定された場合は4〜7桁からランダムに決定
    if (length === 'R') finalLength = Math.floor(Math.random() * 4) + 4;

    // 0〜9の数字プールをシャッフル
    const digitsPool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digitsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digitsPool[i], digitsPool[j]] = [digitsPool[j], digitsPool[i]];
    }
    const newDigits = digitsPool.slice(0, finalLength);
    // 先頭桁が0にならないよう入れ替え
    if (newDigits[0] === 0) [newDigits[0], newDigits[1]] = [newDigits[1], newDigits[0]];

    // 7桁固定配列の右詰めで配置
    const newArray = Array(7).fill(null);
    const startIndex = 7 - finalLength;
    for (let k = 0; k < finalLength; k++) newArray[startIndex + k] = newDigits[k];
    updatedProblem[side] = newArray;

    // 右辺の場合は30%の確率で小数点を付与
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
 * 条件を満たす10問の掛け算問題を全自動で生成します。
 * 最大50回の試行を行い、成功した問題セットを返します。
 * 
 * @returns {Array<Object>} 10問分の掛け算問題状態オブジェクトの配列
 */
export const generateMultiplicationProblems = () => {
    let attempts = 0;
    
    while (attempts < 50) {
        attempts++;
        const problems = _generateMultiplicationProblems_internal();
        if (problems) return problems;
    }
    console.warn("フォールバックとして空の初期状態を返します");
    return Array(10).fill(null).map(() => createInitialMultiplicationState());
};

/**
 * 掛け算問題群生成の内部処理メイン関数
 * 1. 左右の桁数配分決定
 * 2. 数字(0-9)の出現頻度均等化プール作成
 * 3. 連続桁・挟み桁などのパターン配置
 * 4. 積の先頭桁重複防止チェック
 * 5. 四捨五入バランス（切り上げ2問、切り捨て2問）および1未満の小数の配置
 * 
 * @private
 * @returns {Array<Object>|null} 10問分の問題配列、生成失敗時はnull
 */
const _generateMultiplicationProblems_internal = () => {
    let countsA, countsB;
    let countAttempts = 0;
    // 1. 各問の桁数（4〜7桁、左右合計10〜12桁）の試行決定
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

    // 2. 0〜9の数字出現度均等割り当てプール
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

    /** 連続桁と挟み桁を配置する行ターゲットを選択 */
    const pickTargets = () => {
        const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffle(arr);
        return { consecutive: arr[0], sandwich: arr[1] };
    };
    const targetsA = pickTargets();
    const targetsB = pickTargets();

    /** プールから数字を取り出し、先頭・末尾・中間桁を初期配置 */
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

    /** 行内での連続桁・挟み桁などの評価スコア */
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

    /** 2数字の遷移（並び順）重複過多のチェックペナルティ評価 */
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

    /** 全体パターンスコア（不要な重複がないか）の計算 */
    const calculateTotalScoreOriginal = (rA, rB) => {
        let score = 0;
        rA.forEach(r => score += getRowPatternScore(r.digits));
        rB.forEach(r => score += getRowPatternScore(r.digits));
        score += calculateTransitions(rA, rB);
        return score;
    };

    // 最適化ループ（不要パターンを0にする山登り法）
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

    /** 後処理：指定したターゲット行に意図した連続・挟みパターンを正確に1つずつ作成するスワップ処理 */
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
    
    /** A側で作成されたパターンの構成数字を抽出 */
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

    // B側のパターン生成
    if (!applyPatternsPostProcess(rowsB, targetsB, forbiddenB, 300000)) return null;

    rowsB.forEach((r, idx) => { r.originalIdx = idx; });

    // 左右ペアリング（積の先頭桁が1〜9まで全数字重複なく出現するかを検証）
    let foundValidPairing = false;
    let shuffleAttempts = 0;
    while (shuffleAttempts < 5000) {
        shuffleAttempts++;
        if (shuffleAttempts > 1) {
            for (let i = 9; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rowsB[i], rowsB[j]] = [rowsB[j], rowsB[i]];
            }
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

    // --- 小数点位置と四捨五入型（切り上げ / 切り捨て）の判別補助関数 ---
    const getDecimalResultType = (valAStr, valBStr, decIdx) => {
        const valA = parseInt(valAStr, 10);
        const valB = parseFloat(valBStr.slice(0, decIdx + 1) + "." + valBStr.slice(decIdx + 1));
        const res = valA * valB;
        if (Number.isInteger(res)) return 'int';
        return (res % 1 >= 0.5) ? 'up' : 'down';
    };

    const candidates = { up: [], down: [] };

    for (let rIdx = 0; rIdx < 10; rIdx++) {
        const rAStr = rowsA[rIdx].digits.join('');
        
        const isPatternRow = (rowsB[rIdx].originalIdx === targetsB.consecutive || rowsB[rIdx].originalIdx === targetsB.sandwich);
        
        if (!isPatternRow) {
            // 1未満の小数の候補検索（先頭ゼロ埋め 0.xxx）
            for (let zc = 1; zc <= 3; zc++) {
                let tempLen = rowsB[rIdx].len;
                let tempZC = zc;
                if (tempLen + tempZC > 7) {
                    continue;
                }
                if (tempZC > 0) {
                    let rBStr = "";
                    for(let i = 0; i < tempZC; i++) rBStr += "0";
                    rBStr += rowsB[rIdx].digits.slice(0, tempLen).join('');
                    
                    const decIdx = 0;
                    const type = getDecimalResultType(rAStr, rBStr, decIdx);
                    if (type === 'up' || type === 'down') {
                        candidates[type].push({
                            rIdx: rIdx,
                            isLessThanOne: true,
                            zeroCount: tempZC,
                            newLen: tempLen,
                            pos: decIdx,
                            type: type
                        });
                    }
                }
            }
        }

        // 通常の小数点付け替え候補
        const rBStr = rowsB[rIdx].digits.join('');
        for (let pos = 0; pos < rowsB[rIdx].len - 1; pos++) {
            const type = getDecimalResultType(rAStr, rBStr, pos);
            if (type === 'up' || type === 'down') {
                candidates[type].push({
                    rIdx: rIdx,
                    isLessThanOne: false,
                    pos: pos,
                    type: type
                });
            }
        }
    }

    shuffle(candidates.up);
    shuffle(candidates.down);

    // 切り上げ2問、切り捨て2問のバランス構成を決定
    let selectedCombo = null;
    const lessThanOneTarget = Math.random() < 0.9 ? 1 : 2;

    outerLoop:
    for (let i = 0; i < candidates.up.length - 1; i++) {
        for (let j = i + 1; j < candidates.up.length; j++) {
            for (let k = 0; k < candidates.down.length - 1; k++) {
                for (let l = k + 1; l < candidates.down.length; l++) {
                    const u1 = candidates.up[i];
                    const u2 = candidates.up[j];
                    const d1 = candidates.down[k];
                    const d2 = candidates.down[l];
                    
                    const rows = new Set([u1.rIdx, u2.rIdx, d1.rIdx, d2.rIdx]);
                    if (rows.size !== 4) continue;
                    
                    let ltCount = 0;
                    if (u1.isLessThanOne) ltCount++;
                    if (u2.isLessThanOne) ltCount++;
                    if (d1.isLessThanOne) ltCount++;
                    if (d2.isLessThanOne) ltCount++;
                    
                    if (ltCount === lessThanOneTarget) {
                        selectedCombo = [u1, u2, d1, d2];
                        break outerLoop;
                    }
                }
            }
        }
    }

    if (!selectedCombo) {
        outerLoop2:
        for (let i = 0; i < candidates.up.length - 1; i++) {
            for (let j = i + 1; j < candidates.up.length; j++) {
                for (let k = 0; k < candidates.down.length - 1; k++) {
                    for (let l = k + 1; l < candidates.down.length; l++) {
                        const u1 = candidates.up[i];
                        const u2 = candidates.up[j];
                        const d1 = candidates.down[k];
                        const d2 = candidates.down[l];
                        
                        const rows = new Set([u1.rIdx, u2.rIdx, d1.rIdx, d2.rIdx]);
                        if (rows.size !== 4) continue;
                        
                        let ltCount = 0;
                        if (u1.isLessThanOne) ltCount++;
                        if (u2.isLessThanOne) ltCount++;
                        if (d1.isLessThanOne) ltCount++;
                        if (d2.isLessThanOne) ltCount++;
                        
                        if (ltCount >= 1) { 
                            selectedCombo = [u1, u2, d1, d2];
                            break outerLoop2;
                        }
                    }
                }
            }
        }
    }

    if (!selectedCombo) return null;

    // 最終的な10問の問題データ形式に格納・返却
    const finalProblems = [];
    for (let i = 0; i < 10; i++) {
        const p = createInitialMultiplicationState();
        const rA = rowsA[i];
        const rB = rowsB[i];

        for (let k = 0; k < rA.len; k++) p.left[6 - (rA.len - 1) + k] = rA.digits[k];
        
        const comboItem = selectedCombo.find(c => c.rIdx === i);
        if (comboItem) {
            if (comboItem.isLessThanOne) {
                const zc = comboItem.zeroCount;
                const newLen = comboItem.newLen;
                const startIdx = 7 - (newLen + zc);
                for (let k = 0; k < zc; k++) p.right[startIdx + k] = 0;
                for (let k = 0; k < newLen; k++) p.right[startIdx + zc + k] = rB.digits[k];
                p.decimalRight = startIdx;
            } else {
                for (let k = 0; k < rB.len; k++) p.right[6 - (rB.len - 1) + k] = rB.digits[k];
                p.decimalRight = 6 - (rB.len - 1) + comboItem.pos;
            }
        } else {
            for (let k = 0; k < rB.len; k++) p.right[6 - (rB.len - 1) + k] = rB.digits[k];
            p.decimalRight = null;
        }
        finalProblems.push(p);
    }
    return finalProblems;
};

