import { useState, useMemo, useCallback } from 'react';

const ROW_COUNT = 20;
const COL_COUNT = 12;

// Helper to create initial grid (20 rows x 12 cols, initialized to 0)
const createInitialGrid = () => {
    return Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill(0));
};

export const useProblemState = () => {
    const [grid, setGrid] = useState(createInitialGrid);

    // Update a single digit
    const updateDigit = useCallback((rowIndex, colIndex, value) => {
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            newGrid[rowIndex][colIndex] = value;
            return newGrid;
        });
    }, []);

    // Calculate stats
    const stats = useMemo(() => {
        let totalSum = 0;
        const frequency = []; // Array of Arrays [row][digit]
        const consecutive = Array(10).fill(null).map(() => Array(10).fill(0));

        grid.forEach(row => {
            // 1. Calculate Sum
            // Convert row array to number string, treating null/undefined as 0 or strictly
            // Assuming row aligns to 10^11, 10^10... 10^0
            let rowValStr = "";
            let hasStarted = false;

            // For calculation, we construct the number. 
            // Note: If using right alignment, we should carefully map columns to powers of 10.
            // Assuming col 0 is highest digit (10^11) -> col 11 is lowest (10^0).

            let isLeading = true;
            const rowFreq = Array(10).fill(0);
            row.forEach((digit, colIndex) => {
                const d = digit === null ? 0 : digit;

                rowValStr += d;

                if (d !== 0) isLeading = false;
                if (isLeading) return; // Skip stats for leading zeros

                rowFreq[d]++;

                // Consecutive count
                if (colIndex < COL_COUNT - 1) {
                    const nextDigit = row[colIndex + 1] === null ? 0 : row[colIndex + 1];
                    consecutive[d][nextDigit]++;
                }
            });
            frequency.push(rowFreq);

            totalSum += parseInt(rowValStr, 10) || 0;
        });

        return {
            totalSum,
            frequency,
            consecutive
        };
    }, [grid]);

    return {
        grid,
        updateDigit,
        totalSum: stats.totalSum,
        frequency: stats.frequency,
        consecutive: stats.consecutive,
        generateRandomGrid: useCallback((minDigits, maxDigits) => {
            setGrid(Array(ROW_COUNT).fill(null).map(() => {
                const row = Array(COL_COUNT).fill(null);
                // Random length between min and max
                const length = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;

                // Fill from right (index 11) to left
                for (let i = 0; i < length; i++) {
                    row[COL_COUNT - 1 - i] = Math.floor(Math.random() * 10);
                }
                return row;
            }));
        }, [])
    };
};
