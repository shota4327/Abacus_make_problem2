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

    // New Conditions
    const [plusOneDigit, setPlusOneDigit] = useState(0);
    const [minusOneDigit, setMinusOneDigit] = useState(0);
    const [enclosedDigit, setEnclosedDigit] = useState(0);
    const [sandwichedDigit, setSandwichedDigit] = useState(0);
    const [consecutiveDigit, setConsecutiveDigit] = useState(0);

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

        return {
            totalSum,
            frequency,
            totalFrequency,
            frequencyDiffs,
            consecutive,
            rowDigitCounts,
            totalRowDigits,
            complementStatus
        };
    }, [grid, rowCount, targetTotalDigits, plusOneDigit, minusOneDigit, isMinusRows]);

    const generateRandomGrid = useCallback(() => {
        const n = rowCount;
        const min = Math.min(minDigit, maxDigit);
        const max = Math.max(minDigit, maxDigit);
        const target = targetTotalDigits;
        const rangeSize = max - min + 1;

        // 1. Initial allocation: Ensure at least one of each length [min...max]
        let lengths = [];
        for (let i = min; i <= max; i++) {
            lengths.push(i);
        }

        // 2. Fill the remaining slots randomly
        while (lengths.length < n) {
            lengths.push(Math.floor(Math.random() * rangeSize) + min);
        }

        // 3. Adjust to target total digits
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

        // Final shuffle 
        lengths.sort(() => Math.random() - 0.5);

        const newGrid = createInitialGrid();
        for (let ri = 0; ri < n; ri++) {
            newGrid[ri] = generateRandomRow(lengths[ri]);
        }

        // --- Constraint Application ---

        // Helper: Find index of first non-zero digit (MSD) and last digit (LSD)
        // Note: Our grid is 13 columns (0..12). 
        // Digits are right aligned effectively by logic? 
        // generateRandomRow makes right-aligned digits in the array (e.g. [0,0,0,1,2,3...]).
        // So MSD is first non-zero index. LSD is always index 12.

        // 1. First Row Constraints (Row 0)
        if (n > 0) {
            const row0 = newGrid[0];
            // Find MSD index
            let msdIndex = row0.findIndex(d => d !== 0 && d !== null);
            if (msdIndex === -1) msdIndex = 12; // Should not happen for valid row

            if (firstRowMin !== null) {
                row0[msdIndex] = firstRowMin === 0 ? 1 : firstRowMin; // MSD cannot be 0, defaulting to 1 if 0 requested (though specific logic might differ)
                // Actually constraint says "firstRowMin" based on "1st Row" min setting (left side).
                // If user sets 0 for MSD, it's invalid for a number. Assuming 1-9 for MSD selectors usually. 
                // But let's respect the value. If 0, it might mean "don't care" or "0" if valid. 
                // Usually MSD is 1-9. ConditionPanel passes 0-9. 
                if (firstRowMin !== 0) row0[msdIndex] = firstRowMin;
            }
            if (firstRowMax !== null) {
                // LSD is always at 12 for non-empty row?
                // Our generateRandomRow fills from end? 
                // YES: row[COL_COUNT - 1 - i] = val; implies index 12 is the 1s place.
                row0[12] = firstRowMax;
            }
        }

        // 2. Last Row Constraints (Row n-1)
        if (n > 1) { // Only if different from first row or exists
            const rowLast = newGrid[n - 1];
            let msdIndex = rowLast.findIndex(d => d !== 0 && d !== null);
            if (msdIndex === -1) msdIndex = 12;

            if (lastRowMin !== null) {
                if (lastRowMin !== 0) rowLast[msdIndex] = lastRowMin;
            }
            if (lastRowMax !== null) {
                rowLast[12] = lastRowMax;
            }
        }

        // Helper to check if a cell occupies a "leading zero" position that must remain non-zero
        // In our grid convention, row is right-aligned in [0..12], but stored as full array.
        // generateRandomRow fills from right. Leading parts are null? No, filled with 0? 
        // Let's check generateRandomRow: it fills with nulls then sets values. 
        // Ah, our grid uses `null` for non-digits? 
        // `const row = Array(COL_COUNT).fill(null);` in generateRandomRow.
        // So `d !== null` check is sufficient for existence.
        // However, the "most significant digit" of a number cannot be 0.
        // We find MSD index for each row.
        const msdIndices = newGrid.map(row => {
            let idx = row.findIndex(d => d !== null && d !== 0);
            return idx === -1 ? 12 : idx;
        });

        // Loop for Frequency Balancing
        const TARGET_TIME_LIMIT = 2000; // 2 seconds
        const startTime = performance.now();

        // Locked cells map (set of strings "r,c")
        const lockedCells = new Set();
        // Lock First Row constraints
        if (n > 0) {
            if (firstRowMin !== null) lockedCells.add(`0,${msdIndices[0]}`);
            if (firstRowMax !== null) lockedCells.add(`0,12`);
        }
        // Lock Last Row constraints
        if (n > 1) {
            const lastIdx = n - 1;
            if (lastRowMin !== null) lockedCells.add(`${lastIdx},${msdIndices[lastIdx]}`);
            if (lastRowMax !== null) lockedCells.add(`${lastIdx},12`);
        }

        while (performance.now() - startTime < TARGET_TIME_LIMIT) {
            // 1. Calculate current frequencies
            const freqs = Array(10).fill(0);
            let totalD = 0;
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < COL_COUNT; c++) {
                    const val = newGrid[r][c];
                    if (val !== null) {
                        freqs[val]++;
                        totalD++;
                    }
                }
            }

            // Goals: totalD / 10, adjusted by plusOne/minusOne
            const diffs = freqs.map((f, digit) => {
                let target = totalD / 10;
                if (digit === plusOneDigit) target += 1;
                if (digit === minusOneDigit) target -= 1;
                return f - target;
            });

            // Find worst offenders
            let maxOver = -Infinity;
            let maxOverDigit = -1;
            let maxUnder = Infinity;
            let maxUnderDigit = -1;

            diffs.forEach((d, i) => {
                if (d > maxOver) { maxOver = d; maxOverDigit = i; }
                if (d < maxUnder) { maxUnder = d; maxUnderDigit = i; }
            });

            // Check convergence for "Perfect Balance"
            if (maxOver < 1 && maxUnder > -1) break;

            // Attempt Swap
            const candidates = [];
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < COL_COUNT; c++) {
                    if (newGrid[r][c] === maxOverDigit) {
                        if (lockedCells.has(`${r},${c}`)) continue;
                        // Leading zero safety:
                        if (maxUnderDigit === 0 && c === msdIndices[r]) continue;

                        candidates.push({ r, c });
                    }
                }
            }

            if (candidates.length === 0) {
                // If stuck, typically implies we can't improve further or constraint blocked.
                break;
            }

            // Pick random candidate and swap
            const cand = candidates[Math.floor(Math.random() * candidates.length)];
            newGrid[cand.r][cand.c] = maxUnderDigit;
        }

        // 3. Answer Constraints (Total Sum)
        // ... (existing logic)

        // Calculate current sum logic helper
        const calculateSum = (g) => {
            let sum = 0;
            for (let r = 0; r < n; r++) {
                let rowStr = g[r].map(d => d ?? 0).join('');
                let val = parseInt(rowStr, 10) * (isMinusRows[r] ? -1 : 1);
                sum += val;
            }
            return sum;
        };

        // Adjust LSD (Answer Max)
        if (answerMax !== null) {
            let currentSum = calculateSum(newGrid);
            let currentLSD = Math.abs(currentSum) % 10;
            let targetLSD = answerMax;
            let diff = targetLSD - currentLSD;
            if (diff !== 0) {
                // We need to change the total sum by `diff` (modulo 10). 
                // Easiest is to add `diff` to the LSD of a mutable row.
                // Mutable row: preferably not 0 or n-1 if constrained. 
                // Let's pick a random row between 0 and n-1. 
                // If constrained rows are touched, we must ensure we don't overwrite the constrained column (LSD is constrained for 0 and n-1).
                // Actually, if row 0 LSD is constrained, we can't touch it.
                // If we have rows 1..n-2, use them.
                let targetRowIndex = -1;
                if (n > 2) {
                    targetRowIndex = Math.floor(Math.random() * (n - 2)) + 1;
                } else {
                    // Fallback: Check if Row 0 LSD is constrained. If not, use it. 
                    if (firstRowMax === null) targetRowIndex = 0;
                    else if (lastRowMax === null) targetRowIndex = n - 1;
                }

                if (targetRowIndex !== -1) {
                    let r = newGrid[targetRowIndex];
                    let oldVal = r[12];
                    let newVal = (oldVal + diff + 10) % 10;
                    r[12] = newVal;
                }
            }
        }

        // Adjust MSD (Answer Min) - This is tricky because it depends on carry over. 
        // Simplification: Try to adjust the MSD of the total by changing the MSD of a mutable row.
        // This is generic and might fail if carry propagates weirdly, but usually works.
        if (answerMin !== null) {
            let currentSum = calculateSum(newGrid);
            let absSum = Math.abs(currentSum);
            let sumStr = absSum.toString();
            let currentMSD = parseInt(sumStr[0], 10);
            let targetMSD = answerMin;

            if (currentMSD !== targetMSD && targetMSD !== 0) {
                // Try to adjust a row's MSD to shift the total MSD.
                // This is complex. A simple heuristic: 
                // Calculate difference in magnitude? No, just replace MSD of a row?
                // Let's find the magnitude of the Total.
                // e.g. Total 12345 (5 digits). We want starts with 8 -> 8xxxx.
                // We need to add/subtract ~ (Target - Current) * 10^(digits-1).

                let power = Math.pow(10, sumStr.length - 1);
                let diffVal = (targetMSD - currentMSD) * power;

                // Apply to a mutable row. Same logic as LSD, find a row that is "safe".
                // Safe row: Not 0 or n-1 if their MSDs are constrained.
                let candidateRows = [];
                for (let r = 0; r < n; r++) {
                    if (r === 0 && firstRowMin !== null) continue;
                    if (r === n - 1 && lastRowMin !== null) continue;
                    candidateRows.push(r);
                }

                if (candidateRows.length > 0) {
                    // Pick one, try to add diffVal. 
                    // Since we work with digits, adding diffVal directly is hard. 
                    // Modifying the digit at the corresponding column is easier.
                    // The column index for 10^k is 12 - k.
                    let colIdx = 12 - (sumStr.length - 1);

                    if (colIdx >= 0 && colIdx <= 12) {
                        // Spread the diff across multiple rows to avoid single digit overflow > 9?
                        // Or just loop until satisfied?
                        // Simple try: Adjust one row.
                        let rIdx = candidateRows[Math.floor(Math.random() * candidateRows.length)];
                        let row = newGrid[rIdx];
                        let val = row[colIdx];
                        // We want to add (target - current). 
                        // Note: total might change length (carry), complicating things. 
                        // This is a "best effort" adjustment.

                        let change = targetMSD - currentMSD;
                        let newVal = val + change;

                        // Clamp to 1-9 if it's the leading digit of the row, or 0-9 otherwise.
                        // Wait, we are modifying the column corresponding to the Total's MSD. 
                        // This column might not be the MSD of the *row* (row might be shorter). 
                        // If row[colIdx] is 0 (leading zero), we can make it non-zero (extend row).
                        // If we extend, we must respect maxDigit constraint... which is implicit in the grid generation. 
                        // Let's just try to modify existing non-zero digit if possible.

                        // Better approach: Re-generate a row with specific target? No.
                        // Let's essentially "force" the MSD of the Answer by brute-force adjusting the largest active column of a free row.

                        // Only try if colIdx is valid
                        if (newVal >= 0 && newVal <= 9) {
                            row[colIdx] = newVal;
                        } else {
                            // If overflow/underflow, wrap around? No, that messes up magnitude. 
                            // Just pick a valid digit close to it.
                            row[colIdx] = Math.max(1, Math.min(9, newVal));
                        }
                    }
                }
            }
        }

        setGrid(newGrid);
    }, [minDigit, maxDigit, rowCount, targetTotalDigits, generateRandomRow,
        firstRowMin, firstRowMax, lastRowMin, lastRowMax, answerMin, answerMax, isMinusRows,
        plusOneDigit, minusOneDigit]);

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
        complementStatus: stats.complementStatus
    };
};
