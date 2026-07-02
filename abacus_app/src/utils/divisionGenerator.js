import { createInitialDivisionState } from '../constants/initialState.js';

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

export const generateDivisionProblems = () => {
    let attempts = 0;
    let bestProblems = null;
    let bestScore = 0;
    
    while (attempts < 5000) {
        attempts++;
        const problems = _generateDivisionProblems_internal();
        if (!problems) continue;

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

        if (firstDigitsSet.size === 9) {
            return problems;
        }
    }
    console.warn("フォールバックとして最も網羅率の高い(" + bestScore + ")結果を返します");
    return bestProblems || Array(10).fill(null).map(() => createInitialDivisionState());
};

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
    // 除算における小数の付与と割られる数(Dividend)の計算
    // ============================================
    
    // パターンが設定された行（連続文字、囲み文字）は1未満の数などの対象から外す
    const isPatternRow = (rIdx) => (rIdx === targetsB.consecutive || rIdx === targetsB.sandwich);

    const availableRowsForDecimal = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(r => !isPatternRow(r));
    shuffle(availableRowsForDecimal);

    // 小数が付くのは4問
    const decimalRows = availableRowsForDecimal.slice(0, 4);
    // そのうち1つは1未満の数
    const lessThanOneRow = decimalRows[0];
    const normalDecimalRows = decimalRows.slice(1, 4);
    const intRows = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(r => !decimalRows.includes(r));

    const finalProblems = [];
    let upCount = 0;
    let downCount = 0;

    const rowConfigs = Array(10).fill(null);

    // まず1未満の数について自然な Dividend を決定し、四捨五入タイプを確定させる
    {
        const rIdx = lessThanOneRow;
        const A = parseInt(rowsA[rIdx].digits.join(''), 10);
        let B_val, B_str, decIdx, zc = 0, newLen = rowsB[rIdx].len;
        
        zc = Math.floor(Math.random() * 3) + 1; // 1, 2, 3
        while (newLen + zc > 7 && newLen > 2) newLen--;
        while (newLen + zc > 7 && zc > 0) zc--;
        if (zc <= 0) return null; // 生成失敗
        
        B_str = "";
        for(let i=0; i<zc; i++) B_str += "0";
        B_str += rowsB[rIdx].digits.slice(0, newLen).join('');
        decIdx = zc - 1;
        B_val = parseFloat(B_str.slice(0, decIdx + 1) + "." + B_str.slice(decIdx + 1));
        
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
            const decPart = (quotient % 1 + 1) % 1; // JSの負の余り対策
            if (decPart >= 0.5) type = 'up';
            else if (decPart > 1e-9) type = 'down';
        }
        
        if (type === 'up') upCount++;
        else if (type === 'down') downCount++;

        rowConfigs[rIdx] = { isDecimal: true, isLessThanOne: true, B_str, decIdx, zc, newLen, B_val, Dividend, type };
    }

    // 残りの小数行3つについて、まだ足りないup/downがあれば意図的にDividendをずらして作る。
    // 小数であれば B_val > 1 なので、整数 Dividend を1ずらすと商が 1/B_val (1未満) ずれるため
    // うまく狙った範囲に入らない可能性がある。
    // だが、B_val は必ず 1 以上 (例: 1.234) であり、4桁〜7桁の数字を小数点1〜6個ずらしたもの。
    // 試行錯誤で Dividend を探す。
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
            // 切り上げになるまで増やす
            let safety = 0;
            while(safety < 100) {
                actualA = Math.round(Dividend / B_val);
                if (actualA !== A) { Dividend -= 1; break; } // Aを超えたら戻る
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

        // 最終確認
        actualA = Math.round(Dividend / B_val);
        if (actualA !== A) return null; // どうしてもうまくいかなかったら破棄
        
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

    // 残りの整数行 (6問) で目標を埋める
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

    for (let i = 0; i < 10; i++) {
        const p = createInitialDivisionState();
        const rA = rowsA[i]; // Answer
        const rB = rowsB[i]; // Divisor
        const conf = rowConfigs[i];

        // Answer
        for (let k = 0; k < rA.len; k++) p.answer[7 - rA.len + k] = rA.digits[k];

        // Divisor
        if (conf.isLessThanOne) {
            const startIdx = 7 - (conf.newLen + conf.zc);
            for (let k = 0; k < conf.zc; k++) p.divisor[startIdx + k] = 0;
            for (let k = 0; k < conf.newLen; k++) p.divisor[startIdx + conf.zc + k] = rB.digits[k];
            p.decimalDivisor = startIdx + conf.zc - 1;
        } else if (conf.isDecimal) {
            for (let k = 0; k < conf.newLen; k++) p.divisor[7 - conf.newLen + k] = rB.digits[k];
            p.decimalDivisor = 7 - conf.newLen + conf.decIdx;
        } else {
            for (let k = 0; k < conf.newLen; k++) p.divisor[7 - conf.newLen + k] = rB.digits[k];
        }

        // Dividend
        const divStr = conf.Dividend.toString();
        const divLen = divStr.length;
        const divOffset = 12 - divLen;
        for (let j = 0; j < divLen; j++) {
            if (divOffset + j >= 0 && divOffset + j < 12) {
                p.dividend[divOffset + j] = parseInt(divStr[j], 10);
            }
        }
        // Save roundType for UI highlighting
        p.roundType = conf.type;
        
        finalProblems.push(p);
    }
    
    return finalProblems;
};
