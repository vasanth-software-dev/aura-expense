# Security & Privacy Architecture

## 1. Zero Sensitive Financial Credential Policy
Aura Expense operates under a strict zero-credential storage policy. The system will **never** request, process, or store:
- UPI PINs
- ATM PINs
- Internet banking passwords
- One-Time Passwords (OTPs)
- Card Verification Values (CVVs)
- Full 16-digit credit/debit card numbers (only masked last 4 digits are recorded: `••••1234`)

---

## 2. AES-256-GCM Token Encryption at Rest
All OAuth access tokens and refresh tokens from Google and Microsoft are encrypted at rest using AES-256-GCM authenticated encryption before being written to PostgreSQL.
- Unique 128-bit Initialization Vector (IV) generated per token.
- 128-bit Authentication Tag generated per token to prevent ciphertext tampering.
- Stored format: `ivHex:authTagHex:ciphertextHex`.
- Encrypted credentials cannot be decrypted without the master `ENCRYPTION_KEY`.

---

## 3. Masked Structured Logging
The logging subsystem (`src/utils/logger.ts`) inspects every log payload recursively:
- Automatically masks 16-digit credit card patterns (`••••-••••-••••-••••`).
- Automatically masks 6-digit OTP codes (`******`).
- Redacts keys containing `password`, `token`, `secret`, `pin`, `otp`, `cvv`, `authorization`.
- Prevents sensitive financial information from ever reaching log management systems.

---

## 4. User Isolation & Access Control
- Every user-owned database model (`Account`, `Transaction`, `Budget`, `Category`, `EmailAccount`) contains a foreign key to `User(id)`.
- Every repository and controller method validates that the authenticated `req.user.id` strictly matches the owner of the resource.
- No user can view, edit, or delete another user's financial transactions.

---

## 5. Right to Erasure & Data Portability
- **Data Export**: Users can export their complete transaction history, categories, accounts metadata, and budgets at any time in standard JSON or CSV format.
- **Account Deletion**: Users can permanently delete their account with a single confirmation. Cascading deletion purges all accounts, transactions, sources, and tokens from PostgreSQL.
