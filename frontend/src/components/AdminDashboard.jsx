import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Button, Card, SectionLabel, StampBadge, Spinner } from './ui';

const NAV = [
  { id: 'users', label: 'Users' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'loans', label: 'Loans' }
];

const money = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminDashboard({ adminPassword, onLogout, notify }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [u, a, t, l] = await Promise.all([
        api.admin.users(adminPassword),
        api.admin.accounts(adminPassword),
        api.admin.transactions(adminPassword),
        api.admin.loans(adminPassword)
      ]);
      setUsers(u.users);
      setAccounts(a.accounts);
      setTransactions(t.transactions);
      setLoans(l.loans);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [adminPassword, notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleProcessInterest() {
    setProcessing(true);
    try {
      const { message } = await api.admin.processInterest(adminPassword);
      notify(message, 'success');
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <header className="border-b border-paper/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-vault-light">
              Genesis Bank &middot; Admin Mode
            </div>
            <div className="font-display text-xl text-paper">Master Directory</div>
          </div>
          <div className="flex gap-3">
            <Button variant="vault" onClick={handleProcessInterest} disabled={processing}>
              {processing && <Spinner />} Process Interest for All
            </Button>
            <Button variant="ghost" onClick={onLogout}>
              Exit Admin Mode
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <nav className="mb-8 flex gap-1 border-b border-paper/10">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`relative px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === n.id ? 'text-vault-light' : 'text-paper/40 hover:text-paper/70'
              }`}
            >
              {n.label}
              {tab === n.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-vault-light" />}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="flex items-center gap-2 justify-center py-20 text-paper/40">
            <Spinner /> Loading master records...
          </div>
        ) : (
          <>
            {tab === 'users' && (
              <div className="animate-rise space-y-6">
                <SectionLabel eyebrow={`${users.length} Registered`} title="All Users" />
                <Table
                  columns={['User ID', 'Name']}
                  rows={users.map((u) => [u.userID, u.name])}
                  empty="No users registered yet."
                />
              </div>
            )}
            {tab === 'accounts' && (
              <div className="animate-rise space-y-6">
                <SectionLabel eyebrow={`${accounts.length} Accounts`} title="All Bank Accounts" />
                <Table
                  columns={['Acct No.', 'Type', 'Balance', 'Owner ID']}
                  rows={accounts.map((a) => [
                    a.accountNumber,
                    <StampBadge tone={a.accountType === 'Savings' ? 'brass' : 'vault'}>{a.accountType}</StampBadge>,
                    money(a.balance),
                    a.ownerUserID
                  ])}
                  empty="No accounts registered yet."
                />
              </div>
            )}
            {tab === 'transactions' && (
              <div className="animate-rise space-y-6">
                <SectionLabel eyebrow={`${transactions.length} Entries`} title="Master Transaction Log" />
                <Table
                  columns={['Tx ID', 'Account', 'Type', 'Amount', 'Date']}
                  rows={transactions.map((t) => [t.transactionID, t.accountNumber, t.transactionType, money(t.amount), t.date])}
                  empty="No transactions recorded yet."
                />
              </div>
            )}
            {tab === 'loans' && (
              <div className="animate-rise space-y-6">
                <SectionLabel eyebrow={`${loans.length} Loans`} title="Master Loan Directory" />
                <Table
                  columns={['Loan ID', 'User ID', 'Principal', 'Rate', 'Term', 'Monthly EMI']}
                  rows={loans.map((l) => [
                    l.loanID,
                    l.ownerUserID,
                    money(l.loanAmount),
                    `${l.interestRate}%`,
                    `${l.duration} mo`,
                    money(l.emi)
                  ])}
                  empty="No loans recorded yet."
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Table({ columns, rows, empty }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-paper/15 py-14 text-center text-sm text-paper/40">
        {empty}
      </div>
    );
  }
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-paper/10 bg-ink-light/60 font-mono text-[11px] uppercase tracking-widest text-paper/40">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-paper/5 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
