import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_segmented_control.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  String _selectedPeriod = 'This Month';

  final Map<String, String> _periods = {
    '7D': '7 Days',
    '30D': '30 Days',
    'This Month': 'This Month',
    'Last Month': 'Last Month',
  };

  final List<Map<String, dynamic>> _reportCategories = [
    {'name': 'Food & Dining', 'icon': '🥤', 'color': AppColors.food, 'amount': 8420.0, 'pct': 34.1},
    {'name': 'Shopping', 'icon': '🛍', 'color': AppColors.shopping, 'amount': 6210.0, 'pct': 25.2},
    {'name': 'Bills & Utilities', 'icon': '🧾', 'color': AppColors.bills, 'amount': 4850.0, 'pct': 19.6},
    {'name': 'Transportation', 'icon': '🚕', 'color': AppColors.transport, 'amount': 2800.0, 'pct': 11.3},
    {'name': 'Other', 'icon': '📦', 'color': AppColors.other, 'amount': 2400.0, 'pct': 9.8},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Spending Reports'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          children: [
            const SizedBox(height: AppSpacing.sm),

            // Time Period Segmented Control
            AppSegmentedControl<String>(
              segments: _periods,
              selectedValue: _selectedPeriod,
              onValueChanged: (val) => setState(() => _selectedPeriod = val),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Spending Summary Card
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                children: [
                  Text(
                    'September',
                    style: AppTypography.callout.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '₹24,680',
                    style: AppTypography.heroAmount.copyWith(
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxs),
                  Text(
                    'Total spending',
                    style: AppTypography.caption.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (isDark ? AppColors.darkIncome : AppColors.lightIncome).withOpacity(0.12),
                      borderRadius: AppRadius.roundedPill,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.arrow_downward_rounded,
                          size: 14,
                          color: isDark ? AppColors.darkIncome : AppColors.lightIncome,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '8% compared with August',
                          style: AppTypography.subcaption.copyWith(
                            color: isDark ? AppColors.darkIncome : AppColors.lightIncome,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Minimal Donut Chart Representation
            Center(
              child: SizedBox(
                width: 180,
                height: 180,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: 0.34,
                      strokeWidth: 16,
                      color: AppColors.food,
                      backgroundColor: (isDark ? AppColors.darkSurfaceSecondary : AppColors.lightSurfaceSecondary),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Food',
                          style: AppTypography.callout.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                        Text(
                          '34%',
                          style: AppTypography.title.copyWith(
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Category Breakdown Table
            Text(
              'Category Breakdown',
              style: AppTypography.sectionTitle.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: _reportCategories.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final cat = entry.value;
                  final isLast = idx == _reportCategories.length - 1;

                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
                        child: Row(
                          children: [
                            Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: cat['color'] as Color,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(cat['icon'], style: const TextStyle(fontSize: 16)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                cat['name'],
                                style: AppTypography.headline.copyWith(
                                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                ),
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  CurrencyFormatter.format(cat['amount']),
                                  style: AppTypography.headline.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                  ),
                                ),
                                Text(
                                  '${cat['pct']}%',
                                  style: AppTypography.caption.copyWith(
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (!isLast)
                        Divider(
                          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                          height: 0.5,
                          indent: AppSpacing.md,
                        ),
                    ],
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
