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
            row[COL_COUNT - 1 - i] = Math.floor(Math.random() * 10);
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
        const consecutive = Array(10).fill(null).map(() => Array(10).fill(0));
        const rowDigitCounts = [];

        grid.forEach(row => {
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
        });

        return {
            totalSum,
            frequency,
            consecutive,
            rowDigitCounts,
            totalRowDigits
        };
    }, [grid]);

    const generateRandomGrid = useCallback(() => {
        setGrid(Array(ROW_COUNT).fill(null).map(() => {
            const length = Math.floor(Math.random() * (maxDigit - minDigit + 1)) + minDigit;
            return generateRandomRow(length);
        }));
    }, [minDigit, maxDigit, generateRandomRow]);

    return {
        grid,
        minDigit,
        maxDigit,
        targetTotalDigits,
        setMinDigit,
        setMaxDigit,
        setTargetTotalDigits,
        updateDigit,
        updateRowDigitCount,
        generateRandomGrid,
        totalSum: stats.totalSum,
        frequency: stats.frequency,
        consecutive: stats.consecutive,
        rowDigitCounts: stats.rowDigitCounts,
        totalRowDigits: stats.totalRowDigits
    };
};
