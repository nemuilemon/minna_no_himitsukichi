// src/components/Transactions.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = () => {
  // --- ステート変数の定義 ---
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]); // カテゴリーリストを保持するstate
  const [type, setType] = useState('expense'); // フォームの取引種別
  const [amount, setAmount] = useState(''); // フォームの金額
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10)); // フォームの取引日
  const [categoryId, setCategoryId] = useState(''); // categoryをcategoryIdに変更し、IDを保持する
  const [description, setDescription] = useState(''); // フォームの説明
  const [error, setError] = useState(null); // エラーメッセージ
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  // カテゴリー管理用のステート
  const [isManagingCategories, setIsManagingCategories] = useState(false); // 管理UIの表示切替
  const [newCategoryName, setNewCategoryName] = useState(''); // 新規カテゴリー名
  const [newCategoryType, setNewCategoryType] = useState('expense'); // 新規カテゴリー種別

  // ---副作用フック (useEffect)---
  useEffect(() => {
    // 初回レンダリング時に取引とカテゴリーの両方を取得する
    fetchTransactions();
    fetchCategories();
  }, []);
  
  useEffect(() => {
    calculateSummary();
  }, [transactions]);


  // ---非同期関数---
  // サーバーからログイン中のユーザーの取引データを取得する関数
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (err) {
      setError("データの取得に失敗しました。");
      console.error(err);
    }
  };

  // カテゴリーを取得する関数
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error("カテゴリーの取得に失敗しました:", err);
    }
  };

  // フォームの送信処理（新しい取引を追加する関数）
  const handleSubmit = async (e) => {
    e.preventDefault(); // フォーム送信時のデフォルトの画面遷移を防ぐ
    if (!type || !amount || !transactionDate || !categoryId) {
      setError("必須項目をすべて入力してください。");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const newTransaction = { type, amount: parseFloat(amount), transaction_date: transactionDate, category_id: parseInt(categoryId), description };
      
      await axios.post('/api/transactions', newTransaction, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchTransactions(); // データを再取得してUIを更新

      // フォームをリセット
      setAmount('');
      setCategoryId('');
      setDescription('');
      setError(null);
    } catch (err) {
      setError("取引の追加に失敗しました。");
      console.error(err);
    }
  };
  
  // 取引を削除する関数
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // 削除されたID以外の取引でリストを再構築
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      setError("削除に失敗しました。");
      console.error(err);
    }
  };

  // ---カテゴリー管理用の関数---

  // 新規カテゴリーを追加する関数
  const handleAddCategory = async () => {
    if (!newCategoryName) {
      alert("カテゴリー名を入力してください。");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/categories', { name: newCategoryName, type: newCategoryType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCategoryName('');
      fetchCategories(); // カテゴリーリストを再取得して更新
    } catch (err) {
      alert("カテゴリーの追加に失敗しました。");
      console.error(err);
    }
  };

  // カテゴリーを削除する関数
  const handleDeleteCategory = async (id) => {
    if (window.confirm("このカテゴリーを本当に削除しますか？")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories(); // カテゴリーリストを再取得
      } catch (err) {
        // サーバーからのエラーメッセージを表示
        alert(err.response?.data?.error || "カテゴリーの削除に失敗しました。");
        console.error(err);
      }
    }
  };

  // カテゴリー名を更新する関数
  const handleUpdateCategory = async (id) => {
    const newName = prompt("新しいカテゴリー名を入力してください。");
    if (newName && newName.trim() !== '') {
        const categoryToUpdate = categories.find(c => c.id === id);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/categories/${id}`, { name: newName, type: categoryToUpdate.type }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCategories(); // カテゴリーリストを再取得
        } catch (err) {
            alert(err.response?.data?.error || "カテゴリーの更新に失敗しました。");
            console.error(err);
        }
    }
  };


  // ---通常関数---
  // 月ごとのサマリーを計算する関数
  const calculateSummary = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      const tDate = new Date(t.transaction_date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        if (t.type === 'income') {
          income += parseFloat(t.amount);
        } else if (t.type === 'expense') {
          expense += parseFloat(t.amount);
        }
      }
    });

    setSummary({
      income,
      expense,
      balance: income - expense,
    });
  };


  // ---JSX (画面の見た目を定義)---
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h2>家計簿</h2>
      
      {/* 月ごとのサマリー表示 */}
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '2rem', background: '#f9f9f9' }}>
        <h3>今月のサマリー</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <p><strong>収入:</strong> <span style={{ color: 'green' }}>{summary.income.toLocaleString()} 円</span></p>
          <p><strong>支出:</strong> <span style={{ color: 'red' }}>{summary.expense.toLocaleString()} 円</span></p>
          <p><strong>差引:</strong> <span style={{ fontWeight: 'bold' }}>{summary.balance.toLocaleString()} 円</span></p>
        </div>
      </div>
      
      {/* 新規取引入力フォーム */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <h3>新しい取引を追加</h3>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <select value={type} onChange={(e) => {
            setType(e.target.value);
            setCategoryId(''); // タイプを変更したらカテゴリ選択をリセット
          }}>
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金額" required />
          <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required />
          
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">カテゴリを選択</option>
            {/* 選択中のtype（収入/支出）に応じてカテゴリをフィルタリング */}
            {categories
              .filter(c => c.type === type)
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
            ))}
          </select>

          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="メモ (任意)" />
        </div>
        <button type="submit" style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>追加</button>
      </form>
      
      {/* カテゴリー管理セクション */}
      <div style={{ margin: '2rem 0' }}>
        <button onClick={() => setIsManagingCategories(!isManagingCategories)}>
          {isManagingCategories ? 'カテゴリー管理を閉じる' : 'カテゴリーを管理する'}
        </button>

        {isManagingCategories && (
          <div style={{ border: '1px solid #ccc', padding: '1rem', marginTop: '1rem' }}>
            <h4>新しいカテゴリーを追加</h4>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                placeholder="新しいカテゴリー名" 
              />
              <select value={newCategoryType} onChange={(e) => setNewCategoryType(e.target.value)}>
                <option value="expense">支出</option>
                <option value="income">収入</option>
              </select>
              <button onClick={handleAddCategory}>追加</button>
            </div>
            <hr />
            <h4>既存のカテゴリー</h4>
            <h5>支出</h5>
            <ul style={{listStyle: 'none', padding: 0}}>
              {categories.filter(c => c.type === 'expense').map(cat => (
                <li key={cat.id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  {cat.name}
                  <div>
                    <button onClick={() => handleUpdateCategory(cat.id)} style={{marginRight: '0.5rem'}}>編集</button>
                    <button onClick={() => handleDeleteCategory(cat.id)}>削除</button>
                  </div>
                </li>
              ))}
            </ul>
            <h5>収入</h5>
             <ul style={{listStyle: 'none', padding: 0}}>
              {categories.filter(c => c.type === 'income').map(cat => (
                <li key={cat.id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  {cat.name}
                  <div>
                    <button onClick={() => handleUpdateCategory(cat.id)} style={{marginRight: '0.5rem'}}>編集</button>
                    <button onClick={() => handleDeleteCategory(cat.id)}>削除</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 取引リスト */}
      <div>
        <h3>取引履歴</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {transactions.map(t => (
            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', borderBottom: '1px solid #eee' }}>
              <div>
                <strong style={{ color: t.type === 'income' ? 'green' : 'red' }}>
                  {new Date(t.transaction_date).toLocaleDateString()} - {t.category_name}
                </strong>
                <p style={{ margin: '0.2rem 0' }}>{t.description}</p>
              </div>
              <div>
                <span>{parseFloat(t.amount).toLocaleString()} 円</span>
                <button onClick={() => handleDelete(t.id)} style={{ marginLeft: '1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>削除</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Transactions;