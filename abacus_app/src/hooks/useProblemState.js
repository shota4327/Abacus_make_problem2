import { useState, useMemo, useCallback } from 'react';
import { createInitialGrid } from '../constants/initialState';

const ROW_COUNT = 20;
const COL_COUNT = 13;

export const useProblemState = (initialData = {}) => {
    // Explicit initialization with function to avoid re-running defaults
    const [grid, setGrid] = useState(() => {
        if (initialData.grid) return initialData.grid;
        return createInitialGrid();
    });
    const [isMinusRows, setIsMinusRows] = useState(() => initialData.isMinusRows || Array(ROW_COUNT).fill(false));
    const [isMinusAllowed, setIsMinusAllowed] = useState(() => initialData.isMinusAllowed !== undefined ? initialData.isMinusAllowed : false);
    const [minDigit, setMinDigit] = useState(() => initialData.minDigit || 5);
    const [maxDigit, setMaxDigit] = useState(() => initialData.maxDigit || 12);
    const [targetTotalDigits, setTargetTotalDigits] = useState(() => initialData.targetTotalDigits || 130);
    const [rowCount, setRowCount] = useState(() => initialData.rowCount || 20);

    // State for loading overlay
    const [isGenerating, setIsGenerating] = useState(false);

    // New Conditions
    const [plusOneDigit, setPlusOneDigit] = useState(() => initialData.plusOneDigit ?? null);
    const [minusOneDigit, setMinusOneDigit] = useState(() => initialData.minusOneDigit ?? null);
    const [enclosedDigit, setEnclosedDigit] = useState(() => initialData.enclosedDigit ?? null);
    const [sandwichedDigit, setSandwichedDigit] = useState(() => initialData.sandwichedDigit ?? null);
    const [consecutiveDigit, setConsecutiveDigit] = useState(() => initialData.consecutiveDigit ?? null);

    // Row specific and Answer constraints
    const [firstRowMin, setFirstRowMin] = useState(() => initialData.firstRowMin ?? null);
    const [firstRowMax, setFirstRowMax] = useState(() => initialData.firstRowMax ?? null);
    const [lastRowMin, setLastRowMin] = useState(() => initialData.lastRowMin ?? null);
    const [lastRowMax, setLastRowMax] = useState(() => initialData.lastRowMax ?? null);
    const [answerMin, setAnswerMin] = useState(() => initialData.answerMin ?? null);
    const [answerMax, setAnswerMax] = useState(() => initialData.answerMax ?? null);

    // Snapshot of current state for saving
    const currentState = useMemo(() => ({
        grid,
        isMinusRows,
        isMinusAllowed,
        minDigit,
        maxDigit,
        targetTotalDigits,
        rowCount,
        plusOneDigit,
        minusOneDigit,
        enclosedDigit,
        sandwichedDigit,
        consecutiveDigit,
        firstRowMin,
        firstRowMax,
        lastRowMin,
        lastRowMax,
        answerMin,
        answerMax
    }), [
        grid, isMinusRows, isMinusAllowed, minDigit, maxDigit, targetTotalDigits, rowCount,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit,
        firstRowMin, firstRowMax, lastRowMin, lastRowMax, answerMin, answerMax
    ]);

    // Update a single digit
    const updateDigit = useCallback((rowIndex, colIndex, value) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex][colIndex] = value;
            return newGrid;
        });
    }, []);

    // Toggle row minus sign
    const toggleRowMinus = useCallback((rowIndex) => {
        setIsMinusRows(prev => {
            const next = [...prev];
            next[rowIndex] = !next[rowIndex];
            return next;
        });
    }, []);

    // Helper to generate a random row of specific length
    const generateRandomRow = useCallback((length) => {
        const row = Array(COL_COUNT).fill(null);
        for (let i = 0; i < length; i++) {
            const isFirstDigit = (i === length - 1);
            let val;
            if (isFirstDigit) {
                val = Math.floor(Math.random() * 9) + 1; // 1-9
            } else {
                val = Math.floor(Math.random() * 10); // 0-9
            }
            row[COL_COUNT - 1 - i] = val;
        }
        return row;
    }, []);

    // Update individual row length
    const updateRowDigitCount = useCallback((rowIndex, length) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex] = generateRandomRow(length);
            return newGrid;
        });
    }, [generateRandomRow]);

    // Calculate stats
    const stats = useMemo(() => {
        let totalSum = 0;
        let totalRowDigits = 0;
        const frequency = []; // Array of Arrays [row][digit]
        const totalFrequency = Array(10).fill(0);
        const consecutive = Array(10).fill(null).map(() => Array(10).fill(0));
        const rowDigitCounts = [];

        // Only process rows up to rowCount
        for (let ri = 0; ri < rowCount; ri++) {
            const row = grid[ri];
            let rowValStr = "";
            let rowDigitCount = 0;
            let isLeading = true;
            const rowFreq = Array(10).fill(0);

            row.forEach((digit, colIndex) => {
                const d = digit === null ? 0 : digit;
                rowValStr += d;

                if (d !== 0) isLeading = false;
                if (isLeading) return; // Skip stats for leading zeros

                rowFreq[d]++;
                totalFrequency[d]++;
                rowDigitCount++;

                // Consecutive count
                if (colIndex < COL_COUNT - 1) {
                    const nextDigit = row[colIndex + 1] === null ? 0 : row[colIndex + 1];
                    consecutive[d][nextDigit]++;
                }
            });

            frequency.push(rowFreq);
            rowDigitCounts.push(rowDigitCount);
            totalRowDigits += rowDigitCount;
            const rowVal = (parseInt(rowValStr, 10) || 0) * (isMinusRows[ri] ? -1 : 1);
            totalSum += rowVal;

            if (totalSum < 0) {
                // Complement check placeholder
            }
        }

        let hasComplement = false;
        let runningTotal = 0;
        for (let ri = 0; ri < rowCount; ri++) {
            const row = grid[ri];
            let rowValStr = "";
            row.forEach(d => rowValStr += (d === null ? 0 : d));
            const rowVal = (parseInt(rowValStr, 10) || 0) * (isMinusRows[ri] ? -1 : 1);
            runningTotal += rowVal;
            if (runningTotal < 0) hasComplement = true;
        }

        const messages = [];
        if (hasComplement) messages.push("補数計算あり");
        if (totalSum < 0) messages.push("結果がマイナス");

        const complementStatus = messages.length > 0 ? messages.join("・") : "なし";

        const frequencyDiffs = Array(10).fill(0).map((_, digit) => {
            let baseline = targetTotalDigits / 10;
            if (digit === plusOneDigit) baseline += 1;
            if (digit === minusOneDigit) baseline -= 1;
            return totalFrequency[digit] - baseline;
        });

        let isEnclosedUsed = enclosedDigit === null;
        if (!isEnclosedUsed) {
            const target = Number(enclosedDigit);
            for (let ri = 0; ri < rowCount; ri++) {
                const row = grid[ri];
                const firstNonZero = row.findIndex(d => d !== null && d !== 0);
                for (let ci = 0; ci < COL_COUNT; ci++) {
                    // Skip leading zeros
                    if (firstNonZero === -1 || ci < firstNonZero) continue;
                    if (row[ci] !== null && row[ci] === target) {
                        const hasGapLeft = ci > 1 && (ci - 2 >= firstNonZero) && row[ci - 2] !== null && row[ci - 2] === target;
                        const hasGapRight = ci < 11 && row[ci + 2] !== null && row[ci + 2] === target;
                        if (hasGapLeft || hasGapRight) {
                            isEnclosedUsed = true;
                            break;
                        }
                    }
                }
                if (isEnclosedUsed) break;
            }
        }

        let isSandwichedUsed = sandwichedDigit === null;
        if (!isSandwichedUsed) {
            const target = Number(sandwichedDigit);
            for (let ri = 0; ri < rowCount; ri++) {
                const row = grid[ri];
                const firstNonZero = row.findIndex(d => d !== null && d !== 0);
                for (let ci = 1; ci < COL_COUNT - 1; ci++) {
                    // Skip leading zeros
                    if (firstNonZero === -1 || ci < firstNonZero) continue;
                    if (row[ci] !== null && row[ci] === target) {
                        // 左右が同じ数字かどうか (3-5-3, 9-5-9 check)
                        if (row[ci - 1] !== null && (ci - 1 >= firstNonZero) && row[ci - 1] === row[ci + 1]) {
                            isSandwichedUsed = true;
                            break;
                        }
                    }
                }
                if (isSandwichedUsed) break;
            }
        }

        let isConsecutiveUsed = consecutiveDigit === null;
        if (!isConsecutiveUsed) {
            const target = Number(consecutiveDigit);
            // consecutive[d1][d2] means d1 followed by d2. So [target][target] means target followed by target.
            if (consecutive[target][target] > 0) {
                isConsecutiveUsed = true;
            }
        }

        // Helper to check match (target=condition, actual=value in grid/sum)
        const checkMatch = (target, actual) => {
            if (target === null) return true;
            return Number(target) === Number(actual);
        };

        // 1. First Row
        const firstRow = grid[0];

        const getMsdLsd = (rowArr) => {
            let msd = null;
            let lsd = null;
            for (let i = 0; i < rowArr.length; i++) {
                const cell = rowArr[i];
                if (cell !== null && cell !== "" && cell !== undefined) {
                    if (msd === null) msd = cell;
                    lsd = cell;
                }
            }
            return { msd, lsd };
        };

        const { msd: firstRowMsd, lsd: firstRowLsd } = getMsdLsd(firstRow);

        // 2. Last Row
        const lastRow = grid[rowCount - 1];
        const { msd: lastRowMsd, lsd: lastRowLsd } = getMsdLsd(lastRow);

        // 3. Answer (Total Sum)
        const sumStr = String(Math.abs(totalSum)); // handle negative logic if needed, usually check digit
        const ansMsd = sumStr[0];
        const ansLsd = sumStr[sumStr.length - 1];

        const isFirstMinValid = checkMatch(firstRowMin, firstRowMsd);
        const isFirstMaxValid = checkMatch(firstRowMax, firstRowLsd);
        const isLastMinValid = checkMatch(lastRowMin, lastRowMsd);
        const isLastMaxValid = checkMatch(lastRowMax, lastRowLsd);
        const isAnsMinValid = checkMatch(answerMin, ansMsd);
        const isAnsMaxValid = checkMatch(answerMax, ansLsd);

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
            isAnsMaxValid,
            currentState, // Return the state snapshot
            isMinusAllowed,
            setIsMinusAllowed
        };
    }, [grid, rowCount, targetTotalDigits, plusOneDigit, minusOneDigit, isMinusRows, enclosedDigit, sandwichedDigit, consecutiveDigit, firstRowMin, firstRowMax, lastRowMin, lastRowMax, answerMin, answerMax, currentState, isMinusAllowed]);

    // Core Logic (Refactored from original generateRandomGrid)
    const generateRandomGridLogic = useCallback(() => {
        const TARGET_TIME_LIMIT = 5000;
        const startTime = performance.now();

        const n = rowCount;
        const nextMinusRows = Array(ROW_COUNT).fill(false);
        if (isMinusAllowed) {
            // Strict count: (n / 3) ± 1
            const baseCount = Math.floor(n / 3);
            const variations = [-1, 0, 1];
            const variation = variations[Math.floor(Math.random() * variations.length)];
            let targetCount = baseCount + variation;

            // Ensure targetCount is within valid range [0, n - 1] 
            // defined by available rows (indices 1 to n-1)
            targetCount = Math.max(0, Math.min(n - 1, targetCount));

            // Select random indices from 1 to n-1
            const eligibleIndices = [];
            for (let i = 1; i < n; i++) eligibleIndices.push(i);

            // Shuffle eligible indices
            for (let i = eligibleIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [eligibleIndices[i], eligibleIndices[j]] = [eligibleIndices[j], eligibleIndices[i]];
            }

            // Mark strict number of rows
            for (let i = 0; i < targetCount; i++) {
                nextMinusRows[eligibleIndices[i]] = true;
            }
        }


        // Helper: Clone grid
        const cloneGrid = (g) => g.map(row => [...row]);

        // Helper: Count orange cells (adjacent/one-gap same digits)
        const countOrangeCells = (g) => {
            let count = 0;
            const n = g.length;
            for (let r = 0; r < n; r++) {
                const row = g[r];
                let firstNonZero = -1;
                for (let c = 0; c < 13; c++) {
                    if (row[c] !== null && row[c] !== 0) {
                        firstNonZero = c;
                        break;
                    }
                }
                if (firstNonZero === -1) firstNonZero = 12;

                for (let c = 0; c < 13; c++) {
                    // Skip leading
                    if (c < firstNonZero) continue;
                    if (c === 0) continue;
                    const d = row[c];
                    if (d === null) continue;

                    let isBad = false;
                    // Adjacent
                    if (c > 1 && row[c - 1] === d) isBad = true; // Left
                    if (c < 12 && row[c + 1] === d) isBad = true; // Right

                    // Gap
                    if (c > 2 && row[c - 2] === d) isBad = true; // Left gap
                    if (c < 11 && row[c + 2] === d) isBad = true; // Right gap
                    if (c > 1 && c < 12 && row[c - 1] === row[c + 1]) {
                        if (c > 0) isBad = true;
                    }

                    if (isBad) count++;
                }
            }
            return count;
        };



        // Helper to check validity of a cell (same as countOrangeCells logic but for a specific cell)
        const isSafeToPlace = (g, r, c, val) => {
            // Check row constraints (leading zero)
            if (val === 0) {
                // Check if it becomes leading zero
                // Find first non-null column index for this row
                let firstAudit = 0;
                while (firstAudit < 13 && g[r][firstAudit] === null) firstAudit++;
                if (c === firstAudit) return false;
            }

            // Check adjacent and gap duplicates
            // Adjacent
            if (c > 1) { // Left
                const left = g[r][c - 1];
                if (left !== null && left === val) return false;
            }
            if (c < 12) { // Right
                const right = g[r][c + 1];
                if (right !== null && right === val) return false;
            }
            // Gap
            if (c > 2) { // Left gap
                const left2 = g[r][c - 2];
                if (left2 !== null && left2 === val) return false;
            }
            if (c < 11) { // Right gap
                const right2 = g[r][c + 2];
                if (right2 !== null && right2 === val) return false;
            }
            return true;
        };

        const calculateSum = (g) => {
            let sum = 0;
            for (let r = 0; r < n; r++) {
                let rowStr = g[r].map(d => d ?? 0).join('');
                let val = parseInt(rowStr, 10) * (nextMinusRows[r] ? -1 : 1);
                sum += val;
            }
            return sum;
        };

        let bestGrid = null;
        let bestBalanceScore = -Infinity; // Higher is better (negative of diff)
        let bestOrangeScore = -Infinity; // Higher is better (negative of count)
        let bestAnswerMatch = false; // True if answerMin constraint is met

        // Best-of-N Loop
        while (performance.now() - startTime < TARGET_TIME_LIMIT) {
            const min = Math.min(minDigit, maxDigit);
            const max = Math.max(minDigit, maxDigit);
            const target = targetTotalDigits;

            // --- 1. Basic Generation ---
            let lengths = [];
            for (let i = min; i <= max; i++) lengths.push(i);
            const rangeSize = max - min + 1;
            while (lengths.length < n) lengths.push(Math.floor(Math.random() * rangeSize) + min);

            let currentSum = lengths.reduce((a, b) => a + b, 0);
            let diff = target - currentSum;
            const indices = Array.from({ length: n }, (_, i) => i);

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
                            if (count > 1) {
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

            const newGrid = createInitialGrid();
            for (let ri = 0; ri < n; ri++) newGrid[ri] = generateRandomRow(lengths[ri]);

            // --- Constraints ---
            const msdIndices = newGrid.map(row => {
                let idx = row.findIndex(d => d !== null && d !== 0);
                return idx === -1 ? 12 : idx;
            });
            const lockedCells = new Set();
            if (n > 0) {
                const r0 = newGrid[0];
                const msd = msdIndices[0];
                if (firstRowMin !== null) {
                    if (firstRowMin !== 0) r0[msd] = firstRowMin;
                    lockedCells.add(`0,${msd}`);
                }
                if (firstRowMax !== null) {
                    r0[12] = firstRowMax;
                    lockedCells.add(`0,12`);
                }
            }
            if (n > 1) {
                const rl = newGrid[n - 1];
                const msd = msdIndices[n - 1];
                if (lastRowMin !== null) {
                    if (lastRowMin !== 0) rl[msd] = lastRowMin;
                    lockedCells.add(`${n - 1},${msd}`);
                }
                if (lastRowMax !== null) {
                    rl[12] = lastRowMax;
                    lockedCells.add(`${n - 1},12`);
                }
            }

            // --- Balancing Loop (Smart Swap) ---
            while (performance.now() - startTime < TARGET_TIME_LIMIT) {
                // Calc stats
                const freqs = Array(10).fill(0);
                let totalD = 0;
                for (let r = 0; r < n; r++) for (let c = 0; c < COL_COUNT; c++) {
                    if (newGrid[r][c] !== null) { freqs[newGrid[r][c]]++; totalD++; }
                }

                const diffs = freqs.map((f, digit) => {
                    let t = totalD / 10;
                    if (digit === plusOneDigit) t += 1;
                    if (digit === minusOneDigit) t -= 1;
                    return f - t;
                });

                let maxOver = -Infinity, maxOverDigit = -1;
                let maxUnder = Infinity, maxUnderDigit = -1;
                diffs.forEach((d, i) => {
                    if (d > maxOver) { maxOver = d; maxOverDigit = i; }
                    if (d < maxUnder) { maxUnder = d; maxUnderDigit = i; }
                });

                // Balancing Check
                if (maxOver < 1 && maxUnder > -1) {
                    // Balanced. Break inner loop to evaluate and compare with global best.
                    break;
                }

                // Attempt Smart Swap by changing MaxOverDigit -> MaxUnderDigit
                // Find candidates (cells with MaxOverDigit)
                const candidates = [];
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < COL_COUNT; c++) {
                        if (newGrid[r][c] === maxOverDigit) {
                            if (lockedCells.has(`${r},${c}`)) continue;
                            if (maxUnderDigit === 0 && c === msdIndices[r]) continue;
                            candidates.push({ r, c });
                        }
                    }
                }
                if (candidates.length === 0) break;

                // Score candidates based on Adjacency
                // We want to CHOOSE a candidate that IMPROVES (reduces) orange count when changed to MaxUnderDigit.
                const currentOrange = countOrangeCells(newGrid);
                let bestCand = null;
                let maxScore = -Infinity;

                candidates.sort(() => Math.random() - 0.5);

                for (let cand of candidates) {
                    const original = newGrid[cand.r][cand.c];
                    newGrid[cand.r][cand.c] = maxUnderDigit;

                    const newOrange = countOrangeCells(newGrid);
                    const score = (currentOrange - newOrange); // +ve if oranges decreased

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

            // --- Evaluate this candidate grid ---
            const orange = countOrangeCells(newGrid);

            // Recalc stats for final state
            const freqs = Array(10).fill(0);
            let totalD = 0;
            for (let r = 0; r < n; r++) for (let c = 0; c < COL_COUNT; c++) if (newGrid[r][c] !== null) { freqs[newGrid[r][c]]++; totalD++; }
            const diff2 = freqs.map((f, digit) => {
                let t = totalD / 10;
                if (digit === plusOneDigit) t += 1;
                if (digit === minusOneDigit) t -= 1;
                return f - t;
            });
            let mo = -Infinity, mu = Infinity;
            diff2.forEach(d => { if (d > mo) mo = d; if (d < mu) mu = d; });
            // const isBalanced = (mo < 1 && mu > -1);

            // Check Answer Min Logic
            let isAnsMinOk = true;
            if (answerMin !== null) {
                const s = String(Math.abs(calculateSum(newGrid)));
                if (s[0] !== String(answerMin)) isAnsMinOk = false;
            }

            // Calculate Balance Score (Negative of total error magnitude)
            // Higher is better (0 is perfect)
            const currentBalanceScore = -diff2.reduce((acc, val) => acc + Math.abs(val), 0);

            // Compare with global best
            let currentIsBetter = false;

            if (bestGrid === null) {
                currentIsBetter = true;
            } else {
                // Priority 1: Balance (Closer to 0 is better)
                if (currentBalanceScore > bestBalanceScore) {
                    currentIsBetter = true;
                } else if (currentBalanceScore === bestBalanceScore) {
                    // Priority 2: Orange Cells (Fewer is better -> Higher negative score)
                    if (orange < -bestOrangeScore) {
                        currentIsBetter = true;
                    } else if (orange === -bestOrangeScore) {
                        // Priority 3: Answer Min Match
                        if (isAnsMinOk && !bestAnswerMatch) currentIsBetter = true;
                    }
                }
            }

            if (currentIsBetter) {
                bestGrid = cloneGrid(newGrid);
                bestBalanceScore = currentBalanceScore;
                bestOrangeScore = -orange;
                bestAnswerMatch = isAnsMinOk;
            }

            // Early Exit: If we found a Perfect Grid (Perfect Balance AND Low Orange AND AnsMinOk)
            // Note: bestBalanceScore === 0 means sum(abs(diff)) === 0, i.e., perfect balance.
            if (bestBalanceScore === 0 && bestOrangeScore >= -2 && bestAnswerMatch) {
                break;
            }

        } // End Outer Loop

        // Use bestGrid
        const FinalGrid = bestGrid ? bestGrid : createInitialGrid(); // Fallback

        // --- 2.5 Consecutive Optimization (New) ---
        // Target: Minimize consecutive pairs (d1->d2) appearing >= 3 times
        const CONSECITVE_OPT_TIME = 2000;
        const optStartTime = performance.now();

        // Fix Scope Variables

        // Re-calculate locked cells for FinalGrid (since lockedCells was local to the generation loop)
        const msdIndicesFinal = FinalGrid.map(row => {
            let idx = row.findIndex(d => d !== null && d !== 0);
            return idx === -1 ? 12 : idx;
        });
        const lockedCells = new Set();
        if (n > 0) {
            const msd = msdIndicesFinal[0];
            if (firstRowMin !== null) {
                lockedCells.add(`0,${msd}`);
            }
            if (firstRowMax !== null) {
                lockedCells.add(`0,12`);
            }
        }
        if (n > 1) {
            const msd = msdIndicesFinal[n - 1];
            if (lastRowMin !== null) {
                lockedCells.add(`${n - 1},${msd}`);
            }
            if (lastRowMax !== null) {
                lockedCells.add(`${n - 1},12`);
            }
        }



        while (performance.now() - optStartTime < CONSECITVE_OPT_TIME) {
            // 1. Identify current status of Target Patterns
            const protectedCells = new Set(); // Strings "r,c"

            // --- CONSECUTIVE (CC) ---
            if (consecutiveDigit !== null) {
                const target = Number(consecutiveDigit);
                const candidates = [];
                for (let r = 0; r < n; r++) {
                    const row = FinalGrid[r];
                    const firstNonZero = row.findIndex(d => d !== null && d !== 0);
                    for (let c = 0; c < COL_COUNT - 1; c++) {
                        if (firstNonZero === -1 || c < firstNonZero) continue;
                        if (row[c] === target && row[c + 1] === target) {
                            candidates.push({ r, c }); // Store start index
                        }
                    }
                }
                if (candidates.length > 0) {
                    // Pick ONE random instance to protect
                    const keep = candidates[Math.floor(Math.random() * candidates.length)];
                    protectedCells.add(`${keep.r},${keep.c}`);
                    protectedCells.add(`${keep.r},${keep.c + 1}`);
                }
            }

            // --- ENCLOSED / SANDWICHED (ESE) ---
            if (enclosedDigit !== null && sandwichedDigit !== null) {
                const E = Number(enclosedDigit);
                const S = Number(sandwichedDigit);
                const candidates = [];
                for (let r = 0; r < n; r++) {
                    const row = FinalGrid[r];
                    const firstNonZero = row.findIndex(d => d !== null && d !== 0);
                    for (let c = 1; c < COL_COUNT - 1; c++) {
                        if (firstNonZero === -1 || c <= firstNonZero) continue;
                        if (row[c - 1] === E && row[c] === S && row[c + 1] === E) {
                            candidates.push({ r, c }); // Store center index
                        }
                    }
                }
                if (candidates.length > 0) {
                    const keep = candidates[Math.floor(Math.random() * candidates.length)];
                    protectedCells.add(`${keep.r},${keep.c - 1}`);
                    protectedCells.add(`${keep.r},${keep.c}`);
                    protectedCells.add(`${keep.r},${keep.c + 1}`);
                }
            }

            // 2. Proactive Fixing (Try to form targets if missing)
            let fixActionTaken = false;

            // --- Fix: Enclosed Combo (ESE) ---
            if (enclosedDigit !== null && sandwichedDigit !== null) {
                const E = Number(enclosedDigit);
                const S = Number(sandwichedDigit);
                let eseCount = 0;
                for (let r = 0; r < n; r++) {
                    const row = FinalGrid[r];
                    const firstNonZero = row.findIndex(d => d !== null && d !== 0);
                    for (let c = 1; c < COL_COUNT - 1; c++) {
                        if (firstNonZero === -1 || c <= firstNonZero) continue;
                        if (FinalGrid[r][c - 1] === E && FinalGrid[r][c] === S && FinalGrid[r][c + 1] === E) eseCount++;
                    }
                }

                if (eseCount === 0) {
                    // Strategy A: ExE -> ESE
                    for (let attempt = 0; attempt < 20; attempt++) {
                        let r = Math.floor(Math.random() * n);
                        const firstNonZero = FinalGrid[r].findIndex(d => d !== null && d !== 0);
                        let c = Math.floor(Math.random() * (COL_COUNT - 2)) + 1; // 1..11
                        if (firstNonZero === -1 || c <= firstNonZero) continue;
                        // Check for ExE
                        if (FinalGrid[r][c - 1] === E && FinalGrid[r][c + 1] === E && FinalGrid[r][c] !== S) {
                            if (!lockedCells.has(`${r},${c}`)) {
                                // Try to swap FinalGrid[r][c] with an S from elsewhere
                                // Find an S
                                let sList = [];
                                for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < COL_COUNT; cc++) {
                                    if (FinalGrid[rr][cc] === S && !lockedCells.has(`${rr},${cc}`)) sList.push({ r: rr, c: cc });
                                }
                                if (sList.length > 0) {
                                    let swapSrc = sList[Math.floor(Math.random() * sList.length)];
                                    // Swap swapSrc (S) <-> (r,c) (x)
                                    let valX = FinalGrid[r][c];
                                    let valS = FinalGrid[swapSrc.r][swapSrc.c]; // S

                                    if (isSafeToPlace(FinalGrid, swapSrc.r, swapSrc.c, valX) &&
                                        // For ESE, checking isSafeToPlace(S at target) is tricky because E_E gap is invalid for E, not S.
                                        // But S is adjacent to E? No issue.
                                        isSafeToPlace(FinalGrid, r, c, valS)) {

                                        FinalGrid[r][c] = valS;
                                        FinalGrid[swapSrc.r][swapSrc.c] = valX;
                                        fixActionTaken = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (fixActionTaken) break;
                    }

                    // Strategy B: ESx / xSE -> ESE
                    if (!fixActionTaken) {
                        for (let attempt = 0; attempt < 20; attempt++) {
                            let r = Math.floor(Math.random() * n);
                            const firstNonZero = FinalGrid[r].findIndex(d => d !== null && d !== 0);
                            let c = Math.floor(Math.random() * (COL_COUNT - 2)) + 1; // 1..11
                            if (firstNonZero === -1 || c <= firstNonZero) continue;
                            // Case 1: E S x (Missing E at right)
                            if (FinalGrid[r][c - 1] === E && FinalGrid[r][c] === S && FinalGrid[r][c + 1] !== E) {
                                let targetC = c + 1;
                                if (!lockedCells.has(`${r},${targetC}`)) {
                                    let eList = [];
                                    for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < COL_COUNT; cc++) {
                                        if (FinalGrid[rr][cc] === E && !lockedCells.has(`${rr},${cc}`)) eList.push({ r: rr, c: cc });
                                    }
                                    if (eList.length > 0) {
                                        let swapSrc = eList[Math.floor(Math.random() * eList.length)];
                                        let valX = FinalGrid[r][targetC];
                                        let valE = FinalGrid[swapSrc.r][swapSrc.c];

                                        let okAtTarget = true;
                                        if (targetC > 1 && FinalGrid[r][targetC - 1] === valE) okAtTarget = false;
                                        if (targetC < 12 && FinalGrid[r][targetC + 1] === valE) okAtTarget = false;
                                        if (targetC < 11 && FinalGrid[r][targetC + 2] === valE) okAtTarget = false;
                                        // Ignore gap left (c-1), as that creates the match.

                                        if (okAtTarget && isSafeToPlace(FinalGrid, swapSrc.r, swapSrc.c, valX)) {
                                            FinalGrid[r][targetC] = valE;
                                            FinalGrid[swapSrc.r][swapSrc.c] = valX;
                                            fixActionTaken = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            // Case 2: x S E (Missing E at left)
                            if (FinalGrid[r][c - 1] !== E && FinalGrid[r][c] === S && FinalGrid[r][c + 1] === E) {
                                let targetC = c - 1;
                                if (!lockedCells.has(`${r},${targetC}`)) {
                                    let eList = [];
                                    for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < COL_COUNT; cc++) {
                                        if (FinalGrid[rr][cc] === E && !lockedCells.has(`${rr},${cc}`)) eList.push({ r: rr, c: cc });
                                    }
                                    if (eList.length > 0) {
                                        let swapSrc = eList[Math.floor(Math.random() * eList.length)];
                                        let valX = FinalGrid[r][targetC];
                                        let valE = FinalGrid[swapSrc.r][swapSrc.c];

                                        let okAtTarget = true;
                                        if (targetC > 1 && FinalGrid[r][targetC - 1] === valE) okAtTarget = false;
                                        if (targetC < 12 && FinalGrid[r][targetC + 1] === valE) okAtTarget = false;
                                        if (targetC > 2 && FinalGrid[r][targetC - 2] === valE) okAtTarget = false;
                                        // Ignore gap right (c+1), match.

                                        if (okAtTarget && isSafeToPlace(FinalGrid, swapSrc.r, swapSrc.c, valX)) {
                                            FinalGrid[r][targetC] = valE;
                                            FinalGrid[swapSrc.r][swapSrc.c] = valX;
                                            fixActionTaken = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } // End Enclosed Fix

            // --- Fix: Consecutive (CC) ---
            if (!fixActionTaken && consecutiveDigit !== null) {
                const target = Number(consecutiveDigit);
                let ccCount = 0;
                for (let r = 0; r < n; r++) {
                    const row = FinalGrid[r];
                    const firstNonZero = row.findIndex(d => d !== null && d !== 0);
                    for (let c = 0; c < COL_COUNT - 1; c++) {
                        if (firstNonZero === -1 || c < firstNonZero) continue;
                        if (FinalGrid[r][c] === target && FinalGrid[r][c + 1] === target) ccCount++;
                    }
                }

                if (ccCount === 0) {
                    let rowsWithMultipleC = [];
                    for (let r = 0; r < n; r++) {
                        let cIndices = [];
                        for (let c = 0; c < COL_COUNT; c++) if (FinalGrid[r][c] === target) cIndices.push(c);
                        if (cIndices.length >= 2) rowsWithMultipleC.push({ r, indices: cIndices });
                    }

                    if (rowsWithMultipleC.length > 0) {
                        // Strategy A: Same Row Swap (Merge existing Cs)
                        for (let item of rowsWithMultipleC) {
                            let r = item.r;
                            let cIdx1 = item.indices[0];
                            let targetC = (cIdx1 < 12) ? cIdx1 + 1 : cIdx1 - 1;

                            if (FinalGrid[r][targetC] !== target) {
                                if (!lockedCells.has(`${r},${targetC}`)) {
                                    let otherCIdx = item.indices.find(idx => idx !== cIdx1 && idx !== targetC);
                                    let swapSrc = null;
                                    if (otherCIdx !== undefined) {
                                        swapSrc = { r: r, c: otherCIdx };
                                    } else {
                                        let cList = [];
                                        for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < COL_COUNT; cc++) {
                                            if (FinalGrid[rr][cc] === target && !lockedCells.has(`${rr},${cc}`) && (rr !== r || cc !== targetC)) {
                                                if (rr === r && cc === cIdx1) continue;
                                                cList.push({ r: rr, c: cc });
                                            }
                                        }
                                        if (cList.length > 0) swapSrc = cList[Math.floor(Math.random() * cList.length)];
                                    }

                                    if (swapSrc) {
                                        let valX = FinalGrid[r][targetC];
                                        let valC = FinalGrid[swapSrc.r][swapSrc.c];

                                        let okAtTarget = true;
                                        if (targetC > cIdx1) { // Right side
                                            if (targetC < 12 && FinalGrid[r][targetC + 1] === target) okAtTarget = false;
                                        } else { // Left side
                                            if (targetC > 0 && FinalGrid[r][targetC - 1] === target) okAtTarget = false;
                                        }
                                        if (targetC > 1 && FinalGrid[r][targetC - 2] === target) okAtTarget = false;
                                        if (targetC < 11 && FinalGrid[r][targetC + 2] === target) okAtTarget = false;

                                        if (okAtTarget && isSafeToPlace(FinalGrid, swapSrc.r, swapSrc.c, valX)) {
                                            FinalGrid[r][targetC] = valC;
                                            FinalGrid[swapSrc.r][swapSrc.c] = valX;
                                            fixActionTaken = true;
                                        }
                                    }
                                }
                            }
                            if (fixActionTaken) break;
                        }
                    } else {
                        // Strategy B: Different Row logic (Fallback?)
                        // Skipped for conciseness as Same Row is prioritized.
                    }
                }
            }

            if (fixActionTaken) continue;

            const counts = Array(10).fill(null).map(() => Array(10).fill(0));
            const badPairs = [];

            for (let r = 0; r < n; r++) {
                const row = FinalGrid[r];
                for (let c = 0; c < COL_COUNT - 1; c++) {
                    const d1 = row[c];
                    const d2 = row[c + 1];
                    if (d1 !== null && d2 !== null) {
                        counts[d1][d2]++;
                    }
                }
            }

            let maxCount = 0;
            for (let d1 = 0; d1 < 10; d1++) {
                for (let d2 = 0; d2 < 10; d2++) {
                    if (counts[d1][d2] > maxCount) maxCount = counts[d1][d2];

                    let threshold = 3;
                    if (consecutiveDigit !== null && d1 === Number(consecutiveDigit) && d2 === Number(consecutiveDigit)) {
                        threshold = 2; // Strict for target
                    }
                    if (counts[d1][d2] >= threshold) {
                        badPairs.push({ d1, d2, count: counts[d1][d2] });
                    }
                }
            }

            if (maxCount <= 2 && badPairs.length === 0) {
                // Good enough
            }

            if (badPairs.length > 0) {
                badPairs.sort((a, b) => b.count - a.count);
                const targetPair = badPairs[0];

                const instances = [];
                for (let r = 0; r < n; r++) {
                    const row = FinalGrid[r];
                    for (let c = 0; c < COL_COUNT - 1; c++) {
                        if (row[c] === targetPair.d1 && row[c + 1] === targetPair.d2) {
                            if (protectedCells.has(`${r},${c}`) || protectedCells.has(`${r},${c + 1}`)) continue;
                            if (lockedCells.has(`${r},${c}`) || lockedCells.has(`${r},${c + 1}`)) continue;
                            instances.push({ r, c });
                        }
                    }
                }

                if (instances.length > 0) {
                    const inst = instances[Math.floor(Math.random() * instances.length)];
                    const { r, c } = inst;

                    for (let attempt = 0; attempt < 50; attempt++) {
                        const targetOffset = Math.random() < 0.5 ? 0 : 1;
                        const targetC = c + targetOffset;
                        const currentVal = FinalGrid[r][targetC];

                        const rr = Math.floor(Math.random() * n);
                        const validCols = [];
                        for (let k = 0; k < 13; k++) if (FinalGrid[rr][k] !== null) validCols.push(k);
                        if (validCols.length === 0) continue;
                        const rc = validCols[Math.floor(Math.random() * validCols.length)];

                        if (r === rr && Math.abs(targetC - rc) <= 2) continue;
                        if (lockedCells.has(`${rr},${rc}`)) continue;
                        if (protectedCells.has(`${rr},${rc}`)) continue;

                        const otherVal = FinalGrid[rr][rc];
                        if (otherVal === currentVal) continue;

                        if (!isSafeToPlace(FinalGrid, r, targetC, otherVal)) continue;
                        if (!isSafeToPlace(FinalGrid, rr, rc, currentVal)) continue;

                        let badImpact = false;
                        if (targetC > 0) {
                            const left = FinalGrid[r][targetC - 1];
                            if (left !== null && counts[left][otherVal] >= 2) badImpact = true;
                        }
                        if (targetC < 12) {
                            const right = FinalGrid[r][targetC + 1];
                            if (right !== null && counts[otherVal][right] >= 2) badImpact = true;
                        }

                        if (rc > 0) {
                            const left = FinalGrid[rr][rc - 1];
                            if (left !== null && counts[left][currentVal] >= 2) badImpact = true;
                        }
                        if (rc < 12) {
                            const right = FinalGrid[rr][rc + 1];
                            if (right !== null && counts[currentVal][right] >= 2) badImpact = true;
                        }

                        if (badImpact) continue;

                        FinalGrid[r][targetC] = otherVal;
                        FinalGrid[rr][rc] = currentVal;
                        break;
                    }
                }
            }
        }

        if (answerMax !== null) {
            let currentSum = calculateSum(FinalGrid);
            let currentLSD = Math.abs(currentSum) % 10;
            let targetLSD = answerMax;
            let diff = targetLSD - currentLSD;
            if (diff !== 0) {
                let targetRowIndex = -1;
                if (n > 2) targetRowIndex = Math.floor(Math.random() * (n - 2)) + 1;
                else {
                    if (firstRowMax === null) targetRowIndex = 0;
                    else if (lastRowMax === null) targetRowIndex = n - 1;
                }
                if (targetRowIndex !== -1) {
                    let r = FinalGrid[targetRowIndex];
                    let oldVal = r[12];
                    let newVal = (oldVal + diff + 10) % 10;
                    r[12] = newVal;
                }
            }
        }




        setGrid(FinalGrid);
        setIsMinusRows(nextMinusRows);
    }, [minDigit, maxDigit, rowCount, targetTotalDigits, generateRandomRow,
        firstRowMin, firstRowMax, lastRowMin, lastRowMax, answerMin, answerMax, isMinusAllowed,
        plusOneDigit, minusOneDigit, enclosedDigit, sandwichedDigit, consecutiveDigit]);

    const generateRandomGrid = useCallback(() => {
        setIsGenerating(true);
        // Delay to allow UI to render the loading state
        setTimeout(() => {
            generateRandomGridLogic();
            setIsGenerating(false);
        }, 50);
    }, [generateRandomGridLogic]);

    return {
        grid, // Return full grid, let components handle display limit if needed
        minDigit,
        maxDigit,
        targetTotalDigits,
        rowCount,
        isMinusRows,
        toggleRowMinus,
        setMinDigit,
        setMaxDigit,
        setTargetTotalDigits,
        setRowCount,
        updateDigit,
        updateRowDigitCount,
        generateRandomGrid,
        isGenerating,
        plusOneDigit, setPlusOneDigit,
        minusOneDigit, setMinusOneDigit,
        enclosedDigit, setEnclosedDigit,
        sandwichedDigit, setSandwichedDigit,
        consecutiveDigit, setConsecutiveDigit,
        firstRowMin, setFirstRowMin,
        firstRowMax, setFirstRowMax,
        lastRowMin, setLastRowMin,
        lastRowMax, setLastRowMax,
        answerMin, setAnswerMin,
        answerMax, setAnswerMax,
        totalSum: stats.totalSum,
        frequency: stats.frequency,
        totalFrequency: stats.totalFrequency,
        frequencyDiffs: stats.frequencyDiffs,
        consecutive: stats.consecutive,
        rowDigitCounts: stats.rowDigitCounts,
        totalRowDigits: stats.totalRowDigits,
        complementStatus: stats.complementStatus,
        isEnclosedUsed: stats.isEnclosedUsed,
        isSandwichedUsed: stats.isSandwichedUsed,
        isConsecutiveUsed: stats.isConsecutiveUsed,
        isFirstMinValid: stats.isFirstMinValid,
        isFirstMaxValid: stats.isFirstMaxValid,
        isLastMinValid: stats.isLastMinValid,
        isLastMaxValid: stats.isLastMaxValid,
        isAnsMinValid: stats.isAnsMinValid,
        isAnsMaxValid: stats.isAnsMaxValid,
        isMinusAllowed,
        setIsMinusAllowed,
        currentState: stats.currentState // Expose currentState
    };
};
