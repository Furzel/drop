import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const store = new Map<string, { payload: object; expires: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expires < now) store.delete(key);
  }
}, 60_000);

app.post('/relay', (req, res) => {
  const { payload } = req.body as { payload: object };
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ error: 'payload required' });
    return;
  }
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  store.set(code, { payload, expires: Date.now() + 5 * 60 * 1000 });
  res.json({ code });
});

app.get('/relay/:code', (req, res) => {
  const entry = store.get(req.params.code);
  if (!entry || entry.expires < Date.now()) {
    res.status(404).json({ error: 'expired or not found' });
    return;
  }
  res.json(entry.payload);
});

app.listen(3001, () => {
  console.log('Drop relay running on http://localhost:3001');
});
