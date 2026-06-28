import { createInitialDivisionState } from '../constants/initialState.js';

/**
 * 特定の問題の要素（割られる数、割る数、答え）の数字を指定された桁数で再生成します。
 * @param {Object} currentProblem - 現在の問題データ
 * @param {string} field - 'dividend', 'divisor', または 'answer'
 * @param {number|string} length - 桁数、または 'R'
 * @returns {Object} 更新された問題データ
 */
export const regenerateDivisionRow = (currentProblem, field, length) => {
    const updatedProblem = { ...currentProblem };
    
    let finalLength = length;
    if (length === 'R') {
        finalLength = Math.floor(Math.random() * 4) + 4; // 4〜7桁 (divisor/answerの場合)
        if (field === 'dividend') {
            finalLength = Math.floor(Math.random() * 7) + 8; // 8〜14桁
        }
    }

    // 0〜9の重複しない数字を生成
    const digitsPool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digitsPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digitsPool[i], digitsPool[j]] = [digitsPool[j], digitsPool[i]];
    }
    const newDigits = digitsPool.slice(0, finalLength > 10 ? 10 : finalLength);
    
    // 足りない分はランダムで補充
    while (newDigits.length < finalLength) {
        newDigits.push(Math.floor(Math.random() * 10));
    }

    // 先頭の数字が0にならないようにする
    if (newDigits[0] === 0) {
        if (newDigits.length > 1) {
            [newDigits[0], newDigits[1]] = [newDigits[1], newDigits[0]];
        } else {
            newDigits[0] = Math.floor(Math.random() * 9) + 1;
        }
    }

    // 右詰めで配列にセット
    const maxLength = field === 'dividend' ? 14 : 7;
    const newArray = Array(maxLength).fill(null);
    const startIndex = maxLength - finalLength;
    for (let k = 0; k < finalLength; k++) {
        newArray[startIndex + k] = newDigits[k];
    }

    updatedProblem[field] = newArray;

    // 小数点はリセット
    const decimalKey = 'decimal' + field.charAt(0).toUpperCase() + field.slice(1);
    updatedProblem[decimalKey] = null;

    return updatedProblem;
};

/**
 * 除算の問題をランダムに一括生成します。
 * 乗算の制約（割る数と答えが各4〜7桁、合計10〜12桁、合計55桁）を適用し、
 * 四捨五入する問題（切り上げ2問、切り下げ2問）を生成します。
 * @returns {Array<Object>} 生成された10問の問題配列
 */
export const generateDivisionProblems = () => {
    // 1. 各行の桁数を決定（割る数と答えがそれぞれ合計55桁になるように、各問は合計10〜12桁）
    let countsA, countsB; // A=割る数, B=答え
    let countAttempts = 0;

    while (countAttempts < 1000) {
        countAttempts++;

        const generateCounts = () => {
            let array = Array(10).fill(0).map(() => Math.floor(Math.random() * 4) + 4); // 4-7桁
            let sum = array.reduce((a, b) => a + b, 0);
            let safety = 0;
            
            while (sum !== 55 && safety < 100) {
                safety++;
                const index = Math.floor(Math.random() * 10);
                if (sum < 55 && array[index] < 7) {
                    array[index]++;
                    sum++;
                } else if (sum > 55 && array[index] > 4) {
                    array[index]--;
                    sum--;
                }
            }
            return (sum === 55) ? array : null;
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
        console.error("除算の桁数の生成に失敗しました");
        return Array(10).fill(null).map(() => createInitialDivisionState());
    }

    // 2. 数字プールの作成
    const possibleDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = possibleDigits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleDigits[i], possibleDigits[j]] = [possibleDigits[j], possibleDigits[i]];
    }

    const poolA_Base = [];
    const usedCounts = Array(10).fill(0);

    for (let i = 0; i < 10; i++) {
        const digit = possibleDigits[i];
        const count = (i < 5) ? 6 : 5;
        usedCounts[digit] += count;
        for (let k = 0; k < count; k++) poolA_Base.push(digit);
    }

    const poolB_Base = [];
    for (let digit = 0; digit <= 9; digit++) {
        const remaining = 11 - usedCounts[digit];
        for (let k = 0; k < remaining; k++) poolB_Base.push(digit);
    }

    // 3. 最初の桁と最後の桁の制約を適用しつつ数値を割り当て
    const setupSide = (counts, basePool) => {
        const rows = counts.map(len => ({ len, digits: Array(len).fill(null) }));

        const takeFromPool = (pool, val) => {
            const idx = pool.indexOf(val);
            if (idx !== -1) {
                pool.splice(idx, 1);
                return val;
            }
            return null;
        };

        // 末尾の数字は0-9を必ず1回ずつ使用
        const lastDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = lastDigits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lastDigits[i], lastDigits[j]] = [lastDigits[j], lastDigits[i]];
        }

        for (let i = 0; i < 10; i++) {
            rows[i].digits[rows[i].len - 1] = takeFromPool(basePool, lastDigits[i]);
        }

        // 残りの桁を埋める
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < rows[i].len - 1; j++) {
                // 先頭が0にならないようにする
                if (j === 0) {
                    let nonZeroIdx = basePool.findIndex(v => v !== 0);
                    if (nonZeroIdx !== -1 && !rows[i].digits.includes(basePool[nonZeroIdx])) {
                        rows[i].digits[0] = takeFromPool(basePool, basePool[nonZeroIdx]);
                        continue;
                    }
                }
                
                // 重複しないように選ぶ
                for (let p = 0; p < basePool.length; p++) {
                    if (!rows[i].digits.includes(basePool[p])) {
                        rows[i].digits[j] = takeFromPool(basePool, basePool[p]);
                        break;
                    }
                }
                
                // 万が一重複回避できなかったら適当なものを取る
                if (rows[i].digits[j] === null && basePool.length > 0) {
                    rows[i].digits[j] = basePool.shift();
                }
            }
        }
        return rows;
    };

    const poolA = [...poolA_Base];
    const poolB = [...poolB_Base];

    // シャッフル
    for (let i = poolA.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolA[i], poolA[j]] = [poolA[j], poolA[i]];
    }
    for (let i = poolB.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [poolB[i], poolB[j]] = [poolB[j], poolB[i]];
    }

    const divisorRows = setupSide(countsA, poolA); // 割る数
    const answerRows = setupSide(countsB, poolB);  // 答え

    // 4. 四捨五入の問題を設定（切り上げ2問、切り下げ2問）
    const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const roundUpIndices = indices.slice(0, 2);
    const roundDownIndices = indices.slice(2, 4);

    const problems = [];
    for (let i = 0; i < 10; i++) {
        const prob = createInitialDivisionState();

        // --- 割る数 (Divisor) ---
        const dLen = divisorRows[i].len;
        const dStartIndex = 7 - dLen;
        let divisorValStr = "";
        for (let j = 0; j < dLen; j++) {
            const digit = divisorRows[i].digits[j];
            prob.divisor[dStartIndex + j] = digit;
            divisorValStr += digit;
        }
        
        let divisorVal = parseInt(divisorValStr, 10);
        
        // 割る数に30%の確率で小数点を付与
        if (Math.random() < 0.3) {
            const k = Math.floor(Math.random() * (dLen - 1));
            prob.decimalDivisor = dStartIndex + k; // 例: [null, 1, 2, 3, 4, null, null], k=1なら decimalDivisor = 2 (2の直後)
            
            // 小数点の位置に応じて値を調整
            // 例: "1234" で k=1 の場合 "12.34" となり、本来の値は 12.34。
            const decimalShift = dLen - 1 - k;
            divisorVal = divisorVal / Math.pow(10, decimalShift);
        }

        // --- 答え (Answer) ---
        const aLen = answerRows[i].len;
        const aStartIndex = 7 - aLen;
        let answerValStr = "";
        for (let j = 0; j < aLen; j++) {
            const digit = answerRows[i].digits[j];
            prob.answer[aStartIndex + j] = digit;
            answerValStr += digit;
        }
        let answerVal = parseInt(answerValStr, 10);

        // --- 割られる数 (Dividend) の計算 ---
        let dividendVal = 0;
        
        if (roundUpIndices.includes(i)) {
            // 切り上げ（例: 答えが123なら、本来の答えは122.5〜122.9）
            const remainderRatio = 0.5 + (Math.random() * 0.4); // 0.5 - 0.9
            const remainder = divisorVal * remainderRatio;
            dividendVal = (divisorVal * (answerVal - 1)) + remainder;
        } else if (roundDownIndices.includes(i)) {
            // 切り下げ（例: 答えが123なら、本来の答えは123.1〜123.4）
            const remainderRatio = 0.1 + (Math.random() * 0.3); // 0.1 - 0.4
            const remainder = divisorVal * remainderRatio;
            dividendVal = (divisorVal * answerVal) + remainder;
        } else {
            // 割り切れる
            dividendVal = divisorVal * answerVal;
        }

        // JavaScriptの浮動小数点誤差を軽減するため、特定の桁で丸める
        let divStr = dividendVal.toFixed(6).replace(/\.?0+$/, ""); 
        
        // divStr が長すぎる場合（最大14マス）、切り詰める
        if (divStr.replace(".", "").length > 14) {
            divStr = parseFloat(divStr).toPrecision(14).replace(/\.?0+e.*$/, "");
        }

        // 割られる数の配列にセット
        const hasDivDecimal = divStr.includes('.');
        const divDigitsStr = divStr.replace('.', '');
        const divOffset = 14 - divDigitsStr.length;
        
        for (let j = 0; j < divDigitsStr.length; j++) {
            if (divOffset + j >= 0 && divOffset + j < 14) {
                prob.dividend[divOffset + j] = parseInt(divDigitsStr[j], 10);
            }
        }

        if (hasDivDecimal) {
            const dotPos = divStr.indexOf('.');
            prob.decimalDividend = divOffset + dotPos - 1;
        }

        problems.push(prob);
    }

    return problems;
};
