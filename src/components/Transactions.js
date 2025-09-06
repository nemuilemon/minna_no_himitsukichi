
// src/components/Transactions.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Box, Paper, Typography, Grid, TextField, Button, Select, MenuItem, 
  List, ListItem, ListItemText, IconButton, Dialog, DialogActions, 
  DialogContent, DialogTitle, Snackbar, Alert, FormControl, InputLabel 
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import './Transactions.css';

const Transactions = () => {
  // --- ステート変数の定義 ---
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });

  // UI制御用のステート
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('expense');
  const [editCategory, setEditCategory] = useState(null); // { id, name, type }
  const [deleteCategory, setDeleteCategory] = useState(null); // { id }
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const token = localStorage.getItem('token');

  // --- データ取得 ---
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axios.get('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (err) {
      setNotification({ open: true, message: '取引データの取得に失敗しました。', severity: 'error' });
      console.error(err);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      setNotification({ open: true, message: 'カテゴリーの取得に失敗しました。', severity: 'error' });
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  // --- サマリー計算 ---
  useEffect(() => {
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

    setSummary({ income, expense, balance: income - expense });
  }, [transactions]);

  // --- イベントハンドラ ---
  const handleNotificationClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !amount || !transactionDate || !categoryId) {
      setNotification({ open: true, message: '必須項目をすべて入力してください。', severity: 'warning' });
      return;
    }
    try {
      const newTransaction = { type, amount: parseFloat(amount), transaction_date: transactionDate, category_id: parseInt(categoryId), description };
      await axios.post('/api/transactions', newTransaction, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTransactions();
      setAmount('');
      setCategoryId('');
      setDescription('');
      setNotification({ open: true, message: '取引を追加しました。', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: '取引の追加に失敗しました。', severity: 'error' });
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(transactions.filter(t => t.id !== id));
      setNotification({ open: true, message: '取引を削除しました。', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: '削除に失敗しました。', severity: 'error' });
      console.error(err);
    }
  };

  // --- カテゴリー管理 ---
  const handleAddCategory = async () => {
    if (!newCategoryName) {
      setNotification({ open: true, message: 'カテゴリー名を入力してください。', severity: 'warning' });
      return;
    }
    try {
      await axios.post('/api/categories', { name: newCategoryName, type: newCategoryType }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCategoryName('');
      fetchCategories();
      setNotification({ open: true, message: 'カテゴリーを追加しました。', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: 'カテゴリーの追加に失敗しました。', severity: 'error' });
      console.error(err);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCategory || !editCategory.name.trim()) {
      setNotification({ open: true, message: 'カテゴリー名を入力してください。', severity: 'warning' });
      return;
    }
    try {
      await axios.put(`/api/categories/${editCategory.id}`, { name: editCategory.name, type: editCategory.type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
      setEditCategory(null);
      setNotification({ open: true, message: 'カテゴリーを更新しました。', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: err.response?.data?.error || 'カテゴリーの更新に失敗しました。', severity: 'error' });
      console.error(err);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategory) return;
    try {
      await axios.delete(`/api/categories/${deleteCategory.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
      setDeleteCategory(null);
      setNotification({ open: true, message: 'カテゴリーを削除しました。', severity: 'success' });
    } catch (err) {
      setNotification({ open: true, message: err.response?.data?.error || 'カテゴリーの削除に失敗しました。', severity: 'error' });
      console.error(err);
    }
  };

  // --- レンダリング ---
  return (
    <Box className="transactions-container">
      <Typography variant="h4" gutterBottom>家計簿</Typography>
      
      {/* サマリー */}
      <Paper elevation={3} className="summary-card">
        <Box p={2}>
          <Typography variant="h5" gutterBottom>今月のサマリー</Typography>
          <Box className="summary-content">
            <Typography><strong>収入:</strong> <span className="income-text">{summary.income.toLocaleString()} 円</span></Typography>
            <Typography><strong>支出:</strong> <span className="expense-text">{summary.expense.toLocaleString()} 円</span></Typography>
            <Typography><strong>差引:</strong> <span className="balance-text">{summary.balance.toLocaleString()} 円</span></Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* 取引追加フォーム */}
      <Paper elevation={3} className="form-card">
        <Box p={2} component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" gutterBottom>新しい取引を追加</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>種別</InputLabel>
                <Select value={type} label="種別" onChange={(e) => { setType(e.target.value); setCategoryId(''); }}>
                  <MenuItem value="expense">支出</MenuItem>
                  <MenuItem value="income">収入</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField type="number" label="金額" value={amount} onChange={(e) => setAmount(e.target.value)} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth required>
                <InputLabel>カテゴリ</InputLabel>
                <Select value={categoryId} label="カテゴリ" onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.filter(c => c.type === type).map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label="メモ (任意)" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth />
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2, width: '100%' }}>追加</Button>
        </Box>
      </Paper>

      {/* カテゴリー管理 */}
      <Box className="category-management-container">
        <Button variant="outlined" onClick={() => setIsManagingCategories(!isManagingCategories)}>
          {isManagingCategories ? 'カテゴリー管理を閉じる' : 'カテゴリーを管理する'}
        </Button>
        {isManagingCategories && (
          <Paper elevation={2} sx={{ p: 2, mt: 1 }}>
            <Typography variant="h6">新しいカテゴリーを追加</Typography>
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={5}>
                <TextField label="新しいカテゴリー名" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>種別</InputLabel>
                  <Select value={newCategoryType} label="種別" onChange={(e) => setNewCategoryType(e.target.value)}>
                    <MenuItem value="expense">支出</MenuItem>
                    <MenuItem value="income">収入</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button onClick={handleAddCategory} variant="contained" fullWidth>追加</Button>
              </Grid>
            </Grid>
            <hr />
            <Typography variant="h6" sx={{ mt: 2 }}>既存のカテゴリー</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">支出</Typography>
                <List dense>
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <ListItem key={cat.id} secondaryAction={
                      <>
                        <IconButton edge="end" aria-label="edit" onClick={() => setEditCategory(cat)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => setDeleteCategory(cat)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }>
                      <ListItemText primary={cat.name} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">収入</Typography>
                <List dense>
                  {categories.filter(c => c.type === 'income').map(cat => (
                    <ListItem key={cat.id} secondaryAction={
                      <>
                        <IconButton edge="end" aria-label="edit" onClick={() => setEditCategory(cat)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => setDeleteCategory(cat)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    }>
                      <ListItemText primary={cat.name} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      {/* 取引履歴 */}
      <Paper elevation={3}>
        <Box p={2}>
          <Typography variant="h5" gutterBottom>取引履歴</Typography>
          <List>
            {transactions.map(t => (
              <ListItem key={t.id} className="transaction-list-item" secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(t.id)}>
                  <DeleteIcon />
                </IconButton>
              }>
                <ListItemText 
                  primary={t.category_name}
                  secondary={`${new Date(t.transaction_date).toLocaleDateString()} - ${t.description || ''}`}
                />
                <Typography variant="body1" className={t.type === 'income' ? 'income-text' : 'expense-text'}>
                  {t.type === 'income' ? '+' : '-'}{parseFloat(t.amount).toLocaleString()} 円
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* ダイアログ */}
      <Dialog open={!!editCategory} onClose={() => setEditCategory(null)}>
        <DialogTitle>カテゴリーを編集</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="カテゴリー名"
            type="text"
            fullWidth
            variant="standard"
            value={editCategory?.name || ''}
            onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCategory(null)}>キャンセル</Button>
          <Button onClick={handleUpdateCategory}>更新</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteCategory} onClose={() => setDeleteCategory(null)}>
        <DialogTitle>カテゴリーを削除</DialogTitle>
        <DialogContent>
          <Typography>「{deleteCategory?.name}」を本当に削除しますか？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCategory(null)}>キャンセル</Button>
          <Button onClick={confirmDeleteCategory} color="error">削除</Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleNotificationClose}>
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Transactions;
