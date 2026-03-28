const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// ── GET /dashboard — Global dashboard for "Me" ────────
router.get('/dashboard', async (req, res) => {
    try {
        const ME_NAMES = ['Gurukant Patil', 'Me', 'Gurukant']; // We identify the global user by these names

        // Find all member records that represent the current user
        const { data: myMembers, error: myMemErr } = await supabase
            .from('members')
            .select('*')
            .in('name', ME_NAMES);

        if (myMemErr) throw myMemErr;

        let totalOwedToYou = 0;
        let totalYouOwe = 0;
        const myGroupIds = myMembers.map(m => m.group_id);
        const myMemberIdsInGroups = {}; // groupId -> memberId
        myMembers.forEach(m => { myMemberIdsInGroups[m.group_id] = m.id; });

        // Get all expenses across all groups the user is part of
        let allExpenses = [];
        let activities = [];

        if (myGroupIds.length > 0) {
            const { data: expenses, error: expErr } = await supabase
                .from('expenses')
                .select('*, splits:expense_splits(*), group:groups(*), payer:members!expenses_paid_by_fkey(name)')
                .in('group_id', myGroupIds)
                .order('created_at', { ascending: false });

            if (expErr) throw expErr;
            allExpenses = expenses;

            // Generate Activity Feed
            activities = expenses.slice(0, 20).map(exp => ({
                id: exp.id,
                title: exp.title,
                amount: exp.amount,
                currency: exp.currency,
                group_name: exp.group?.name || 'Unknown Group',
                paid_by_name: exp.payer?.name || 'Someone',
                date: exp.date,
                created_at: exp.created_at
            }));
        }

        let friendsIndex = {}; // friendName -> balance

        // Get names of all members in my groups to resolve who owes me
        let memberNames = {};
        if (myGroupIds.length > 0) {
            const { data: allMembersInMyGroups, error: memErr } = await supabase
                .from('members')
                .select('*')
                .in('group_id', myGroupIds);
            if (memErr) throw memErr;
            if (allMembersInMyGroups) {
                allMembersInMyGroups.forEach(m => { memberNames[m.id] = m.name; });
            }
        }

        // Calculate global balances per group and pairwise friends
        for (const groupId of myGroupIds) {
            const myId = myMemberIdsInGroups[groupId];
            const groupExpenses = allExpenses.filter(e => e.group_id === groupId);
            
            // Calculate pairwise balances for me in this group
            let myGroupBalance = 0; 
            
            for (const expense of groupExpenses) {
                const payerId = expense.paid_by;
                const splits = expense.splits || [];
                
                for (const split of splits) {
                    const splitMemberId = split.member_id;
                    const splitAmount = parseFloat(split.amount);

                    if (payerId === myId && splitMemberId !== myId) {
                        // I paid, they owe me
                        myGroupBalance += splitAmount;
                        const friendName = memberNames[splitMemberId];
                        if (friendName && !ME_NAMES.includes(friendName)) {
                            friendsIndex[friendName] = (friendsIndex[friendName] || 0) + splitAmount;
                        }
                    } else if (splitMemberId === myId && payerId !== myId) {
                        // Someone else paid, I owe them
                        myGroupBalance -= splitAmount;
                        const friendName = memberNames[payerId];
                        if (friendName && !ME_NAMES.includes(friendName)) {
                            friendsIndex[friendName] = (friendsIndex[friendName] || 0) - splitAmount;
                        }
                    }
                }
            }

            // Simplified sum:
            if (myGroupBalance > 0.01) {
                totalOwedToYou += myGroupBalance;
            } else if (myGroupBalance < -0.01) {
                totalYouOwe += Math.abs(myGroupBalance);
            }
        }

        // Convert friendsIndex to array
        const friends = Object.entries(friendsIndex).map(([name, balance]) => ({
            name,
            balance: Math.round(balance * 100) / 100
        })).filter(f => Math.abs(f.balance) > 0.01);

        res.json({
            summary: {
                total_owed_to_you: Math.round(totalOwedToYou * 100) / 100,
                total_you_owe: Math.round(totalYouOwe * 100) / 100,
                net_balance: Math.round((totalOwedToYou - totalYouOwe) * 100) / 100
            },
            activities,
            friends
        });
    } catch (err) {
        console.error('Error fetching global dashboard:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
