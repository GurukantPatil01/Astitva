/**
 * Export expenses to CSV
 */
export function exportToCSV(expenses, groupName, currencySymbol) {
    const headers = ['Date', 'Title', 'Amount', 'Currency', 'Paid By', 'Split Method', 'Converted Amount', 'Exchange Rate'];

    const rows = expenses.map((e) => [
        e.date,
        `"${e.title}"`,
        e.amount,
        e.currency,
        e.payer?.name || '',
        e.split_method,
        e.converted_amount || e.amount,
        e.exchange_rate || 1,
    ]);

    const csv = [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupName.replace(/\s+/g, '_')}_expenses.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Filter and search expenses
 */
export function filterExpenses(expenses, searchQuery, filterMethod) {
    let filtered = expenses;

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((e) =>
            e.title.toLowerCase().includes(q) ||
            (e.payer?.name || '').toLowerCase().includes(q)
        );
    }

    if (filterMethod && filterMethod !== 'all') {
        filtered = filtered.filter((e) => e.split_method === filterMethod);
    }

    return filtered;
}
