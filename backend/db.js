const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'database.json');

function defaultData() {
  return {
    users: [],       // { userID, name, password }
    accounts: [],     // { accountNumber, balance, accountType, ownerUserID }
    transactions: [], // { transactionID, amount, transactionType, date, accountNumber }
    loans: [],        // { loanID, loanAmount, interestRate, duration, ownerUserID }
    seq: { user: 100, account: 1000, transaction: 0, loan: 500 }
  };
}

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData(), null, 2));
  }
}

function load() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    const fresh = defaultData();
    save(fresh);
    return fresh;
  }
}

function save(data) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ---- ID generators (mirrors generateNextUserID/AccountNumber/TransactionID/LoanID) ----
function nextUserID(db) {
  db.seq.user += 1;
  return db.seq.user;
}
function nextAccountNumber(db) {
  db.seq.account += 1;
  return db.seq.account;
}
function nextTransactionID(db) {
  db.seq.transaction += 1;
  return db.seq.transaction;
}
function nextLoanID(db) {
  db.seq.loan += 1;
  return db.seq.loan;
}

// ---- Interest rates (mirrors SavingsAccount / CurrentAccount) ----
const INTEREST_RATES = {
  Savings: 0.04,
  Current: 0.02
};

function calculateInterest(account) {
  const rate = INTEREST_RATES[account.accountType] ?? 0;
  return account.balance * rate;
}

// ---- EMI calculation (mirrors Loan::calculateEMI) ----
function calculateEMI(loanAmount, interestRate, duration) {
  if (loanAmount <= 0 || interestRate <= 0 || duration <= 0) return 0;
  const monthlyRate = interestRate / (12 * 100);
  const emi =
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, duration)) /
    (Math.pow(1 + monthlyRate, duration) - 1);
  return emi;
}

function nowDateString() {
  return new Date().toString();
}

module.exports = {
  DB_PATH,
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
};
