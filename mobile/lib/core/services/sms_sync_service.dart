import 'dart:async';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ParsedSmsTransaction {
  final String bank;
  final double amount;
  final String type; // 'DEBIT' or 'CREDIT'
  final String merchant;
  final String account;
  final String upiRef;
  final String category;
  final Color categoryColor;
  final String iconEmoji;
  final String rawText;
  final String sender;
  final DateTime timestamp;

  ParsedSmsTransaction({
    required this.bank,
    required this.amount,
    required this.type,
    required this.merchant,
    required this.account,
    required this.upiRef,
    required this.category,
    required this.categoryColor,
    required this.iconEmoji,
    required this.rawText,
    required this.sender,
    required this.timestamp,
  });
}

class SmsSyncService {
  static const MethodChannel _methodChannel = MethodChannel('com.aura.expense/sms_channel');
  static const EventChannel _eventChannel = EventChannel('com.aura.expense/sms_stream');

  static StreamSubscription? _smsSubscription;

  // Real-time SMS Listener
  static void startRealtimeListener({required Function(ParsedSmsTransaction) onTransactionDetected}) {
    _smsSubscription?.cancel();
    _smsSubscription = _eventChannel.receiveBroadcastStream().listen((dynamic event) {
      if (event is Map) {
        final body = event['body']?.toString() ?? '';
        final sender = event['sender']?.toString() ?? 'SMS';
        final rawTs = event['timestamp'];
        final ts = rawTs is int ? DateTime.fromMillisecondsSinceEpoch(rawTs) : DateTime.now();

        final parsed = parseSms(body, sender: sender, timestamp: ts);
        if (parsed != null) {
          onTransactionDetected(parsed);
        }
      }
    }, onError: (err) {
      debugPrint('Real-time SMS stream error: $err');
    });
  }

  static void stopRealtimeListener() {
    _smsSubscription?.cancel();
    _smsSubscription = null;
  }

  // Permission Checks
  static Future<bool> checkPermissions() async {
    try {
      final bool? granted = await _methodChannel.invokeMethod<bool>('checkSmsPermissions');
      return granted ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> requestPermissions() async {
    try {
      final bool? granted = await _methodChannel.invokeMethod<bool>('requestSmsPermissions');
      return granted ?? false;
    } catch (_) {
      return false;
    }
  }

  // Scan recent inbox SMS
  static Future<List<ParsedSmsTransaction>> readRecentBankSms({int limit = 20}) async {
    try {
      final List<dynamic>? list = await _methodChannel.invokeMethod<List<dynamic>>(
        'readRecentBankSms',
        {'limit': limit},
      );
      if (list == null) return [];

      final results = <ParsedSmsTransaction>[];
      for (final item in list) {
        if (item is Map) {
          final body = item['body']?.toString() ?? '';
          final sender = item['sender']?.toString() ?? '';
          final rawTs = item['timestamp'];
          final ts = rawTs is int ? DateTime.fromMillisecondsSinceEpoch(rawTs) : DateTime.now();

          final parsed = parseSms(body, sender: sender, timestamp: ts);
          if (parsed != null) {
            results.add(parsed);
          }
        }
      }
      return results;
    } catch (e) {
      debugPrint('Error reading inbox SMS: $e');
      return [];
    }
  }

  // Indian Bank SMS Parser
  static ParsedSmsTransaction? parseSms(
    String rawText, {
    String sender = 'BANK',
    DateTime? timestamp,
  }) {
    final text = rawText.trim();
    if (text.isEmpty) return null;

    // 1. Amount Extraction (Rs., INR, Rs, ₹)
    final amountRegex = RegExp(
      r'(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)|debited\s+by\s+(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)',
      caseSensitive: false,
    );
    final amountMatch = amountRegex.firstMatch(text);
    if (amountMatch == null) return null;

    final amountStr = (amountMatch.group(1) ?? amountMatch.group(2) ?? '').replaceAll(',', '');
    final amount = double.tryParse(amountStr);
    if (amount == null || amount <= 0) return null;

    // 2. Transaction Type (DEBIT vs CREDIT)
    final isDebit = RegExp(r'\b(debited|spent|withdrawn|paid|sent|charged)\b', caseSensitive: false).hasMatch(text);
    final isCredit = RegExp(r'\b(credited|received|deposited|refunded)\b', caseSensitive: false).hasMatch(text);
    final type = (isCredit && !isDebit) ? 'CREDIT' : 'DEBIT';

    // 3. Bank & Account Identification
    String bank = 'Indian Bank';
    String account = 'A/C ••9021';
    final upperText = text.toUpperCase();
    final upperSender = sender.toUpperCase();

    if (upperText.contains('HDFC') || upperSender.contains('HDFC')) {
      bank = 'HDFC Bank';
      final accMatch = RegExp(r'(?:\*\*|a\/c\s+)(\d{4})', caseSensitive: false).firstMatch(text);
      account = 'HDFC ••${accMatch?.group(1) ?? '4092'}';
    } else if (upperText.contains('SBI') || upperSender.contains('SBI')) {
      bank = 'State Bank of India';
      final accMatch = RegExp(r'(?:A\/C\s+)(\d{4})', caseSensitive: false).firstMatch(text);
      account = 'SBI ••${accMatch?.group(1) ?? '8120'}';
    } else if (upperText.contains('ICICI') || upperSender.contains('ICICI')) {
      bank = 'ICICI Bank';
      final accMatch = RegExp(r'(?:ending\s+)(\d{4})', caseSensitive: false).firstMatch(text);
      account = 'ICICI ••${accMatch?.group(1) ?? '9914'}';
    } else if (upperText.contains('AXIS') || upperSender.contains('AXIS')) {
      bank = 'Axis Bank';
      final accMatch = RegExp(r'(?:ending\s+|A\/c\s+)(\d{4})', caseSensitive: false).firstMatch(text);
      account = 'Axis ••${accMatch?.group(1) ?? '3301'}';
    } else if (upperText.contains('KOTAK') || upperSender.contains('KOTAK')) {
      bank = 'Kotak Bank';
      final accMatch = RegExp(r'(?:A\/c\s+|ending\s+)(\d{4})', caseSensitive: false).firstMatch(text);
      account = 'Kotak ••${accMatch?.group(1) ?? '5412'}';
    } else if (upperText.contains('CRED') || upperSender.contains('CRED')) {
      bank = 'CRED Pay';
      account = 'CRED ••Club';
    }

    // 4. Payee / Merchant Extraction
    String merchant = 'Merchant';
    final toMatch = RegExp(r'(?:to|at|info:|vpa)\s+([A-Za-z0-9\s*_\.-]+?)(?:\s+(?:UPI|on|Ref|avl|Bal|INR)|\.|$)', caseSensitive: false).firstMatch(text);
    if (toMatch != null) {
      merchant = toMatch.group(1)!.replaceAll(RegExp(r'^(UPI to|by UPI to)\s+', caseSensitive: false), '').trim();
      if (merchant.contains('@')) {
        merchant = merchant.split('@').first;
      }
      if (merchant.length > 25) {
        merchant = merchant.substring(0, 25).trim();
      }
    }

    // 5. UPI / Reference Number Extraction
    String upiRef = 'REF-${(DateTime.now().millisecondsSinceEpoch % 100000000)}';
    final refMatch = RegExp(r'(?:UPI(?:\s*Ref(?:\s*No\.?)?)?|Ref No|UTR)[:\s/]+(\d{6,16})', caseSensitive: false).firstMatch(text);
    if (refMatch != null) {
      upiRef = refMatch.group(1)!;
    }

    // 6. Smart Categorization
    final catInfo = _detectCategory(merchant, text);

    return ParsedSmsTransaction(
      bank: bank,
      amount: amount,
      type: type,
      merchant: merchant,
      account: account,
      upiRef: upiRef,
      category: catInfo.name,
      categoryColor: catInfo.color,
      iconEmoji: catInfo.emoji,
      rawText: text,
      sender: sender,
      timestamp: timestamp ?? DateTime.now(),
    );
  }

  static ({String name, Color color, String emoji}) _detectCategory(String merchant, String body) {
    final lower = '$merchant $body'.toLowerCase();

    if (lower.contains('swiggy') || lower.contains('zomato') || lower.contains('starbucks') ||
        lower.contains('mcdonald') || lower.contains('kfc') || lower.contains('restaurant') ||
        lower.contains('food') || lower.contains('cafe') || lower.contains('burger') ||
        lower.contains('pizza')) {
      return (name: 'Food', color: AppColors.food, emoji: '🍕');
    }
    if (lower.contains('zepto') || lower.contains('blinkit') || lower.contains('instamart') ||
        lower.contains('bigbasket') || lower.contains('grocery') || lower.contains('supermarket') ||
        lower.contains('kirana') || lower.contains('nature basket')) {
      return (name: 'Groceries', color: AppColors.groceries, emoji: '🥦');
    }
    if (lower.contains('amazon') || lower.contains('flipkart') || lower.contains('myntra') ||
        lower.contains('zara') || lower.contains('ajio') || lower.contains('croma') ||
        lower.contains('shopping') || lower.contains('store')) {
      return (name: 'Shopping', color: AppColors.shopping, emoji: '🛍');
    }
    if (lower.contains('uber') || lower.contains('ola') || lower.contains('rapido') ||
        lower.contains('metro') || lower.contains('fuel') || lower.contains('petrol') ||
        lower.contains('hpcl') || lower.contains('bpcl') || lower.contains('ioc')) {
      return (name: 'Transport', color: AppColors.transport, emoji: '🚕');
    }
    if (lower.contains('electricity') || lower.contains('bescom') || lower.contains('airtel') ||
        lower.contains('jio') || lower.contains('vi') || lower.contains('broadband') ||
        lower.contains('bill') || lower.contains('water') || lower.contains('gas')) {
      return (name: 'Bills', color: AppColors.bills, emoji: '⚡');
    }
    if (lower.contains('netflix') || lower.contains('spotify') || lower.contains('prime') ||
        lower.contains('pvr') || lower.contains('inox') || lower.contains('cinema') ||
        lower.contains('movie')) {
      return (name: 'Entertainment', color: AppColors.entertainment, emoji: '🎬');
    }
    if (lower.contains('apollo') || lower.contains('pharmacy') || lower.contains('medplus') ||
        lower.contains('netmeds') || lower.contains('hospital') || lower.contains('clinic') ||
        lower.contains('dr ')) {
      return (name: 'Health', color: AppColors.health, emoji: '💊');
    }
    if (lower.contains('salary') || lower.contains('dividend') || lower.contains('cashback') ||
        lower.contains('interest')) {
      return (name: 'Income', color: AppColors.lightIncome, emoji: '💰');
    }

    return (name: 'Other', color: AppColors.other, emoji: '💳');
  }

  // Preset Indian SMS Templates for instant mobile testing
  static const Map<String, String> presetTemplates = {
    'HDFC Debit': 'Sent Rs.450.00 from HDFC Bank A/C **4092 to SWIGGY UPI:428910284 on 25-09-26. Bal: INR 18,420.50',
    'SBI UPI': 'Dear SBI User, your A/C 8120 debited by Rs 1250.00 on 25Sep26 by UPI to ZEPTOMARKET. UPI Ref 981723401.',
    'ICICI Card': 'ICICI Bank Card ending 9914 charged INR 3,499.00 at AMAZON INDIA on 24-Sep-26. Avl Lmt: INR 1,45,000.',
    'Axis UPI': 'Axis Bank: INR 280.00 spent on Card ending 3301 at UBER INDIA on 25-Sep-26. Info: UPI/310928319',
    'Kotak UPI': 'Sent Rs 650.00 from Kotak Bank A/c 5412 to ZOMATO on 25-09-26. Ref: 204918234. Avl Bal: Rs 42,100',
    'CRED Pay': 'Paid Rs. 1,840.00 using CRED Pay at STARBUCKS. Ref No: CRD891230 on 25-09-26.',
  };
}
