/**
 * アプリケーション全体で利用する定数と初期状態を定義します。
 */

// 見取り算の盤面のサイズ定数
export const ROW_COUNT = 20;
export const COL_COUNT = 13;

/**
 * 見取り算用の空の盤面（Grid）を生成します。
 * @returns {Array<Array<number|null>>}
 */
export const createInitialGrid = () => {
    return Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill(null));
};

/**
 * 1問分の見取り算の初期状態を生成します。
 * @returns {Object}
 */
export const createInitialProblemState = () => ({
    grid: createInitialGrid(),
    isMinusRows: Array(ROW_COUNT).fill(false), // 各行がマイナス（引き算）かどうかのフラグ
    isMinusAllowed: false,                     // マイナスの行を許可するかどうか
    minDigit: 5,                               // 最小桁数
    maxDigit: 12,                              // 最大桁数
    targetTotalDigits: 130,                    // 目標とする合計桁数
    rowCount: 20,                              // 有効な行数
    
    // 特定の数字に関する出現条件
    plusOneDigit: null,                        // 出現回数を1回増やす数字
    minusOneDigit: null,                       // 出現回数を1回減らす数字
    enclosedDigit: null,                       // 囲み文字の対象数字
    sandwichedDigit: null,                     // はさまれ文字の対象数字
    consecutiveDigit: null,                    // 連続文字の対象数字
    
    // 特定の行や答えに対する制約
    firstRowFirstDigit: null,                  // 1口目の先頭の数字
    firstRowLastDigit: null,                   // 1口目の末尾の数字
    lastRowFirstDigit: null,                   // 最終口の先頭の数字
    lastRowLastDigit: null,                    // 最終口の末尾の数字
    answerFirstDigit: null,                    // 答えの先頭の数字
    answerLastDigit: null,                     // 答えの末尾の数字
    
    hasMinus: false,                           // マイナスの答えを持つかのフラグ（旧仕様）
    complementStatus: false                    // 補数計算のステータス
});

/**
 * 1問分の掛け算の初期状態を生成します。
 * @returns {Object}
 */
export const createInitialMultiplicationState = () => ({
    left: Array(7).fill(null),   // かけられる数（最大7桁、右詰め）
    right: Array(7).fill(null),  // かける数（最大7桁、右詰め）
    decimalLeft: null,           // 左辺の小数点のインデックス（0-6）、ない場合は null
    decimalRight: null           // 右辺の小数点のインデックス（0-6）、ない場合は null
});
