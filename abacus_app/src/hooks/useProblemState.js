import { useState, useMemo, useCallback } from 'react';

const ROW_COUNT = 20;
const COL_COUNT = 12;

// Helper to create initial grid (20 rows x 12 cols, initialized to 0)
const createInitialGrid = () => {
    return Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill(0));
};

export const useProblemState = () => {
    const [grid, setGrid] = useState(createInitialGrid);
    const [minDigit, setMinDigit] = useState(5);
    const [maxDigit, setMaxDigit] = useState(12);
    const [targetTotalDigits, setTargetTotalDigits] = useState(120);
    const [rowCount, setRowCount] = useState(20);

    // Update a single digit
    const updateDigit = useCallback((rowIndex, colIndex, value) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex][colIndex] = value;
            return newGrid;
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
            totalSum += parseInt(rowValStr, 10) || 0;
        }

        return {
            totalSum,
            frequency,
            totalFrequency,
            consecutive,
            rowDigitCounts,
            totalRowDigits
        };
    }, [grid, rowCount]);

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
            // Need to add digits: Increment rows without exceeding max
            while (diff > 0) {
                // Randomly shuffle indices to distribute increments
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
                if (!changed) break; // All at max
            }
        } else if (diff < 0) {
            // Need to remove digits: Decrement rows without going below min
            // and without losing the "at least one of each" integrity
            while (diff < 0) {
                const shuffled = [...indices].sort(() => Math.random() - 0.5);
                let changed = false;
                for (let i of shuffled) {
                    if (lengths[i] > min) {
                        const val = lengths[i];
                        // Only decrement if we have more than one row with this length
                        // to ensure at least one remains for the "every length" requirement
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

        // Final shuffle so the row order is random
        lengths.sort(() => Math.random() - 0.5);

        const newGrid = createInitialGrid();
        for (let ri = 0; ri < n; ri++) {
            newGrid[ri] = generateRandomRow(lengths[ri]);
        }
        setGrid(newGrid);
    }, [minDigit, maxDigit, rowCount, targetTotalDigits, generateRandomRow]);

    return {
        grid: grid.slice(0, rowCount), // Only expose active rows
        minDigit,
        maxDigit,
        targetTotalDigits,
        rowCount,
        setMinDigit,
        setMaxDigit,
        setTargetTotalDigits,
        setRowCount,
        updateDigit,
        updateRowDigitCount,
        generateRandomGrid,
        totalSum: stats.totalSum,
        frequency: stats.frequency,
        totalFrequency: stats.totalFrequency,
        consecutive: stats.consecutive,
        rowDigitCounts: stats.rowDigitCounts,
        totalRowDigits: stats.totalRowDigits
    };
};
