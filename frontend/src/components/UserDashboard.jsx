import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { api } from '../api';
import { Button, Field, Select, Card, SectionLabel, StampBadge, Spinner } from './ui';

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'loans', label: 'Loans' },
  { id: 'history', label: 'Transactions' }
];

const money = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function UserDashboard({ user, onLogout, notify }) {
  const [tab, setTab] = useState('overview');
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, loanRes, txRes] = await Promise.all([
        api.getAccounts(user.userID),
        api.getLoans(user.userID),
        api.getTransactions(user.userID)
      ]);
      setAccounts(accRes.accounts);
      setLoans(loanRes.loans);
      setTransactions(txRes.transactions);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user.userID, notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emi, 0);

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <Header user={user} onLogout={onLogout} />

      <div className="mx-auto max-w-6xl px-6 pb-20 pt-8">
        <nav className="mb-8 flex gap-1 border-b border-paper/10">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`relative px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors ${
                tab === n.id ? 'text-brass' : 'text-paper/40 hover:text-paper/70'
              }`}
            >
              {n.label}
              {tab === n.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brass" />
              )}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="flex items-center gap-2 py-20 justify-center text-paper/40">
            <Spinner /> Loading your ledger...
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <Overview accounts={accounts} loans={loans} totalBalance={totalBalance} totalEMI={totalEMI} />
            )}
            {tab === 'accounts' && (
              <AccountsTab user={user} accounts={accounts} refresh={refresh} notify={notify} />
            )}
            {tab === 'loans' && <LoansTab user={user} loans={loans} refresh={refresh} notify={notify} />}
            {tab === 'history' && <HistoryTab transactions={transactions} />}
          </>
        )}
      </div>
    </div>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="border-b border-paper/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass/60">Genesis Bank</div>
          <div className="font-display text-xl text-paper">
            Welcome, {user.name} <span className="text-paper/30">&middot;</span>{' '}
            <span className="font-mono text-sm text-paper/40">ID {user.userID}</span>
          </div>
        </div>
        <Button variant="ghost" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

function StatCard({ eyebrow, value, sub }) {
  return (
    <Card className="p-5">
      <div className="font-mono text-[11px] uppercase tracking-widest text-paper/40">{eyebrow}</div>
      <div className="mt-2 font-display text-3xl text-paper">{value}</div>
      {sub && <div className="mt-1 text-xs text-paper/40">{sub}</div>}
    </Card>
  );
}

function Overview({ accounts, loans, totalBalance, totalEMI }) {
  const chartData = accounts.map((a) => ({
    name: `#${a.accountNumber}`,
    balance: Number(a.balance.toFixed(2)),
    type: a.accountType
  }));

  return (
    <div className="space-y-8 animate-rise">
      <SectionLabel
        eyebrow="Ledger Summary"
        title="Your Financial Overview"
        subtitle="A snapshot of holdings, obligations, and standing."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard eyebrow="Total Balance" value={money(totalBalance)} sub={`${accounts.length} account(s)`} />
        <StatCard eyebrow="Active Loans" value={loans.length} sub={`${money(totalEMI)}/mo combined EMI`} />
        <StatCard
          eyebrow="Est. Annual Interest"
          value={money(accounts.reduce((s, a) => s + a.estimatedAnnualInterest, 0))}
          sub="Across all accounts"
        />
      </div>

      <Card className="p-6">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-widest text-paper/40">
          Balance by Account
        </div>
        {chartData.length === 0 ? (
          <EmptyState message="No accounts yet &mdash; open one from the Accounts tab." />
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,241,231,0.08)" />
                <XAxis dataKey="name" stroke="rgba(246,241,231,0.4)" fontSize={12} />
                <YAxis stroke="rgba(246,241,231,0.4)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0F1A2E', border: '1px solid rgba(201,162,39,0.3)', fontSize: 12 }}
                  formatter={(v) => money(v)}
                />
                <Bar dataKey="balance" fill="#C9A227" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

function AccountsTab({ user, accounts, refresh, notify }) {
  const [creating, setCreating] = useState(false);
  const [accountType, setAccountType] = useState('Savings');
  const [initialBalance, setInitialBalance] = useState('0');
  const [busy, setBusy] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { message } = await api.createAccount(user.userID, accountType, Number(initialBalance));
      notify(message, 'success');
      setCreating(false);
      setInitialBalance('0');
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex items-end justify-between">
        <SectionLabel
          eyebrow="Your Holdings"
          title="Accounts & Balances"
          subtitle="Every account carries its own interest rate and passbook."
        />
        <Button onClick={() => setCreating((c) => !c)}>{creating ? 'Cancel' : '+ Open Account'}</Button>
      </div>

      {creating && (
        <Card className="p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
            <Select label="Account Type" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
              <option value="Savings">Savings &middot; 4% APY</option>
              <option value="Current">Current &middot; 2% APY</option>
            </Select>
            <Field
              label="Initial Deposit ($)"
              type="number"
              min="0"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
            <Button type="submit" disabled={busy} className="h-fit">
              {busy && <Spinner />} Create Account
            </Button>
          </form>
        </Card>
      )}

      {accounts.length === 0 ? (
        <EmptyState message="You don't have any accounts yet. Open one to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {accounts.map((acc) => (
            <PassbookCard key={acc.accountNumber} account={acc} user={user} refresh={refresh} notify={notify} />
          ))}
        </div>
      )}
    </div>
  );
}

function PassbookCard({ account, user, refresh, notify }) {
  const [mode, setMode] = useState(null); // 'deposit' | 'withdraw' | null
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const fn = mode === 'deposit' ? api.deposit : api.withdraw;
      const { message } = await fn(account.accountNumber, user.userID, Number(amount));
      notify(message, 'success');
      setMode(null);
      setAmount('');
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="relative overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-paper/40">
            Account No. {account.accountNumber}
          </div>
          <div className="mt-2 font-display text-3xl text-paper">{money(account.balance)}</div>
        </div>
        <StampBadge tone={account.accountType === 'Savings' ? 'brass' : 'vault'}>
          {account.accountType}
        </StampBadge>
      </div>

      <div className="mt-4 flex justify-between text-xs text-paper/40">
        <span>Interest rate: {(account.interestRate * 100).toFixed(0)}% / yr</span>
        <span>Est. annual: {money(account.estimatedAnnualInterest)}</span>
      </div>

      {mode ? (
        <form onSubmit={submit} className="mt-5 flex items-end gap-3 animate-rise">
          <Field
            label={`${mode === 'deposit' ? 'Deposit' : 'Withdraw'} amount ($)`}
            type="number"
            min="0.01"
            step="0.01"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={busy} variant={mode === 'withdraw' ? 'danger' : 'brass'}>
            {busy && <Spinner />} Confirm
          </Button>
          <Button type="button" variant="ghost" onClick={() => setMode(null)}>
            Cancel
          </Button>
        </form>
      ) : (
        <div className="mt-5 flex gap-3">
          <Button onClick={() => setMode('deposit')} className="flex-1">
            Deposit
          </Button>
          <Button onClick={() => setMode('withdraw')} variant="vault" className="flex-1">
            Withdraw
          </Button>
        </div>
      )}
    </Card>
  );
}

function LoansTab({ user, loans, refresh, notify }) {
  const [applying, setApplying] = useState(false);
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('7.5');
  const [duration, setDuration] = useState('24');
  const [busy, setBusy] = useState(false);

  const previewEMI = calcEMI(Number(amount), Number(rate), Number(duration));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { message } = await api.applyLoan(user.userID, Number(amount), Number(rate), Number(duration));
      notify(message, 'success');
      setApplying(false);
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex items-end justify-between">
        <SectionLabel
          eyebrow="Credit"
          title="Loans & EMIs"
          subtitle="Apply for a loan and preview your monthly installment before committing."
        />
        <Button onClick={() => setApplying((a) => !a)}>{applying ? 'Cancel' : '+ Apply for Loan'}</Button>
      </div>

      {applying && (
        <Card className="p-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end">
            <Field label="Loan Amount ($)" type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Field label="Annual Rate (%)" type="number" min="0.1" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
            <Field label="Term (months)" type="number" min="1" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <Button type="submit" disabled={busy} className="h-fit">
              {busy && <Spinner />} Confirm Loan
            </Button>
          </form>
          <div className="mt-4 rounded-sm border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-paper/70">
            Estimated Monthly EMI: <span className="font-mono text-brass">{money(previewEMI)}</span>
          </div>
        </Card>
      )}

      {loans.length === 0 ? (
        <EmptyState message="No active loans. Apply above if you need financing." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-paper/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-paper/10 bg-ink-light/60 font-mono text-[11px] uppercase tracking-widest text-paper/40">
                <th className="px-4 py-3">Loan ID</th>
                <th className="px-4 py-3">Principal</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Term</th>
                <th className="px-4 py-3">Monthly EMI</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.loanID} className="border-b border-paper/5 last:border-0">
                  <td className="px-4 py-3 font-mono">{l.loanID}</td>
                  <td className="px-4 py-3">{money(l.loanAmount)}</td>
                  <td className="px-4 py-3">{l.interestRate}%</td>
                  <td className="px-4 py-3">{l.duration} mo</td>
                  <td className="px-4 py-3 font-mono text-brass">{money(l.emi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ transactions }) {
  return (
    <div className="space-y-6 animate-rise">
      <SectionLabel eyebrow="Full Record" title="Transaction History" subtitle="Every deposit, withdrawal, and credit across your accounts." />
      {transactions.length === 0 ? (
        <EmptyState message="No transactions recorded for your accounts yet." />
      ) : (
        <Card className="ledger-rule divide-y divide-paper/5 overflow-hidden">
          {transactions.map((t) => (
            <div key={t.transactionID} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm text-paper">{t.transactionType}</div>
                <div className="text-xs text-paper/40">
                  Acct #{t.accountNumber} &middot; {t.date}
                </div>
              </div>
              <div
                className={`font-mono text-sm ${
                  t.transactionType === 'Withdrawal' ? 'text-rust' : 'text-brass'
                }`}
              >
                {t.transactionType === 'Withdrawal' ? '-' : '+'}
                {money(t.amount)}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-md border border-dashed border-paper/15 py-14 text-center text-sm text-paper/40">
      {message}
    </div>
  );
}

function calcEMI(loanAmount, interestRate, duration) {
  if (!loanAmount || !interestRate || !duration || loanAmount <= 0 || interestRate <= 0 || duration <= 0) return 0;
  const monthlyRate = interestRate / (12 * 100);
  return (
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
    (Math.pow(1 + monthlyRate, duration) - 1)
  );
}
