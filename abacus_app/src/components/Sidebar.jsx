import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentTab, onTabChange }) => {
    return (
        <div className="sidebar">
            <h2 className="sidebar-title">問題管理</h2>
            <div className="sidebar-buttons">
                <button
                    className={`sidebar-btn ${currentTab === 'multiplication' ? 'active' : ''}`}
                    onClick={() => onTabChange('multiplication')}
                >
                    乗算問題
                </button>
                <button
                    className={`sidebar-btn ${currentTab === 'manager' ? 'active' : ''}`}
                    onClick={() => onTabChange('manager')}
                >
                    作問条件一覧
                </button>
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
