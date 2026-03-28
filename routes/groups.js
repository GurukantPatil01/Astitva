const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// ── POST / — Create a new group ────────────────────────
router.post('/', async (req, res) => {
    try {
        const { name, base_currency = 'INR', members = ['Me'] } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        // 1. Insert Group
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .insert({ name: name.trim(), base_currency: base_currency.toUpperCase() })
            .select()
            .single();

        if (groupError) throw groupError;

        // 2. Insert Members
        if (members && Array.isArray(members) && members.length > 0) {
            const memberInserts = members.map(mName => ({
                name: mName.trim(),
                group_id: group.id
            }));

            const { error: memError } = await supabase
                .from('members')
                .insert(memberInserts);

            if (memError) throw memError;
        }

        res.status(201).json({ message: 'Group created', group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET / — List all groups ────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('groups')
            .select('*, members(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const groups = data.map((g) => ({
            ...g,
            member_count: g.members?.[0]?.count || 0,
        }));

        res.json({ groups });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /:id — Get group details with members ──────────
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', id)
            .single();

        if (groupError) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const { data: members, error: memberError } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', id)
            .order('created_at');

        if (memberError) throw memberError;

        res.json({ group: { ...group, members } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PUT /:id — Update group ────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, base_currency } = req.body;

        const updates = {};
        if (name) updates.name = name.trim();
        if (base_currency) updates.base_currency = base_currency.toUpperCase();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Nothing to update' });
        }

        const { data, error } = await supabase
            .from('groups')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Group not found' });

        res.json({ message: 'Group updated', group: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /:id — Delete group ─────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Group deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
