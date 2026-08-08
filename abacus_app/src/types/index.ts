/**
 * 珠算作問アプリケーション (abacus_app) 共通型定義
 */

// ==========================================
// 1. 基本型・タブ識別子
// ==========================================

/**
 * アプリケーションのタブ種別
 * 数値(0-9): 見取り算の各問題タブ (第1問〜第10問)
 * 'multiplication': 掛け算タブ
 * 'division': 割り算タブ
 * 'manager': 作問条件一括管理タブ
 */
export type TabType = number | 'multiplication' | 'division' | 'manager';

/**
 * 見取り算盤面の単一セル値 (0-9の数字またはnull)
 */
export type GridCell = number | null;

/**
 * 見取り算盤面グリッド (行 × 列の2次元配列)
 */
export type Grid = GridCell[][];

// ==========================================
// 2. 見取り算 (Mitorizan) 関連型定義
// ==========================================

/**
 * 見取り算の作問条件インターフェース
 */
export interface ProblemConditions {
  /** +1の文字指定 (0-9またはnull) */
  plusOneDigit: number | null;
  /** -1の文字指定 (0-9またはnull) */
  minusOneDigit: number | null;
  /** 挟み数字指定 (0-9またはnull) */
  enclosedDigit: number | null;
  /** 挟まれ数字指定 (0-9またはnull) */
  sandwichedDigit: number | null;
  /** 連続数字指定 (0-9またはnull) */
  consecutiveDigit: number | null;
  /** 初口先頭桁数字 (1-9またはnull) */
  firstRowFirstDigit: number | null;
  /** 初口末尾桁数字 (0-9またはnull) */
  firstRowLastDigit: number | null;
  /** 最終口先頭桁数字 (1-9またはnull) */
  lastRowFirstDigit: number | null;
  /** 最終口末尾桁数字 (0-9またはnull) */
  lastRowLastDigit: number | null;
  /** 答え先頭桁数字 (1-9またはnull) */
  answerFirstDigit: number | null;
  /** 答え末尾桁数字 (0-9またはnull) */
  answerLastDigit: number | null;
}

/**
 * 単一見取り算問題の完全な状態インターフェース
 */
export interface ProblemState extends ProblemConditions {
  /** 盤面データ (20行×13列) */
  grid: Grid;
  /** 行ごとのマイナス符号フラグ配列 */
  isMinusRows: boolean[];
  /** マイナス行の使用を許可するかどうか */
  isMinusAllowed: boolean;
  /** 最少桁数 (例: 3) */
  minDigit: number;
  /** 最大桁数 (例: 6) */
  maxDigit: number;
  /** 目標総字数 (例: 110) */
  targetTotalDigits: number;
  /** 口数 (行数、例: 20) */
  rowCount: number;
  /** マイナス行が含まれているか */
  hasMinus: boolean;
  /** 補数計算フラグ */
  complementStatus: boolean;

  // --- バリデーション評価結果フラグ ---
  /** 挟み数字条件充足フラグ */
  isEnclosedUsed?: boolean;
  /** 挟まれ数字条件充足フラグ */
  isSandwichedUsed?: boolean;
  /** 連続数字条件充足フラグ */
  isConsecutiveUsed?: boolean;
  /** 初口先頭桁条件妥当性フラグ */
  isFirstMinValid?: boolean;
  /** 初口末尾桁条件妥当性フラグ */
  isFirstMaxValid?: boolean;
  /** 最終口先頭桁条件妥当性フラグ */
  isLastMinValid?: boolean;
  /** 最終口末尾桁条件妥当性フラグ */
  isLastMaxValid?: boolean;
  /** 答え先頭桁条件妥当性フラグ */
  isAnsMinValid?: boolean;
  /** 答え末尾桁条件妥当性フラグ */
  isAnsMaxValid?: boolean;
  /** マイナス条件妥当性フラグ */
  isMinusValid?: boolean;
  /** 補数条件妥当性フラグ */
  isComplementValid?: boolean;
}

/**
 * 見取り算問題の統計情報インターフェース
 */
export interface ProblemStats {
  /** 問題の合計値 */
  totalSum: number;
  /** 行別・数字別(0-9)の出現頻度マトリクス */
  frequency: number[][];
  /** 数字別(0-9)の合計出現頻度 */
  totalFrequency: number[];
  /** 目標頻度からの過不足差分 */
  frequencyDiffs: number[];
  /** 2桁連続数字の遷移マトリクス (10x10) */
  consecutive: number[][];
  /** 各行の桁数リスト */
  rowDigitCounts: number[];
  /** 全行の合計桁数 */
  totalRowDigits: number;
  /** 補数状態文字列 */
  complementStatus: string;
  /** 挟み数字条件充足フラグ */
  isEnclosedUsed: boolean;
  /** 挟まれ数字条件充足フラグ */
  isSandwichedUsed: boolean;
  /** 連続数字条件充足フラグ */
  isConsecutiveUsed: boolean;
  /** 初口先頭桁妥当性 */
  isFirstMinValid: boolean;
  /** 初口末尾桁妥当性 */
  isFirstMaxValid: boolean;
  /** 最終口先頭桁妥当性 */
  isLastMinValid: boolean;
  /** 最終口末尾桁妥当性 */
  isLastMaxValid: boolean;
  /** 答え先頭桁妥当性 */
  isAnsMinValid: boolean;
  /** 答え末尾桁妥当性 */
  isAnsMaxValid: boolean;
}

// ==========================================
// 3. 掛け算 (Multiplication) 関連型定義
// ==========================================

/**
 * 単一掛け算問題の状態インターフェース
 */
export interface MultiplicationProblemState {
  /** 被乗数（左辺）の桁配列 (最大7桁) */
  left: (number | null)[];
  /** 乗数（右辺）の桁配列 (最大7桁) */
  right: (number | null)[];
  /** 被乗数（左辺）の小数点インデックス (0-6、未設定時null) */
  decimalLeft: number | null;
  /** 乗数（右辺）の小数点インデックス (0-6、未設定時null) */
  decimalRight: number | null;
}

/** 掛け算問題データのエイリアス */
export type MultiplicationProblem = MultiplicationProblemState;

/**
 * 掛け算10問全体の統計情報インターフェース
 */
export interface MultiplicationStats {
  /** 全体（左右合算）の行別・数字別(0-9)出現頻度マトリクス */
  frequencyAll: number[][];
  /** 全体（左右合算）の数字別合計出現頻度 */
  totalFrequencyAll: number[];
  /** 全体の行別有効桁数 */
  rowDigitCountsAll: number[];
  /** 全体の合計桁数 */
  totalRowDigitsAll: number;
  /** 全体の頻度過不足差分 */
  frequencyDiffsAll: number[];
  /** 全体の目標総桁数 */
  targetTotalDigitsAll: number;
  /** 被乗数（左辺）の行別・数字別出現頻度 */
  frequencyLeft: number[][];
  /** 被乗数（左辺）の数字別合計出現頻度 */
  totalFrequencyLeft: number[];
  /** 被乗数（左辺）の行別桁数 */
  rowDigitCountsLeft: number[];
  /** 被乗数（左辺）の合計桁数 */
  totalRowDigitsLeft: number;
  /** 乗数（右辺）の行別・数字別出現頻度 */
  frequencyRight: number[][];
  /** 乗数（右辺）の数字別合計出現頻度 */
  totalFrequencyRight: number[];
  /** 乗数（右辺）の行別桁数 */
  rowDigitCountsRight: number[];
  /** 乗数（右辺）の合計桁数 */
  totalRowDigitsRight: number;
  /** 2桁連続数字の遷移マトリクス (10x10) */
  consecutive: number[][];
}

// ==========================================
// 4. 割り算 (Division) 関連型定義
// ==========================================

/**
 * 単一割り算問題の状態インターフェース
 */
export interface DivisionProblemState {
  /** 割られる数 (Dividend) の桁配列 (最大12桁) */
  dividend: (number | null)[];
  /** 割る数 (Divisor) の桁配列 (最大7桁) */
  divisor: (number | null)[];
  /** 商/答え (Answer) の桁配列 (最大7桁) */
  answer: (number | null)[];
  /** 割られる数の小数点インデックス (0-11、未設定時null) */
  decimalDividend: number | null;
  /** 割る数の小数点インデックス (0-6、未設定時null) */
  decimalDivisor: number | null;
  /** 商/答えの小数点インデックス (0-6、未設定時null) */
  decimalAnswer: number | null;
  /** 端数処理種別 ('up': 切り上げ, 'down': 切り捨て, 'int': 整数) */
  roundType?: 'up' | 'down' | 'int';
}

/** 割り算問題データのエイリアス */
export type DivisionProblem = DivisionProblemState;

/**
 * 割り算10問全体の統計情報インターフェース
 */
export interface DivisionStats {
  /** 全体（割る数＋答え合算）の行別・数字別(0-9)出現頻度マトリクス */
  frequencyAll: number[][];
  /** 全体（割る数＋答え合算）の数字別合計出現頻度 */
  totalFrequencyAll: number[];
  /** 全体の行別有効桁数 */
  rowDigitCountsAll: number[];
  /** 全体の合計桁数 */
  totalRowDigitsAll: number;
  /** 全体の頻度過不足差分 */
  frequencyDiffsAll: number[];
  /** 全体の目標総桁数 */
  targetTotalDigitsAll: number;
  /** 割る数の行別・数字別出現頻度 */
  frequencyDivisor: number[][];
  /** 割る数の数字別合計出現頻度 */
  totalFrequencyDivisor: number[];
  /** 割る数の行別桁数 */
  rowDigitCountsDivisor: number[];
  /** 割る数の合計桁数 */
  totalRowDigitsDivisor: number;
  /** 答え/商の行別・数字別出現頻度 */
  frequencyAnswer: number[][];
  /** 答え/商の数字別合計出現頻度 */
  totalFrequencyAnswer: number[];
  /** 答え/商の行別桁数 */
  rowDigitCountsAnswer: number[];
  /** 答え/商の合計桁数 */
  totalRowDigitsAnswer: number;
  /** 2桁連続数字の遷移マトリクス (10x10) */
  consecutive: number[][];
}

// ==========================================
// 5. Web Worker 通信型定義
// ==========================================

/**
 * Web Worker への生成リクエストメッセージ
 */
export interface WorkerRequest {
  type: 'GENERATE';
}

/**
 * Web Worker からのレスポンスメッセージ
 */
export type WorkerResponse =
  | { type: 'SUCCESS'; payload: DivisionProblemState[] }
  | { type: 'ERROR'; payload: { message: string; stack?: string | null } };

// ==========================================
// 6. UIセル位置・選択状態型定義
// ==========================================

/** 見取り算の選択セル位置 */
export interface MitorizanCellPosition {
  row: number;
  col: number;
}

/** 掛け算の選択セル位置 */
export interface MultiplicationCellPosition {
  problemIndex: number;
  side: 'left' | 'right';
  colIndex: number;
}

/** 割り算の選択セル位置 */
export interface DivisionCellPosition {
  problemIndex: number;
  field: 'dividend' | 'divisor' | 'answer';
  colIndex: number;
}

/** 条件マネージャーの選択位置 */
export interface ConditionManagerSelector {
  problemIndex: number;
  key: string;
}

/** セル位置の統合型 */
export type CellPosition =
  | MitorizanCellPosition
  | MultiplicationCellPosition
  | DivisionCellPosition;

// ==========================================
// 7. React コンポーネント Props インターフェース
// ==========================================

/** Sidebar コンポーネントの Props */
export interface SidebarProps {
  /** 現在アクティブなタブ */
  currentTab: TabType;
  /** タブ切り替えイベントハンドラー */
  onTabChange: (tabKey: TabType) => void;
}

/** ProblemGrid (見取り算) コンポーネントの Props */
export interface ProblemGridProps {
  /** 盤面データ (20行×13列) */
  grid: Grid;
  /** セル数値更新ハンドラー */
  updateDigit: (rowIndex: number, colIndex: number, value: number | null) => void;
  /** 口数 (行数) */
  rowCount: number;
  /** 行ごとのマイナス符号フラグ */
  isMinusRows: boolean[];
  /** 行マイナス符号切り替えハンドラー */
  toggleRowMinus: (rowIndex: number) => void;
  /** 合計計算値 */
  totalSum: number;
  /** ランダム盤面生成ハンドラー */
  generateRandomGrid: () => void;
  /** ページ（問題）番号 */
  pageIndex: number;
  /** CSVインポートなどによる状態一括更新ハンドラー */
  importState: (newState: Partial<ProblemState>) => void;
  /** 現在の作問条件 */
  currentConditions: ProblemState;
}

/** ConditionPanel (見取り算作問条件) コンポーネントの Props */
export interface ConditionPanelProps {
  /** パネルタイトル (オプション) */
  title?: string;
  /** 最少桁数 */
  minDigit: number;
  /** 最大桁数 */
  maxDigit: number;
  /** 最少桁数変更ハンドラー */
  setMinDigit: (val: number) => void;
  /** 最大桁数変更ハンドラー */
  setMaxDigit: (val: number) => void;
  /** 目標総字数 */
  targetTotalDigits: number;
  /** 目標総字数変更ハンドラー */
  setTargetTotalDigits: (val: number) => void;
  /** 口数 (行数) */
  rowCount: number;
  /** 口数変更ハンドラー */
  setRowCount: (val: number) => void;

  /** +1の文字指定 */
  plusOneDigit: number | null;
  setPlusOneDigit: (val: number | null) => void;
  /** -1の文字指定 */
  minusOneDigit: number | null;
  setMinusOneDigit: (val: number | null) => void;
  /** 挟み数字指定 */
  enclosedDigit: number | null;
  setEnclosedDigit: (val: number | null) => void;
  /** 挟まれ数字指定 */
  sandwichedDigit: number | null;
  setSandwichedDigit: (val: number | null) => void;
  /** 連続数字指定 */
  consecutiveDigit: number | null;
  setConsecutiveDigit: (val: number | null) => void;

  /** 初口先頭桁指定 */
  firstRowFirstDigit: number | null;
  setFirstRowMin: (val: number | null) => void;
  /** 初口末尾桁指定 */
  firstRowLastDigit: number | null;
  setFirstRowMax: (val: number | null) => void;
  /** 最終口先頭桁指定 */
  lastRowFirstDigit: number | null;
  setLastRowMin: (val: number | null) => void;
  /** 最終口末尾桁指定 */
  lastRowLastDigit: number | null;
  setLastRowMax: (val: number | null) => void;
  /** 答え先頭桁指定 */
  answerFirstDigit: number | null;
  setAnswerMin: (val: number | null) => void;
  /** 答え末尾桁指定 */
  answerLastDigit: number | null;
  setAnswerMax: (val: number | null) => void;

  /** マイナス行使用有無 */
  hasMinus: boolean;
  setHasMinus: (val: boolean) => void;
  /** 補数計算フラグ */
  complementStatus: boolean;
  setComplementStatus: (val: boolean) => void;

  // --- バリデーション評価フラグ (オプション) ---
  isMinusValid?: boolean;
  isComplementValid?: boolean;
  isEnclosedUsed?: boolean;
  isSandwichedUsed?: boolean;
  isConsecutiveUsed?: boolean;
  isFirstMinValid?: boolean;
  isFirstMaxValid?: boolean;
  isLastMinValid?: boolean;
  isLastMaxValid?: boolean;
  isAnsMinValid?: boolean;
  isAnsMaxValid?: boolean;
}

/** ConditionManager (全10問条件管理) コンポーネントの Props */
export interface ConditionManagerProps {
  /** 全10問の見取り算状態リスト */
  problems: ProblemState[];
  /** 指定問題の状態更新ハンドラー */
  onUpdate: (index: number, newState: ProblemState) => void;
}

/** MultiplicationGrid (掛け算) コンポーネントの Props */
export interface MultiplicationGridProps {
  /** 10問の掛け算問題データ */
  problems: MultiplicationProblemState[];
  /** セル数値更新ハンドラー */
  updateDigit: (
    problemIndex: number,
    side: 'left' | 'right',
    colIndex: number,
    value: number | null
  ) => void;
  /** 小数点切り替えハンドラー */
  toggleDecimal: (
    problemIndex: number,
    side: 'left' | 'right',
    colIndex: number
  ) => void;
  /** 全10問ランダム再生成ハンドラー */
  generateRandomProblems: () => void;
  /** CSVインポートなどによる全10問置き換えハンドラー */
  replaceProblems: (newProblems: MultiplicationProblemState[]) => void;
}

/** DivisionGrid (割り算) コンポーネントの Props */
export interface DivisionGridProps {
  /** 10問の割り算問題データ */
  problems: DivisionProblemState[];
  /** セル数値更新ハンドラー */
  updateDigit: (
    problemIndex: number,
    field: 'dividend' | 'divisor' | 'answer',
    colIndex: number,
    value: number | null
  ) => void;
  /** 小数点切り替えハンドラー */
  toggleDecimal: (
    problemIndex: number,
    field: 'dividend' | 'divisor' | 'answer',
    colIndex: number
  ) => void;
  /** 全10問ランダム再生成ハンドラー */
  generateRandomProblems: () => void;
  /** CSVインポートなどによる全10問置き換えハンドラー */
  replaceProblems: (newProblems: DivisionProblemState[]) => void;
}

/** FrequencyCounter (共通数字出現頻度) コンポーネントの Props */
export interface FrequencyCounterProps {
  /** 行別・数字別(0-9)出現頻度マトリクス */
  frequency: number[][];
  /** 数字別合計出現頻度 */
  totalFrequency: number[];
  /** 頻度過不足差分 */
  frequencyDiffs?: number[];
  /** 各行の有効桁数 */
  rowDigitCounts: number[];
  /** 全行の合計桁数 */
  totalRowDigits: number;
  /** 目標総桁数 */
  targetTotalDigits?: number;
  /** 行桁数変更ハンドラー */
  updateRowDigitCount: (rowIndex: number, length: number) => void;
  /** 最少桁数 */
  minDigit?: number;
  /** 最大桁数 */
  maxDigit?: number;
  /** テーブルタイトル */
  title?: string;
  /** 桁数変更を読み取り専用にするか */
  readOnlyDigitCount?: boolean;
  /** 警告閾値 */
  warnThreshold?: number;
}

/** DivisionFrequencyCounter (割り算用出現頻度) コンポーネントの Props */
export interface DivisionFrequencyCounterProps extends FrequencyCounterProps {
  /** パネル囲みフレームを出力しないフラグ */
  noPanel?: boolean;
  /** No.カラムを非表示にするフラグ */
  hideNoColumn?: boolean;
}

/** ConsecutiveCounter (2桁連続数字マトリクス) コンポーネントの Props */
export interface ConsecutiveCounterProps {
  /** 10x10の連続数字ペア遷移マトリクス */
  consecutive: number[][];
}

/** ProblemContainer (見取り算コンテナ) コンポーネントの Props */
export interface ProblemContainerProps {
  /** 問題の初期データ */
  initialData: ProblemState;
  /** 親Appへの状態更新通知コールバック */
  onUpdate: (newState: ProblemState) => void;
  /** ページ（問題）番号 (1-10) */
  pageIndex: number;
}

/** MultiplicationContainer (掛け算コンテナ) コンポーネントの Props */
export interface MultiplicationContainerProps {
  // コンテナへの渡すPropsなし (Hookにより内部状態で完結)
}

/** DivisionContainer (割り算コンテナ) コンポーネントの Props */
export interface DivisionContainerProps {
  // コンテナへの渡すPropsなし (Hookにより内部状態で完結)
}
