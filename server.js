// server.js

// 1. Expressをインポートする
const express = require('express');
// --- ▼▼ 追加 ▼▼ ---
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
// --- ▲▲ 追加 ▲▲ ---

// 2. Expressアプリのインスタンスを作成する
const app = express();
// --- ▼▼ 追加 ▼▼ ---
// POSTリクエストのbodyをJSONとして解析するために必要
app.use(express.json()); 
// --- ▲▲ 追加 ▲▲ ---

// 3. サーバーがリッスンするポート番号を設定する
const port = 3000;

// --- ▼▼ 追加 ▼▼ ---
// データベース接続設定
const pool = new Pool({
  user: 'your_db_user',       // ご自身のPostgreSQLユーザー名
  host: 'localhost',
  database: 'secret_base_db', // ご自身のデータベース名
  password: 'your_db_password',  // ご自身のパスワード
  port: 5432,
});

// JWTの秘密鍵（これは絶対に公開しないでください）
const JWT_SECRET = 'your-super-secret-key'; 
// --- ▲▲ 追加 ▲▲ ---


// 4. ルートURL ('/') へのGETリクエストに対する処理
app.get('/', (req, res) => {
  res.send('皆の秘密基地サーバーへようこそ！');
});


// --- ▼▼ ここからAPIを実装 ▼▼ ---

// ## アカウント登録API (/api/register) ##
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // パスワードをハッシュ化
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // データベースに新しいユーザーを保存
    const newUser = await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *",
      [username, hashedPassword]
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
    const validPassword = await bcrypt.compare(password, user.rows[0].password);

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