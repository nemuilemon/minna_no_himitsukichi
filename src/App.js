// src/App.js

import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import TodoList from './components/TodoList';

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
      {/* ログアウトボタンはログインしている時だけ表示 */}
      {isLoggedIn && <button onClick={handleLogout} className="logout-button">ログアウト</button>}
      
      {/* isLoggedIn の値によって表示するコンポーネントを切り替える */}
      {isLoggedIn ? (
        <TodoList />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

// ログアウトボタン用の簡単なスタイル
const styles = `
  .logout-button {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 8px 16px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9rem;
    z-index: 10;
  }
  .logout-button:hover {
    background-color: #5a6268;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


export default App;