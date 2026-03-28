const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { simplifyDebts, calculateNetBalances } = require('../utils/debtSimplifier');

// ── GET /groups/:groupId/balances — Member balances ────
router.get('/groups/:groupId/balances', async (req, res) => {
    try {
        const { groupId } = req.params;

        // Get all members
        const { data: members, error: memErr } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', groupId);

        if (memErr) throw memErr;

        // Get all expenses with splits
        const { data: expenses, error: expErr } = await supabase
            .from('expenses')
            .select('*, splits:expense_splits(*)')
            .eq('group_id', groupId);

        if (expErr) throw expErr;

        // Calculate net balances
        const netBalances = calculateNetBalances(expenses);

        // Build member balance report
        const balances = members.map((member) => {
            const balance = netBalances[member.id] || 0;
            return {
                member_id: member.id,
                member_name: member.name,
                net_balance: Math.round(balance * 100) / 100,
                status: balance > 0.01 ? 'is_owed' : balance < -0.01 ? 'owes' : 'settled',
            };
        });

        res.json({ balances });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /groups/:groupId/settlements — Simplified debts ─
router.get('/groups/:groupId/settlements', async (req, res) => {
    try {
        const { groupId } = req.params;

        // Get group details
        const { data: group, error: grpErr } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (grpErr) return res.status(404).json({ error: 'Group not found' });

        // Get all members
        const { data: members, error: memErr } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', groupId);

        if (memErr) throw memErr;

        // Get all expenses with splits
        const { data: expenses, error: expErr } = await supabase
            .from('expenses')
            .select('*, splits:expense_splits(*)')
            .eq('group_id', groupId);

        if (expErr) throw expErr;

        // Calculate net balances and simplify
        const netBalances = calculateNetBalances(expenses);
        const settlements = simplifyDebts(netBalances);

        // Create a member name lookup
        const memberMap = {};
        members.forEach((m) => (memberMap[m.id] = m.name));

        // Enrich settlements with names
        const enrichedSettlements = settlements.map((s) => ({
            from_id: s.from,
            from_name: memberMap[s.from] || 'Unknown',
            to_id: s.to,
            to_name: memberMap[s.to] || 'Unknown',
            amount: s.amount,
            currency: group.base_currency,
        }));

        res.json({
            group_name: group.name,
            base_currency: group.base_currency,
            total_transactions: enrichedSettlements.length,
            settlements: enrichedSettlements,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /groups/:groupId/members/:memberId/dashboard ───
router.get('/groups/:groupId/members/:memberId/dashboard', async (req, res) => {
    try {
        const { groupId, memberId } = req.params;

        // Get member info
        const { data: member, error: memErr } = await supabase
            .from('members')
            .select('*')
            .eq('id', memberId)
            .single();

        if (memErr) return res.status(404).json({ error: 'Member not found' });

        // Get group info
        const { data: group } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        // Get all members
        const { data: allMembers } = await supabase
            .from('members')
            .select('*')
            .eq('group_id', groupId);

        // Get all expenses with splits
        const { data: expenses, error: expErr } = await supabase
            .from('expenses')
            .select('*, splits:expense_splits(*)')
            .eq('group_id', groupId);

        if (expErr) throw expErr;

        // Calculate pairwise balances for this member
        const pairwiseBalances = {};
        const memberMap = {};
        allMembers.forEach((m) => {
            memberMap[m.id] = m.name;
            if (m.id !== parseInt(memberId)) {
                pairwiseBalances[m.id] = 0;
            }
        });

        for (const expense of expenses) {
            const payerId = expense.paid_by;
            const splits = expense.splits || [];

            for (const split of splits) {
                const splitMemberId = split.member_id;
                const splitAmount = parseFloat(split.amount);

                if (payerId === parseInt(memberId) && splitMemberId !== parseInt(memberId)) {
                    // I paid, they owe me
                    pairwiseBalances[splitMemberId] = (pairwiseBalances[splitMemberId] || 0) + splitAmount;
                } else if (splitMemberId === parseInt(memberId) && payerId !== parseInt(memberId)) {
                    // Someone else paid, I owe them
                    pairwiseBalances[payerId] = (pairwiseBalances[payerId] || 0) - splitAmount;
                }
            }
        }

        // Build the dashboard
        let totalOwed = 0; // money others owe me
        let totalOwes = 0; // money I owe others
        const details = [];

        for (const [otherMemberId, balance] of Object.entries(pairwiseBalances)) {
            const roundedBalance = Math.round(balance * 100) / 100;
            if (Math.abs(roundedBalance) < 0.01) continue;

            if (roundedBalance > 0) {
                totalOwed += roundedBalance;
                details.push({
                    member_id: parseInt(otherMemberId),
                    member_name: memberMap[otherMemberId],
                    amount: roundedBalance,
                    direction: 'owes_you',
                    description: `${memberMap[otherMemberId]} owes you ₹${roundedBalance.toFixed(2)}`,
                });
            } else {
                totalOwes += Math.abs(roundedBalance);
                details.push({
                    member_id: parseInt(otherMemberId),
                    member_name: memberMap[otherMemberId],
                    amount: Math.abs(roundedBalance),
                    direction: 'you_owe',
                    description: `You owe ${memberMap[otherMemberId]} ₹${Math.abs(roundedBalance).toFixed(2)}`,
                });
            }
        }

        res.json({
            member: { id: member.id, name: member.name },
            group: { id: group.id, name: group.name, base_currency: group.base_currency },
            summary: {
                total_owed_to_you: Math.round(totalOwed * 100) / 100,
                total_you_owe: Math.round(totalOwes * 100) / 100,
                net_balance: Math.round((totalOwed - totalOwes) * 100) / 100,
            },
            details,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
