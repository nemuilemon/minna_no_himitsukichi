// src/components/Transactions.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = () => {
  // ステート変数（コンポーネントが内部で保持するデータ）の定義
  const [transactions, setTransactions] = useState([]); // 取引リスト
  const [type, setType] = useState('expense'); // フォームの取引種別
  const [amount, setAmount] = useState(''); // フォームの金額
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10)); // フォームの取引日
  const [category, setCategory] = useState(''); // フォームのカテゴリ
  const [description, setDescription] = useState(''); // フォームの説明
  const [error, setError] = useState(null); // エラーメッセージ
  
  // 月ごとのサマリーを計算するためのステート
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  // ---副作用フック (useEffect)---
  // コンポーネントが最初に表示されたときに、サーバーから取引データを取得する
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  // 取引データが更新されるたびに、月ごとのサマリーを再計算する
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

  // フォームの送信処理（新しい取引を追加する関数）
  const handleSubmit = async (e) => {
    e.preventDefault(); // フォーム送信時のデフォルトの画面遷移を防ぐ
    if (!type || !amount || !transactionDate || !category) {
      setError("必須項目をすべて入力してください。");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const newTransaction = { type, amount: parseFloat(amount), transaction_date: transactionDate, category, description };
      
      const response = await axios.post('/api/transactions', newTransaction, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 状態を更新してUIに即時反映
      setTransactions([response.data, ...transactions]);

      // フォームをリセット
      setAmount('');
      setCategory('');
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
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="金額" required />
          <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required />
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="カテゴリ (例: 食費)" required />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="メモ (任意)" />
        </div>
        <button type="submit" style={{ marginTop: '1rem', width: '100%', padding: '0.8rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>追加</button>
      </form>
      
      {/* 取引リスト */}
      <div>
        <h3>取引履歴</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {transactions.map(t => (
            <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', borderBottom: '1px solid #eee' }}>
              <div>
                <strong style={{ color: t.type === 'income' ? 'green' : 'red' }}>
                  {new Date(t.transaction_date).toLocaleDateString()} - {t.category}
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