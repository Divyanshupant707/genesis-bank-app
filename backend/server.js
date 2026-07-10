const express = require('express');
const cors = require('cors');
const {
  load,
  save,
  nextUserID,
  nextAccountNumber,
  nextTransactionID,
  nextLoanID,
  INTEREST_RATES,
  calculateInterest,
  calculateEMI,
  nowDateString
} = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = 'admin123'; // Mirrors the hard-coded admin password in the original C++ app

app.use(cors());
app.use(express.json());

// ---------- helpers ----------
function isBlank(str) {
  return typeof str !== 'string' || str.trim().length === 0;
}

function publicUser(u) {
  return { userID: u.userID, name: u.name };
}

function publicAccount(acc) {
  return {
    accountNumber: acc.accountNumber,
    balance: acc.balance,
    accountType: acc.accountType,
    ownerUserID: acc.ownerUserID,
    interestRate: INTEREST_RATES[acc.accountType] ?? 0,
    estimatedAnnualInterest: calculateInterest(acc)
  };
}

function publicLoan(loan) {
  return {
    ...loan,
    emi: calculateEMI(loan.loanAmount, loan.interestRate, loan.duration)
  };
}

function requireAdmin(req, res, next) {
  const pass = req.header('x-admin-password');
  if (pass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }
  next();
}

// ================= AUTH =================

// User Sign Up  (menu option 1)
app.post('/api/auth/signup', (req, res) => {
  const { name, password } = req.body;
  if (isBlank(name)) return res.status(400).json({ error: 'Name cannot be empty.' });
  if (isBlank(password)) return res.status(400).json({ error: 'Password cannot be empty.' });

  const db = load();
  const userID = nextUserID(db);
  const user = { userID, name: name.trim(), password };
  db.users.push(user);
  save(db);

  res.json({ user: publicUser(user), message: 'Registration successful! Please keep your User ID to log in.' });
});

// User Login (menu option 2)
app.post('/api/auth/login', (req, res) => {
  const { userID, password } = req.body;
  const db = load();
  const user = db.users.find((u) => u.userID === Number(userID));
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Authentication failed. Incorrect ID or Password.' });
  }
  res.json({ user: publicUser(user) });
});

// Admin Mode login (menu option 3)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Access Denied. Incorrect Admin Password.' });
  }
  res.json({ ok: true });
});

// ================= USER: ACCOUNTS =================

// View my accounts & balances (menu option 5)
app.get('/api/users/:userID/accounts', (req, res) => {
  const db = load();
  const userID = Number(req.params.userID);
  const accounts = db.accounts.filter((a) => a.ownerUserID === userID).map(publicAccount);
  res.json({ accounts });
});

// Create Savings/Current account (menu options 1 & 2)
app.post('/api/users/:userID/accounts', (req, res) => {
  const db = load();
  const userID = Number(req.params.userID);
  const user = db.users.find((u) => u.userID === userID);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { accountType, initialBalance } = req.body;
  if (!['Savings', 'Current'].includes(accountType)) {
    return res.status(400).json({ error: 'Account type must be Savings or Current.' });
  }
  const initBal = Number(initialBalance);
  if (isNaN(initBal) || initBal < 0) {
    return res.status(400).json({ error: 'Initial balance cannot be negative.' });
  }

  const accountNumber = nextAccountNumber(db);
  const account = { accountNumber, balance: initBal, accountType, ownerUserID: userID };
  db.accounts.push(account);

  if (initBal > 0) {
    const transactionID = nextTransactionID(db);
    db.transactions.push({
      transactionID,
      amount: initBal,
      transactionType: 'Initial Deposit',
      date: nowDateString(),
      accountNumber
    });
  }

  save(db);
  res.json({ account: publicAccount(account), message: `${accountType} Account created successfully!` });
});

// Deposit Money (menu option 3)
app.post('/api/accounts/:accountNumber/deposit', (req, res) => {
  const db = load();
  const accountNumber = Number(req.params.accountNumber);
  const { userID, amount } = req.body;
  const account = db.accounts.find((a) => a.accountNumber === accountNumber);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  if (account.ownerUserID !== Number(userID)) {
    return res.status(403).json({ error: 'This account does not belong to you.' });
  }
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Deposit amount must be positive.' });
  }

  account.balance += amt;
  const transactionID = nextTransactionID(db);
  db.transactions.push({
    transactionID,
    amount: amt,
    transactionType: 'Deposit',
    date: nowDateString(),
    accountNumber
  });
  save(db);

  res.json({ account: publicAccount(account), message: `Deposited $${amt.toFixed(2)}. New Balance: $${account.balance.toFixed(2)}` });
});

// Withdraw Money (menu option 4)
app.post('/api/accounts/:accountNumber/withdraw', (req, res) => {
  const db = load();
  const accountNumber = Number(req.params.accountNumber);
  const { userID, amount } = req.body;
  const account = db.accounts.find((a) => a.accountNumber === accountNumber);
  if (!account) return res.status(404).json({ error: 'Account not found.' });
  if (account.ownerUserID !== Number(userID)) {
    return res.status(403).json({ error: 'This account does not belong to you.' });
  }
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Withdrawal amount must be positive.' });
  }
  if (account.balance < amt) {
    return res.status(400).json({ error: 'Insufficient balance.' });
  }

  account.balance -= amt;
  const transactionID = nextTransactionID(db);
  db.transactions.push({
    transactionID,
    amount: amt,
    transactionType: 'Withdrawal',
    date: nowDateString(),
    accountNumber
  });
  save(db);

  res.json({ account: publicAccount(account), message: `Withdrawn $${amt.toFixed(2)}. Remaining Balance: $${account.balance.toFixed(2)}` });
});

// ================= USER: LOANS =================

// Apply for a Loan (menu option 6)
app.post('/api/users/:userID/loans', (req, res) => {
  const db = load();
  const userID = Number(req.params.userID);
  const user = db.users.find((u) => u.userID === userID);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const { amount, rate, duration } = req.body;
  const amt = Number(amount);
  const r = Number(rate);
  const dur = Number(duration);

  if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Loan amount must be positive.' });
  if (isNaN(r) || r <= 0) return res.status(400).json({ error: 'Interest rate must be positive.' });
  if (!Number.isInteger(dur) || dur <= 0) return res.status(400).json({ error: 'Loan term must be a positive whole number of months.' });

  const loanID = nextLoanID(db);
  const loan = { loanID, loanAmount: amt, interestRate: r, duration: dur, ownerUserID: userID };
  db.loans.push(loan);
  save(db);

  res.json({ loan: publicLoan(loan), message: 'Loan Applied successfully.' });
});

// View My Loans & EMIs (menu option 7)
app.get('/api/users/:userID/loans', (req, res) => {
  const db = load();
  const userID = Number(req.params.userID);
  const loans = db.loans.filter((l) => l.ownerUserID === userID).map(publicLoan);
  res.json({ loans });
});

// ================= USER: TRANSACTIONS =================

// View My Transaction History (menu option 8)
app.get('/api/users/:userID/transactions', (req, res) => {
  const db = load();
  const userID = Number(req.params.userID);
  const accountNumbers = db.accounts.filter((a) => a.ownerUserID === userID).map((a) => a.accountNumber);
  const transactions = db.transactions
    .filter((t) => accountNumbers.includes(t.accountNumber))
    .sort((a, b) => b.transactionID - a.transactionID);
  res.json({ transactions });
});

// ================= ADMIN =================

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const db = load();
  res.json({ users: db.users.map(publicUser) });
});

app.get('/api/admin/accounts', requireAdmin, (req, res) => {
  const db = load();
  res.json({ accounts: db.accounts.map(publicAccount) });
});

app.get('/api/admin/transactions', requireAdmin, (req, res) => {
  const db = load();
  const transactions = [...db.transactions].sort((a, b) => b.transactionID - a.transactionID);
  res.json({ transactions });
});

app.get('/api/admin/loans', requireAdmin, (req, res) => {
  const db = load();
  res.json({ loans: db.loans.map(publicLoan) });
});

// Process Interest Crediting for All Accounts (admin option 5)
app.post('/api/admin/process-interest', requireAdmin, (req, res) => {
  const db = load();
  if (db.accounts.length === 0) {
    return res.json({ credited: [], message: 'No active accounts found to process interest.' });
  }
  const credited = [];
  for (const account of db.accounts) {
    const interest = calculateInterest(account);
    if (interest > 0) {
      account.balance += interest;
      const transactionID = nextTransactionID(db);
      db.transactions.push({
        transactionID,
        amount: interest,
        transactionType: 'Interest Credit',
        date: nowDateString(),
        accountNumber: account.accountNumber
      });
      credited.push({ accountNumber: account.accountNumber, interest });
    }
  }
  save(db);
  res.json({ credited, message: `Interest credited to ${credited.length} account(s).` });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Genesis Bank API listening on http://localhost:${PORT}`);
});
