// src/App.js

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
// TodoListの代わりにDashboardをインポート
import Dashboard from './components/Dashboard';

function App() {
  // ログイン状態を管理するステート
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // アプリケーションが最初に読み込まれた時に、トークンの存在を確認する
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('token'); // トークンを削除
    setIsLoggedIn(false);
  };

  // ログイン成功時に呼ばれる関数
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  return (
    <div className="App">
      {/* isLoggedIn の値によって表示するコンポーネントを切り替える
        TodoListをDashboardに差し替え、handleLogoutをpropsとして渡す
      */}
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

// 以前のログアウトボタン用のスタイルは不要なので削除します

export default App;