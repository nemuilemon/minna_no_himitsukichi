// src/components/TodoList.js

import React, { useState, useEffect } from 'react';
import './TodoList.css'; // あとで作成するCSSファイルをインポート

const TodoList = () => {
  // ステート変数
  const [todos, setTodos] = useState([]); // ToDoリストを保持
  const [title, setTitle] = useState(''); // 新規ToDoのタイトル入力
  const [editingId, setEditingId] = useState(null); // 編集中のToDoのID
  const [editingText, setEditingText] = useState(''); // 編集中のToDoのテキスト
  const [error, setError] = useState(null); // エラーメッセージを保持

  // コンポーネントのマウント時にToDoを取得する
  useEffect(() => {
    fetchTodos();
  }, []);

  // ToDoリストを取得する関数 (Read)
  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("ログインが必要です。");
        return;
      }

      const response = await fetch(`/api/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('データの取得に失敗しました。');
      }

      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // 新しいToDoを追加する関数 (Create)
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return; // タイトルが空の場合は何もしない

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error('ToDoの追加に失敗しました。');
      }

      const newTodo = await response.json();
      setTodos([newTodo, ...todos]); // リストの先頭に追加
      setTitle(''); // 入力欄をクリア
    } catch (err) {
      setError(err.message);
    }
  };
  
  // ToDoを更新する関数 (Update)
  const handleUpdateTodo = async (id, updatedData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
            throw new Error('ToDoの更新に失敗しました。');
        }

        const updatedTodo = await response.json();
        setTodos(todos.map(todo => (todo.id === id ? updatedTodo : todo)));
        
        // 編集モードを終了
        setEditingId(null);
        setEditingText('');

    } catch (err) {
        setError(err.message);
    }
  };

  // 完了状態を切り替える
  const handleToggleComplete = (todo) => {
    handleUpdateTodo(todo.id, { ...todo, is_completed: !todo.is_completed });
  };
  
  // 編集モードを開始する
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };
  
  // 編集内容を送信する
  const handleEditSubmit = (e, todo) => {
    e.preventDefault();
    handleUpdateTodo(todo.id, { ...todo, title: editingText });
  };


  // ToDoを削除する関数 (Delete)
  const handleDeleteTodo = async (id) => {
    if (window.confirm("本当にこのToDoを削除しますか？")) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE',
                headers: {
                'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('ToDoの削除に失敗しました。');
            }

            setTodos(todos.filter(todo => todo.id !== id)); // 状態から削除
        } catch (err) {
            setError(err.message);
        }
    }
  };

  return (
    <div className="todo-container">
      <h1>ToDoリスト</h1>
      
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleAddTodo} className="todo-form">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新しい目標を追加..."
        />
        <button type="submit">追加</button>
      </form>
      
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.is_completed ? 'completed' : ''}>
            {editingId === todo.id ? (
                <form onSubmit={(e) => handleEditSubmit(e, todo)} className="edit-form">
                    <input 
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        autoFocus
                    />
                    <button type="submit">保存</button>
                </form>
            ) : (
                <>
                    <input 
                        type="checkbox"
                        checked={todo.is_completed}
                        onChange={() => handleToggleComplete(todo)}
                    />
                    <span onClick={() => handleToggleComplete(todo)}>{todo.title}</span>
                    <div className="button-group">
                        <button onClick={() => startEditing(todo)} className="edit-button">編集</button>
                        <button onClick={() => handleDeleteTodo(todo.id)} className="delete-button">削除</button>
                    </div>
                </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;