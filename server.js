const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Task status persistence (in-memory; survives restarts via Railway volume if needed)
let taskStatuses = {};

app.get('/api/tasks', (req, res) => {
  res.json(taskStatuses);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  taskStatuses[id] = status;
  res.json({ id, status });
});

app.put('/api/tasks', (req, res) => {
  taskStatuses = { ...taskStatuses, ...req.body };
  res.json(taskStatuses);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`USD1 Dashboard running on port ${PORT}`);
});
