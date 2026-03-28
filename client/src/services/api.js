const API_BASE = '/api';

async function request(url, options = {}) {
    const res = await fetch(`${API_BASE}${url}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

// ── Groups ─────────────────────────────────────────────
export const groupsAPI = {
    list: () => request('/groups'),
    get: (id) => request(`/groups/${id}`),
    create: (body) => request('/groups', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/groups/${id}`, { method: 'DELETE' }),
};

// ── Members ────────────────────────────────────────────
export const membersAPI = {
    list: (groupId) => request(`/groups/${groupId}/members`),
    add: (groupId, body) => request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => request(`/members/${id}`, { method: 'DELETE' }),
};

// ── Expenses ───────────────────────────────────────────
export const expensesAPI = {
    list: (groupId) => request(`/groups/${groupId}/expenses`),
    get: (id) => request(`/expenses/${id}`),
    create: (groupId, body) => request(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};

// ── Balances & Settlements ─────────────────────────────
export const balancesAPI = {
    getBalances: (groupId) => request(`/groups/${groupId}/balances`),
    getSettlements: (groupId) => request(`/groups/${groupId}/settlements`),
    getDashboard: (groupId, memberId) => request(`/groups/${groupId}/members/${memberId}/dashboard`),
};

// ── Recurring ──────────────────────────────────────────
export const recurringAPI = {
    list: (groupId) => request(`/groups/${groupId}/recurring`),
    generate: (id) => request(`/recurring/${id}/generate`, { method: 'POST' }),
};

// ── Currency ───────────────────────────────────────────
export const currencyAPI = {
    rates: (base = 'INR') => request(`/currency/rates?base=${base}`),
    convert: (from, to, amount) => request(`/currency/convert?from=${from}&to=${to}&amount=${amount}`),
    supported: () => request('/currency/supported'),
};
