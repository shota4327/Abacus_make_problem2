import { useState, useMemo, useCallback } from 'react';

const INITIAL_PROBLEM = {
    left: Array(7).fill(null),
    right: Array(7).fill(null),
    decimalLeft: null, // Index of digit after which decimal point is placed (0-6), or null
    decimalRight: null,
};

export const useMultiplicationState = () => {
    // 10 problems
    const [problems, setProblems] = useState(() =>
        Array(10).fill(null).map(() => JSON.parse(JSON.stringify(INITIAL_PROBLEM)))
    );

    const updateDigit = useCallback((problemIndex, side, digitIndex, value) => {
        setProblems(prev => {
            const next = [...prev];
            // Deep copy the specific problem to avoid mutation
            next[problemIndex] = {
                ...next[problemIndex],
                [side]: [...next[problemIndex][side]]
            };
            next[problemIndex][side][digitIndex] = value;
            return next;
        });
    }, []);

    const toggleDecimal = useCallback((problemIndex, side, digitIndex) => {
        setProblems(prev => {
            const next = [...prev];
            const currentDecimal = next[problemIndex][side === 'left' ? 'decimalLeft' : 'decimalRight'];
            // If clicking the same index, toggle off (null). Otherwise set to new index.
            const newDecimal = currentDecimal === digitIndex ? null : digitIndex;

            next[problemIndex] = {
                ...next[problemIndex],
                [side === 'left' ? 'decimalLeft' : 'decimalRight']: newDecimal
            };
            return next;
        });
    }, []);

    const calculateValue = (digits, decimalIdx) => {
        let str = "";
        for (let i = 0; i < digits.length; i++) {
            const val = digits[i] !== null ? digits[i] : 0;
            str += val;
            if (decimalIdx === i) {
                str += ".";
            }
        }
        if (str === "" || str === ".") return 0;
        return parseFloat(str);
    };

    const generateRandomProblems = useCallback(() => {
        // --- 1. Determine Digit Counts ---
        // A: 10 rows, 4-7 digits, sum = 55
        // B: 10 rows, 4-7 digits, sum = 55
        // Constraint: A + B for each row in 10-12

        let countsA, countsB;
        let countAttempts = 0;

        while (countAttempts < 1000) {
            countAttempts++;

            const generateCounts = () => {
                let arr = Array(10).fill(0).map(() => Math.floor(Math.random() * 4) + 4); // 4-7
                let sum = arr.reduce((a, b) => a + b, 0);
                let safety = 0;
                while (sum !== 55 && safety < 100) {
                    safety++;
                    const idx = Math.floor(Math.random() * 10);
                    if (sum < 55 && arr[idx] < 7) {
                        arr[idx]++;
                        sum++;
                    } else if (sum > 55 && arr[idx] > 4) {
                        arr[idx]--;
                        sum--;
                    }
                }
                return (sum === 55) ? arr : null;
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
            console.error("Failed to generate valid digit counts");
            return;
        }

        // --- 2. Create Digit Pools ---
        // 55 digits for A, 55 for B.
        // A: 5 types x 6, 5 types x 5.
        // B: Remainder from global 110 (11 each).

        const possibleDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle to randomize which digits get 6 or 5
        for (let i = possibleDigits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [possibleDigits[i], possibleDigits[j]] = [possibleDigits[j], possibleDigits[i]];
        }

        const poolA_Base = [];
        const usedCounts = Array(10).fill(0);

        for (let i = 0; i < 10; i++) {
            const d = possibleDigits[i];
            const count = (i < 5) ? 6 : 5;
            usedCounts[d] += count; // Tracking for B
            for (let k = 0; k < count; k++) poolA_Base.push(d);
        }

        const poolB_Base = [];
        for (let d = 0; d <= 9; d++) {
            const remaining = 11 - usedCounts[d];
            for (let k = 0; k < remaining; k++) poolB_Base.push(d);
        }

        // --- 3. Initial Assignment (Strict First/Last Constraints) ---
        // Constraint A: Last digits (10 rows) must be 0-9 exactly once.
        // Constraint B: First digits (10 rows) must be 1-9 exactly once + 1 random non-zero (Leading zero forbidden). (Wait, 10 rows. 1-9 is 9 digits. One duplicate non-zero.)

        const setupSide = (counts, basePool) => {
            const rows = counts.map(len => ({ len, digits: Array(len).fill(null) }));

            // Helper to remove from pool
            const takeFromPool = (pool, val) => {
                const idx = pool.indexOf(val);
                if (idx !== -1) {
                    pool.splice(idx, 1);
                    return val;
                }
                return null;
            };

            // 1. Last Digits (0-9 exactly once)
            const lastDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            // Shuffle rows permutation to assign random last digit to random row
            const rowIndices = Array.from({ length: 10 }, (_, i) => i);
            for (let i = rowIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
            }

            rowIndices.forEach((rIdx, i) => {
                const val = lastDigits[i];
                rows[rIdx].digits[rows[rIdx].len - 1] = takeFromPool(basePool, val);
            });

            // 2. First Digits (Non-zero)
            // 1-9 exactly once + 1 random from 1-9.
            const firstDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            const extra = Math.floor(Math.random() * 9) + 1;
            firstDigits.push(extra);

            // Shuffle
            for (let i = firstDigits.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [firstDigits[i], firstDigits[j]] = [firstDigits[j], firstDigits[i]];
            }
            // Shuffle row indices again for random assignment
            for (let i = rowIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rowIndices[i], rowIndices[j]] = [rowIndices[j], rowIndices[i]];
            }

            rowIndices.forEach((rIdx, i) => {
                const val = firstDigits[i];
                // Must ensure we can take it from pool. If pool logic is strict, it should have enough.
                const got = takeFromPool(basePool, val);
                if (got === null) {
                    // Fallback: if pool somehow exhausted specific digit (unlikely given distribution but possible if logic flawed), force swap?
                    // With 55 digits total and 0-9 distributed well, we should be safe.
                    // But if 'extra' was a digit that only had 5 counts and we used them all? 
                    // 11 total global, split 5/6 or 6/5. 
                    // Min count for any digit in one side is 5 (for A) or 11-6=5 (for B).
                    // We need 1 First + 1 Last = 2 max per digit fixed? 
                    // Wait, first/last are unique except one. So max 2 fixed uses of a specific digit per side. 
                    // Pool has min 5. So safe.
                    console.error("Pool exhausted for", val);
                }
                rows[rIdx].digits[0] = got;
            });

            // 3. Fill Middle Digits
            // Randomly fill nulls from remaining pool
            // Shuffle remaining pool first
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

        // --- 4. Optimization (Pattern Reduction & Transition Frequency Limit) ---
        // Run for ~5 seconds
        // Moved BEFORE Decimal Logic to ensure optimization doesn't break decimal rounding,
        // and Decimal Logic can select rows that naturally fit the criteria.

        const startTime = Date.now();
        const DURATION = 5000;

        // Helper to check standard warnings (consecutive ident, 1-skip)
        const getRowPatternScore = (rowDigits) => {
            let s = 0;
            for (let i = 0; i < rowDigits.length; i++) {
                const d = rowDigits[i];
                if (d === null) continue;
                if (i > 0 && rowDigits[i - 1] === d) s++;
                if (i > 1 && rowDigits[i - 2] === d) s++;
            }
            return s;
        };

        const calculateTotalScore = (rA, rB) => {
            let score = 0;

            // 1. Standard Pattern Score
            rA.forEach(r => score += getRowPatternScore(r.digits));
            rB.forEach(r => score += getRowPatternScore(r.digits));

            // 2. Global Transition Frequency Penalty (Target: Count < 3)
            const transitions = Array(10).fill(null).map(() => Array(10).fill(0));

            const tally = (rows) => {
                rows.forEach(r => {
                    for (let i = 0; i < r.digits.length - 1; i++) {
                        const d1 = r.digits[i];
                        const d2 = r.digits[i + 1];
                        if (d1 !== null && d2 !== null) {
                            transitions[d1][d2]++;
                        }
                    }
                });
            };

            tally(rA);
            tally(rB);

            // Penalty for any transition >= 3
            for (let d1 = 0; d1 < 10; d1++) {
                for (let d2 = 0; d2 < 10; d2++) {
                    if (transitions[d1][d2] >= 3) {
                        // Penalty increases with excess
                        score += (transitions[d1][d2] - 2) * 1000;
                    }
                }
            }
            return score;
        };

        let currentScore = calculateTotalScore(rowsA, rowsB);

        while (Date.now() - startTime < DURATION) {
            // Pick side A or B
            const isA = Math.random() < 0.5;
            const targetRows = isA ? rowsA : rowsB;

            // Pick two rows
            const r1 = Math.floor(Math.random() * 10);
            const r2 = Math.floor(Math.random() * 10);

            // Pick middle indices (cannot touch 0 or len-1)
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

            // Swap
            const val1 = targetRows[r1].digits[i1];
            const val2 = targetRows[r2].digits[i2];

            targetRows[r1].digits[i1] = val2;
            targetRows[r2].digits[i2] = val1;

            // Since Decimal Logic is now AFTER this, we don't need to check decimal constraints here.
            // We just optimize for pattern score.

            const newScore = calculateTotalScore(rowsA, rowsB);

            if (newScore <= currentScore) {
                currentScore = newScore;
                if (newScore === 0) break;
            } else {
                // Revert
                targetRows[r1].digits[i1] = val1;
                targetRows[r2].digits[i2] = val2;
            }
        }

        // --- 5. Decimal Logic (Select Rows) ---
        // Need 2 UP, 2 DOWN.
        // Scan all 10 rows for valid decimal positions (0..len-2) that yield UP or DOWN.

        const finalDecimals = Array(10).fill(null);

        // Helper to check result type
        const getDecimalResultType = (valsA, valsB, decIdx) => {
            const vA = parseInt(valsA.join(''), 10);
            const valB = parseFloat(valsB.slice(0, decIdx + 1).join('') + "." + valsB.slice(decIdx + 1).join(''));
            const res = vA * valB;
            if (Number.isInteger(res)) return 'int';
            const frac = res % 1;
            return (frac >= 0.5) ? 'up' : 'down';
        };

        // Find candidates
        const upCandidates = []; // { rIdx, pos }
        const downCandidates = [];

        for (let i = 0; i < 10; i++) {
            const rA = rowsA[i].digits;
            const rB = rowsB[i].digits;
            const len = rowsB[i].len;
            // Valid positions: 0 to len-2
            for (let pos = 0; pos < len - 1; pos++) {
                const type = getDecimalResultType(rA, rB, pos);
                if (type === 'up') upCandidates.push({ rIdx: i, pos, candidates: [] }); // candidates field just for structure consistency if needed
                if (type === 'down') downCandidates.push({ rIdx: i, pos });
            }
        }

        // Shuffle candidates
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

        // Select 2 UP
        for (const cand of upCandidates) {
            if (selectedUp >= 2) break;
            if (!usedRows.has(cand.rIdx)) {
                finalDecimals[cand.rIdx] = cand.pos;
                usedRows.add(cand.rIdx);
                selectedUp++;
            }
        }

        // Select 2 DOWN
        for (const cand of downCandidates) {
            if (selectedDown >= 2) break;
            if (!usedRows.has(cand.rIdx)) {
                finalDecimals[cand.rIdx] = cand.pos;
                usedRows.add(cand.rIdx);
                selectedDown++;
            }
        }

        // Use standard logic for final problems assembly
        const finalProblems = [];
        for (let i = 0; i < 10; i++) {
            const p = JSON.parse(JSON.stringify(INITIAL_PROBLEM));
            const rA = rowsA[i];
            const rB = rowsB[i];

            // Right align
            for (let k = 0; k < rA.len; k++) p.left[6 - (rA.len - 1) + k] = rA.digits[k];
            for (let k = 0; k < rB.len; k++) p.right[6 - (rB.len - 1) + k] = rB.digits[k];

            // Decimal
            if (finalDecimals[i] !== null) {
                // Decimal index in grid. 
                // finalDecimals is index in digits array (0-based).
                // If digits valid indices 0..len-1.
                // Grid right aligned.
                // Digit k maps to grid 6-(len-1)+k.
                // Decimal at D means dot after digits[D].
                // So dot after grid[6-(len-1)+D].
                // That grid index is the decimal button index.
                p.decimalRight = 6 - (rB.len - 1) + finalDecimals[i];
            }
            finalProblems.push(p);
        }

        setProblems(finalProblems);

    }, []);

    // --- Statistics ---

    // Helper to count digits in a set of arrays (treating null as 0 is NOT what we want for stats usually, 
    // but in the existing app, empty cells might be ignored. Let's assume null/undefined are ignored).
    // WAIT: In the existing app, empty cells are null. 0 is a valid digit.

    const calculateFrequency = (dataSets) => {
        // dataSets is an array of arrays of digits
        // Returns table [rowIndex][digit] -> count
        const freqTable = dataSets.map(row => {
            const counts = Array(10).fill(0);
            row.forEach(d => {
                if (d !== null && d !== undefined && d !== '') {
                    counts[d]++;
                }
            });
            return counts;
        });
        return freqTable;
    };

    const calculateTotalFrequency = (freqTable) => {
        const total = Array(10).fill(0);
        freqTable.forEach(row => {
            row.forEach((count, d) => {
                total[d] += count;
            });
        });
        return total;
    };

    const calculateRowDigitCounts = (dataSets) => {
        return dataSets.map(row => row.filter(d => d !== null && d !== undefined && d !== '').length);
    };

    // 1. All (Left + Right combined per problem)
    const frequencyAll = useMemo(() => {
        const rows = problems.map(p => [...p.left, ...p.right]);
        return calculateFrequency(rows);
    }, [problems]);

    const totalFrequencyAll = useMemo(() => calculateTotalFrequency(frequencyAll), [frequencyAll]);
    const rowDigitCountsAll = useMemo(() => {
        const rows = problems.map(p => [...p.left, ...p.right]);
        return calculateRowDigitCounts(rows);
    }, [problems]);
    const totalRowDigitsAll = useMemo(() => rowDigitCountsAll.reduce((a, b) => a + b, 0), [rowDigitCountsAll]);

    // Target 11 per digit for 'All' stats
    const frequencyDiffsAll = useMemo(() => {
        return totalFrequencyAll.map(count => count - 11);
    }, [totalFrequencyAll]);
    const targetTotalDigitsAll = 110;


    // 2. Left (A only)
    const frequencyLeft = useMemo(() => {
        const rows = problems.map(p => p.left);
        return calculateFrequency(rows);
    }, [problems]);

    const totalFrequencyLeft = useMemo(() => calculateTotalFrequency(frequencyLeft), [frequencyLeft]);
    const rowDigitCountsLeft = useMemo(() => {
        const rows = problems.map(p => p.left);
        return calculateRowDigitCounts(rows);
    }, [problems]);
    const totalRowDigitsLeft = useMemo(() => rowDigitCountsLeft.reduce((a, b) => a + b, 0), [rowDigitCountsLeft]);


    // 3. Right (B only)
    const frequencyRight = useMemo(() => {
        const rows = problems.map(p => p.right);
        return calculateFrequency(rows);
    }, [problems]);

    const totalFrequencyRight = useMemo(() => calculateTotalFrequency(frequencyRight), [frequencyRight]);
    const rowDigitCountsRight = useMemo(() => {
        const rows = problems.map(p => p.right);
        return calculateRowDigitCounts(rows);
    }, [problems]);
    const totalRowDigitsRight = useMemo(() => rowDigitCountsRight.reduce((a, b) => a + b, 0), [rowDigitCountsRight]);


    // 4. Consecutive Digits (Global check)
    // "Consecutive Digit" area displays how many times consecutive characters appear in the entire problem.
    // Logic: Iterate through all digits in sequence?
    // In Mitorizan, it checks vertical and horizontal?
    // For Multiplication (A x B), is it just A and B?
    // "The 'Consecutive Characters' area displays how many times consecutive characters appear in the entire problem, similar to the calculation."
    // In Mitorizan (ProblemGrid), 'consecutive' is checked for [d1][d2] pairs.
    // For Multiplication, we probably treat each problem row as a sequence: A digits then B digits? Or just A and B separately?
    // "Problem creation area" -> "10 problems".
    // Usually consecutive checks are within a number (e.g. 77 in 477).
    // Let's assume we check consecutives within A and within B separately, and aggregate them.
    // Or maybe A and B are distinct numbers, so no cross-boundary check?
    // "A x B" -> A is one number, B is another.
    // I will check consecutives internally in A and internally in B for all 10 problems.

    const consecutive = useMemo(() => {
        const counts = Array(10).fill(null).map(() => Array(10).fill(0)); // [d1][d2] matrix

        problems.forEach(p => {
            // Check Left
            for (let i = 0; i < p.left.length - 1; i++) {
                const d1 = p.left[i];
                const d2 = p.left[i + 1];
                if (d1 !== null && d2 !== null) {
                    counts[d1][d2]++;
                }
            }
            // Check Right
            for (let i = 0; i < p.right.length - 1; i++) {
                const d1 = p.right[i];
                const d2 = p.right[i + 1];
                if (d1 !== null && d2 !== null) {
                    counts[d1][d2]++;
                }
            }
        });
        return counts;
    }, [problems]);


    return {
        problems,
        updateDigit,
        toggleDecimal,

        frequencyAll,
        totalFrequencyAll,
        rowDigitCountsAll,
        totalRowDigitsAll,
        frequencyDiffsAll,
        targetTotalDigitsAll,

        frequencyLeft,
        totalFrequencyLeft,
        rowDigitCountsLeft,
        totalRowDigitsLeft,

        frequencyRight,
        totalFrequencyRight,
        rowDigitCountsRight,
        totalRowDigitsRight,

        consecutive,
        generateRandomProblems
    };
};
