import { generateProblemGrid } from './src/utils/problemGenerator.js';
import { generateMultiplicationProblems } from './src/utils/multiplicationGenerator.js';
import { calculateProblemStats } from './src/utils/problemValidator.js';
import { calculateMultiplicationStats } from './src/utils/multiplicationValidator.js';
import { createInitialProblemState } from './src/constants/initialState.js';

console.log("=== アプリケーションロジックテスト開始 ===");

try {
    console.log("\n[1] 見取り算 問題生成テスト (通常設定)");
    const mitorizanStart = performance.now();
    const mitorizanConfig = createInitialProblemState();
    
    // エッジケースの条件を少し付与（マイナス行あり、特定の数字の増減あり）
    mitorizanConfig.isMinusAllowed = true;
    mitorizanConfig.conditions = {
        firstRowFirstDigit: 1, firstRowLastDigit: 9,
        lastRowFirstDigit: 1, lastRowLastDigit: 9,
        answerFirstDigit: 1, answerLastDigit: 9,
        plusOneDigit: 5, minusOneDigit: 3
    };
    
    const { grid, isMinusRows } = generateProblemGrid({
        rowCount: mitorizanConfig.rowCount,
        minDigit: mitorizanConfig.minDigit,
        maxDigit: mitorizanConfig.maxDigit,
        targetTotalDigits: mitorizanConfig.targetTotalDigits,
        isMinusAllowed: mitorizanConfig.isMinusAllowed,
        conditions: mitorizanConfig.conditions
    });
    const mitorizanTime = performance.now() - mitorizanStart;
    
    console.log(`生成完了: 所要時間 ${mitorizanTime.toFixed(2)}ms`);
    console.log(`マイナス行数: ${isMinusRows.filter(v => v).length}行 / ${mitorizanConfig.rowCount}行`);
    
    console.log("\n[2] 見取り算 統計情報テスト");
    const mitorizanStats = calculateProblemStats(grid, isMinusRows, mitorizanConfig.rowCount, mitorizanConfig.targetTotalDigits, mitorizanConfig.conditions);
    console.log(`合計値: ${mitorizanStats.totalSum}`);
    console.log(`実際の合計桁数: ${mitorizanStats.totalRowDigits} (目標: ${mitorizanConfig.targetTotalDigits})`);
    
    console.log("\n[3] 掛け算 問題生成テスト (エッジケース含むランダム生成)");
    const multiStart = performance.now();
    const multiProblems = generateMultiplicationProblems();
    const multiTime = performance.now() - multiStart;
    
    console.log(`生成完了: 所要時間 ${multiTime.toFixed(2)}ms`);
    console.log(`生成された問題数: ${multiProblems.length}問`);
    
    console.log("\n[4] 掛け算 統計情報テスト");
    const multiStats = calculateMultiplicationStats(multiProblems);
    console.log(`左辺全体桁数: ${multiStats.totalRowDigitsLeft}, 右辺全体桁数: ${multiStats.totalRowDigitsRight}`);
    
    console.log("\n=== テスト成功 ===");
} catch (error) {
    console.error("\n[エラー発生] テスト中に例外が発生しました:");
    console.error(error);
}
