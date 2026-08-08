/**
 * @file main.tsx
 * @description アプリケーションのエントリーポイントファイルです。
 * ReactコンポーネントツリーをDOM（#root）にマウントします。
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// DOMルート要素を取得し、Reactアプリケーションを描画します。
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
