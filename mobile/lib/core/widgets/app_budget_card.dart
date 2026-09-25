import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/currency_formatter.dart';
import 'app_card.dart';
import 'app_progress_bar.dart';

class AppBudgetCard extends StatelessWidget {
  final double spent;
  final double totalLimit;
  final VoidCallback? onTap;

  const AppBudgetCard({
    super.key,
    required this.spent,
    required this.totalLimit,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = totalLimit > 0 ? (spent / totalLimit) : 0.0;
    final remaining = (totalLimit - spent).clamp(0.0, double.infinity);
    final percentage = (progress * 100).toInt();

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Monthly Budget',
                style: AppTypography.callout.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              Text(
                '$percentage%',
                style: AppTypography.callout.copyWith(
                  fontWeight: FontWeight.w600,
                  color: progress > 1.0
                      ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
                      : progress > 0.8
                          ? (isDark ? AppColors.darkWarning : AppColors.lightWarning)
                          : (isDark ? AppColors.darkAccent : AppColors.lightAccent),
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
                CurrencyFormatter.format(spent),
                style: AppTypography.title.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                ' / ${CurrencyFormatter.format(totalLimit)}',
                style: AppTypography.headline.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          AppProgressBar(progress: progress, height: 10),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                progress > 1.0
                    ? 'Over budget by ${CurrencyFormatter.format(spent - totalLimit)}'
                    : '${CurrencyFormatter.format(remaining)} remaining',
                style: AppTypography.caption.copyWith(
                  color: progress > 1.0
                      ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
                      : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                  fontWeight: progress > 1.0 ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
              const Icon(
                Icons.chevron_right,
                size: 16,
                color: AppColors.lightTextTertiary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
