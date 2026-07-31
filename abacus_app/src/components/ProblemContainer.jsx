/**
 * @file ProblemContainer.jsx
 * @description 単一の見取り算問題（1問分）の編集グリッド、各種作問条件入力パネル、出現頻度表、連続文字マトリクスを統合描画し、状態変更を親コンポーネント(App.jsx)に同期させる画面コンテナコンポーネントです。
 */

import React, { useEffect, useRef } from 'react';
import ProblemGrid from './ProblemGrid';
import FrequencyCounter from './FrequencyCounter';
import ConsecutiveCounter from './ConsecutiveCounter';
import ConditionPanel from './ConditionPanel';
import { useProblemState } from '../hooks/useProblemState';

/**
 * 単一見取り算問題編集コンテナコンポーネント
 * 
 * @param {Object} props - コンポーネントProps
 * @param {Object} props.initialData - 問題の初期設定・盤面データ
 * @param {Function} props.onUpdate - 親コンポーネント(App.jsx)への状態同期通知コールバック (newState) => void
 * @param {number} props.pageIndex - 問題番号 (1-10)
 * @returns {JSX.Element} 個別見取り算問題編集画面UI
 */
const ProblemContainer = ({ initialData, onUpdate, pageIndex }) => {
    // カスタムフックで問題の状態と操作ロジックを取得
    const {
        grid, updateDigit, rowCount,
        minDigit, setMinDigit,
        maxDigit, setMaxDigit,
        targetTotalDigits, setTargetTotalDigits,
        setRowCount,
        frequency, totalFrequency, frequencyDiffs,
        rowDigitCounts, totalRowDigits, updateRowDigitCount,
        generateRandomGrid,
        isGenerating,
        plusOneDigit, setPlusOneDigit,
        minusOneDigit, setMinusOneDigit,
        enclosedDigit, setEnclosedDigit,
        sandwichedDigit, setSandwichedDigit,
        consecutiveDigit, setConsecutiveDigit,
        firstRowFirstDigit, setFirstRowMin,
        firstRowLastDigit, setFirstRowMax,
        lastRowFirstDigit, setLastRowMin,
        lastRowLastDigit, setLastRowMax,
        answerFirstDigit, setAnswerMin,
        answerLastDigit, setAnswerMax,
        complementStatus, setComplementStatus,
        calculatedComplementStatus,
        isEnclosedUsed, isSandwichedUsed, isConsecutiveUsed,
        isFirstMinValid, isFirstMaxValid, isLastMinValid, isLastMaxValid, isAnsMinValid, isAnsMaxValid,
        totalSum,
        consecutive,
        isMinusRows, toggleRowMinus,
        hasMinus, setHasMinus,
        currentState,
        importState
    } = useProblemState(initialData);

    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    });

    // 内部状態(currentState)が変更されるたびに親(App.jsx)へ同期待機データを通知
    useEffect(() => {
        if (onUpdateRef.current && currentState) {
            onUpdateRef.current(currentState);
        }
    }, [currentState]);


    return (
        <>
            <ProblemGrid
                grid={grid}
                updateDigit={updateDigit}
                rowCount={rowCount}
                isMinusRows={isMinusRows}
                toggleRowMinus={toggleRowMinus}
                totalSum={totalSum}
                generateRandomGrid={generateRandomGrid}
                pageIndex={pageIndex}
                importState={importState}
                currentConditions={currentState}
            />

            <FrequencyCounter
                frequency={frequency}
                totalFrequency={totalFrequency}
                frequencyDiffs={frequencyDiffs}
                rowDigitCounts={rowDigitCounts}
                totalRowDigits={totalRowDigits}
                targetTotalDigits={targetTotalDigits}
                updateRowDigitCount={updateRowDigitCount}
                minDigit={minDigit}
                maxDigit={maxDigit}
            />

            <ConsecutiveCounter consecutive={consecutive} />

            <ConditionPanel
                minDigit={minDigit} setMinDigit={setMinDigit}
                maxDigit={maxDigit} setMaxDigit={setMaxDigit}
                targetTotalDigits={targetTotalDigits} setTargetTotalDigits={setTargetTotalDigits}
                rowCount={rowCount} setRowCount={setRowCount}
                generateRandomGrid={generateRandomGrid}
                plusOneDigit={plusOneDigit} setPlusOneDigit={setPlusOneDigit}
                minusOneDigit={minusOneDigit} setMinusOneDigit={setMinusOneDigit}
                enclosedDigit={enclosedDigit} setEnclosedDigit={setEnclosedDigit}
                sandwichedDigit={sandwichedDigit} setSandwichedDigit={setSandwichedDigit}
                consecutiveDigit={consecutiveDigit} setConsecutiveDigit={setConsecutiveDigit}
                firstRowFirstDigit={firstRowFirstDigit} setFirstRowMin={setFirstRowMin}
                firstRowLastDigit={firstRowLastDigit} setFirstRowMax={setFirstRowMax}
                lastRowFirstDigit={lastRowFirstDigit} setLastRowMin={setLastRowMin}
                lastRowLastDigit={lastRowLastDigit} setLastRowMax={setLastRowMax}
                answerFirstDigit={answerFirstDigit} setAnswerMin={setAnswerMin}
                answerLastDigit={answerLastDigit} setAnswerMax={setAnswerMax}
                hasMinus={hasMinus} setHasMinus={setHasMinus}
                complementStatus={complementStatus} setComplementStatus={setComplementStatus}
                isMinusValid={hasMinus === isMinusRows.some(Boolean)}
                isComplementValid={complementStatus === (calculatedComplementStatus !== "なし")}
                isEnclosedUsed={isEnclosedUsed}
                isSandwichedUsed={isSandwichedUsed}
                isConsecutiveUsed={isConsecutiveUsed}
                isFirstMinValid={isFirstMinValid}
                isFirstMaxValid={isFirstMaxValid}
                isLastMinValid={isLastMinValid}
                isLastMaxValid={isLastMaxValid}
                isAnsMinValid={isAnsMinValid}
                isAnsMaxValid={isAnsMaxValid}
            />

            {isGenerating && (
                <div className="loading-overlay">
                    <div className="loading-message">作成中...</div>
                </div>
            )}
        </>
    );
};

export default ProblemContainer;
