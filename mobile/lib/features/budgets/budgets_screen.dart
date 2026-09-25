import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_progress_bar.dart';

class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  double _monthlyLimit = 30000.0;
  double _totalSpent = 24680.0;

  final List<Map<String, dynamic>> _categoryBudgets = [
    {'name': 'Food & Dining', 'icon': '🥤', 'color': AppColors.food, 'spent': 6420.0, 'limit': 8000.0},
    {'name': 'Shopping', 'icon': '🛍', 'color': AppColors.shopping, 'spent': 5210.0, 'limit': 6000.0},
    {'name': 'Bills & Utilities', 'icon': '🧾', 'color': AppColors.bills, 'spent': 4200.0, 'limit': 5000.0},
    {'name': 'Transportation', 'icon': '🚕', 'color': AppColors.transport, 'spent': 2310.0, 'limit': 3000.0},
    {'name': 'Entertainment', 'icon': '🎬', 'color': AppColors.entertainment, 'spent': 2140.0, 'limit': 2500.0},
    {'name': 'Health', 'icon': '💊', 'color': AppColors.health, 'spent': 1500.0, 'limit': 2000.0},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalProgress = _monthlyLimit > 0 ? _totalSpent / _monthlyLimit : 0.0;
    final remaining = (_monthlyLimit - _totalSpent).clamp(0.0, double.infinity);

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Budgets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            onPressed: () {
              HapticsHelper.light();
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          children: [
            const SizedBox(height: AppSpacing.md),

            // Overall Monthly Budget Hero Card
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'September Budget',
                        style: AppTypography.callout.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: (totalProgress > 0.8
                                  ? (isDark ? AppColors.darkWarning : AppColors.lightWarning)
                                  : (isDark ? AppColors.darkAccent : AppColors.lightAccent))
                              .withOpacity(0.15),
                          borderRadius: AppRadius.roundedPill,
                        ),
                        child: Text(
                          '${(totalProgress * 100).toInt()}% used',
                          style: AppTypography.subcaption.copyWith(
                            color: totalProgress > 0.8
                                ? (isDark ? AppColors.darkWarning : AppColors.lightWarning)
                                : (isDark ? AppColors.darkAccent : AppColors.lightAccent),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        CurrencyFormatter.format(_totalSpent),
                        style: AppTypography.title.copyWith(
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        ' / ${CurrencyFormatter.format(_monthlyLimit)}',
                        style: AppTypography.headline.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  AppProgressBar(progress: totalProgress, height: 12),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    '${CurrencyFormatter.format(remaining)} remaining for the next 5 days',
                    style: AppTypography.caption.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),

            if (totalProgress >= 0.8) ...[
              const SizedBox(height: AppSpacing.md),
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: (isDark ? AppColors.darkWarning : AppColors.lightWarning).withOpacity(0.12),
                  borderRadius: AppRadius.medium,
                  border: Border.all(
                    color: (isDark ? AppColors.darkWarning : AppColors.lightWarning).withOpacity(0.3),
                    width: 0.5,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.warning_amber_rounded,
                      color: isDark ? AppColors.darkWarning : AppColors.lightWarning,
                      size: 20,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        "You've used ${(totalProgress * 100).toInt()}% of your monthly budget.",
                        style: AppTypography.caption.copyWith(
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.xl),

            // Category Budgets Header
            Text(
              'Category Budgets',
              style: AppTypography.sectionTitle.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

            // Category Budgets Card
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                children: _categoryBudgets.map((cat) {
                  final spent = cat['spent'] as double;
                  final limit = cat['limit'] as double;
                  final ratio = limit > 0 ? (spent / limit) : 0.0;
                  final pct = (ratio * 100).toInt();

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Text(cat['icon'], style: const TextStyle(fontSize: 16)),
                                const SizedBox(width: 8),
                                Text(
                                  cat['name'],
                                  style: AppTypography.headline.copyWith(
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                  ),
                                ),
                              ],
                            ),
                            Text(
                              '${CurrencyFormatter.format(spent)} / ${CurrencyFormatter.format(limit)}',
                              style: AppTypography.callout.copyWith(
                                fontWeight: FontWeight.w600,
                                color: ratio > 1.0
                                    ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
                                    : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        AppProgressBar(
                          progress: ratio,
                          height: 8,
                          color: cat['color'] as Color,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              ratio > 1.0
                                  ? 'Exceeded by ${CurrencyFormatter.format(spent - limit)}'
                                  : '${CurrencyFormatter.format(limit - spent)} remaining',
                              style: AppTypography.subcaption.copyWith(
                                color: ratio > 1.0
                                    ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
                                    : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                              ),
                            ),
                            Text(
                              '$pct%',
                              style: AppTypography.subcaption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),

            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }
}
