# Aura Expense REST API Specification

Base URL: `http://localhost:8080/api/v1`

All authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
Creates a new user and seeds default Indian financial categories.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "Arun Kumar",
    "currency": "INR"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "Arun Kumar",
        "currency": "INR"
      }
    }
  }
  ```

### `POST /auth/login`
Authenticates existing user.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### `GET /auth/profile`
Returns authenticated user profile.

---

## 2. Transactions (`/transactions`)

### `GET /transactions`
List transactions with pagination, filtering, and search.
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `type`: `DEBIT` | `CREDIT`
  - `paymentMethod`: `UPI` | `CASH` | `DEBIT_CARD` | `CREDIT_CARD` | `BANK_TRANSFER` | `ATM`
  - `categoryId`: Filter by category UUID
  - `accountId`: Filter by bank account UUID
  - `status`: `CONFIRMED` | `PENDING_REVIEW`
  - `startDate`, `endDate`: ISO Date strings
  - `search`: Case-insensitive text search on merchant/description/UPI reference

### `POST /transactions`
Create manual transaction.
- **Request Body**:
  ```json
  {
    "amount": 438.00,
    "type": "DEBIT",
    "merchant": "Swiggy",
    "categoryId": "uuid",
    "accountId": "uuid",
    "paymentMethod": "UPI",
    "transactionTime": "2026-09-25T14:02:00.000Z",
    "notes": "Dinner"
  }
  ```

### `POST /transactions/sms-ingest`
Batch ingestion of SMS messages from Android device.
- **Request Body**:
  ```json
  {
    "messages": [
      {
        "sender": "HDFCBK",
        "body": "UPDATE: INR 438.00 debited from HDFC Bank A/C **1234 on 25-SEP-26 to VPA swiggy@icici (UPI Ref No 426912345678).",
        "timestamp": "2026-09-25T14:02:00.000Z"
      }
    ]
  }
  ```

### `GET /transactions/review-queue`
Returns all transactions with status `PENDING_REVIEW` for 1-tap confirmation.

### `POST /transactions/:id/confirm-review`
- **Request Body**:
  ```json
  {
    "categoryId": "uuid",
    "rememberRule": true
  }
  ```

---

## 3. Email Accounts (`/email-accounts`)

### `POST /email-accounts/gmail/connect`
Returns Google OAuth2 authorization URL with minimal read-only scope.

### `GET /email-accounts/gmail/callback`
Exchanges authorization code, stores AES-256-GCM encrypted tokens, and dispatches initial background sync.

### `POST /email-accounts/:id/sync`
Queues an on-demand transaction synchronization job.

---

## 4. Budgets & Reports

### `GET /budgets`
Returns monthly budget limit, spent amount, remaining amount, and percentage.

### `GET /reports/summary`
Returns total spent, income, transfers, and month-over-month percentage change.

### `GET /reports/categories`
Returns category breakdown with percentages for donut charts.

---

## 5. Privacy & Data Control (`/privacy`)

### `GET /privacy/export?format=json` (or `format=csv`)
Exports all user financial transactions and accounts. Zero secrets or OAuth tokens are ever exported.

### `DELETE /privacy/delete-account`
Permanently purges the user and all associated financial records.
