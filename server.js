const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const LEADERSHIP = {
  username: process.env.DASH_USER || 'USD1',
  password: process.env.DASH_PASS || 'AgenticPayments123!'
};

const TEAMS = {
  eng: {
    id: 'eng', pillar: 'Pillar 1', name: 'Engineering', lead: 'Yu Feng', color: '#3B82F6',
    username: 'engineering', password: process.env.ENG_PASS || 'Build&Ship#2026!'
  },
  bd: {
    id: 'bd', pillar: 'Pillar 2', name: 'Business Development', lead: 'Zach & Zach', color: '#8B5CF6',
    username: 'bd', password: process.env.BD_PASS || 'CloseDeals$2026!'
  },
  defi: {
    id: 'defi', pillar: 'Pillar 3', name: 'DeFi & Exchange', lead: 'Justin', color: '#10B981',
    username: 'defi', password: process.env.DEFI_PASS || 'Yield&Liquidity#2026!'
  },
  legal: {
    id: 'legal', pillar: 'Pillar 4', name: 'Legal & Compliance', lead: 'Mack', color: '#F59E0B',
    username: 'legal', password: process.env.LEGAL_PASS || 'Terms&Trust#2026!'
  },
  mktg: {
    id: 'mktg', pillar: 'Pillar 5', name: 'Marketing', lead: 'Shawn', color: '#EF4444',
    username: 'marketing', password: process.env.MKTG_PASS || 'Story&Growth#2026!'
  }
};

function checkAuth(req, username, password) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Basic ')) return false;
  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const colonIndex = decoded.indexOf(':');
  const u = decoded.substring(0, colonIndex);
  const p = decoded.substring(colonIndex + 1);
  return u === username && p === password;
}

function requireAuth(username, password, realm) {
  return (req, res, next) => {
    if (checkAuth(req, username, password)) return next();
    res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    return res.status(401).send('Authentication required');
  };
}

app.use(express.json());

// Health — no auth
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Task API — any valid credential
let taskStatuses = {};

app.use('/api/tasks', (req, res, next) => {
  if (checkAuth(req, LEADERSHIP.username, LEADERSHIP.password)) return next();
  for (const team of Object.values(TEAMS)) {
    if (checkAuth(req, team.username, team.password)) return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="USD1"');
  return res.status(401).send('Authentication required');
});

app.get('/api/tasks', (req, res) => res.json(taskStatuses));
app.put('/api/tasks/:id', (req, res) => {
  taskStatuses[req.params.id] = req.body.status;
  res.json({ id: req.params.id, status: req.body.status });
});
app.put('/api/tasks', (req, res) => {
  taskStatuses = { ...taskStatuses, ...req.body };
  res.json(taskStatuses);
});

// Team routes — BEFORE leadership catch-all
Object.values(TEAMS).forEach(team => {
  app.get(`/${team.id}`,
    requireAuth(team.username, team.password, `${team.name} Dashboard`),
    (req, res) => {
      const html = fs.readFileSync(path.join(__dirname, 'public', 'team.html'), 'utf8');
      const injected = html.replace('__TEAM_CONFIG__', JSON.stringify({
        id: team.id, pillar: team.pillar, name: team.name, lead: team.lead, color: team.color
      }));
      res.send(injected);
    }
  );
});

// Leadership root — AFTER team routes
app.get('/',
  requireAuth(LEADERSHIP.username, LEADERSHIP.password, 'USD1 Leadership'),
  (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`USD1 Dashboard running on port ${PORT}`);
});
