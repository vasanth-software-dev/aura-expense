import 'package:intl/intl.dart';

class CurrencyFormatter {
  static final NumberFormat _inrFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static final NumberFormat _inrWithDecimalsFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  /// Formats amount into Indian currency format: ₹24,680 (no decimal if integer)
  static String format(double amount, {bool showDecimals = false}) {
    if (showDecimals || amount % 1 != 0) {
      return _inrWithDecimalsFormatter.format(amount);
    }
    return _inrFormatter.format(amount);
  }

  /// Format compact: ₹1.2L, ₹45K, ₹1.5Cr
  static String formatCompact(double amount) {
    if (amount >= 10000000) {
      return '₹${(amount / 10000000).toStringAsFixed(1)}Cr';
    } else if (amount >= 100000) {
      return '₹${(amount / 100000).toStringAsFixed(1)}L';
    } else if (amount >= 1000) {
      return '₹${(amount / 1000).toStringAsFixed(1)}k';
    }
    return '₹${amount.toStringAsFixed(0)}';
  }

  /// Formats without symbol for inputs
  static String formatRaw(double amount) {
    return NumberFormat('#,##,###.##', 'en_IN').format(amount);
  }
}
