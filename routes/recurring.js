const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// ── GET /groups/:groupId/recurring — List recurring ────
router.get('/groups/:groupId/recurring', async (req, res) => {
    try {
        const { groupId } = req.params;

        const { data, error } = await supabase
            .from('expenses')
            .select(`
        *,
        payer:members!paid_by(id, name),
        splits:expense_splits(*, member:members(id, name))
      `)
            .eq('group_id', groupId)
            .eq('is_recurring', true)
            .order('date', { ascending: false });

        if (error) throw error;

        // Check which ones are due for generation
        const today = new Date();
        const recurringExpenses = data.map((exp) => {
            const lastDate = new Date(exp.last_recurrence_date || exp.date);
            let nextDueDate;

            if (exp.recurrence_interval === 'weekly') {
                nextDueDate = new Date(lastDate);
                nextDueDate.setDate(nextDueDate.getDate() + 7);
            } else {
                // monthly
                nextDueDate = new Date(lastDate);
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            }

            return {
                ...exp,
                next_due_date: nextDueDate.toISOString().split('T')[0],
                is_due: nextDueDate <= today,
            };
        });

        res.json({ recurring_expenses: recurringExpenses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /recurring/:id/generate — Generate next entry ─
router.post('/recurring/:id/generate', async (req, res) => {
    try {
        const { id } = req.params;

        // Get the recurring expense
        const { data: original, error: fetchErr } = await supabase
            .from('expenses')
            .select('*, splits:expense_splits(*)')
            .eq('id', id)
            .eq('is_recurring', true)
            .single();

        if (fetchErr || !original) {
            return res.status(404).json({ error: 'Recurring expense not found' });
        }

        // Calculate next date
        const lastDate = new Date(original.last_recurrence_date || original.date);
        let nextDate;

        if (original.recurrence_interval === 'weekly') {
            nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + 7);
        } else {
            nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
        }

        const nextDateStr = nextDate.toISOString().split('T')[0];

        // Check if already generated
        const today = new Date();
        if (nextDate > today) {
            return res.status(400).json({
                error: 'Not yet due for generation',
                next_due_date: nextDateStr,
            });
        }

        // Create new expense entry
        const { data: newExpense, error: insertErr } = await supabase
            .from('expenses')
            .insert({
                group_id: original.group_id,
                title: `${original.title} (recurring)`,
                amount: original.amount,
                currency: original.currency,
                paid_by: original.paid_by,
                date: nextDateStr,
                split_method: original.split_method,
                is_recurring: false, // generated entries are not themselves recurring
                exchange_rate: original.exchange_rate,
                converted_amount: original.converted_amount,
            })
            .select()
            .single();

        if (insertErr) throw insertErr;

        // Copy splits
        const newSplits = original.splits.map((s) => ({
            expense_id: newExpense.id,
            member_id: s.member_id,
            amount: s.amount,
            item_description: s.item_description,
            percentage_or_shares: s.percentage_or_shares,
        }));

        const { error: splitErr } = await supabase
            .from('expense_splits')
            .insert(newSplits);

        if (splitErr) throw splitErr;

        // Update original's last recurrence date
        const { error: updateErr } = await supabase
            .from('expenses')
            .update({ last_recurrence_date: nextDateStr })
            .eq('id', id);

        if (updateErr) throw updateErr;

        res.status(201).json({
            message: 'Recurring expense generated',
            expense: newExpense,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
