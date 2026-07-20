# Blood Bank Management System — MERN Stack

The application has been rebuilt with MongoDB, Express, React, and Node.js while preserving the original red Bootstrap design and role-based workflows.

## Features

- Signup, login, JWT sessions, and donor/recipient/administrator roles
- Donor eligibility form, donation history, and automatic inventory updates
- Recipient hospital selection, blood requests, urgency, and request history
- Administrator dashboard, hospital create/edit/delete, request review, and inventory-safe approvals
- Eight blood-group inventory records, responsive navigation, alerts, validation, and detail dialogs
- One-time migration of the existing Django SQLite users, donors, hospitals, and donations into MongoDB

## Setup

1. Install Node.js 20+ and MongoDB 7+.
2. Copy `.env.example` to `.env` and set `JWT_SECRET`. The defaults connect to local MongoDB.
3. Install packages:

   ```bash
   pnpm install
   ```

4. Start MongoDB, then start both application parts:

   ```bash
   pnpm dev
   ```

5. Open `http://localhost:5173`.

Do not start only the `client` folder: login and signup require the Express server and MongoDB. If the page says that the Blood Bank server is not running, confirm MongoDB is active and restart `pnpm dev` from the project root.

## Administrator login

Create or reset the administrator account after MongoDB is running:

```bash
pnpm seed:admin
```

The default development credentials are:

- Username: `admin`
- Password: `Admin@123`

Change `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL` in `.env` before production use, then run `pnpm seed:admin` again. The command is safe to repeat and updates the existing administrator.

## Demonstration data

Populate a complete, synthetic demonstration dataset:

```bash
pnpm seed:demo
```

This repeatable command creates or updates 160 donors, 120 recipients, 32 hospitals across India, 120 blood requests, 80 donation records, and inventory for all blood groups. All demonstration identities use reserved `.demo` email addresses and contain no real personal information.

To complete the local `pooja` recipient and `dipu` donor profiles shown in the demonstration screenshots, run `pnpm seed:profiles` after `pnpm seed:demo`.

## Backend architecture

- Mongoose validation and indexed donor/request queries
- Compatibility-aware donor matching with eligibility and donation-interval checks
- Atomic inventory deduction to prevent over-approval
- JWT authentication and role-based route protection
- Centralized API errors and consistent HTTP status responses
- Repeatable administrator, migration, and demonstration-data utilities
- Operational analytics for records, stock, requests, and fulfillment

For a production build, run `pnpm build` and then `pnpm start`. Express serves the compiled React app on `http://localhost:5050`.

## Import the existing SQLite data

The original database is retained locally at `data/legacy-django.sqlite3`. Start MongoDB, then run:

```bash
pnpm migrate:sqlite
```

The importer is repeatable and does not delete or modify SQLite. Because Django password hashes are not compatible with the new login implementation, imported users receive a temporary password in the form `ChangeMe-<old numeric id>!`; they should change it after migration. The database is excluded from version control because it may contain personal information.

## Structure

```text
client/                 React + Vite interface
server/src/models.js    MongoDB models
server/src/routes/      Express APIs and permissions
server/scripts/         SQLite-to-MongoDB migration
server/test/            API checks
data/                   Private legacy migration data
```

Generated folders such as `node_modules` and `client/dist` are intentionally not stored in the project. Recreate them with `pnpm install` and `pnpm build`.
