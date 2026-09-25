import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_bottom_sheet.dart';
import '../../core/widgets/app_empty_state.dart';

class ReviewItem {
  final String id;
  final String merchant;
  final double amount;
  final String paymentMethod;
  final String time;
  String category;
  Color categoryColor;
  bool rememberRule;

  ReviewItem({
    required this.id,
    required this.merchant,
    required this.amount,
    required this.paymentMethod,
    required this.time,
    required this.category,
    required this.categoryColor,
    this.rememberRule = true,
  });
}

class ReviewQueueScreen extends StatefulWidget {
  const ReviewQueueScreen({super.key});

  @override
  State<ReviewQueueScreen> createState() => _ReviewQueueScreenState();
}

class _ReviewQueueScreenState extends State<ReviewQueueScreen> {
  final List<ReviewItem> _pendingItems = [
    ReviewItem(
      id: 'rev-1',
      merchant: 'M/S Venkateshwara Store',
      amount: 1250.0,
      paymentMethod: 'UPI',
      time: 'Today, 2:15 PM',
      category: 'Groceries',
      categoryColor: AppColors.groceries,
      rememberRule: true,
    ),
    ReviewItem(
      id: 'rev-2',
      merchant: 'PAYTM*RECHARGE',
      amount: 499.0,
      paymentMethod: 'UPI',
      time: 'Yesterday, 11:30 AM',
      category: 'Bills & Utilities',
      categoryColor: AppColors.bills,
      rememberRule: true,
    ),
  ];

  final List<Map<String, dynamic>> _categoryChoices = [
    {'name': 'Food & Dining', 'color': AppColors.food},
    {'name': 'Groceries', 'color': AppColors.groceries},
    {'name': 'Shopping', 'color': AppColors.shopping},
    {'name': 'Transportation', 'color': AppColors.transport},
    {'name': 'Bills & Utilities', 'color': AppColors.bills},
    {'name': 'Health & Medical', 'color': AppColors.health},
    {'name': 'Entertainment', 'color': AppColors.entertainment},
    {'name': 'Other', 'color': AppColors.other},
  ];

  void _chooseCategory(ReviewItem item) {
    AppBottomSheet.show(
      context: context,
      title: 'Select Category',
      child: ListView.separated(
        shrinkWrap: true,
        itemCount: _categoryChoices.length,
        separatorBuilder: (_, __) => const Divider(height: 0.5),
        itemBuilder: (context, index) {
          final cat = _categoryChoices[index];
          final isSelected = cat['name'] == item.category;

          return ListTile(
            title: Text(cat['name'], style: AppTypography.headline),
            trailing: isSelected
                ? const Icon(Icons.check, color: AppColors.lightAccent)
                : null,
            onTap: () {
              setState(() {
                item.category = cat['name'];
                item.categoryColor = cat['color'];
              });
              Navigator.pop(context);
            },
          );
        },
      ),
    );
  }

  void _confirmReview(ReviewItem item) {
    HapticsHelper.success();
    setState(() {
      _pendingItems.removeWhere((i) => i.id == item.id);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Categorized as ${item.category}'),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Review Queue'),
      ),
      body: SafeArea(
        child: _pendingItems.isEmpty
            ? AppEmptyState(
                icon: Icons.task_alt_rounded,
                title: 'All Caught Up!',
                description: 'No transactions need review right now. All your recent expenses are organized.',
                buttonText: 'Return to Dashboard',
                onButtonPressed: () => Navigator.pop(context),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: _pendingItems.length,
                separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.lg),
                itemBuilder: (context, index) {
                  final item = _pendingItems[index];

                  return AppCard(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              item.time,
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: (isDark ? AppColors.darkWarning : AppColors.lightWarning).withOpacity(0.15),
                                borderRadius: AppRadius.roundedPill,
                              ),
                              child: Text(
                                'Low Confidence',
                                style: AppTypography.subcaption.copyWith(
                                  color: isDark ? AppColors.darkWarning : AppColors.lightWarning,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          CurrencyFormatter.format(item.amount),
                          style: AppTypography.largeTitle.copyWith(
                            color: isDark ? AppColors.darkExpense : AppColors.lightExpense,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          item.merchant,
                          style: AppTypography.headline.copyWith(
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                        ),
                        Text(
                          'Payment: ${item.paymentMethod}',
                          style: AppTypography.caption.copyWith(
                            color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                        const SizedBox(height: AppSpacing.md),

                        // Category Selector
                        InkWell(
                          onTap: () => _chooseCategory(item),
                          borderRadius: AppRadius.medium,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkSurfaceSecondary : AppColors.lightSurfaceSecondary,
                              borderRadius: AppRadius.medium,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        color: item.categoryColor,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      item.category,
                                      style: AppTypography.headline.copyWith(
                                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                                const Icon(Icons.chevron_right, size: 18, color: AppColors.lightTextTertiary),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: AppSpacing.md),

                        // Remember Rule Toggle
                        Row(
                          children: [
                            Checkbox(
                              value: item.rememberRule,
                              activeColor: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                              onChanged: (val) {
                                setState(() => item.rememberRule = val ?? true);
                              },
                            ),
                            Expanded(
                              child: Text(
                                'Remember rule for future "${item.merchant}" transactions',
                                style: AppTypography.caption.copyWith(
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: AppSpacing.sm),

                        // Confirm Button
                        AppButton(
                          text: 'Confirm Category',
                          width: double.infinity,
                          height: 44,
                          onPressed: () => _confirmReview(item),
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
