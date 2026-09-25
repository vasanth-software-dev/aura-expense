# Aura Expense System Architecture

## Overview
Aura Expense is a production-ready personal expense tracker designed primarily for India. It automates financial tracking across UPI, Indian banks, debit/credit cards, ATM withdrawals, and manual entries while maintaining a privacy-first, Apple iOS-inspired user experience.

```text
┌────────────────────────────────────────────────────────┐
│                      Mobile Layer                      │
│      Flutter Client with Custom iOS Design System      │
│ (AppColors, AppTypography, AppRadius, AppScaffold, UI) │
└───────────────────────────┬────────────────────────────┘
                            │ REST / HTTPS (JWT Auth)
                            ▼
┌────────────────────────────────────────────────────────┐
│                      Backend API                       │
│              Express.js + TypeScript                   │
│   (Rate Limiter, Helmet, Zod Validator, JWT Middleware)│
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌───────────────────────┐ ┌─────────────┐ ┌───────────────────────┐
│ Ingestion Layer       │ │ Queue/Worker│ │ Financial Intelligence│
│ • Android SMS Parser  │ │ • BullMQ    │ │ • Deduplicator        │
│ • Google Gmail API    │ │ • Resilient │ │ • Transfer Detector   │
│ • Microsoft Graph API │ │   In-Memory │ │ • Multi-tier Category │
│ • Manual Entry        │ │   Fallback  │ │ • Confidence Scoring  │
└───────────┬───────────┘ └──────┬──────┘ └───────────┬───────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────┐
│                   Data Storage Layer                   │
│                Prisma ORM + PostgreSQL                 │
│              (AES-256-GCM Token Encryption)            │
└────────────────────────────────────────────────────────┘
```

---

## Source Independence Pipeline

Transactions arrive from diverse formats (SMS text, Gmail HTML receipt, Outlook Graph payload, or manual form). The ingestion layer normalizes all inputs into a canonical `NormalizedTransaction`:

```text
Incoming Payload (SMS / Email / Manual)
                   │
                   ▼
       [ Multi-Bank Regex Parsers ]
     (HDFC, SBI, ICICI, Axis, Generic)
                   │
                   ▼
         NormalizedTransaction
                   │
                   ▼
        [ Deduplication Engine ]
   (UPI Ref Match / Proximity Match)
      ├── If Duplicate ──► Attach TransactionSource & skip
      └── If New
                   │
                   ▼
     [ Transfer Detection Engine ]
 (Cross-Account Match / Self Keywords)
                   │
                   ▼
      [ Categorization Pipeline ]
  (User Rules ► Merchant Directory ► Keywords)
                   │
                   ▼
    Confidence < 0.8 ?
      ├── Yes ──► PENDING_REVIEW (Review Queue)
      └── No  ──► CONFIRMED
                   │
                   ▼
          Database Persistence
```

---

## Deduplication Strategy
1. **Strong Match**: 12-digit UPI Reference Number or Bank Reference ID. If an SMS and an Email share the same reference, they are consolidated into one canonical transaction with two `TransactionSource` entries.
2. **Proximity Fuzzy Match**: If reference number is absent (e.g. credit card spends), transactions are matched if:
   - Amounts are identical (`|A - B| < 0.01`).
   - Timestamps fall within a 15-minute window.
   - Account last 4 digits match.
   - Merchant names match or share substring overlap.

---

## Own-Account Transfer Detection
Moving money between a user's own accounts (e.g. ₹10,000 from HDFC to SBI) must NOT be counted as a ₹10,000 expense and a ₹10,000 income.
The `TransferDetector` identifies:
1. Paired transactions: A `DEBIT` on Account A and a `CREDIT` on Account B of equal amount within 20 minutes.
2. Keyword triggers: "Self transfer", "Transfer to own account", "To self A/C".
Both transactions are flagged with `isTransfer = true` and linked via `transferPairId`.
