/**
 * @file Sidebar.tsx
 * @description アプリケーション左側に配置されるナビゲーションサイドバーです。乗算問題・除算問題・作問条件一覧・見取り算各問題(1-10問)のタブ切り替えメニューを提供します。
 */

import React from 'react';
import './Sidebar.css';
import { SidebarProps } from '../types';

/**
 * サイドバーナビゲーションコンポーネント
 * 
 * @param props - コンポーネントProps
 * @param props.currentTab - 現在アクティブなタブ ID (0-9:見取り算各問, 'multiplication', 'division', 'manager')
 * @param props.onTabChange - タブ切り替え通知ハンドラー (tabKey) => void
 * @returns サイドバー描画要素
 */
const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
    return (
        <div className="sidebar">
            <h2 className="sidebar-title">問題管理</h2>
            <div className="sidebar-buttons">
                {/* 乗算問題タブ */}
                <button
                    className={`sidebar-btn ${currentTab === 'multiplication' ? 'active' : ''}`}
                    onClick={() => onTabChange('multiplication')}
                >
                    乗算問題
                </button>
                {/* 除算問題タブ */}
                <button
                    className={`sidebar-btn ${currentTab === 'division' ? 'active' : ''}`}
                    onClick={() => onTabChange('division')}
                >
                    除算問題
                </button>
                {/* 見取り算の全問題条件一括マネージャータブ */}
                <button
                    className={`sidebar-btn ${currentTab === 'manager' ? 'active' : ''}`}
                    onClick={() => onTabChange('manager')}
                >
                    作問条件一覧
                </button>
                {/* 見取り算 第1問〜第10問個別編集タブ */}
                {Array.from({ length: 10 }, (_, i) => (
                    <button
                        key={i}
                        className={`sidebar-btn ${currentTab === i ? 'active' : ''}`}
                        onClick={() => onTabChange(i)}
                    >
                        第{i + 1}問
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
