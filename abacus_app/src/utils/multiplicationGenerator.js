import { createInitialMultiplicationState } from '../constants/initialState.js';

export const regenerateMultiplicationRow = (currentProblem, side, length) => {
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

export const generateMultiplicationProblems = () => {
    let attempts = 0;
    let bestProblems = null;
    let bestScore = 0;
    
    while (attempts < 5000) {
        attempts++;
        const problems = _generateMultiplicationProblems_internal();
        if (!problems) continue;

        const firstDigitsSet = new Set();
        for (const p of problems) {
            let leftStr = p.left.filter(d => d !== null).join('');
            let rightStr = p.right.filter(d => d !== null).join('');
            
            let leftVal = parseInt(leftStr, 10);
            let rightVal;
            if (p.decimalRight !== null) {
                const rightArr = p.right.map(d => d === null ? '' : d);
                const decIdx = p.decimalRight;
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

        if (firstDigitsSet.size === 9) {
            return problems;
        }
    }
    console.warn("フォールバックとして最も網羅率の高い(" + bestScore + ")結果を返します");
    return bestProblems || Array(10).fill(null).map(() => createInitialMultiplicationState());
};

const _generateMultiplicationProblems_internal = () => {
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

    // 最適化ループ（パターンを0にする）
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

    // 後処理：意図的なスワップでパターンを1つずつ作る
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

        const tryMakePattern = (targetRowIdx, isConsecutive) => {
            // targetRowIdxの特定インデックスと他の行をスワップしてパターンを作る総当たり
            for (let i = 1; i < sideRows[targetRowIdx].len - (isConsecutive ? 1 : 2); i++) {
                // スワップで実現したい数字
                const neededVal = sideRows[targetRowIdx].digits[i]; 
                // そのために書き換えるべき隣接インデックス
                const targetIdxToChange = isConsecutive ? i + 1 : i + 2; 
                
                // 全ての他の行・中間インデックスから neededVal を探してスワップしてみる
                for (let r2 = 0; r2 < 10; r2++) {
                    if (r2 === targetRowIdx) continue;
                    for (let j2 = 1; j2 < sideRows[r2].len - 1; j2++) {
                        if (sideRows[r2].digits[j2] === neededVal) {
                            // スワップ
                            const oldVal = sideRows[targetRowIdx].digits[targetIdxToChange];
                            sideRows[targetRowIdx].digits[targetIdxToChange] = neededVal;
                            sideRows[r2].digits[j2] = oldVal;
                            
                            // スワップ後の評価
                            // この行単体でのペナルティ、他行のペナルティ、全体の遷移ペナルティ
                            const currentEval = evaluateSwap();
                            // これから作る目標：
                            // 連続を作っているなら、この行のcが1になっていれば良い。
                            // 但し evaluateSwap で全体を評価した方が確実。
                            
                            if (currentEval === 0 || (isConsecutive && currentEval === 100) || (!isConsecutive && currentEval === 0)) {
                                // 完璧になったら戻して次へ（後でまとめて判定する）
                                // と思ったが、ここはインクリメンタルに作るので、
                                // "連続を作った結果、残りのペナルティが囲み分（100）だけになっているか" 
                                // "囲みを作った結果、ペナルティが0になっているか"
                            }
                            
                            // 戻す
                            sideRows[targetRowIdx].digits[targetIdxToChange] = oldVal;
                            sideRows[r2].digits[j2] = neededVal;
                        }
                    }
                }
            }
            return false;
        };

        // よりシンプルな総当り：
        // ランダムにスワップを試行し、evaluateSwap() が 0 になるまでループ
        // 目標が明確（2つの特定行に1つずつ作るだけ）なので、総当りのほうが見つけやすい。
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
            // 山登り（同じか良くなったら採用）
            if (newScore <= pScore) {
                pScore = newScore;
            } else {
                // 戻す
                sideRows[r1].digits[i1] = val1;
                sideRows[r2].digits[i2] = val2;
            }
        }
        return pScore === 0;
    };

    if (!applyPatternsPostProcess(rowsA, targetsA, { consecutiveDigit: null, sandwichOuter: null, sandwichInner: null }, 100000)) return null;
    
    // A側で作られたパターン構成数字を抽出
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

    // B側の最適化（抽出した数字を同種のパターンで使わないようにする、探索回数を30万回に増強）
    if (!applyPatternsPostProcess(rowsB, targetsB, forbiddenB, 300000)) return null;

    // ============================================
    // 小数点のロジック（四捨五入バランスと1未満の数）
    // ============================================
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
        
        // パターンが設定された行は1未満の数（切り詰め）の対象から外す
        const isPatternRow = (rIdx === targetsB.consecutive || rIdx === targetsB.sandwich);
        
        if (!isPatternRow) {
            // 1未満の候補（zeroCount 1, 2, 3 全て試す）
            for (let zc = 1; zc <= 3; zc++) {
                let tempLen = rowsB[rIdx].len;
                let tempZC = zc;
                while (tempLen + tempZC > 7 && tempLen > 2) tempLen--;
                while (tempLen + tempZC > 7 && tempZC > 0) tempZC--;
                if (tempZC > 0) {
                    let rBStr = "";
                    for(let i = 0; i < tempZC; i++) rBStr += "0";
                    rBStr += rowsB[rIdx].digits.slice(0, tempLen).join('');
                    
                    const decIdx = tempZC - 1;
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

        // 通常の小数候補
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
                p.decimalRight = startIdx + zc - 1;
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
