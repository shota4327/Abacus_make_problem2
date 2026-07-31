/**
 * @file main.jsx
 * @description アプリケーションのエントリーポイントファイルです。
 * ReactコンポーネントツリーをDOM（#root）にマウントします。
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// DOMルート要素を取得し、Reactアプリケーションを描画します。
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

