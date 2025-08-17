// server.js

// 1. Expressをインポートする
const express = require('express');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');


// 2. Expressアプリのインスタンスを作成する
const app = express();
// POSTリクエストのbodyをJSONとして解析するために必要
app.use(express.json()); 

// 3. サーバーがリッスンするポート番号を設定する
const port = 3000;

// データベース接続設定
const pool = new Pool({
  user: 'postgres',       // ご自身のPostgreSQLユーザー名
  host: 'localhost',
  database: process.env.postgres_database, // ご自身のデータベース名
  password: process.env.postgres_database_password,  // ご自身のパスワード
  port: 5432,
});

// JWTの秘密鍵
const JWT_SECRET = process.env.JWT_SECRET; 


// 4. ルートURL ('/') へのGETリクエストに対する処理
app.get('/', (req, res) => {
  res.send('皆の秘密基地サーバーへようこそ！');
});

// --- ▼▼ ここからAPIを実装 ▼▼ ---

// ## アカウント登録API (/api/register) ##
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // データベースに新しいユーザーを保存
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "アカウントが正常に作成されました。", userId: newUser.rows[0].id });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("サーバーエラーが発生しました。");
  }
});

// ## ログインAPI (/api/login) ##
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // ユーザーがデータベースに存在するか確認
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "ユーザーが見つかりません。" });
    }

    // パスワードが正しいか確認
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "パスワードが正しくありません。" });
    }

    // JWTを生成してクライアントに返す
    const token = jwt.sign(
      { userId: user.rows[0].id }, // トークンに含める情報
      JWT_SECRET,                  // 秘密鍵
      { expiresIn: '1h' }         // 有効期限
    );

    res.json({ token });

  } catch (error) {
    console.error(error.message);
    res.status(500).send("サーバーエラーが発生しました。");
  }
});


// 5. 指定したポートでサーバーを起動
app.listen(port, () => {
  console.log(`サーバーがポート ${port} で起動しました。 http://localhost:${port}`);
  
});


// JWTを検証し、リクエストにユーザー情報を付与するミドルウェア
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" の形式からTOKEN部分を抽出

  if (token == null) {
    return res.sendStatus(401); // トークンが存在しない場合はアクセスを拒否
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // トークンが無効な場合はアクセスを拒否
    }
    req.user = user; // リクエストオブジェクトにデコードされたユーザー情報（{ userId: ... }）を保存
    next(); // 次の処理へ進む
  });
};


// --- ▼▼ ここからToDoリストのCRUD APIを実装 ▼▼ ---

// ## ToDo作成API (POST /api/todos) ##
// authenticateTokenミドルウェアを適用し、認証されたユーザーのみアクセス可能にする
app.post('/api/todos', authenticateToken, async (req, res) => {
  try {
    // リクエストボディからToDoの情報を取得
    const { title, description, priority, due_date, category } = req.body;
    // ミドルウェアによって設定されたユーザーIDを取得
    const userId = req.user.userId;

    // 必須項目であるtitleが空の場合はエラーを返す
    if (!title) {
      return res.status(400).json({ error: "タイトルは必須です。" });
    }

    // データベースに新しいToDoを保存
    const newTodo = await pool.query(
      "INSERT INTO todos (user_id, title, description, priority, due_date, category) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, title, description, priority, due_date, category]
    );

    res.status(201).json(newTodo.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("サーバーエラーが発生しました。");
  }
});


// ## ToDo取得API (GET /api/todos) ##
app.get('/api/todos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // ログイン中のユーザーIDに紐づくToDoをすべて取得
    const allTodos = await pool.query("SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC", [userId]);

    res.json(allTodos.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("サーバーエラーが発生しました。");
  }
});


// ## ToDo更新API (PUT /api/todos/:id) ##
app.put('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; // URLから更新対象のToDoのIDを取得
    const userId = req.user.userId;
    const { title, description, priority, due_date, category, is_completed } = req.body;

    // 更新対象のToDoが存在し、かつそれがログイン中のユーザーのものであることを確認
    const todo = await pool.query("SELECT * FROM todos WHERE id = $1 AND user_id = $2", [id, userId]);
    if (todo.rows.length === 0) {
      return res.status(404).json({ error: "対象のToDoが見つからないか、アクセス権がありません。" });
    }

    // データベースの情報を更新
    const updatedTodo = await pool.query(
      "UPDATE todos SET title = $1, description = $2, priority = $3, due_date = $4, category = $5, is_completed = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *",
      [title, description, priority, due_date, category, is_completed, id]
    );

    res.json(updatedTodo.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("サーバーエラーが発生しました。");
  }
});


// ## ToDo削除API (DELETE /api/todos/:id) ##
app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; // URLから削除対象のToDoのIDを取得
    const userId = req.user.userId;

    // 削除対象のToDoが存在し、かつそれがログイン中のユーザーのものであることを確認してから削除
    const deleteOp = await pool.query("DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING *", [id, userId]);

    if (deleteOp.rows.length === 0) {
      return res.status(404).json({ error: "対象のToDoが見つからないか、アクセス権がありません。" });
    }

    res.json({ message: "ToDoが正常に削除されました。" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("サーバーエラーが発生しました。");
  }
});

// --- ▲▲ ここまでToDoリストのCRUD API ---
