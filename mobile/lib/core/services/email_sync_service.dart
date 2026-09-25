import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../theme/app_colors.dart';

class ParsedEmailTransaction {
  final String provider;
  final String bank;
  final double amount;
  final String type; // DEBIT / CREDIT
  final String merchant;
  final String account;
  final String reference;
  final String category;
  final Color categoryColor;
  final String iconEmoji;
  final String subject;
  final DateTime date;

  ParsedEmailTransaction({
    required this.provider,
    required this.bank,
    required this.amount,
    required this.type,
    required this.merchant,
    required this.account,
    required this.reference,
    required this.category,
    required this.categoryColor,
    required this.iconEmoji,
    required this.subject,
    required this.date,
  });
}

class EmailSyncService {
  // Configurable backend URL (defaults to localhost:8080 or custom IP)
  static String backendUrl = 'http://localhost:8080/api/v1';

  // Bank Email Parser
  static ParsedEmailTransaction? parseEmail({
    required String subject,
    required String body,
    String provider = 'Gmail',
  }) {
    final combined = '$subject\n$body';

    // 1. Amount Extraction
    final amountRegex = RegExp(r'(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)', caseSensitive: false);
    final amountMatch = amountRegex.firstMatch(combined);
    if (amountMatch == null) return null;

    final amountStr = amountMatch.group(1)?.replaceAll(',', '') ?? '0';
    final amount = double.tryParse(amountStr);
    if (amount == null || amount <= 0) return null;

    // 2. Type
    final isCredit = RegExp(r'\b(credited|received|deposit|refund)\b', caseSensitive: false).hasMatch(combined);
    final type = isCredit ? 'CREDIT' : 'DEBIT';

    // 3. Bank
    String bank = 'Indian Bank';
    String account = 'A/C ••5012';
    if (combined.toUpperCase().contains('HDFC')) {
      bank = 'HDFC Bank';
      final accMatch = RegExp(r'(?:\*\*|a\/c\s+ending\s+|a\/c\s+)(\d{4})', caseSensitive: false).firstMatch(combined);
      account = 'HDFC ••${accMatch?.group(1) ?? '4092'}';
    } else if (combined.toUpperCase().contains('ICICI')) {
      bank = 'ICICI Bank';
      final accMatch = RegExp(r'(?:ending\s+with\s+|card\s+ending\s+)(\d{4})', caseSensitive: false).firstMatch(combined);
      account = 'ICICI ••${accMatch?.group(1) ?? '9914'}';
    } else if (combined.toUpperCase().contains('SBI')) {
      bank = 'State Bank of India';
      final accMatch = RegExp(r'(?:A\/C\s+)(\d{4})', caseSensitive: false).firstMatch(combined);
      account = 'SBI ••${accMatch?.group(1) ?? '8120'}';
    }

    // 4. Merchant
    String merchant = 'Merchant Payee';
    final toMatch = RegExp(r'(?:to|at|vpa|paid to|charged at)\s+([A-Za-z0-9\s*_\.-]+?)(?:\s+(?:on|via|ref|bal|using)|\.|$)', caseSensitive: false).firstMatch(combined);
    if (toMatch != null) {
      merchant = toMatch.group(1)!.trim();
      if (merchant.length > 25) merchant = merchant.substring(0, 25).trim();
    }

    // 5. Reference
    String reference = 'EML-${DateTime.now().millisecondsSinceEpoch % 1000000}';
    final refMatch = RegExp(r'(?:Reference|Ref(?:\s*No)?|Txn ID|UTR)[:\s/]+([A-Za-z0-9]{8,20})', caseSensitive: false).firstMatch(combined);
    if (refMatch != null) {
      reference = refMatch.group(1)!;
    }

    // 6. Category
    final cat = _detectCategory(merchant, combined);

    return ParsedEmailTransaction(
      provider: provider,
      bank: bank,
      amount: amount,
      type: type,
      merchant: merchant,
      account: account,
      reference: reference,
      category: cat.name,
      categoryColor: cat.color,
      iconEmoji: cat.emoji,
      subject: subject,
      date: DateTime.now(),
    );
  }

  static ({String name, Color color, String emoji}) _detectCategory(String merchant, String body) {
    final lower = '$merchant $body'.toLowerCase();
    if (lower.contains('swiggy') || lower.contains('zomato') || lower.contains('food') || lower.contains('dining') || lower.contains('starbucks')) {
      return (name: 'Food', color: AppColors.food, emoji: '🍕');
    }
    if (lower.contains('amazon') || lower.contains('flipkart') || lower.contains('myntra') || lower.contains('shopping')) {
      return (name: 'Shopping', color: AppColors.shopping, emoji: '🛍');
    }
    if (lower.contains('uber') || lower.contains('ola') || lower.contains('petrol') || lower.contains('flight') || lower.contains('makemytrip')) {
      return (name: 'Transport', color: AppColors.transport, emoji: '✈️');
    }
    if (lower.contains('bill') || lower.contains('electricity') || lower.contains('broadband') || lower.contains('airtel')) {
      return (name: 'Bills', color: AppColors.bills, emoji: '⚡');
    }
    if (lower.contains('salary') || lower.contains('dividend') || lower.contains('interest')) {
      return (name: 'Income', color: AppColors.lightIncome, emoji: '💰');
    }
    return (name: 'Other', color: AppColors.other, emoji: '📧');
  }

  // Check backend server connection
  static Future<bool> testBackendConnection(String hostUrl) async {
    try {
      final base = hostUrl.replaceAll('/api/v1', '');
      final res = await http.get(Uri.parse('$base/health')).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Trigger sync on backend
  static Future<Map<String, dynamic>?> triggerBackendSync(String accountId, String token) async {
    try {
      final res = await http.post(
        Uri.parse('$backendUrl/email-accounts/$accountId/sync'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 202) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      debugPrint('Backend sync error: $e');
      return null;
    }
  }

  // Preset Email Templates
  static const Map<String, ({String subject, String body})> presetEmailTemplates = {
    'HDFC NetBanking Alert': (
      subject: 'Transaction Alert: INR 1,450.00 debited from HDFC Bank A/c **4092',
      body: 'Dear Customer, INR 1,450.00 has been debited from your HDFC Bank Account **4092 towards payment to BLINKIT COMMERCE on 25-SEP-26. Reference No: HDFC92819234. Avl Balance: INR 17,210.00.'
    ),
    'ICICI Card Alert': (
      subject: 'Transaction alert for your ICICI Bank Credit Card ending 9914',
      body: 'Dear Cardmember, Your ICICI Bank Credit Card ending 9914 was used for INR 4,890.00 at ZARA INDIA on 25-SEP-26 18:22. Txn ID: IC8892104. Available credit limit: INR 1,40,110.00.'
    ),
    'SBI UPI Payment': (
      subject: 'UPI Payment Confirmation - State Bank of India',
      body: 'Dear SBI Customer, your A/C ending 8120 has been debited by Rs 380.00 on 25-Sep-2026. Paid to STARBUCKS COFFEE UPI. UTR / UPI Ref: SBI991204812.'
    ),
  };
}
