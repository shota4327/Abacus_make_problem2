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

        consecutive
    };
};
