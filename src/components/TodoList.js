// src/components/TodoList.js

import React, { useState, useEffect } from 'react';
// ★ react-beautiful-dnd から必要な部品をインポート
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './TodoList.css'; 

const TodoList = () => {
  // ... ステート変数は変更なし ...
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [error, setError] = useState(null);


  // ... useEffectや他の関数も、新しく追加する onDragEnd 以外は変更なし ...
  useEffect(() => {
    fetchTodos();
    fetchCategories();
  }, []);

  const fetchTodos = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("ログインが必要です。");
        return;
      }
      const response = await fetch(`/api/todos`, {
        headers: { 'Authorization': `Bearer ${token}` },
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
  
  const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/categories`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            throw new Error('カテゴリの取得に失敗しました。');
        }
        const data = await response.json();
        setCategories(data); 
      } catch(err) {
          console.error(err.message);
      }
  }

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, category }),
      });
      if (!response.ok) { throw new Error('ToDoの追加に失敗しました。'); }
      const newTodo = await response.json();
      setTodos([newTodo, ...todos]);
      setTitle('');
      setCategory('');
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleUpdateTodo = async (id, updatedData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updatedData),
        });
        if (!response.ok) { throw new Error('ToDoの更新に失敗しました。'); }
        const updatedTodo = await response.json();
        setTodos(todos.map(todo => (todo.id === id ? updatedTodo : todo)));
        setEditingId(null);
        setEditingTitle('');
        setEditingCategory('');
    } catch (err) {
        setError(err.message);
    }
  };

    const handleToggleComplete = (todo) => {
        handleUpdateTodo(todo.id, { ...todo, is_completed: !todo.is_completed });
    };
    
    const handleDeleteTodo = async (id) => {
        if (window.confirm("本当にこのToDoを削除しますか？")) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/todos/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) { throw new Error('ToDoの削除に失敗しました。'); }
                setTodos(todos.filter(todo => todo.id !== id));
            } catch (err) {
                setError(err.message);
            }
        }
    };
  
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingCategory(todo.category || '');
  };
  
  const handleEditSubmit = (e, todo) => {
    e.preventDefault();
    handleUpdateTodo(todo.id, { ...todo, title: editingTitle, category: editingCategory });
  };
  
  // ★★★ ドラッグが終了したときの処理を定義する関数 (New) ★★★
  const onDragEnd = (result) => {
    // ドロップ先がなければ何もしない
    if (!result.destination) {
      return;
    }
    // todos配列をコピー
    const items = Array.from(todos);
    // ドラッグされたアイテムを一度削除
    const [reorderedItem] = items.splice(result.source.index, 1);
    // ドロップ先にアイテムを挿入
    items.splice(result.destination.index, 0, reorderedItem);
    // stateを更新
    setTodos(items);
    // 注意：この時点では、画面リロードで順番は元に戻ります。
    // 順番を永続化するには、次のステップでAPIとDBの改修が必要です。
  };

  return (
    <div className="todo-container">
      <h1>ToDoリスト</h1>
      
      {error && <p className="error-message">{error}</p>}
      
      {/* ... form部分は変更なし ... */}
      <form onSubmit={handleAddTodo} className="todo-form">
        <input
          className="todo-input-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="新しい目標を追加..."
        />
        <select 
            className="todo-input-category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
        >
            <option value="">カテゴリ未選択</option>
            <option value="学習">学習</option>
            <option value="仕事">仕事</option>
            <option value="個人開発">個人開発</option>
            <option value="プライベート">プライベート</option>
        </select>
        <button type="submit">追加</button>
      </form>
      
      {/* ★★★ ここからリスト全体を DragDropContext と Droppable で囲む ★★★ */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos">
          {(provided) => (
            <ul className="todo-list" {...provided.droppableProps} ref={provided.innerRef}>
              {todos.map((todo, index) => (
                // ★★★ 各リスト項目を Draggable で囲む ★★★
                <Draggable key={todo.id} draggableId={String(todo.id)} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps} // ← これがドラッグするための「取っ手」になる
                      className={todo.is_completed ? 'completed' : ''}
                    >
                      {editingId === todo.id ? (
                          // ... 編集フォーム（変更なし） ...
                          <form onSubmit={(e) => handleEditSubmit(e, todo)} className="edit-form">
                            <input type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} autoFocus />
                            <select value={editingCategory} onChange={(e) => setEditingCategory(e.target.value)}>
                                <option value="">カテゴリ未選択</option>
                                <option value="学習">学習</option>
                                <option value="仕事">仕事</option>
                                <option value="個人開発">個人開発</option>
                                <option value="プライベート">プライベート</option>
                            </select>
                            <button type="submit">保存</button>
                            <button type="button" onClick={() => setEditingId(null)}>中止</button>
                          </form>
                      ) : (
                          // ... 通常表示（変更なし） ...
                          <>
                              <div className="todo-item-main">
                                  <input type="checkbox" checked={todo.is_completed} onChange={() => handleToggleComplete(todo)} />
                                  <span className="todo-title" onClick={() => handleToggleComplete(todo)}>{todo.title}</span>
                                  {todo.category && <span className="todo-category">{todo.category}</span>}
                              </div>
                              <div className="button-group">
                                  <button onClick={() => startEditing(todo)} className="edit-button">編集</button>
                                  <button onClick={() => handleDeleteTodo(todo.id)} className="delete-button">削除</button>
                              </div>
                          </>
                      )}
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default TodoList;