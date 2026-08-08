/**
 * @file App.tsx
 * @description アプリケーションのメインコンポーネントです。
 * 見取り算・掛け算・割り算・全問題条件マネージャーのタブ切り替えと、見取り算問題(10問分)の状態管理を行います。
 */

import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ProblemContainer from './components/ProblemContainer';
import ConditionManager from './components/ConditionManager';
import MultiplicationContainer from './components/MultiplicationContainer';
import DivisionContainer from './components/DivisionContainer';
import { createInitialProblemState } from './constants/initialState';
import { calculateProblemStats } from './utils/problemValidator';
import { ProblemState, TabType } from './types';
import './index.css';

/**
 * 単一の見取り算問題オブジェクトを受け取り、統計情報をもとに各種条件（包み・挟み・連続・各行桁数・補数など）の検証結果フラグを付与した状態を返します。
 * 
 * @param {ProblemState} p - 見取り算問題データ
 * @returns {ProblemState} 各種バリデーションフラグが更新された問題データ
 */
const validateProblemState = (p: ProblemState): ProblemState => {
  // 盤面グリッドから統計情報（数字出現数、補数計算の有無、特殊桁パターン等）を取得
  const stats = calculateProblemStats(p.grid, p.isMinusRows, p.rowCount, p.targetTotalDigits, p);
  
  // 引き算の存在整合性をチェック
  const isMinusValid = p.hasMinus === p.isMinusRows.some(Boolean);
  
  // 補数計算の存在整合性をチェック
  const isComplementValid = p.complementStatus === (stats.complementStatus !== "なし");

  return {
      ...p,
      isEnclosedUsed: stats.isEnclosedUsed,       // 包み数字が条件通り使われているか
      isSandwichedUsed: stats.isSandwichedUsed,   // 挟み数字が条件通り使われているか
      isConsecutiveUsed: stats.isConsecutiveUsed, // 連続数字が条件通り使われているか
      isFirstMinValid: stats.isFirstMinValid,     // 1口目最小桁数の妥当性
      isFirstMaxValid: stats.isFirstMaxValid,     // 1口目最大桁数の妥当性
      isLastMinValid: stats.isLastMinValid,       // 最終口最小桁数の妥当性
      isLastMaxValid: stats.isLastMaxValid,       // 最終口最大桁数の妥当性
      isAnsMinValid: stats.isAnsMinValid,         // 答えの最小桁数の妥当性
      isAnsMaxValid: stats.isAnsMaxValid,         // 答えの最大桁数の妥当性
      isMinusValid,                               // 引き算設定の妥当性
      isComplementValid                           // 補数設定の妥当性
  };
};

/**
 * アプリケーションのルートコンポーネント。
 * サイドバーでのタブ選択に応じて、各種コンポーネント（見取り算、掛け算、割り算、一括条件マネージャー）を表示します。
 * 
 * @returns {React.ReactElement} アプリケーション全体の描画要素
 */
function App(): React.ReactElement {
  // 見取り算問題10問分の状態配列を初期化
  const [problems, setProblems] = useState<ProblemState[]>(() =>
    Array(10).fill(null).map(() => validateProblemState(createInitialProblemState()))
  );
  
  // 現在選択中のタブ（0〜9: 見取り算各問題、'multiplication': 掛け算、'division': 割り算、'manager': 条件マネージャー）
  const [currentTab, setCurrentTab] = useState<TabType>(0);

  /**
   * 指定した問題インデックスの状態を更新し、バリデーションを再計算するコールバック関数
   * 
   * @param {number} index - 更新対象問題のインデックス (0-9)
   * @param {ProblemState} newState - 新しい問題データ
   */
  const handleUpdate = useCallback((index: number, newState: ProblemState): void => {
    setProblems(prev => {
      const next = [...prev];
      next[index] = validateProblemState(newState);
      return next;
    });
  }, []);

  return (
    <div className="app-container">
      {/* サイドバー（ナビゲーション） */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      
      {/* メインコンテンツ表示エリア */}
      <div className={`content-area ${typeof currentTab === 'number' ? '' : 'non-grid-mode'}`}>
        {/* 掛け算タブ */}
        <div className="full-width-tab" style={{ display: currentTab === 'multiplication' ? 'block' : 'none', height: '100%' }}>
          <MultiplicationContainer />
        </div>
        
        {/* 割り算タブ */}
        <div className="full-width-tab" style={{ display: currentTab === 'division' ? 'block' : 'none', height: '100%' }}>
          <DivisionContainer />
        </div>
        
        {/* 条件一括管理マネージャータブ */}
        <div className="full-width-tab" style={{ display: currentTab === 'manager' ? 'block' : 'none', height: '100%' }}>
          <ConditionManager problems={problems} onUpdate={handleUpdate} />
        </div>
        
        {/* 見取り算個別問題編集タブ (0〜9) */}
        {typeof currentTab === 'number' && (
          // key属性にcurrentTabを指定することで、タブ切り替え時にProblemContainerを再初期化する
          <ProblemContainer
            key={currentTab}
            pageIndex={Number(currentTab) + 1}
            initialData={problems[currentTab as number]!}
            onUpdate={(newState: ProblemState) => handleUpdate(currentTab as number, newState)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
