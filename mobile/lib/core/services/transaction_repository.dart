import 'package:flutter/material.dart';
import '../../features/transactions/transactions_screen.dart';
import '../theme/app_colors.dart';
import '../utils/haptics_helper.dart';
import 'sms_sync_service.dart';
import 'email_sync_service.dart';

class TransactionRepository extends ChangeNotifier {
  static final TransactionRepository instance = TransactionRepository._internal();
  factory TransactionRepository() => instance;

  TransactionRepository._internal() {
    _initDefaults();
  }

  final List<TransactionItemModel> _transactions = [];

  List<TransactionItemModel> get transactions => List.unmodifiable(_transactions);

  double get totalSpent {
    double sum = 0;
    for (final tx in _transactions) {
      if (tx.type == 'DEBIT') {
        sum += tx.amount;
      }
    }
    return sum;
  }

  void _initDefaults() {
    _transactions.addAll([
      TransactionItemModel(
        id: 'tx-1',
        title: 'Swiggy',
        categoryName: 'Food',
        paymentMethod: 'UPI',
        amount: 438.0,
        type: 'DEBIT',
        time: '7:32 PM',
        dateGroup: 'Today',
        iconEmoji: '🥤',
        categoryColor: AppColors.food,
      ),
      TransactionItemModel(
        id: 'tx-2',
        title: 'Uber',
        categoryName: 'Transport',
        paymentMethod: 'UPI',
        amount: 280.0,
        type: 'DEBIT',
        time: '6:10 PM',
        dateGroup: 'Today',
        iconEmoji: '🚕',
        categoryColor: AppColors.transport,
      ),
      TransactionItemModel(
        id: 'tx-3',
        title: 'Amazon India',
        categoryName: 'Shopping',
        paymentMethod: 'UPI',
        amount: 799.0,
        type: 'DEBIT',
        time: '8:43 PM',
        dateGroup: 'Yesterday',
        iconEmoji: '🛍',
        categoryColor: AppColors.shopping,
      ),
      TransactionItemModel(
        id: 'tx-4',
        title: 'Metro Smart Card',
        categoryName: 'Transport',
        paymentMethod: 'UPI',
        amount: 60.0,
        type: 'DEBIT',
        time: '9:15 AM',
        dateGroup: 'Yesterday',
        iconEmoji: '🚇',
        categoryColor: AppColors.transport,
      ),
      TransactionItemModel(
        id: 'tx-5',
        title: 'Salary Credit',
        categoryName: 'Income',
        paymentMethod: 'Bank Transfer',
        amount: 145000.0,
        type: 'CREDIT',
        time: '10:00 AM',
        dateGroup: 'Sep 23',
        iconEmoji: '💼',
        categoryColor: AppColors.lightIncome,
      ),
    ]);
  }

  void addTransaction(TransactionItemModel tx) {
    _transactions.insert(0, tx);
    HapticsHelper.success();
    notifyListeners();
  }

  TransactionItemModel importFromSms(ParsedSmsTransaction sms) {
    final now = DateTime.now();
    final hour = now.hour > 12 ? now.hour - 12 : (now.hour == 0 ? 12 : now.hour);
    final period = now.hour >= 12 ? 'PM' : 'AM';
    final minute = now.minute.toString().padLeft(2, '0');
    final timeStr = '$hour:$minute $period';

    final tx = TransactionItemModel(
      id: 'tx-sms-${DateTime.now().millisecondsSinceEpoch}',
      title: sms.merchant,
      categoryName: sms.category,
      paymentMethod: sms.upiRef.startsWith('UPI') || sms.upiRef.length > 8 ? 'UPI' : 'Card',
      amount: sms.amount,
      type: sms.type,
      time: timeStr,
      dateGroup: 'Today',
      iconEmoji: sms.iconEmoji,
      categoryColor: sms.categoryColor,
      needsReview: false,
    );

    addTransaction(tx);
    return tx;
  }

  TransactionItemModel importFromEmail(ParsedEmailTransaction email) {
    final now = DateTime.now();
    final hour = now.hour > 12 ? now.hour - 12 : (now.hour == 0 ? 12 : now.hour);
    final period = now.hour >= 12 ? 'PM' : 'AM';
    final minute = now.minute.toString().padLeft(2, '0');
    final timeStr = '$hour:$minute $period';

    final tx = TransactionItemModel(
      id: 'tx-eml-${DateTime.now().millisecondsSinceEpoch}',
      title: email.merchant,
      categoryName: email.category,
      paymentMethod: 'Bank Alert',
      amount: email.amount,
      type: email.type,
      time: timeStr,
      dateGroup: 'Today',
      iconEmoji: email.iconEmoji,
      categoryColor: email.categoryColor,
      needsReview: false,
    );

    addTransaction(tx);
    return tx;
  }

  void removeTransaction(String id) {
    _transactions.removeWhere((t) => t.id == id);
    notifyListeners();
  }
}
