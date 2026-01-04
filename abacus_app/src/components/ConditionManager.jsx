import React from 'react';
import ConditionPanel from './ConditionPanel';
import './ConditionManager.css';

const ConditionManager = ({ problems, onUpdate }) => {
    return (
        <div className="condition-manager-container">
            <div className="condition-manager-grid">
                {problems.map((problemState, index) => {
                    const updateState = (key, value) => {
                        const newState = { ...problemState, [key]: value };
                        onUpdate(index, newState);
                    };

                    return (
                        <div key={index} className="condition-manager-item">
                            <ConditionPanel
                                title={`作問条件(第${index + 1}問)`}
                                minDigit={problemState.minDigit}
                                setMinDigit={(val) => updateState('minDigit', val)}
                                maxDigit={problemState.maxDigit}
                                setMaxDigit={(val) => updateState('maxDigit', val)}
                                targetTotalDigits={problemState.targetTotalDigits}
                                setTargetTotalDigits={(val) => updateState('targetTotalDigits', val)}
                                rowCount={problemState.rowCount}
                                setRowCount={(val) => updateState('rowCount', val)}
                                plusOneDigit={problemState.plusOneDigit}
                                setPlusOneDigit={(val) => updateState('plusOneDigit', val)}
                                minusOneDigit={problemState.minusOneDigit}
                                setMinusOneDigit={(val) => updateState('minusOneDigit', val)}
                                enclosedDigit={problemState.enclosedDigit}
                                setEnclosedDigit={(val) => updateState('enclosedDigit', val)}
                                sandwichedDigit={problemState.sandwichedDigit}
                                setSandwichedDigit={(val) => updateState('sandwichedDigit', val)}
                                consecutiveDigit={problemState.consecutiveDigit}
                                setConsecutiveDigit={(val) => updateState('consecutiveDigit', val)}
                                firstRowMin={problemState.firstRowMin}
                                setFirstRowMin={(val) => updateState('firstRowMin', val)}
                                firstRowMax={problemState.firstRowMax}
                                setFirstRowMax={(val) => updateState('firstRowMax', val)}
                                lastRowMin={problemState.lastRowMin}
                                setLastRowMin={(val) => updateState('lastRowMin', val)}
                                lastRowMax={problemState.lastRowMax}
                                setLastRowMax={(val) => updateState('lastRowMax', val)}
                                answerMin={problemState.answerMin}
                                setAnswerMin={(val) => updateState('answerMin', val)}
                                answerMax={problemState.answerMax}
                                setAnswerMax={(val) => updateState('answerMax', val)}
                                hasMinus={problemState.isMinusRows.some(Boolean)}
                                // Suppress warnings / complex calculations
                                complementStatus="計算なし"
                                isEnclosedUsed={true}
                                isSandwichedUsed={true}
                                isConsecutiveUsed={true}
                                isFirstMinValid={true}
                                isFirstMaxValid={true}
                                isLastMinValid={true}
                                isLastMaxValid={true}
                                isAnsMinValid={true}
                                isAnsMaxValid={true}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConditionManager;
