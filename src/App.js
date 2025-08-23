// src/App.js

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  // ★ 改善点: 初期状態をlocalStorageのトークンの有無で直接決定する
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // ログアウト処理（状態更新とトークン削除をここに集約）
  const handleLogout = () => {
    localStorage.removeItem('token'); // トークンを削除
    setIsLoggedIn(false);
  };

  // ログイン成功時に呼ばれる関数
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  // ★★★ 追加部分: axiosインターセプターからの自動ログアウト要求を監視 ★★★
  useEffect(() => {
    const handleAuthError = () => {
      // 認証エラーのイベントを受け取ったら、ログアウト処理を実行
      handleLogout();
    };

    // 'auth-error' というカスタムイベントを監視するリスナーを追加
    window.addEventListener('auth-error', handleAuthError);

    // コンポーネントが不要になった時にイベントリスナーをクリーンアップ（お掃除）する
    return () => {
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, []); // 空の配列を渡すことで、このuseEffectは最初の1回だけ実行される

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;