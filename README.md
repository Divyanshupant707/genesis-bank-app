# Genesis Bank Management System

A full-stack web app conversion of the original C++ console **Genesis Bank Management
System**. Same rules, same math (identical EMI formula, identical 4%/2% interest
rates), now with a REST API backend and a React ledger-styled frontend.

```
genesis-bank/
├── backend/     Express API + JSON-file persistence
└── frontend/    React (Vite) + Tailwind + Recharts UI
```

## Features carried over from the original app

- User sign up / login (numeric User ID + password)
- Create Savings (4% APY) or Current (2% APY) accounts
- Deposit / withdraw with balance validation
- View accounts, balances, and estimated annual interest
- Apply for loans and see the monthly EMI (same amortization formula as the C++ version)
- Full transaction history per user
- Admin Mode (password: `admin123`) — master directories for users, accounts,
  transactions, and loans, plus "Process Interest for All Accounts"

## Running it

### 1. Backend

```bash
cd backend
npm install
npm start
```

The API starts on **http://localhost:4000** and persists data to
`backend/data/database.json` (created automatically on first run).

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app opens on **http://localhost:5173** and talks to the backend at
`http://localhost:4000` by default. To point it at a different backend URL, copy
`.env.example` to `.env` and set `VITE_API_URL`.

### 3. Try it out

1. Open the app, go to **Open Account**, and register — you'll get a User ID.
2. **Sign In** with that ID and password.
3. Open a Savings or Current account, deposit/withdraw, apply for a loan.
4. Log out and use **Admin Access** with password `admin123` to see the master
   directories and trigger interest crediting for every account.

## Notes

- Data is stored in a simple JSON file (`backend/data/database.json`) instead of
  the original `.txt` files, but the schema mirrors the original 1:1.
- Passwords are stored as plain text, exactly as in the original C++ program —
  this is a like-for-like conversion, not a production-hardened security model.
  If you plan to deploy this publicly, add password hashing (e.g. bcrypt) and
  real authentication/session tokens first.
- The admin password (`admin123`) is unchanged from the source program.
