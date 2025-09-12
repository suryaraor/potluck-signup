const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3002; // Use different port to avoid conflicts

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/potlucks', (req, res) => {
  console.log('Potluck creation requested:', req.body);
  res.json({ id: 1, name: req.body.name, date: req.body.date });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);
  console.log('Server is ready to accept connections');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});