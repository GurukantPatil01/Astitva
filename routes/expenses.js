const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { calculateSplits } = require('../utils/splitCalculator');
const { convertCurrency } = require('../utils/currencyService');

// ── POST /groups/:groupId/expenses — Add expense ───────
router.post('/groups/:groupId/expenses', async (req, res) => {
    try {
        const { groupId } = req.params;
        const {
            title,
            amount,
            currency = 'INR',
            paid_by,
            date,
            split_method = 'equal',
            split_details = {},
            members: splitMembers,
            is_recurring = false,
            recurrence_interval = null,
            category = 'Others',
        } = req.body;

        // ── Validation ─────────────────────────────────────
        if (!title || !amount || !paid_by) {
            return res.status(400).json({
                error: 'title, amount, and paid_by are required',
            });
        }

        if (amount <= 0) {
            return res.status(400).json({ error: 'Amount must be positive' });
        }

        // Verify group exists and get base currency
        const { data: group, error: groupErr } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (groupErr || !group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // ── Currency conversion ────────────────────────────
        let exchangeRate = 1.0;
        let convertedAmount = amount;

        if (currency.toUpperCase() !== group.base_currency.toUpperCase()) {
            const conversion = await convertCurrency(amount, currency, group.base_currency);
            exchangeRate = conversion.exchangeRate;
            convertedAmount = conversion.convertedAmount;
        }

        // ── Get members for split ──────────────────────────
        let memberIds = splitMembers;
        if (!memberIds || memberIds.length === 0) {
            // Default: all group members
            const { data: allMembers } = await supabase
                .from('members')
                .select('id')
                .eq('group_id', groupId);
            memberIds = allMembers.map((m) => m.id);
        }

        if (memberIds.length === 0) {
            return res.status(400).json({ error: 'No members to split expense among' });
        }

        // ── Calculate splits ───────────────────────────────
        const splits = calculateSplits(convertedAmount, split_method, memberIds, split_details);

        // ── Insert expense ─────────────────────────────────
        const { data: expense, error: expError } = await supabase
            .from('expenses')
            .insert({
                group_id: parseInt(groupId),
                title: title.trim(),
                amount: parseFloat(amount),
                currency: currency.toUpperCase(),
                paid_by: parseInt(paid_by),
                date: date || new Date().toISOString().split('T')[0],
                split_method,
                is_recurring,
                recurrence_interval: is_recurring ? recurrence_interval : null,
                last_recurrence_date: is_recurring ? (date || new Date().toISOString().split('T')[0]) : null,
                category: category || 'Others',
                exchange_rate: exchangeRate,
                converted_amount: convertedAmount,
            })
            .select()
            .single();

        if (expError) throw expError;

        // ── Insert splits ──────────────────────────────────
        const splitInserts = splits.map((s) => ({
            expense_id: expense.id,
            member_id: s.member_id,
            amount: s.amount,
            item_description: s.item_description,
            percentage_or_shares: s.percentage_or_shares,
        }));

        const { data: insertedSplits, error: splitError } = await supabase
            .from('expense_splits')
            .insert(splitInserts)
            .select();

        if (splitError) throw splitError;

        res.status(201).json({
            message: 'Expense added',
            expense: { ...expense, splits: insertedSplits },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /groups/:groupId/expenses — List expenses ──────
router.get('/groups/:groupId/expenses', async (req, res) => {
    try {
        const { groupId } = req.params;

        const { data: expenses, error } = await supabase
            .from('expenses')
            .select(`
        *,
        payer:members!paid_by(id, name),
        splits:expense_splits(*, member:members(id, name))
      `)
            .eq('group_id', groupId)
            .order('date', { ascending: false });

        if (error) throw error;

        res.json({ expenses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /expenses/:id — Get single expense ─────────────
router.get('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: expense, error } = await supabase
            .from('expenses')
            .select(`
        *,
        payer:members!paid_by(id, name),
        splits:expense_splits(*, member:members(id, name))
      `)
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ expense });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /expenses/:id — Delete expense ──────────────
router.delete('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
