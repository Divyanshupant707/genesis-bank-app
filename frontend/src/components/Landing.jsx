import React, { useState } from 'react';
import { api } from '../api';
import { Button, Field, Card, Spinner } from './ui';

const TABS = [
  { id: 'login', label: 'Sign In' },
  { id: 'signup', label: 'Open Account' },
  { id: 'admin', label: 'Admin Access' }
];

export default function Landing({ onLogin, onAdmin, notify }) {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);

  // signup fields
  const [name, setName] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [issuedID, setIssuedID] = useState(null);

  // login fields
  const [loginID, setLoginID] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // admin field
  const [adminPass, setAdminPass] = useState('');

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setIssuedID(null);
    try {
      const { user, message } = await api.signup(name, signupPass);
      setIssuedID(user.userID);
      setName('');
      setSignupPass('');
      notify(message, 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await api.login(Number(loginID), loginPass);
      notify(`Welcome back, ${user.name}.`, 'success');
      onLogin(user);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdmin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.adminLogin(adminPass);
      onAdmin(adminPass);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[1.1fr_1fr]">
        {/* Hero / signature element: the passbook */}
        <div className="order-2 flex flex-col justify-center lg:order-1">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.35em] text-brass/70">
            Est. Ledger No. 001
          </div>
          <h1 className="font-display text-5xl font-medium leading-[1.05] text-paper sm:text-6xl">
            Genesis Bank
            <span className="block text-brass">Management System</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-paper/60">
            A ledger for your accounts, loans, and every transaction &mdash; recreated
            from the original console banking engine, now with a full API and an
            interface you can actually enjoy using.
          </p>

          <div className="relative mt-12 hidden max-w-sm sm:block">
            <Passbook />
          </div>
        </div>

        {/* Auth card */}
        <div className="order-1 lg:order-2">
          <Card className="mx-auto w-full max-w-md p-1.5">
            <div className="flex gap-1 rounded-t-md bg-ink/40 p-1.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded-sm px-3 py-2 font-mono text-[12px] uppercase tracking-wider transition-colors ${
                    tab === t.id
                      ? 'bg-brass text-ink font-semibold'
                      : 'text-paper/50 hover:text-paper/80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4 animate-rise">
                  <p className="text-sm text-paper/50">
                    Enter the User ID you were issued at sign-up.
                  </p>
                  <Field
                    label="User ID"
                    type="number"
                    required
                    value={loginID}
                    onChange={(e) => setLoginID(e.target.value)}
                    placeholder="e.g. 101"
                  />
                  <Field
                    label="Password"
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  />
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Spinner />} Sign In
                  </Button>
                </form>
              )}

              {tab === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4 animate-rise">
                  <p className="text-sm text-paper/50">
                    Register to receive a permanent User ID for the ledger.
                  </p>
                  <Field
                    label="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Alvarez"
                  />
                  <Field
                    label="Choose a Password"
                    type="password"
                    required
                    value={signupPass}
                    onChange={(e) => setSignupPass(e.target.value)}
                    placeholder="At least a few characters"
                  />
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Spinner />} Open Account
                  </Button>
                  {issuedID !== null && (
                    <div className="rounded-sm border border-brass/40 bg-brass/10 p-3 text-center">
                      <div className="font-mono text-[11px] uppercase tracking-widest text-brass/70">
                        Your assigned User ID
                      </div>
                      <div className="font-display text-3xl text-brass">{issuedID}</div>
                      <p className="mt-1 text-xs text-paper/50">
                        Keep this ID safe &mdash; you'll need it to sign in.
                      </p>
                    </div>
                  )}
                </form>
              )}

              {tab === 'admin' && (
                <form onSubmit={handleAdmin} className="space-y-4 animate-rise">
                  <p className="text-sm text-paper/50">
                    Restricted access for bank operations staff only.
                  </p>
                  <Field
                    label="Admin Password"
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  />
                  <Button type="submit" variant="vault" disabled={loading} className="w-full">
                    {loading && <Spinner />} Enter Admin Mode
                  </Button>
                </form>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Passbook() {
  return (
    <svg viewBox="0 0 380 260" className="w-full drop-shadow-2xl" role="img" aria-label="Bank passbook illustration">
      <g transform="rotate(-4 190 130)">
        <rect x="20" y="20" width="300" height="200" rx="6" fill="#0F1A2E" stroke="#C9A227" strokeOpacity="0.4" />
        <rect x="20" y="20" width="300" height="200" rx="6" fill="url(#stitch)" opacity="0.25" />
        <rect x="34" y="34" width="272" height="172" rx="3" fill="none" stroke="#C9A227" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 4" />
        <text x="170" y="95" textAnchor="middle" fill="#E0C158" fontFamily="Fraunces, serif" fontSize="22">
          GENESIS BANK
        </text>
        <text x="170" y="120" textAnchor="middle" fill="#C9A227" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="3">
          PASSBOOK &middot; LEDGER
        </text>
        <line x1="60" y1="145" x2="280" y2="145" stroke="#C9A227" strokeOpacity="0.3" />
        <text x="60" y="170" fill="#F6F1E7" fontFamily="IBM Plex Mono, monospace" fontSize="11" opacity="0.7">
          ACCT NO. 1001
        </text>
        <text x="280" y="170" textAnchor="end" fill="#F6F1E7" fontFamily="IBM Plex Mono, monospace" fontSize="11" opacity="0.7">
          BAL $ 12,480.00
        </text>
      </g>
      <defs>
        <pattern id="stitch" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="#C9A227" />
        </pattern>
      </defs>
    </svg>
  );
}
