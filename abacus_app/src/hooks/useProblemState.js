import { useState, useMemo, useCallback } from 'react';

const ROW_COUNT = 20;
const COL_COUNT = 13;

// Helper to create initial grid (20 rows x 13 cols, initialized to 0)
const createInitialGrid = () => {
    return Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill(0));
};

export const useProblemState = () => {
    const [grid, setGrid] = useState(createInitialGrid);
    const [isMinusRows, setIsMinusRows] = useState(Array(ROW_COUNT).fill(false));
    const [minDigit, setMinDigit] = useState(5);
    const [maxDigit, setMaxDigit] = useState(12);
    const [targetTotalDigits, setTargetTotalDigits] = useState(130);
    const [rowCount, setRowCount] = useState(20);

    // State for loading overlay
    const [isGenerating, setIsGenerating] = useState(false);

    // New Conditions
    const [plusOneDigit, setPlusOneDigit] = useState(null);
    const [minusOneDigit, setMinusOneDigit] = useState(null);
    const [enclosedDigit, setEnclosedDigit] = useState(null);
    const [sandwichedDigit, setSandwichedDigit] = useState(null);
    const [consecutiveDigit, setConsecutiveDigit] = useState(null);

    // Row specific and Answer constraints (digit counts or patterns)
    const [firstRowMin, setFirstRowMin] = useState(null);
    const [firstRowMax, setFirstRowMax] = useState(null);
    const [lastRowMin, setLastRowMin] = useState(null);
    const [lastRowMax, setLastRowMax] = useState(null);
    const [answerMin, setAnswerMin] = useState(null);
    const [answerMax, setAnswerMax] = useState(null);

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

            // Complement check: if running total drops below 0 at any point (implied sequential addition)
            // Note: This check happens AFTER the row is added. 
            // Abacus logic: negative intermediate result means "borrow" or "complement".
            if (totalSum < 0) {
                // Actually, "during calculation" implies running total. 
                // We check after each row addition.
                // However, finding complement might be triggered even if total is positive but operation subtracts?
                // Standard definition: If the *value on the abacus* would be negative? 
                // Abacus usually doesn't show negative. 
                // Interpretation: "Intermediate total < 0" seems correct for "complement calculation needed".
                // But wait, if we start with 10 - 20, we get -10. 
                // Let's stick to "running total < 0".
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
                for (let ci = 0; ci < COL_COUNT; ci++) {
                    if (row[ci] === target) {
                        const hasGapLeft = ci > 1 && row[ci - 2] === target;
                        const hasGapRight = ci < 11 && row[ci + 2] === target;
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
                for (let ci = 1; ci < COL_COUNT - 1; ci++) {
                    if (row[ci] === target) {
                        // 左右が同じ数字かどうか (3-5-3, 9-5-9 check)
                        if (row[ci - 1] === row[ci + 1]) {
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
            isConsecutiveUsed
        };
    }, [grid, rowCount, targetTotalDigits, plusOneDigit, minusOneDigit, isMinusRows, enclosedDigit, sandwichedDigit, consecutiveDigit]);

    // Core Logic (Refactored from original generateRandomGrid)
    const generateRandomGridLogic = useCallback(() => {
        const TARGET_TIME_LIMIT = 5000;
        const startTime = performance.now();

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

        let bestGrid = null;
        let bestBalanceScore = -Infinity; // Higher is better (negative of diff)
        let bestOrangeScore = -Infinity; // Higher is better (negative of count)

        // Best-of-N Loop
        while (performance.now() - startTime < TARGET_TIME_LIMIT) {
            const n = rowCount;
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
            const isBalanced = (mo < 1 && mu > -1);

            // Compare with global best
            let currentIsBetter = false;

            if (bestGrid === null) {
                currentIsBetter = true;
            } else {
                const bestBalanced = (bestBalanceScore === 100);

                if (isBalanced && !bestBalanced) {
                    currentIsBetter = true;
                } else if (isBalanced && bestBalanced) {
                    // Both balanced: prefer fewer orange cells
                    if (orange < -bestOrangeScore) currentIsBetter = true;
                } else if (!isBalanced && !bestBalanced) {
                    currentIsBetter = true; // Just overwrite
                }
            }

            if (currentIsBetter) {
                bestGrid = cloneGrid(newGrid);
                bestBalanceScore = isBalanced ? 100 : 0;
                bestOrangeScore = -orange;
            }

            // Early Exit: If we found a Perfect Grid (Balanced AND Orange <= 2)
            if (bestBalanceScore === 100 && bestOrangeScore >= -2) {
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
        const n = rowCount;

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

        while (performance.now() - optStartTime < CONSECITVE_OPT_TIME) {
            // 1. Calculate current consecutive counts
            const counts = Array(10).fill(null).map(() => Array(10).fill(0));
            const badPairs = []; // {d1, d2, count}

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
                    if (counts[d1][d2] >= 3) {
                        badPairs.push({ d1, d2, count: counts[d1][d2] });
                    }
                    if (counts[d1][d2] > maxCount) maxCount = counts[d1][d2];
                }
            }

            if (maxCount <= 2) break; // All pairs count <= 2. Success!

            if (badPairs.length === 0) break; // Should be covered by maxCount check, but safety.

            // Sort bad pairs by count desc
            badPairs.sort((a, b) => b.count - a.count);
            const targetPair = badPairs[0]; // {d1, d2}

            // Find all instances of this pair
            const instances = [];
            for (let r = 0; r < n; r++) {
                const row = FinalGrid[r];
                for (let c = 0; c < COL_COUNT - 1; c++) {
                    if (row[c] === targetPair.d1 && row[c + 1] === targetPair.d2) {
                        // Check if locked
                        if (lockedCells.has(`${r},${c}`) || lockedCells.has(`${r},${c + 1}`)) continue;
                        instances.push({ r, c });
                    }
                }
            }

            if (instances.length === 0) break; // Can't fix remaining ones (locked)

            // Pick a random instance to break
            const inst = instances[Math.floor(Math.random() * instances.length)];
            const { r, c } = inst;

            let swapped = false;

            // Limit attempts per loop
            for (let attempt = 0; attempt < 50; attempt++) {
                // Decide whether to swap d1 (index c) or d2 (index c+1)
                const targetOffset = Math.random() < 0.5 ? 0 : 1;
                const targetC = c + targetOffset; // The cell we want to change
                const currentVal = FinalGrid[r][targetC];

                // Pick random other cell (rr, rc)
                const rr = Math.floor(Math.random() * n);
                // Find valid columns in that row
                const validCols = [];
                for (let k = 0; k < 13; k++) if (FinalGrid[rr][k] !== null) validCols.push(k);
                if (validCols.length === 0) continue;
                const rc = validCols[Math.floor(Math.random() * validCols.length)];

                // Avoid self-swap or swapping too close (simplicity)
                if (r === rr && Math.abs(targetC - rc) <= 2) continue;
                if (lockedCells.has(`${rr},${rc}`)) continue;

                const otherVal = FinalGrid[rr][rc];
                if (otherVal === currentVal) continue;

                // Check validity of placing otherVal at (r, targetC)
                if (!isSafeToPlace(FinalGrid, r, targetC, otherVal)) continue;

                // Check validity of placing currentVal at (rr, rc)
                if (!isSafeToPlace(FinalGrid, rr, rc, currentVal)) continue;

                // Check Consecutive Impact (prevent creating NEW bad pairs)
                let badImpact = false;

                // Check neighbors of (r, targetC) with otherVal
                if (targetC > 0) {
                    const left = FinalGrid[r][targetC - 1];
                    if (left !== null && counts[left][otherVal] >= 2) badImpact = true;
                }
                if (targetC < 12) {
                    const right = FinalGrid[r][targetC + 1];
                    if (right !== null && counts[otherVal][right] >= 2) badImpact = true;
                }

                // Check neighbors of (rr, rc) with currentVal
                if (rc > 0) {
                    const left = FinalGrid[rr][rc - 1];
                    if (left !== null && counts[left][currentVal] >= 2) badImpact = true;
                }
                if (rc < 12) {
                    const right = FinalGrid[rr][rc + 1];
                    if (right !== null && counts[currentVal][right] >= 2) badImpact = true;
                }

                if (badImpact) continue;

                // Apply Swap
                FinalGrid[r][targetC] = otherVal;
                FinalGrid[rr][rc] = currentVal;
                swapped = true;
                break;
            }
        }

        // --- 3. Answer Constraints ---
        const calculateSum = (g) => {
            let sum = 0;
            for (let r = 0; r < n; r++) {
                let rowStr = g[r].map(d => d ?? 0).join('');
                let val = parseInt(rowStr, 10) * (isMinusRows[r] ? -1 : 1);
                sum += val;
            }
            return sum;
        };

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

        if (answerMin !== null) {
            let currentSum = calculateSum(FinalGrid);
            let absSum = Math.abs(currentSum);
            let sumStr = absSum.toString();
            let currentMSD = parseInt(sumStr[0], 10);
            let targetMSD = answerMin;
            if (currentMSD !== targetMSD && targetMSD !== 0) {
                let power = Math.pow(10, sumStr.length - 1);
                let diffVal = (targetMSD - currentMSD) * power;
                let candidateRows = [];
                for (let r = 0; r < n; r++) {
                    if (r === 0 && firstRowMin !== null) continue;
                    if (r === n - 1 && lastRowMin !== null) continue;
                    candidateRows.push(r);
                }
                if (candidateRows.length > 0) {
                    let colIdx = 12 - (sumStr.length - 1);
                    if (colIdx >= 0 && colIdx <= 12) {
                        let rIdx = candidateRows[Math.floor(Math.random() * candidateRows.length)];
                        let row = FinalGrid[rIdx];
                        let val = row[colIdx];
                        let change = targetMSD - currentMSD;
                        let newVal = val + change;
                        if (newVal >= 0 && newVal <= 9) {
                            row[colIdx] = newVal;
                        } else {
                            row[colIdx] = Math.max(1, Math.min(9, newVal));
                        }
                    }
                }
            }
        }

        setGrid(FinalGrid);
    }, [minDigit, maxDigit, rowCount, targetTotalDigits, generateRandomRow,
        firstRowMin, firstRowMax, lastRowMin, lastRowMax, answerMin, answerMax, isMinusRows,
        plusOneDigit, minusOneDigit]);

    const generateRandomGrid = useCallback(() => {
        setIsGenerating(true);
        // Delay to allow UI to render the loading state
        setTimeout(() => {
            generateRandomGridLogic();
            setIsGenerating(false);
        }, 50);
    }, [generateRandomGridLogic]);

    return {
        grid: grid.slice(0, rowCount), // Only expose active rows
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
        isConsecutiveUsed: stats.isConsecutiveUsed
    };
};
