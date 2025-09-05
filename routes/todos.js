const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

// ## ToDo作成API (POST /api/todos) ##
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, due_date, category } = req.body;
    const userId = req.user.userId;

    if (!title) {
      return res.status(400).json({ error: "タイトルは必須です。" });
    }

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
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const allTodos = await pool.query("SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC", [userId]);

    res.json(allTodos.rows);
});

// ## ToDo更新API (PUT /api/todos/:id) ##
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, priority, due_date, category, is_completed } = req.body;

    const todo = await pool.query("SELECT * FROM todos WHERE id = $1 AND user_id = $2", [id, userId]);
    if (todo.rows.length === 0) {
      return res.status(404).json({ error: "対象のToDoが見つからないか、アクセス権がありません。" });
    }

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
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

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

module.exports = router;
