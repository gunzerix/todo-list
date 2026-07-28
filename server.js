require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Security ----------
app.use(helmet({ hsts: false }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,            // limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// ---------- Logging ----------
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream })); // file log (for monitoring/analysis)
app.use(morgan('dev')); // console log (for docker logs / docker-compose logs)

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Health check (used by monitoring / load balancer) ----------
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ---------- Todo API ----------
app.get('/api/todos', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY id DESC').all();
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const info = db.prepare('INSERT INTO todos (title) VALUES (?)').run(title.trim());
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  const existing = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'not found' });

  db.prepare('UPDATE todos SET done = ? WHERE id = ?').run(done ? 1 : 0, id);
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
  res.json(todo);
});

app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM todos WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

// ---------- Fallback ----------
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Todo app listening on port ${PORT}`);
  });
}

module.exports = app;
