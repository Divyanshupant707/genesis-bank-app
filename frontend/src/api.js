const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, adminPassword } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminPassword) headers['x-admin-password'] = adminPassword;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    throw new Error(
      `Could not reach the Genesis Bank server at ${BASE_URL}. Is the backend running?`
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (name, password) => request('/api/auth/signup', { method: 'POST', body: { name, password } }),
  login: (userID, password) => request('/api/auth/login', { method: 'POST', body: { userID, password } }),
  adminLogin: (password) => request('/api/admin/login', { method: 'POST', body: { password } }),

  getAccounts: (userID) => request(`/api/users/${userID}/accounts`),
  createAccount: (userID, accountType, initialBalance) =>
    request(`/api/users/${userID}/accounts`, { method: 'POST', body: { accountType, initialBalance } }),
  deposit: (accountNumber, userID, amount) =>
    request(`/api/accounts/${accountNumber}/deposit`, { method: 'POST', body: { userID, amount } }),
  withdraw: (accountNumber, userID, amount) =>
    request(`/api/accounts/${accountNumber}/withdraw`, { method: 'POST', body: { userID, amount } }),

  getLoans: (userID) => request(`/api/users/${userID}/loans`),
  applyLoan: (userID, amount, rate, duration) =>
    request(`/api/users/${userID}/loans`, { method: 'POST', body: { amount, rate, duration } }),

  getTransactions: (userID) => request(`/api/users/${userID}/transactions`),

  admin: {
    users: (adminPassword) => request('/api/admin/users', { adminPassword }),
    accounts: (adminPassword) => request('/api/admin/accounts', { adminPassword }),
    transactions: (adminPassword) => request('/api/admin/transactions', { adminPassword }),
    loans: (adminPassword) => request('/api/admin/loans', { adminPassword }),
    processInterest: (adminPassword) =>
      request('/api/admin/process-interest', { method: 'POST', adminPassword })
  }
};
