# Project: Abacus App TypeScript Migration

## Architecture
本プロジェクトは `c:\Users\kneko\OneDrive\60  ツール\Git\Abacus_make_problem2\abacus_app` 内の React (Vite) アプリケーション全28ファイル（5,721行）を TypeScript (.ts / .tsx) へ完全移行するものです。

- **`abacus_app` (ソースコード)**: React 19, Vite 6, Tailwind CSS アプリケーション。
- **基本方針**:
  1. `src` 配下の全 `.js` / `.jsx` ファイルを `.ts` / `.tsx` に変換し、適切な型定義（Interface/Type）を追加する。
  2. `tsconfig.json` を新規作成し `strict: true` モードを有効化。`any` の使用を極力排除。
  3. `package.json` に `"type-check": "tsc --noEmit"` を追加。
  4. `npm run type-check`（または `npx tsc --noEmit`）で型エラー0件、かつ `npm run build` がエラーなく正常に完了すること。

## Feature Inventory
| # | Feature / Component | Description | Lines | Milestone | Source |
|---|---------------------|-------------|-------|-----------|--------|
| 1 | TS Infrastructure & Types | `tsconfig.json`, `package.json` 更新, `src/types/index.ts` 作成 | - | M1 | Survey |
| 2 | `src/constants/initialState.js` | 盤面サイズ定数・各問題初期状態生成関数 | 115 | M2 | Survey |
| 3 | `src/utils/validatorUtils.js` | かけ算・わり算共通の出現頻度・桁数計算 | 75 | M2 | Survey |
| 4 | `src/utils/problemValidator.js` | 見取り算統計集計・条件評価 | 241 | M2 | Survey |
| 5 | `src/utils/problemGenerator.js` | 見取り算問題盤面(20x13)自動生成アルゴリズム | 679 | M2 | Survey |
| 6 | `src/utils/multiplicationValidator.js` | 掛け算問題統計集計 | 102 | M2 | Survey |
| 7 | `src/utils/multiplicationGenerator.js` | 掛け算問題10問自動生成アルゴリズム | 551 | M2 | Survey |
| 8 | `src/utils/divisionValidator.js` | 割り算問題統計集計 | 90 | M2 | Survey |
| 9 | `src/utils/divisionGenerator.js` | 割り算問題10問自動生成アルゴリズム | 694 | M2 | Survey |
| 10 | `src/utils/testConsecutive.js` | 連続文字検出検証スクリプト | 29 | M2 | Survey |
| 11 | `src/utils/testPerformance.js` | 割り算自動生成パフォーマンス検証スクリプト | 33 | M2 | Survey |
| 12 | `src/workers/divisionWorker.js` | 割り算非同期Web Worker生成処理 | 48 | M2 | Survey |
| 13 | `src/hooks/useProblemState.js` | 見取り算状態管理カスタムフック | 230 | M3 | Survey |
| 14 | `src/hooks/useMultiplicationState.js` | 掛け算状態管理カスタムフック | 113 | M3 | Survey |
| 15 | `src/hooks/useDivisionState.js` | 割り算状態管理カスタムフック | 165 | M3 | Survey |
| 16 | `src/components/Sidebar.jsx` | タブ切替ナビゲーションコンポーネント | 60 | M3 | Survey |
| 17 | `src/components/ConsecutiveCounter.jsx` | 10x10連続数値ペア遷移マトリクス表示 | 72 | M3 | Survey |
| 18 | `src/components/FrequencyCounter.jsx` | 数字別出現頻度・桁数統計表示 | 156 | M3 | Survey |
| 19 | `src/components/DivisionFrequencyCounter.jsx` | 割り算用数字別出現頻度・桁数統計表示 | 156 | M3 | Survey |
| 20 | `src/components/ConditionPanel.jsx` | 見取り算作問条件設定パネル | 321 | M3 | Survey |
| 21 | `src/components/ConditionManager.jsx` | 見取り算10問作問条件一括管理・ランダム生成テーブル | 685 | M3 | Survey |
| 22 | `src/components/ProblemGrid.jsx` | 見取り算(20x13)グリッド入力・CSV入出力 | 425 | M3 | Survey |
| 23 | `src/components/MultiplicationGrid.jsx` | 掛け算10問グリッド入力・CSV入出力 | 377 | M3 | Survey |
| 24 | `src/components/DivisionGrid.jsx` | 割り算10問2カラムグリッド入力・CSV入出力 | 344 | M3 | Survey |
| 25 | `src/components/ProblemContainer.jsx` | 見取り算問題統合コンテナ | 141 | M4 | Survey |
| 26 | `src/components/MultiplicationContainer.jsx` | 掛け算問題統合コンテナ | 136 | M4 | Survey |
| 27 | `src/components/DivisionContainer.jsx` | 割り算問題統合コンテナ | 147 | M4 | Survey |
| 28 | `src/App.jsx` | ルートアプリケーションコンポーネント | 117 | M4 | Survey |
| 29 | `src/main.jsx` / `index.html` | アプリケーションエントリーポイント | 19 | M4 | Survey |
| 30 | 全体ビルド & 型安全監査 | strictモード検証, type-check 0件, build成功, 監査 | - | M5 | Survey |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | TS基盤 & 共通型定義構築 | `tsconfig.json` 作成, `package.json` 依存追加, `src/types/index.ts` 作成 | M0 (Survey) | DONE |
| 2 | ボトム層ユーティリティ & アルゴリズム移行 | Level 0, 1, 2 の11ファイルを `.ts` へ移行 | M1 | DONE |
| 3 | カスタムフック & 単体UIコンポーネ断移行 | Level 3 (hooks 3個) および Level 4 (components 9個) を `.ts`/`.tsx` へ移行 | M2 | DONE |
| 4 | コンテナコンポーネント & アプリエントリー移行 | Level 5 (container 3個), Level 6 (`App.tsx`), Level 7 (`main.tsx`, `index.html`) の移行 | M3 | DONE |
| 5 | 全体検証 & フォレンジック整合性監査 | `npm run type-check` (0エラー), `npm run build` (成功), strictモード, 監査 CLEAN | M4 | DONE |

## Interface Contracts & Layout Rules
- **共通型定義ファイル**: `abacus_app/src/types/index.ts`
  - `ProblemConditions`, `ProblemState`, `ProblemStats`
  - `MultiplicationProblemState`, `MultiplicationStats`
  - `DivisionProblemState`, `DivisionStats`
  - `WorkerRequest`, `WorkerResponse`
  - `TabType`, `CellPosition`
- **型安全性方針**:
  - `strict: true` モード有効化。
  - `any` 型の使用禁止（型定義困難なサードパーティ型等、極少数の理由が明確な箇所のみ `unknown` または `// @ts-expect-error` を使用）。
  - すべての Props, State, リターン値に明示的な型を注記。
- **動作同一性の保証**:
  - 既存のコンポーネント仕様・問題生成ロジック・CSV入出力ロジック・レイアウトスタイルに変更を加えない。

## Code Layout
- `abacus_app/tsconfig.json`: TS設定ファイル
- `abacus_app/package.json`: スクリプトおよび依存関係
- `abacus_app/src/types/index.ts`: 共通TypeScript型定義
- `abacus_app/src/constants/*.ts`: 定数
- `abacus_app/src/utils/*.ts`: ユーティリティ・アルゴリズム関数
- `abacus_app/src/workers/*.ts`: Web Worker
- `abacus_app/src/hooks/*.ts`: カスタムフック
- `abacus_app/src/components/*.tsx`: React UI コンポーネント
- `abacus_app/src/App.tsx`, `src/main.tsx`: アプリケーションエントリーポイント
- `.agents/`: エージェント計画・作業メタデータ
