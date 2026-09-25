import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_search_bar.dart';
import '../../core/widgets/app_transaction_tile.dart';
import '../../core/widgets/app_empty_state.dart';

class TransactionItemModel {
  final String id;
  final String title;
  final String categoryName;
  final String paymentMethod;
  final double amount;
  final String type; // DEBIT, CREDIT, TRANSFER
  final String time;
  final String dateGroup; // Today, Yesterday, Sep 23
  final String? iconEmoji;
  final Color? categoryColor;
  final bool needsReview;

  TransactionItemModel({
    required this.id,
    required this.title,
    required this.categoryName,
    required this.paymentMethod,
    required this.amount,
    required this.type,
    required this.time,
    required this.dateGroup,
    this.iconEmoji,
    this.categoryColor,
    this.needsReview = false,
  });
}

class TransactionsScreen extends StatefulWidget {
  final VoidCallback onAddExpenseTap;
  final ValueChanged<TransactionItemModel>? onTransactionTap;

  const TransactionsScreen({
    super.key,
    required this.onAddExpenseTap,
    this.onTransactionTap,
  });

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  String _selectedFilter = 'All';
  String _searchQuery = '';

  final List<String> _filters = [
    'All',
    'Expenses',
    'Income',
    'Transfers',
    'UPI',
    'Cash',
    'Card',
    'Bank',
  ];

  final List<TransactionItemModel> _allTransactions = [
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
      categoryName: 'Salary',
      paymentMethod: 'Bank Transfer',
      amount: 85000.0,
      type: 'CREDIT',
      time: '10:00 AM',
      dateGroup: 'September 23',
      iconEmoji: '💼',
      categoryColor: AppColors.salary,
    ),
    TransactionItemModel(
      id: 'tx-6',
      title: 'Transfer to SBI',
      categoryName: 'Transfer',
      paymentMethod: 'IMPS',
      amount: 15000.0,
      type: 'TRANSFER',
      time: '3:20 PM',
      dateGroup: 'September 22',
      iconEmoji: '🔄',
      categoryColor: AppColors.lightTransfer,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Filter logic
    final filtered = _allTransactions.where((t) {
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final matches = t.title.toLowerCase().contains(q) ||
            t.categoryName.toLowerCase().contains(q) ||
            t.paymentMethod.toLowerCase().contains(q);
        if (!matches) return false;
      }

      switch (_selectedFilter) {
        case 'Expenses':
          return t.type == 'DEBIT';
        case 'Income':
          return t.type == 'CREDIT';
        case 'Transfers':
          return t.type == 'TRANSFER';
        case 'UPI':
          return t.paymentMethod == 'UPI';
        case 'Cash':
          return t.paymentMethod == 'Cash';
        case 'Card':
          return t.paymentMethod.contains('Card');
        case 'Bank':
          return t.paymentMethod.contains('Bank') || t.paymentMethod.contains('IMPS');
        case 'All':
        default:
          return true;
      }
    }).toList();

    // Group by dateGroup
    final Map<String, List<TransactionItemModel>> grouped = {};
    for (final tx in filtered) {
      grouped.putIfAbsent(tx.dateGroup, () => []).add(tx);
    }

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Screen Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.xs),
              child: Text(
                'Transactions',
                style: AppTypography.largeTitle.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                ),
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.xs),
              child: AppSearchBar(
                placeholder: 'Search transactions...',
                onChanged: (val) => setState(() => _searchQuery = val),
              ),
            ),

            const SizedBox(height: AppSpacing.xs),

            // Horizontal Filter Chips
            SizedBox(
              height: 38,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.xs),
                itemBuilder: (context, index) {
                  final filter = _filters[index];
                  final isSelected = filter == _selectedFilter;

                  return GestureDetector(
                    onTap: () {
                      HapticsHelper.selectionClick();
                      setState(() => _selectedFilter = filter);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? (isDark ? AppColors.darkAccent : AppColors.lightAccent)
                            : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
                        borderRadius: AppRadius.roundedPill,
                        border: Border.all(
                          color: isSelected
                              ? Colors.transparent
                              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                          width: 0.5,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        filter,
                        style: AppTypography.callout.copyWith(
                          color: isSelected
                              ? Colors.white
                              : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

            // Grouped Transaction List or Empty State
            Expanded(
              child: filtered.isEmpty
                  ? AppEmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No transactions found',
                      description: 'Try adjusting your filters or add a new transaction.',
                      buttonText: '+ Add Expense',
                      onButtonPressed: widget.onAddExpenseTap,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                      itemCount: grouped.keys.length,
                      itemBuilder: (context, groupIndex) {
                        final dateGroup = grouped.keys.elementAt(groupIndex);
                        final itemsInGroup = grouped[dateGroup]!;

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(top: AppSpacing.md, bottom: AppSpacing.xs, left: 4),
                              child: Text(
                                dateGroup,
                                style: AppTypography.callout.copyWith(
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            AppCard(
                              padding: EdgeInsets.zero,
                              child: Column(
                                children: itemsInGroup.asMap().entries.map((entry) {
                                  final idx = entry.key;
                                  final item = entry.value;
                                  final isLast = idx == itemsInGroup.length - 1;

                                  return Column(
                                    children: [
                                      AppTransactionTile(
                                        title: item.title,
                                        categoryName: item.categoryName,
                                        paymentMethod: item.paymentMethod,
                                        amount: item.amount,
                                        type: item.type,
                                        time: item.time,
                                        iconEmoji: item.iconEmoji,
                                        categoryColor: item.categoryColor,
                                        needsReview: item.needsReview,
                                        onTap: () {
                                          if (widget.onTransactionTap != null) {
                                            widget.onTransactionTap!(item);
                                          }
                                        },
                                        onDelete: () {
                                          setState(() => _allTransactions.removeWhere((t) => t.id == item.id));
                                        },
                                      ),
                                      if (!isLast)
                                        Divider(
                                          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                                          height: 0.5,
                                          indent: 64,
                                        ),
                                    ],
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
