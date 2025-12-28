import React from 'react';
import './ConditionPanel.css';

const ConditionPanel = () => {
    return (
        <div className="panel condition-panel">
            <h2>作問条件</h2>
            <div className="condition-list">
                <div className="condition-item">総字数: -</div>
                <div className="condition-item">口数: 20</div>
                <div className="condition-item">＋１文字: -</div>
                <div className="condition-item">－１文字: -</div>
                <div className="condition-item">ケタ範囲: -</div>
                <div className="condition-item">囲み文字: -</div>
                <div className="condition-item">はさまれ文字: -</div>
                <div className="condition-item">連続文字: -</div>
                <div className="condition-item">マイナス: -</div>
                <div className="condition-item">１口目: -</div>
                <div className="condition-item">最終口: -</div>
                <div className="condition-item">答え: -</div>
            </div>
        </div>
    );
};

export default ConditionPanel;
