/**
 * Debt Simplification Algorithm
 * Minimizes the number of transactions needed to settle all debts.
 *
 * Algorithm: Greedy min-cash-flow
 * 1. Calculate net balance for each member (positive = creditor, negative = debtor)
 * 2. Find the max creditor and max debtor
 * 3. Settle min(maxCredit, maxDebt) between them
 * 4. Repeat until all settled
 */

/**
 * Simplify debts to minimum transactions
 * @param {Array} expenses - Array of expense objects with splits
 * @returns {Array} Simplified settlement transactions [{ from, to, amount }]
 */
function simplifyDebts(balances) {
    // balances is an object: { memberId: netBalance }
    // positive = owed money (creditor), negative = owes money (debtor)

    // Separate creditors and debtors
    const creditors = []; // people who are owed money
    const debtors = [];   // people who owe money

    for (const [memberId, balance] of Object.entries(balances)) {
        const roundedBalance = Math.round(balance * 100) / 100;
        if (roundedBalance > 0) {
            creditors.push({ id: parseInt(memberId), amount: roundedBalance });
        } else if (roundedBalance < 0) {
            debtors.push({ id: parseInt(memberId), amount: Math.abs(roundedBalance) });
        }
    }

    // Sort descending by amount for optimal settlement
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const settlements = [];

    let i = 0; // creditor index
    let j = 0; // debtor index

    while (i < creditors.length && j < debtors.length) {
        const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);
        const roundedAmount = Math.round(settleAmount * 100) / 100;

        if (roundedAmount > 0) {
            settlements.push({
                from: debtors[j].id,
                to: creditors[i].id,
                amount: roundedAmount,
            });
        }

        creditors[i].amount -= settleAmount;
        debtors[j].amount -= settleAmount;

        // Round to avoid floating point issues
        creditors[i].amount = Math.round(creditors[i].amount * 100) / 100;
        debtors[j].amount = Math.round(debtors[j].amount * 100) / 100;

        if (creditors[i].amount === 0) i++;
        if (debtors[j].amount === 0) j++;
    }

    return settlements;
}

/**
 * Calculate net balances from expense data
 * @param {Array} expenses - Expenses with their splits
 * @returns {Object} { memberId: netBalance }
 */
function calculateNetBalances(expenses) {
    const balances = {};

    for (const expense of expenses) {
        const payerId = expense.paid_by;
        const amount = parseFloat(expense.converted_amount || expense.amount);

        // Payer is owed back the total amount
        if (!balances[payerId]) balances[payerId] = 0;
        balances[payerId] += amount;

        // Each split member owes their share
        if (expense.splits) {
            for (const split of expense.splits) {
                const memberId = split.member_id;
                const splitAmount = parseFloat(split.amount);
                if (!balances[memberId]) balances[memberId] = 0;
                balances[memberId] -= splitAmount;
            }
        }
    }

    return balances;
}

module.exports = { simplifyDebts, calculateNetBalances };
