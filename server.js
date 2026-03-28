require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request Logger ─────────────────────────────────────
app.use((req, res, next) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// ── Routes ─────────────────────────────────────────────
const groupRoutes = require('./routes/groups');
const memberRoutes = require('./routes/members');
const expenseRoutes = require('./routes/expenses');
const balanceRoutes = require('./routes/balances');
const recurringRoutes = require('./routes/recurring');
const currencyRoutes = require('./routes/currency');

app.use('/api/groups', groupRoutes);
app.use('/api', memberRoutes);
app.use('/api', expenseRoutes);
app.use('/api', balanceRoutes);
app.use('/api', recurringRoutes);
app.use('/api/currency', currencyRoutes);

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Split It Fair API is running 🚀',
        timestamp: new Date().toISOString(),
    });
});

// ── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Split It Fair server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
});
