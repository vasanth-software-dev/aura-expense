import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_bottom_sheet.dart';
import '../../core/widgets/app_text_field.dart';

class AddExpenseScreen extends StatefulWidget {
  final VoidCallback onExpenseAdded;

  const AddExpenseScreen({
    super.key,
    required this.onExpenseAdded,
  });

  @override
  State<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends State<AddExpenseScreen> {
  String _amountString = '0';
  final TextEditingController _merchantController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  String _selectedCategory = 'Food & Dining';
  String _selectedPaymentMethod = 'UPI';
  String _selectedAccount = 'AD-HDFCBK-S';
  DateTime _selectedDate = DateTime.now();
  String _transactionType = 'DEBIT'; // DEBIT, CREDIT, TRANSFER

  final List<Map<String, dynamic>> _categories = [
    {'name': 'Food & Dining', 'icon': '🥤', 'color': AppColors.food},
    {'name': 'Shopping', 'icon': '🛍', 'color': AppColors.shopping},
    {'name': 'Transportation', 'icon': '🚕', 'color': AppColors.transport},
    {'name': 'Bills & Utilities', 'icon': '🧾', 'color': AppColors.bills},
    {'name': 'Groceries', 'icon': '🛒', 'color': AppColors.groceries},
    {'name': 'Entertainment', 'icon': '🎬', 'color': AppColors.entertainment},
    {'name': 'Rent & Housing', 'icon': '🏠', 'color': AppColors.rent},
    {'name': 'Health & Medical', 'icon': '💊', 'color': AppColors.health},
    {'name': 'Salary & Earnings', 'icon': '💼', 'color': AppColors.salary},
    {'name': 'Other', 'icon': '📦', 'color': AppColors.other},
  ];

  final List<String> _paymentMethods = [
    'UPI',
    'Cash',
    'Debit Card',
    'Credit Card',
    'Bank Transfer',
    'ATM',
  ];

  final List<String> _accounts = [
    'AD-HDFCBK-S',
    'VK-SBIINB',
    'ICICI-Card',
    'AXIS-UPI',
    'Cash',
  ];

  @override
  void dispose() {
    _merchantController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _onKeypadTap(String val) {
    HapticsHelper.selectionClick();
    setState(() {
      if (val == 'C') {
        _amountString = '0';
      } else if (val == '⌫') {
        if (_amountString.length > 1) {
          _amountString = _amountString.substring(0, _amountString.length - 1);
        } else {
          _amountString = '0';
        }
      } else if (val == '.') {
        if (!_amountString.contains('.')) {
          _amountString += '.';
        }
      } else {
        if (_amountString == '0') {
          _amountString = val;
        } else {
          // Max 2 decimals
          if (_amountString.contains('.')) {
            final parts = _amountString.split('.');
            if (parts[1].length < 2) {
              _amountString += val;
            }
          } else if (_amountString.length < 9) {
            _amountString += val;
          }
        }
      }
    });
  }

  void _openCategoryPicker() {
    AppBottomSheet.show(
      context: context,
      title: 'Select Category',
      child: ListView.separated(
        shrinkWrap: true,
        itemCount: _categories.length,
        separatorBuilder: (_, __) => const Divider(height: 0.5),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = cat['name'] == _selectedCategory;

          return ListTile(
            leading: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: (cat['color'] as Color).withOpacity(0.15),
                borderRadius: AppRadius.small,
              ),
              alignment: Alignment.center,
              child: Text(cat['icon'], style: const TextStyle(fontSize: 18)),
            ),
            title: Text(cat['name'], style: AppTypography.headline),
            trailing: isSelected
                ? const Icon(Icons.check, color: AppColors.lightAccent)
                : null,
            onTap: () {
              setState(() => _selectedCategory = cat['name']);
              Navigator.pop(context);
            },
          );
        },
      ),
    );
  }

  void _openPaymentPicker() {
    AppBottomSheet.show(
      context: context,
      title: 'Payment Method',
      child: ListView.separated(
        shrinkWrap: true,
        itemCount: _paymentMethods.length,
        separatorBuilder: (_, __) => const Divider(height: 0.5),
        itemBuilder: (context, index) {
          final method = _paymentMethods[index];
          final isSelected = method == _selectedPaymentMethod;

          return ListTile(
            title: Text(method, style: AppTypography.headline),
            trailing: isSelected
                ? const Icon(Icons.check, color: AppColors.lightAccent)
                : null,
            onTap: () {
              setState(() => _selectedPaymentMethod = method);
              Navigator.pop(context);
            },
          );
        },
      ),
    );
  }

  void _openAccountPicker() {
    final customController = TextEditingController(text: _selectedAccount);

    AppBottomSheet.show(
      context: context,
      title: 'Account Name',
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: customController,
                    autofocus: true,
                    style: AppTypography.headline,
                    decoration: InputDecoration(
                      hintText: 'Enter name (e.g. AD-HDFCBK-S)',
                      hintStyle: AppTypography.body.copyWith(color: AppColors.lightTextTertiary),
                      prefixIcon: const Icon(Icons.tag_rounded, size: 20, color: AppColors.lightAccent),
                      border: OutlineInputBorder(
                        borderRadius: AppRadius.medium,
                        borderSide: const BorderSide(color: AppColors.lightBorder),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                AppButton(
                  text: 'Save',
                  height: 48,
                  onPressed: () {
                    final txt = customController.text.trim();
                    if (txt.isNotEmpty) {
                      setState(() {
                        if (!_accounts.contains(txt)) _accounts.insert(0, txt);
                        _selectedAccount = txt;
                      });
                      Navigator.pop(context);
                    }
                  },
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Suggestions',
              style: AppTypography.caption.copyWith(color: AppColors.lightTextSecondary),
            ),
            const SizedBox(height: AppSpacing.xs),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _accounts.map((acc) {
                final isSelected = acc == _selectedAccount;
                return ChoiceChip(
                  label: Text(acc),
                  selected: isSelected,
                  selectedColor: AppColors.lightAccent.withOpacity(0.2),
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => _selectedAccount = acc);
                      Navigator.pop(context);
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final parsedAmount = double.tryParse(_amountString) ?? 0.0;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Add Transaction'),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                children: [
                  const SizedBox(height: AppSpacing.md),

                  // Transaction Type Pill Toggle
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.darkSurfaceSecondary : AppColors.lightSurfaceSecondary,
                        borderRadius: AppRadius.roundedPill,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildTypeTab('Expense', 'DEBIT', isDark),
                          _buildTypeTab('Income', 'CREDIT', isDark),
                          _buildTypeTab('Transfer', 'TRANSFER', isDark),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Hero Amount Display
                  Center(
                    child: Column(
                      children: [
                        Text(
                          '₹',
                          style: AppTypography.title.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                        Text(
                          _amountString,
                          style: AppTypography.heroAmount.copyWith(
                            color: _transactionType == 'DEBIT'
                                ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
                                : _transactionType == 'CREDIT'
                                    ? (isDark ? AppColors.darkIncome : AppColors.lightIncome)
                                    : (isDark ? AppColors.darkTransfer : AppColors.lightTransfer),
                            fontSize: 48,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.xl),

                  // Form Fields (Grouped iOS style)
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                      borderRadius: AppRadius.large,
                      border: Border.all(
                        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                        width: 0.5,
                      ),
                    ),
                    child: Column(
                      children: [
                        _buildRow(
                          label: 'Merchant',
                          child: TextField(
                            controller: _merchantController,
                            textAlign: TextAlign.end,
                            style: AppTypography.headline.copyWith(
                              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            ),
                            decoration: InputDecoration(
                              hintText: 'e.g. Swiggy, Uber',
                              hintStyle: AppTypography.body.copyWith(
                                color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                        _buildDivider(isDark),
                        _buildRow(
                          label: 'Category',
                          value: _selectedCategory,
                          onTap: _openCategoryPicker,
                          showChevron: true,
                          isDark: isDark,
                        ),
                        _buildDivider(isDark),
                        _buildRow(
                          label: 'Payment',
                          value: _selectedPaymentMethod,
                          onTap: _openPaymentPicker,
                          showChevron: true,
                          isDark: isDark,
                        ),
                        _buildDivider(isDark),
                        _buildRow(
                          label: 'Account',
                          value: _selectedAccount,
                          onTap: _openAccountPicker,
                          showChevron: true,
                          isDark: isDark,
                        ),
                        _buildDivider(isDark),
                        _buildRow(
                          label: 'Note',
                          child: TextField(
                            controller: _noteController,
                            textAlign: TextAlign.end,
                            style: AppTypography.headline.copyWith(
                              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Optional note',
                              hintStyle: AppTypography.body.copyWith(
                                color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: AppSpacing.lg),

                  // Numeric Keypad
                  _buildKeypad(isDark),

                  const SizedBox(height: AppSpacing.lg),
                ],
              ),
            ),

            // Primary Add Expense CTA Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
              child: AppButton(
                text: _transactionType == 'DEBIT'
                    ? 'Add Expense'
                    : _transactionType == 'CREDIT'
                        ? 'Add Income'
                        : 'Record Transfer',
                onPressed: parsedAmount > 0
                    ? () {
                        HapticsHelper.success();
                        widget.onExpenseAdded();
                        Navigator.pop(context);
                      }
                    : null,
                width: double.infinity,
                height: 52,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeTab(String label, String type, bool isDark) {
    final isSelected = _transactionType == type;

    return GestureDetector(
      onTap: () {
        HapticsHelper.selectionClick();
        setState(() => _transactionType = type);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? AppColors.darkSurface : AppColors.lightSurface)
              : Colors.transparent,
          borderRadius: AppRadius.roundedPill,
        ),
        child: Text(
          label,
          style: AppTypography.callout.copyWith(
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            color: isSelected
                ? (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary)
                : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
          ),
        ),
      ),
    );
  }

  Widget _buildRow({
    required String label,
    String? value,
    Widget? child,
    VoidCallback? onTap,
    bool showChevron = false,
    bool isDark = false,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: AppTypography.headline.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            if (child != null)
              Expanded(child: child)
            else
              Row(
                children: [
                  Text(
                    value ?? '',
                    style: AppTypography.headline.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  if (showChevron) ...[
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right, size: 18, color: AppColors.lightTextTertiary),
                  ],
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
      height: 0.5,
      indent: AppSpacing.md,
    );
  }

  Widget _buildKeypad(bool isDark) {
    final keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['.', '0', '⌫'],
    ];

    return Column(
      children: keys.map((row) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: row.map((key) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.all(4.0),
                child: Material(
                  color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                  borderRadius: AppRadius.medium,
                  child: InkWell(
                    borderRadius: AppRadius.medium,
                    onTap: () => _onKeypadTap(key),
                    child: Container(
                      height: 48,
                      alignment: Alignment.center,
                      child: Text(
                        key,
                        style: AppTypography.title.copyWith(
                          fontSize: 22,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        );
      }).toList(),
    );
  }
}
