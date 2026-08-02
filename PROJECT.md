# Project: Abacus Divide Problem Generator Perfect Algorithm & Verification

## Architecture
本プロジェクトは、`abacus_app` 内の除算問題（割り算問題）自動生成ロジックの再構築および1000回連続自動検証テストスイートの構築を行います。

- **`abacus_app` (ソースコード)**: 除算問題生成のコアロジック（`setupSide`および関連モジュール）。
- **`test` / 検証スクリプト**: R4を満たす1000回自動検証テストスクリプト。

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | コードベース調査 & 課題特定 | `abacus_app` の既存除算アルゴリズム構造解析 | none | DONE |
| 2 | E2E自動検証スクリプト作成 (R4) | 1000回連続テスト・厳密な全制約検証スクリプト | M1 | DONE |
| 3 | 除算アルゴリズム改修 (R1, R2, R3) | 整数Dividend, 完全均等配分, 既存品質制約維持の実装 | M1 | DONE |
| 4 | レビュー・対立的挑戦検証 (Challenger/Reviewer) | アルゴリズムおよびテスト結果の並列レビュー・負荷検証 | M2, M3 | DONE |
| 5 | フォレンジック整合性監査 (Auditor) | ハードコーディングやダミー実装がないことの厳密監査 | M4 | DONE |
| 6 | 1000回連続検証パス & 完走証明 | 最終テスト完走ログ提示および承認 | M5 | DONE |

## Interface Contracts
- **除算生成関数**: 10問の問題リストを生成。各問題は Dividend, Divisor, Quotient を持ち、0〜9の数字出現回数の合計が正確に設定値（各数字11回等、計110桁）と一致すること。
- **検証スクリプト**: Node.jsにより実行可能であり、0〜9桁分布、整数整合性、末尾/先頭制約、連続/挟み制約、フォールバック有無を検証して終了コード0で結果を出力すること。

## Code Layout
- `abacus_app/`: アプリケーションメインソースコード
- `.agents/`: エージェント作業ログ・計画メタデータ
