import { calculateMultiplicationStats } from './multiplicationValidator.js';

const p1 = {
    left: [null, null, 1, 2, 3, 4, 5],
    right: [null, null, null, 0, 1, 2, 3], // 0.123
    decimalRight: 3
};

const p2 = {
    left: [null, null, 1, 2, 3, 4, 5],
    right: [null, null, 0, 0, 1, 2, 3], // 0.0123
    decimalRight: 3
};

const problems = [p1, p2];

const stats = calculateMultiplicationStats(problems);
console.log("Consecutive 0-0:", stats.consecutive[0][0]);
console.log("Consecutive 0-1:", stats.consecutive[0][1]);
