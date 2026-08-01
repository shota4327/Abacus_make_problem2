/**
 * @file initialState.js
 * @description アプリケーション全体で利用する盤面サイズ定数および各種問題（見取り算・掛け算・割り算）の初期状態生成関数を定義します。
 */

/** 割り算のグリッド桁数定数 */
export const MAX_DIVIDEND_LENGTH = 12;
export const MAX_DIVISOR_LENGTH = 7;
export const MAX_ANSWER_LENGTH = 7;

/** 見取り算のグリッド行数（口数 maximum） */
export const ROW_COUNT = 20;

/** 見取り算のグリッド列数（最大桁数 maximum） */
export const COL_COUNT = 13;

/**
 * 見取り算用の空の盤面（Grid: 20行×13列）を生成します。
 * 各セルは数字(0-9)または未入力(null)を保持します。
 * 
 * @returns {Array<Array<number|null>>} ROW_COUNT × COL_COUNT の2次元配列
 */
export const createInitialGrid = () => {
    return Array(ROW_COUNT).fill(null).map(() => Array(COL_COUNT).fill(null));
};

/**
 * 1問分の見取り算問題設定・盤面データをまとめた初期状態オブジェクトを生成します。
 * 
 * @returns {Object} 見取り算の初期状態オブジェクト
 * @returns {Array<Array<number|null>>} return.grid - 20x13の数値グリッド
 * @returns {boolean[]} return.isMinusRows - 各行が引き算（マイナス）であるかのフラグ配列
 * @returns {boolean} return.isMinusAllowed - マイナスの行（引き算）を生成時に許可するかどうか
 * @returns {number} return.minDigit - 1口あたりの最小桁数
 * @returns {number} return.maxDigit - 1口あたりの最大桁数
 * @returns {number} return.targetTotalDigits - 問題全体の目標合計桁数
 * @returns {number} return.rowCount - 有効な行数（口数）
 * @returns {number|null} return.plusOneDigit - 出現頻度を1回増やしたい特定の数字 (0-9)
 * @returns {number|null} return.minusOneDigit - 出現頻度を1回減らしたい特定の数字 (0-9)
 * @returns {number|null} return.enclosedDigit - 包み（両隣が同じ数字）の対象数字
 * @returns {number|null} return.sandwichedDigit - 挟み（同じ数字で挟まれた中央の数字）の対象数字
 * @returns {number|null} return.consecutiveDigit - 連続（同数字の2連続）の対象数字
 * @returns {number|null} return.firstRowFirstDigit - 1口目の最上位桁（先頭数字）の指定
 * @returns {number|null} return.firstRowLastDigit - 1口目の最下位桁（末尾数字）の指定
 * @returns {number|null} return.lastRowFirstDigit - 最終口の最上位桁（先頭数字）の指定
 * @returns {number|null} return.lastRowLastDigit - 最終口の最下位桁（末尾数字）の指定
 * @returns {number|null} return.answerFirstDigit - 計算結果（答え）の最上位桁の指定
 * @returns {number|null} return.answerLastDigit - 計算結果（答え）の最下位桁の指定
 * @returns {boolean} return.hasMinus - マイナス計算が含まれているかどうかのフラグ
 * @returns {boolean} return.complementStatus - 繰り上がり/繰り下がり等の補数計算が含まれているかのフラグ
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
    enclosedDigit: null,                       // 包み（両隣が同数字）の対象数字
    sandwichedDigit: null,                     // 挟み（同数字で挟まれた中央）の対象数字
    consecutiveDigit: null,                    // 連続（同数字が2つ並ぶ）の対象数字
    
    // 特定の行や答えに対する制約
    firstRowFirstDigit: null,                  // 1口目の先頭の数字
    firstRowLastDigit: null,                   // 1口目の末尾の数字
    lastRowFirstDigit: null,                   // 最終口の先頭の数字
    lastRowLastDigit: null,                    // 最終口の末尾の数字
    answerFirstDigit: null,                    // 答えの先頭の数字
    answerLastDigit: null,                     // 答えの末尾の数字
    
    hasMinus: false,                           // マイナス計算を含むかどうかの判定フラグ
    complementStatus: false                    // 補数計算のステータス
});

/**
 * 1問分の掛け算問題の初期状態オブジェクトを生成します。
 * 
 * @returns {Object} 掛け算の初期状態
 * @returns {Array<number|null>} return.left - 被乗数（かけられる数、最大7桁、右詰め配列）
 * @returns {Array<number|null>} return.right - 乗数（かける数、最大7桁、右詰め配列）
 * @returns {number|null} return.decimalLeft - 被乗数の小数点位置（0-6のインデックス、無ければnull）
 * @returns {number|null} return.decimalRight - 乗数の小数点位置（0-6のインデックス、無ければnull）
 */
export const createInitialMultiplicationState = () => ({
    left: Array(7).fill(null),   // かけられる数（最大7桁、右詰め）
    right: Array(7).fill(null),  // かける数（最大7桁、右詰め）
    decimalLeft: null,           // 左辺の小数点のインデックス（0-6）、ない場合は null
    decimalRight: null           // 右辺の小数点のインデックス（0-6）、ない場合は null
});

/**
 * 1問分の割り算問題の初期状態オブジェクトを生成します。
 * 
 * @returns {Object} 割り算の初期状態
 * @returns {Array<number|null>} return.dividend - 被除数（割られる数、最大12桁、右詰め配列）
 * @returns {Array<number|null>} return.divisor - 除数（割る数、最大7桁、右詰め配列）
 * @returns {Array<number|null>} return.answer - 商（答え、最大7桁、右詰め配列）
 * @returns {number|null} return.decimalDividend - 被除数の小数点位置（0-11）
 * @returns {number|null} return.decimalDivisor - 除数の小数点位置（0-6）
 * @returns {number|null} return.decimalAnswer - 商（答え）の小数点位置（0-6）
 */
export const createInitialDivisionState = () => ({
    dividend: Array(MAX_DIVIDEND_LENGTH).fill(null), // 割られる数（最大12桁、右詰め）
    divisor: Array(MAX_DIVISOR_LENGTH).fill(null),   // 割る数（最大7桁、右詰め）
    answer: Array(MAX_ANSWER_LENGTH).fill(null),    // 答え（最大7桁、右詰め）
    decimalDividend: null,          // 割られる数の小数点のインデックス（0-11）
    decimalDivisor: null,           // 割る数の小数点のインデックス（0-6）
    decimalAnswer: null             // 答えの小数点のインデックス（0-6）
});
