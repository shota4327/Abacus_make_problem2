/**
 * @file initialState.ts
 * @description アプリケーション全体で利用する盤面サイズ定数および各種問題（見取り算・掛け算・割り算）の初期状態生成関数を定義します。
 */

import {
  Grid,
  ProblemState,
  MultiplicationProblemState,
  DivisionProblemState,
} from '../types';

/** 割り算のグリッド桁数定数 */
export const MAX_DIVIDEND_LENGTH: number = 12;
export const MAX_DIVISOR_LENGTH: number = 7;
export const MAX_ANSWER_LENGTH: number = 7;

/** 見取り算のグリッド行数（口数 maximum） */
export const ROW_COUNT: number = 20;

/** 見取り算のグリッド列数（最大桁数 maximum） */
export const COL_COUNT: number = 13;

/**
 * 見取り算用の空の盤面（Grid: 20行×13列）を生成します。
 * 各セルは数字(0-9)または未入力(null)を保持します。
 * 
 * @returns ROW_COUNT × COL_COUNT の2次元配列
 */
export const createInitialGrid = (): Grid => {
  return Array(ROW_COUNT)
    .fill(null)
    .map(() => Array(COL_COUNT).fill(null));
};

/**
 * 1問分の見取り算問題設定・盤面データをまとめた初期状態オブジェクトを生成します。
 * 
 * @returns 見取り算の初期状態オブジェクト
 */
export const createInitialProblemState = (): ProblemState => ({
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
 * @returns 掛け算の初期状態
 */
export const createInitialMultiplicationState = (): MultiplicationProblemState => ({
  left: Array(7).fill(null),   // かけられる数（最大7桁、右詰め）
  right: Array(7).fill(null),  // かける数（最大7桁、右詰め）
  decimalLeft: null,           // 左辺の小数点のインデックス（0-6）、ない場合は null
  decimalRight: null           // 右辺の小数点のインデックス（0-6）、ない場合は null
});

/**
 * 1問分の割り算問題の初期状態オブジェクトを生成します。
 * 
 * @returns 割り算の初期状態
 */
export const createInitialDivisionState = (): DivisionProblemState => ({
  dividend: Array(MAX_DIVIDEND_LENGTH).fill(null), // 割られる数（最大12桁、右詰め）
  divisor: Array(MAX_DIVISOR_LENGTH).fill(null),   // 割る数（最大7桁、右詰め）
  answer: Array(MAX_ANSWER_LENGTH).fill(null),    // 答え（最大7桁、右詰め）
  decimalDividend: null,          // 割られる数の小数点のインデックス（0-11）
  decimalDivisor: null,           // 割る数の小数点のインデックス（0-6）
  decimalAnswer: null             // 答えの小数点のインデックス（0-6）
});
