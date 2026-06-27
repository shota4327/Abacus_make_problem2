import { createInitialGrid, ROW_COUNT, COL_COUNT } from '../constants/initialState.js';

/**
 * 指定された長さのランダムな行（数値配列）を生成します。
 * @param {number} length - 生成する桁数
 * @returns {Array<number|null>} 生成された行データ
 */
export const generateRandomRow = (length) => {
    const row = Array(COL_COUNT).fill(null);
    for (let i = 0; i < length; i++) {
        const isFirstDigit = (i === length - 1);
        let val;
        if (isFirstDigit) {
            val = Math.floor(Math.random() * 9) + 1; // 先頭は 1-9
        } else {
            val = Math.floor(Math.random() * 10); // それ以外は 0-9
        }
        row[COL_COUNT - 1 - i] = val;
    }
    return row;
};

/**
 * 盤面の条件達成度と無駄なオレンジ色（ペナルティ）を評価します。
 * 指定された囲み文字などが「ぴったり1回」発生しているかをチェックします。
 */
export const evaluateConditions = (grid, conditions = {}, lockedCells = null) => {
    const { enclosedDigit, sandwichedDigit, consecutiveDigit } = conditions;
    let enclosedCount = 0;
    let sandwichedCount = 0;
    let consecutiveCount = 0;
    let penaltyScore = 0; // 不要なオレンジ色の数
    let penaltyCells = [];

    const transitionCounts = Array(10).fill(null).map(() => Array(10).fill(0));
    const n = grid.length;

    for (let rowIndex = 0; rowIndex < n; rowIndex++) {
        const row = grid[rowIndex];
        let firstNonZeroIndex = -1;
        
        for (let colIndex = 0; colIndex < COL_COUNT; colIndex++) {
            if (row[colIndex] !== null && row[colIndex] !== 0) {
                firstNonZeroIndex = colIndex;
                break;
            }
        }
        if (firstNonZeroIndex === -1) firstNonZeroIndex = COL_COUNT - 1;

        for (let colIndex = 0; colIndex < COL_COUNT; colIndex++) {
            if (colIndex < firstNonZeroIndex || colIndex === 0) continue;
            const currentDigit = row[colIndex];
            if (currentDigit === null) continue;

            // 遷移のカウント（左隣が有効な数字なら、遷移としてカウント）
            if (colIndex > 0 && colIndex - 1 >= firstNonZeroIndex) {
                let leftDigit = row[colIndex - 1];
                if (leftDigit !== null && currentDigit !== null) {
                    transitionCounts[leftDigit][currentDigit]++;
                }
            }

            // 連続文字（左隣と同じか）
            let isConsecutive = (colIndex > 0 && colIndex - 1 >= firstNonZeroIndex && row[colIndex - 1] === currentDigit);
            
            // 囲み文字（左へ1つ空けて同じか）
            let isEnclosed = (colIndex > 1 && colIndex - 2 >= firstNonZeroIndex && row[colIndex - 2] === currentDigit);
            
            // はさまれ文字（自分の左右が同じか）
            let isSandwiched = (colIndex > 0 && colIndex < COL_COUNT - 1 && colIndex - 1 >= firstNonZeroIndex && row[colIndex - 1] === row[colIndex + 1] && row[colIndex - 1] !== null);

            let cellPenalty = 0;
            const up = (rowIndex > 0) ? grid[rowIndex - 1][colIndex] : null;
            const down = (rowIndex < n - 1) ? grid[rowIndex + 1][colIndex] : null;

            let isLocked = lockedCells ? lockedCells.has(`${rowIndex},${colIndex}`) : true;

            // ★重要修正★
            // A B A という配列は、Bにとっては「はさまれ文字」、右のAにとっては「囲み文字」になる。
            // どちらか一方の条件としてユーザーが指定した場合、もう一方がペナルティとしてカウントされてしまうのを防ぐため、
            // 「条件として指定された方を優先し、もう一方はペナルティから免除する」ようにする。
            
            let isEnclosedPenalty = false;
            let isSandwichedPenalty = false;

            if (isConsecutive) {
                if (consecutiveDigit != null && currentDigit === Number(consecutiveDigit)) {
                    consecutiveCount++;
                    if (lockedCells && !isLocked) cellPenalty++;
                    else if (!lockedCells && consecutiveCount > 1) cellPenalty++;
                } else {
                    cellPenalty++;
                }
            }

            if (isEnclosed) {
                if (enclosedDigit != null && currentDigit === Number(enclosedDigit)) {
                    enclosedCount++;
                    if (lockedCells && !isLocked) cellPenalty++;
                    else if (!lockedCells && enclosedCount > 1) cellPenalty++;
                } else {
                    isEnclosedPenalty = true;
                }
            }

            if (isSandwiched) {
                if (sandwichedDigit != null && currentDigit === Number(sandwichedDigit)) {
                    sandwichedCount++;
                    if (lockedCells && !isLocked) cellPenalty++;
                    else if (!lockedCells && sandwichedCount > 1) cellPenalty++;
                } else {
                    isSandwichedPenalty = true;
                }
            }

            // 免除ロジック: 
            // もし「はさまれ文字（例：4）」の指定があり、実際に B が指定文字だった場合、
            // その右側の A は isEnclosedPenalty=true になっているが、免除する。
            if (isEnclosedPenalty) {
                let leftDigit = grid[rowIndex][colIndex - 1];
                if (sandwichedDigit != null && leftDigit === Number(sandwichedDigit)) {
                    isEnclosedPenalty = false; // 免除
                }
            }

            // 同様に、「囲み文字（例：8）」の指定があり、自分が A(囲み指定文字) によって挟まれている B(はさまれペナルティ) の場合、免除する。
            if (isSandwichedPenalty) {
                let sideDigit = grid[rowIndex][colIndex - 1];
                if (enclosedDigit != null && sideDigit === Number(enclosedDigit)) {
                    isSandwichedPenalty = false; // 免除
                }
            }

            if (isEnclosedPenalty) cellPenalty++;
            if (isSandwichedPenalty) cellPenalty++;

            // 上下隣接は常にペナルティ
            let isUpPenalty = (up === currentDigit);
            let isDownPenalty = (down === currentDigit);
            if (isUpPenalty || isDownPenalty) {
                cellPenalty++;
            }

            if (cellPenalty > 0) {
                penaltyCells.push({ r: rowIndex, c: colIndex });
                // 相方のセルもペナルティ候補に追加する（ロックされている場合の逃げ道）
                if (isConsecutive) penaltyCells.push({ r: rowIndex, c: colIndex - 1 });
                if (isEnclosedPenalty) penaltyCells.push({ r: rowIndex, c: colIndex - 2 });
                if (isSandwichedPenalty) {
                    penaltyCells.push({ r: rowIndex, c: colIndex - 1 });
                    penaltyCells.push({ r: rowIndex, c: colIndex + 1 });
                }
                if (isUpPenalty) penaltyCells.push({ r: rowIndex - 1, c: colIndex });
                if (isDownPenalty) penaltyCells.push({ r: rowIndex + 1, c: colIndex });
            }
            penaltyScore += cellPenalty;
        }
    }

    // 数字の遷移（Aの後ろにBが来る回数）に関するペナルティ加算
    let transitionPenalty = 0;
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            let count = transitionCounts[i][j];
            if (count === 3) {
                // 3回発生するのはやむを得ないこともあるが、できるだけ避けるために軽いペナルティ
                transitionPenalty += 1;
            } else if (count >= 4) {
                // 4回以上は発生しないようにしたいので、非常に重いペナルティ
                transitionPenalty += (count - 3) * 5;
            }
        }
    }

    let condScore = 0;
    if (consecutiveDigit != null) {
        if (consecutiveCount !== 1) condScore -= Math.abs(consecutiveCount - 1) + 1;
    }
    if (enclosedDigit != null) {
        if (enclosedCount !== 1) condScore -= Math.abs(enclosedCount - 1) + 1;
    }
    if (sandwichedDigit != null) {
        if (sandwichedCount !== 1) condScore -= Math.abs(sandwichedCount - 1) + 1;
    }

    return { penaltyScore, transitionPenalty, condScore, penaltyCells };
};

/**
 * 条件に基づいてランダムな問題（Grid）を生成します。
 * 
 * @param {Object} params - 生成パラメータ
 * @returns {Object} 生成された { grid, isMinusRows }
 */
export const generateProblemGrid = ({
    rowCount, minDigit, maxDigit, targetTotalDigits, isMinusAllowed, conditions
}) => {
    const TARGET_TIME_LIMIT = 5000; // 最大5秒間（より完璧な盤面を探索する）
    const startTime = performance.now();
    const n = rowCount;
    const {
        firstRowFirstDigit, firstRowLastDigit, lastRowFirstDigit, lastRowLastDigit, answerFirstDigit, answerLastDigit,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit
    } = conditions;

    const nextMinusRows = Array(ROW_COUNT).fill(false);
    
    // マイナス行の決定
    if (isMinusAllowed) {
        // 全体の約1/3をマイナスにする (±1のブレ)
        const baseCount = Math.floor(n / 3);
        const variations = [-1, 0, 1];
        const variation = variations[Math.floor(Math.random() * variations.length)];
        let targetCount = baseCount + variation;
        
        targetCount = Math.max(0, Math.min(n - 1, targetCount));
        
        const eligibleIndices = [];
        for (let i = 1; i < n; i++) eligibleIndices.push(i); // 1行目はマイナスにしない
        
        for (let i = eligibleIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [eligibleIndices[i], eligibleIndices[j]] = [eligibleIndices[j], eligibleIndices[i]];
        }
        
        for (let i = 0; i < targetCount; i++) {
            nextMinusRows[eligibleIndices[i]] = true;
        }
    }

    const calculateSum = (grid) => {
        let sum = 0;
        for (let r = 0; r < n; r++) {
            let rowString = grid[r].map(d => d ?? 0).join('');
            let val = parseInt(rowString, 10) * (nextMinusRows[r] ? -1 : 1);
            sum += val;
        }
        return sum;
    };

    let bestGrid = null;
    let bestBalanceScore = -Infinity;
    let bestCondScore = -Infinity;
    let bestPenaltyScore = -Infinity;
    let bestAnswerMatch = false;

    // 問題の生成と最適化ループ (Best-of-N)
    while (performance.now() - startTime < TARGET_TIME_LIMIT) {
        const min = Math.min(minDigit, maxDigit);
        const max = Math.max(minDigit, maxDigit);
        const target = targetTotalDigits;

        // 1. 各行の桁数を決定
        let lengths = [];
        for (let i = min; i <= max; i++) lengths.push(i);
        const rangeSize = max - min + 1;
        while (lengths.length < n) lengths.push(Math.floor(Math.random() * rangeSize) + min);

        let currentSumLengths = lengths.reduce((a, b) => a + b, 0);
        let diff = target - currentSumLengths;
        const indices = Array.from({ length: n }, (_, i) => i);

        // 合計桁数を目標値に合わせる
        if (diff > 0) {
            while (diff > 0) {
                const shuffled = [...indices].sort(() => Math.random() - 0.5);
                let changed = false;
                for (let i of shuffled) {
                    if (lengths[i] < max) {
                        lengths[i]++;
                        diff--;
                        changed = true;
                        if (diff === 0) break;
                    }
                }
                if (!changed) break;
            }
        } else if (diff < 0) {
            while (diff < 0) {
                const shuffled = [...indices].sort(() => Math.random() - 0.5);
                let changed = false;
                for (let i of shuffled) {
                    if (lengths[i] > min) {
                        const val = lengths[i];
                        const count = lengths.filter(l => l === val).length;
                        if (count > 1) { // 少なくとも1つは残す
                            lengths[i]--;
                            diff++;
                            changed = true;
                            if (diff === 0) break;
                        }
                    }
                }
                if (!changed) break;
            }
        }
        lengths.sort(() => Math.random() - 0.5);

        // 1.5. 答えの最終桁（answerLastDigit）を満たすための右端の数字をあらかじめ決定する
        let rightDigits = Array(n).fill(null);
        if (answerLastDigit != null) {
            while (true) {
                let sum = 0;
                let freqs = Array(10).fill(0);
                for (let r = 0; r < n; r++) {
                    let d = Math.floor(Math.random() * 10);
                    if (lengths[r] === 1) {
                        d = Math.floor(Math.random() * 9) + 1; // 1桁の行は先頭なので0を避ける
                    }
                    if (r === 0 && firstRowLastDigit != null) d = Number(firstRowLastDigit);
                    if (r === n - 1 && lastRowLastDigit != null) d = Number(lastRowLastDigit);
                    
                    rightDigits[r] = d;
                    freqs[d]++;
                    sum += d * (nextMinusRows[r] ? -1 : 1);
                }
                
                // 同じ数字が多すぎるとオレンジ色（ペナルティ）を消せなくなるため回避
                let maxAllowed = Math.ceil(n / 2);
                if (freqs.some(f => f > maxAllowed)) continue;

                // 上下で同じ数字が並ばないようにチェック（右端は交換が制限されるため、最初から隣接ペナルティを避ける）
                let hasAdj = false;
                for (let r = 1; r < n; r++) {
                    if (rightDigits[r] === rightDigits[r - 1]) {
                        hasAdj = true;
                        break;
                    }
                }
                if (hasAdj) continue;
                
                let lsd = Math.abs(sum) % 10;
                if (lsd === Number(answerLastDigit)) {
                    break;
                }
            }
        }

        const newGrid = createInitialGrid();
        for (let rowIndex = 0; rowIndex < n; rowIndex++) {
            newGrid[rowIndex] = generateRandomRow(lengths[rowIndex]);
            // 決定した右端の数字を適用
            if (rightDigits[rowIndex] !== null) {
                newGrid[rowIndex][COL_COUNT - 1] = rightDigits[rowIndex];
            }
        }

        // 1.8. 条件（囲み文字など）の強制配置
        // 局所探索でゼロから作り出すのは困難なため、初期配置の段階で形を作ってロックしておく
        const forcedLockedCells = new Set();
        
        // 指定された位置の数字を初期盤面にセットし、ロックする
        const setFixedDigit = (r, c, digit) => {
            if (digit != null && c >= 0 && c < COL_COUNT) {
                newGrid[r][c] = Number(digit);
                forcedLockedCells.add(`${r},${c}`);
            }
        };

        setFixedDigit(0, COL_COUNT - lengths[0], firstRowFirstDigit);
        setFixedDigit(0, COL_COUNT - 1, firstRowLastDigit);
        setFixedDigit(n - 1, COL_COUNT - lengths[n - 1], lastRowFirstDigit);
        setFixedDigit(n - 1, COL_COUNT - 1, lastRowLastDigit);

        // 答えの先頭文字（answerFirstDigit）は、とりあえず最も桁数が大きい行の先頭をロックしておく（簡易対応）
        if (answerFirstDigit != null) {
            let maxLen = Math.max(...lengths);
            let targetRow = lengths.indexOf(maxLen);
            setFixedDigit(targetRow, COL_COUNT - maxLen, answerFirstDigit);
        }
        
        const checkAdjacency = (r, c, digit) => {
            const up = r > 0 ? newGrid[r - 1][c] : null;
            const down = r < n - 1 ? newGrid[r + 1][c] : null;
            // 左右もチェックするが、同じ行の範囲内だけ（null の場合は何もないので OK）
            const left = c > 0 ? newGrid[r][c - 1] : null;
            const right = c < COL_COUNT - 1 ? newGrid[r][c + 1] : null;
            return up === digit || down === digit || left === digit || right === digit;
        };
        
        // 連続文字 (22など)
        if (consecutiveDigit != null) {
            let r, c;
            let placed = false;
            for(let attempt=0; attempt<100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - lengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 1 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 1) continue;
                if (forcedLockedCells.has(`${r},${c}`) || forcedLockedCells.has(`${r},${c+1}`)) continue;
                
                let target = Number(consecutiveDigit);
                if (checkAdjacency(r, c, target) || checkAdjacency(r, c+1, target)) continue;
                
                newGrid[r][c] = target;
                newGrid[r][c+1] = target;
                forcedLockedCells.add(`${r},${c}`);
                forcedLockedCells.add(`${r},${c+1}`);
                placed = true;
                break;
            }
        }

        // 囲み文字とはさまれ文字の配置
        if (enclosedDigit != null && sandwichedDigit != null) {
            // 両方指定されている場合は、1つの塊（例：3 9 3）として配置する
            let r, c;
            let placed = false;
            for(let attempt=0; attempt<100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - lengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 2 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 2) continue;
                if (forcedLockedCells.has(`${r},${c}`) || forcedLockedCells.has(`${r},${c+1}`) || forcedLockedCells.has(`${r},${c+2}`)) continue;
                
                let encTarget = Number(enclosedDigit);
                let sanTarget = Number(sandwichedDigit);
                
                // 隣接チェック
                if (checkAdjacency(r, c, encTarget) || checkAdjacency(r, c+2, encTarget) || checkAdjacency(r, c+1, sanTarget)) continue;
                // 万が一 encTarget === sanTarget だった場合は「連続文字」になってしまうため弾く（通常は別々の数字が指定される想定）
                if (encTarget === sanTarget) continue;
                
                newGrid[r][c] = encTarget;
                newGrid[r][c+1] = sanTarget;
                newGrid[r][c+2] = encTarget;
                
                forcedLockedCells.add(`${r},${c}`);
                forcedLockedCells.add(`${r},${c+1}`);
                forcedLockedCells.add(`${r},${c+2}`);
                placed = true;
                break;
            }
        } else if (enclosedDigit != null) {
            // 囲み文字のみ
            let r, c;
            let placed = false;
            for(let attempt=0; attempt<100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - lengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 2 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 2) continue;
                if (forcedLockedCells.has(`${r},${c}`) || forcedLockedCells.has(`${r},${c+1}`) || forcedLockedCells.has(`${r},${c+2}`)) continue;
                
                let target = Number(enclosedDigit);
                if (checkAdjacency(r, c, target) || checkAdjacency(r, c+2, target)) continue;
                
                newGrid[r][c] = target;
                newGrid[r][c+2] = target;
                let center = newGrid[r][c+1];
                if (center === Number(enclosedDigit) || center === null) {
                    center = (Number(enclosedDigit) + 1) % 10;
                    if (center === 0) center = 1;
                    newGrid[r][c+1] = center;
                }
                forcedLockedCells.add(`${r},${c}`);
                forcedLockedCells.add(`${r},${c+1}`);
                forcedLockedCells.add(`${r},${c+2}`);
                placed = true;
                break;
            }
        } else if (sandwichedDigit != null) {
            // はさまれ文字のみ
            let r, c;
            let placed = false;
            for(let attempt=0; attempt<100; attempt++) {
                r = Math.floor(Math.random() * n);
                let firstValidIdx = COL_COUNT - lengths[r];
                c = Math.floor(Math.random() * (COL_COUNT - 2 - firstValidIdx)) + firstValidIdx;
                if (c >= COL_COUNT - 2) continue;
                if (forcedLockedCells.has(`${r},${c}`) || forcedLockedCells.has(`${r},${c+1}`) || forcedLockedCells.has(`${r},${c+2}`)) continue;
                
                let target = Number(sandwichedDigit);
                if (checkAdjacency(r, c+1, target)) continue;

                // 左右の数字は適当な数字にする
                let side = (target + 1) % 10;
                if (side === 0) side = 1;
                if (checkAdjacency(r, c, side) || checkAdjacency(r, c+2, side)) continue;

                newGrid[r][c+1] = target;
                newGrid[r][c] = side;
                newGrid[r][c+2] = side;
                forcedLockedCells.add(`${r},${c}`);
                forcedLockedCells.add(`${r},${c+1}`);
                forcedLockedCells.add(`${r},${c+2}`);
                placed = true;
                break;
            }
        }

        // 2. 制約の適用（1行目、最終行の指定値）
        const msdIndices = newGrid.map(row => {
            let idx = row.findIndex(digit => digit !== null && digit !== 0);
            return idx === -1 ? COL_COUNT - 1 : idx;
        });
        const lockedCells = new Set(forcedLockedCells);
        
        if (n > 0) {
            const firstRow = newGrid[0];
            const msd = msdIndices[0];
            if (firstRowFirstDigit != null) {
                if (firstRowFirstDigit !== 0) firstRow[msd] = firstRowFirstDigit;
                lockedCells.add(`0,${msd}`);
            }
            if (firstRowLastDigit != null) {
                firstRow[COL_COUNT - 1] = firstRowLastDigit;
                lockedCells.add(`0,${COL_COUNT - 1}`);
            }
        }
        if (n > 1) {
            const lastRow = newGrid[n - 1];
            const msd = msdIndices[n - 1];
            if (lastRowFirstDigit != null) {
                if (lastRowFirstDigit !== 0) lastRow[msd] = lastRowFirstDigit;
                lockedCells.add(`${n - 1},${msd}`);
            }
            if (lastRowLastDigit != null) {
                lastRow[COL_COUNT - 1] = lastRowLastDigit;
                lockedCells.add(`${n - 1},${COL_COUNT - 1}`);
            }
        }

        // 3. バランス調整ループ（特定の数字が偏らないようにスワップ）
        for (let iter = 0; iter < 100; iter++) {
            const freqs = Array(10).fill(0);
            let totalD = 0;
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < COL_COUNT; c++) {
                    if (newGrid[r][c] !== null) { freqs[newGrid[r][c]]++; totalD++; }
                }
            }

            const diffs = freqs.map((f, digit) => {
                let t = totalD / 10;
                if (plusOneDigit !== null && digit === Number(plusOneDigit)) t += 1;
                if (minusOneDigit !== null && digit === Number(minusOneDigit)) t -= 1;
                return f - t;
            });

            let maxOver = -Infinity, maxOverDigit = -1;
            let maxUnder = Infinity, maxUnderDigit = -1;
            diffs.forEach((d, i) => {
                if (d > maxOver) { maxOver = d; maxOverDigit = i; }
                if (d < maxUnder) { maxUnder = d; maxUnderDigit = i; }
            });

            // バランスが取れていれば終了
            if (maxOver === 0 && maxUnder === 0) {
                break;
            }

            // 過剰な数字を不足している数字へスワップを試みる
            const candidates = [];
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < COL_COUNT; c++) {
                    // 右端の列は最終桁制約で固定しているためバランス調整のスワップ候補から除外
                    if (answerLastDigit != null && c === COL_COUNT - 1) continue;
                    
                    if (newGrid[r][c] === maxOverDigit) {
                        if (lockedCells.has(`${r},${c}`)) continue;
                        if (maxUnderDigit === 0 && c === msdIndices[r]) continue; // 先頭をゼロにしない
                        candidates.push({ r, c });
                    }
                }
            }
            if (candidates.length === 0) break;

            const currentEval = evaluateConditions(newGrid, conditions, lockedCells);
            let bestCand = null;
            let maxScore = -Infinity;

            candidates.sort(() => Math.random() - 0.5);

            for (let cand of candidates) {
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

        // 3.5 ペナルティ解消ループ（局所探索：オレンジ色を減らすスワップ）
        // 過不足が調整された後、出現回数を変えずにオレンジ色を消していく
        let currentEval = evaluateConditions(newGrid, conditions, lockedCells);
        for (let iter = 0; iter < 2000; iter++) {
            if (currentEval.penaltyScore === 0 && currentEval.transitionPenalty === 0 && currentEval.condScore === 0) break;

            let r1, c1, r2, c2;
            
            // ペナルティが発生しているセル（エラーセル）を優先的に選ぶ
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
            if (newGrid[r1][c1] === newGrid[r2][c2]) continue; // 同じ数字なら意味がない
            if (lockedCells.has(`${r1},${c1}`) || lockedCells.has(`${r2},${c2}`)) continue;

            // 答えの最終桁制約がある場合、右端列の数字の種類を変えると最終桁が狂うため、
            // 「右端列と、右端列以外のスワップ」は禁止する（右端同士のスワップは許可）
            if (answerLastDigit != null) {
                let isRight1 = (c1 === COL_COUNT - 1);
                let isRight2 = (c2 === COL_COUNT - 1);
                if (isRight1 !== isRight2) continue; // 片方だけ右端なら棄却
                
                // 右端同士のスワップの場合、プラス行とマイナス行の間だと最終桁が変わる可能性がある
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

            // 先頭にゼロが来てしまうのを防ぐ
            if (newGrid[r1][c1] === 0 && c2 === msdIndices[r2]) continue;
            if (newGrid[r2][c2] === 0 && c1 === msdIndices[r1]) continue;

            // スワップ実行
            let temp = newGrid[r1][c1];
            newGrid[r1][c1] = newGrid[r2][c2];
            newGrid[r2][c2] = temp;

            const newEval = evaluateConditions(newGrid, conditions, lockedCells);

            const currentTotalPenalty = currentEval.penaltyScore + currentEval.transitionPenalty;
            const newTotalPenalty = newEval.penaltyScore + newEval.transitionPenalty;

            // 焼きなまし法による改悪の許容判定
            let revert = false;
            if (newEval.condScore < currentEval.condScore) {
                revert = true; // condScore の悪化は絶対に許さない
            } else if (newEval.condScore === currentEval.condScore && newTotalPenalty > currentTotalPenalty) {
                // ペナルティの悪化は確率的に許容する（温度を下げる）
                const tempProb = 0.05 * (1.0 - iter / 2000);
                if (Math.random() > tempProb) {
                    revert = true;
                }
            }

            if (revert) {
                // 元に戻す
                let tempBack = newGrid[r1][c1];
                newGrid[r1][c1] = newGrid[r2][c2];
                newGrid[r2][c2] = tempBack;
            } else {
                currentEval = newEval;
            }
        }

        // 4. 生成結果の評価
        const evalResult = evaluateConditions(newGrid, conditions);
        const currentCondScore = evalResult.condScore;
        const currentPenaltyScore = -evalResult.penaltyScore;

        // 答えの制約を満たしているか
        let isAnsMinOk = true;
        let isAnsLastOk = true;
        const currentSumFinal = calculateSum(newGrid);
        const s = String(Math.abs(currentSumFinal));
        
        if (answerFirstDigit != null) {
            if (s[0] !== String(answerFirstDigit)) isAnsMinOk = false;
        }
        if (answerLastDigit != null) {
            if (s[s.length - 1] !== String(answerLastDigit)) isAnsLastOk = false;
        }

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

        // 総合スコアの計算
        const currentBalanceScore = -diff2.reduce((acc, val) => acc + Math.abs(val), 0);
        let currentIsBetter = false;
        const currentAnswerMatch = isAnsMinOk && isAnsLastOk;

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
            bestBalanceScore = currentBalanceScore;
            bestCondScore = currentCondScore;
            bestPenaltyScore = currentPenaltyScore;
            bestAnswerMatch = currentAnswerMatch;
        }

        if (currentBalanceScore === 0 && currentCondScore === 0 && currentPenaltyScore === 0 && currentAnswerMatch) {
            break;
        }
    } // End Best-of-N Loop

    const finalGrid = bestGrid ? bestGrid : createInitialGrid(); // 万一失敗した際のフォールバック

    return { grid: finalGrid, isMinusRows: nextMinusRows };
};
