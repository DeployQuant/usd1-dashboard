const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const USERNAME = process.env.DASH_USER || 'USD1';
const PASSWORD = process.env.DASH_PASS || 'AgenticPayments123!';

// Basic auth middleware
app.use((req, res, next) => {
  if (req.path === '/api/health') return next();

  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="USD1 Command Center"');
    return res.status(401).send('Authentication required');
  }

  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [user, pass] = decoded.split(':');

  if (user !== USERNAME || pass !== PASSWORD) {
    res.setHeader('WWW-Authenticate', 'Basic realm="USD1 Command Center"');
    return res.status(401).send('Invalid credentials');
  }

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
