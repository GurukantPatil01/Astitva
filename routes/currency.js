const express = require('express');
const router = express.Router();
const { getExchangeRates, convertCurrency, getSupportedCurrencies } = require('../utils/currencyService');

// ── GET /rates — Get exchange rates for a base currency ─
router.get('/rates', async (req, res) => {
    try {
        const base = (req.query.base || 'INR').toUpperCase();
        const rates = await getExchangeRates(base);

        res.json({
            base,
            rates,
            cached: true,
            message: `Exchange rates for ${base}`,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /convert — Convert amount ──────────────────────
router.get('/convert', async (req, res) => {
    try {
        const { from, to, amount } = req.query;

        if (!from || !to || !amount) {
            return res.status(400).json({ error: 'from, to, and amount query params are required' });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const result = await convertCurrency(parsedAmount, from, to);

        res.json({
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            original_amount: parsedAmount,
            converted_amount: result.convertedAmount,
            exchange_rate: result.exchangeRate,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /supported — List supported currencies ─────────
router.get('/supported', async (req, res) => {
    try {
        const currencies = await getSupportedCurrencies();
        res.json({ count: currencies.length, currencies });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
