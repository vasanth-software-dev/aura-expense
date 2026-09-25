# Aura Expense (✨ Premium Personal Expense Tracker for India)

> "Where did my money go?"

Aura Expense is a production-ready personal expense tracker tailored for India. It features a custom design system inspired by Apple iOS financial applications (Apple Wallet, Apple Health, Apple Card), combining clean minimalism, generous whitespace, large typography, smooth animations, and native-feeling gesture interactions.

The application automatically normalizes financial transactions from Android SMS, connected Gmail and Outlook emails, and manual entries, with built-in deduplication, own-account transfer detection, and smart categorization.

---

## Key Highlights

- **iOS-Inspired Design System**: Built with Flutter and a custom iOS design system (`AppColors`, `AppTypography`, `AppRadius`, `AppCard`, full-screen amount hero, sliding segmented controls, and subtle haptics).
- **Source-Independent Normalization**: Multi-bank SMS parsers for HDFC, SBI, ICICI, Axis, and a universal generic fallback parser.
- **Deduplication Engine**: Multi-signal matching (UPI Ref, Bank Ref, proximity fuzzy matching) consolidating SMS and Email alerts for the same purchase into a single canonical transaction.
- **Own-Account Transfer Detection**: Automatically detects money moving between a user's own accounts (e.g. HDFC to SBI) to prevent double-counting as an expense and income.
- **Review Queue**: Low-confidence transactions are routed to a dedicated review queue with 1-tap categorization and rule learning for future merchant transactions.
- **Privacy & Security**: Zero sensitive credentials stored (no PINs, OTPs, CVVs, passwords), AES-256-GCM token encryption at rest, masked audit logging, CSV/JSON data export, and full account deletion.

---

## Tech Stack

### Mobile Client
- **Flutter 3+** & **Dart**
- Cupertino & Material 3 foundation with custom iOS Design System
- State Management: Provider / ChangeNotifier
- Secure Storage: `flutter_secure_storage`

### Backend API
- **Node.js 22** & **TypeScript**
- **Express.js** REST API with Clean Modular Architecture
- **PostgreSQL** & **Prisma ORM**
- **BullMQ** / **Redis** background job queue (with resilient in-memory fallback for local development)
- **Vitest** for fast unit and integration testing
- **Zod** schema validation & **Helmet** / **Rate Limiter** security

---

## Project Structure

```text
aura-expense/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # 11 PostgreSQL tables, indexes & relations
│   │   └── seed.ts                    # Default Indian categories, banks, demo user
│   ├── src/
│   │   ├── config/                    # Env vars, constants, merchant directory
│   │   ├── database/                  # Prisma client instance & connector
│   │   ├── middleware/                # JWT auth, rate limiter, validator, error handler
│   │   ├── modules/
│   │   │   ├── auth/                  # Register, login, profile
│   │   │   ├── accounts/              # Bank accounts & cards (masked last 4)
│   │   │   ├── categories/            # System & user-defined categories
│   │   │   ├── transactions/          # CRUD, SMS ingest, review queue
│   │   │   ├── engine/                # Normalizer, Deduplicator, TransferDetector, Categorizer
│   │   │   ├── parsers/               # SMS (HDFC, SBI, ICICI, Axis, Generic) & Email parsers
│   │   │   ├── email/                 # Real Google OAuth2 / Gmail API & Microsoft Graph
│   │   │   ├── sync/                  # Sync runner & cursor coordinator
│   │   │   ├── budgets/               # Budget tracking & category limits
│   │   │   ├── reports/               # Monthly summary, donut charts, trends
│   │   │   └── privacy/               # CSV/JSON data export, audit logs, account deletion
│   │   ├── queues/                    # BullMQ queue with in-memory runner fallback
│   │   ├── utils/                     # AES-256-GCM encryption, masked logger, API response
│   │   └── app.ts                     # Express server entry point
│   ├── tests/                         # Vitest unit test suite
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── mobile/
│   ├── lib/
│   │   ├── core/
│   │   │   ├── theme/                 # AppColors (iOS light/dark), AppTypography, AppRadius
│   │   │   ├── utils/                 # Indian currency formatter, haptics
│   │   │   └── widgets/               # Reusable iOS components (AppCard, AppButton, AppBottomNav...)
│   │   ├── features/
│   │   │   ├── home/                  # Dashboard (spent hero, budget card, donut chart, recents)
│   │   │   ├── transactions/          # Grouped list, search, filters, full-screen add expense
│   │   │   ├── review_queue/          # 1-tap categorization & merchant rule learning
│   │   │   ├── budgets/               # Monthly budget & category progress
│   │   │   ├── reports/               # Analytics & category breakdown
│   │   │   ├── email_sync/            # Gmail & Outlook connection, sync history
│   │   │   └── settings/              # iOS grouped settings, privacy info, data export
│   │   └── main.dart                  # App bootstrap & navigation shell
│   └── pubspec.yaml
│
└── docs/
    ├── ARCHITECTURE.md                # System design & normalization pipeline
    ├── API_SPEC.md                    # REST API endpoint contracts
    ├── OAUTH_SETUP.md                 # Google Cloud Console & Azure App Registration guide
    ├── SMS_COMPLIANCE.md              # Google Play SMS Policy compliance & fallback
    └── SECURITY_PRIVACY.md            # Zero credential storage, AES-256-GCM encryption
```

---

## Quickstart Guide

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run unit tests (17 passed)
npm test

# Start development server
npm run dev
```

### 2. Mobile App Setup
```bash
cd mobile

# Fetch Flutter dependencies
flutter pub get

# Run on Android emulator or connected device
flutter run
```

---

## Environment Variables (.env)

| Variable | Description |
|---|---|
| `PORT` | API server port (default: `8080`) |
| `JWT_SECRET` | Secret key for signing session tokens |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM OAuth token encryption |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis URL for BullMQ (in-memory queue used if offline) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for Gmail API |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `MICROSOFT_CLIENT_ID` | Azure App Client ID for Microsoft Graph |
| `MICROSOFT_CLIENT_SECRET` | Azure App Client Secret |

---

## Testing & Verification

Run the automated test suite:
```bash
cd backend
npm test
```
Verified tests:
- `sms-parsers.test.ts`: HDFC, SBI, ICICI, Axis, and Generic fallback parsing UPI debits, credits, and card spends.
- `deduplication.test.ts`: Multi-source deduplication across SMS and Email alerts.
- `transfer-detector.test.ts`: Cross-account movement and self-transfer keyword detection.
- `categorizer.test.ts`: User custom rules, merchant directory matching, and low-confidence fallback.
