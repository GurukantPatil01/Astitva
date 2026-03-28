const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// ── POST /groups/:groupId/members — Add member ─────────
router.post('/groups/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Member name is required' });
        }

        // Verify group exists
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('id')
            .eq('id', groupId)
            .single();

        if (groupError || !group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check for duplicate name in group
        const { data: existing } = await supabase
            .from('members')
            .select('id')
            .eq('group_id', groupId)
            .ilike('name', name.trim());

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Member with this name already exists in the group' });
        }

        const { data, error } = await supabase
            .from('members')
            .insert({ name: name.trim(), group_id: parseInt(groupId) })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ message: 'Member added', member: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /groups/:groupId/members — List members ────────
router.get('/groups/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params;

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at');

        if (error) throw error;

        res.json({ members: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /members/:id — Remove member ────────────────
router.delete('/members/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if member has any expenses
        const { data: expenses } = await supabase
            .from('expenses')
            .select('id')
            .eq('paid_by', id)
            .limit(1);

        if (expenses && expenses.length > 0) {
            return res.status(409).json({
                error: 'Cannot delete member — they have expenses. Delete their expenses first.',
            });
        }

        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Member removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
