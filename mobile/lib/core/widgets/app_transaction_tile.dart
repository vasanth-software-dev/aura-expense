import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/currency_formatter.dart';
import '../utils/haptics_helper.dart';

class AppTransactionTile extends StatelessWidget {
  final String title;
  final String categoryName;
  final String paymentMethod;
  final double amount;
  final String type; // DEBIT, CREDIT, TRANSFER
  final String time;
  final String? iconEmoji;
  final Color? categoryColor;
  final bool needsReview;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;

  const AppTransactionTile({
    super.key,
    required this.title,
    required this.categoryName,
    required this.paymentMethod,
    required this.amount,
    required this.type,
    required this.time,
    this.iconEmoji,
    this.categoryColor,
    this.needsReview = false,
    this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Color amountColor;
    String prefix;
    if (type == 'DEBIT') {
      amountColor = isDark ? AppColors.darkExpense : AppColors.lightExpense;
      prefix = '-';
    } else if (type == 'CREDIT') {
      amountColor = isDark ? AppColors.darkIncome : AppColors.lightIncome;
      prefix = '+';
    } else {
      amountColor = isDark ? AppColors.darkTransfer : AppColors.lightTransfer;
      prefix = '';
    }

    Widget content = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticsHelper.light();
          if (onTap != null) onTap!();
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            children: [
              // Icon surface
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: (categoryColor ?? (isDark ? AppColors.darkAccent : AppColors.lightAccent))
                      .withOpacity(0.12),
                  borderRadius: AppRadius.medium,
                ),
                alignment: Alignment.center,
                child: Text(
                  iconEmoji ?? '💳',
                  style: const TextStyle(fontSize: 20),
                ),
              ),
              const SizedBox(width: AppSpacing.md),

              // Title and category/payment info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: AppTypography.headline.copyWith(
                              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (needsReview) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: (isDark ? AppColors.darkWarning : AppColors.lightWarning)
                                  .withOpacity(0.15),
                              borderRadius: AppRadius.roundedPill,
                            ),
                            child: Text(
                              'Review',
                              style: AppTypography.subcaption.copyWith(
                                color: isDark ? AppColors.darkWarning : AppColors.lightWarning,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$categoryName · $paymentMethod',
                      style: AppTypography.caption.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),

              // Amount and time
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '$prefix${CurrencyFormatter.format(amount)}',
                    style: AppTypography.headline.copyWith(
                      color: amountColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    time,
                    style: AppTypography.caption.copyWith(
                      color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (onDelete != null) {
      return Dismissible(
        key: UniqueKey(),
        direction: DismissDirection.endToStart,
        background: Container(
          color: isDark ? AppColors.darkExpense : AppColors.lightExpense,
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: AppSpacing.lg),
          child: const Icon(Icons.delete_outline, color: Colors.white, size: 24),
        ),
        confirmDismiss: (direction) async {
          HapticsHelper.warning();
          return true;
        },
        onDismissed: (_) => onDelete!(),
        child: content,
      );
    }

    return content;
  }
}
