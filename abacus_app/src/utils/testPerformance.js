import { generateMultiplicationProblems } from './multiplicationGenerator.js';
import { generateDivisionProblems } from './divisionGenerator.js';

console.log("Testing Multiplication Generation...");
let start = Date.now();
let problems = generateMultiplicationProblems();
console.log(`Multiplication generation took ${Date.now() - start}ms`);

console.log("Testing Division Generation...");
start = Date.now();
problems = generateDivisionProblems();
console.log(`Division generation took ${Date.now() - start}ms`);
