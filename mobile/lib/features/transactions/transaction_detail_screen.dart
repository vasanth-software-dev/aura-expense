import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import 'transactions_screen.dart';

class TransactionDetailScreen extends StatelessWidget {
  final TransactionItemModel transaction;
  final VoidCallback onDeleted;
  final VoidCallback? onMarkAsTransfer;

  const TransactionDetailScreen({
    super.key,
    required this.transaction,
    required this.onDeleted,
    this.onMarkAsTransfer,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Color amountColor;
    String prefix = '';
    if (transaction.type == 'DEBIT') {
      amountColor = isDark ? AppColors.darkExpense : AppColors.lightExpense;
      prefix = '-';
    } else if (transaction.type == 'CREDIT') {
      amountColor = isDark ? AppColors.darkIncome : AppColors.lightIncome;
      prefix = '+';
    } else {
      amountColor = isDark ? AppColors.darkTransfer : AppColors.lightTransfer;
    }

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Transaction Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
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
            const SizedBox(height: AppSpacing.xl),

            // Top Hero Amount
            Center(
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: (transaction.categoryColor ?? AppColors.lightAccent).withOpacity(0.15),
                      borderRadius: AppRadius.large,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      transaction.iconEmoji ?? '💳',
                      style: const TextStyle(fontSize: 30),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    '$prefix${CurrencyFormatter.format(transaction.amount)}',
                    style: AppTypography.heroAmount.copyWith(
                      color: amountColor,
                      fontSize: 38,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    transaction.title,
                    style: AppTypography.title.copyWith(
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    transaction.categoryName,
                    style: AppTypography.callout.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xxl),

            // Grouped Details Card
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildDetailRow('Payment Method', transaction.paymentMethod, isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Account', 'HDFC Bank ••••1234', isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Date & Time', '${transaction.dateGroup}, ${transaction.time}', isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('UPI Reference', '426912345678', isDark),
                  _buildDivider(isDark),
                  _buildDetailRow('Sources', 'SMS + Connected Email', isDark),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Action Buttons
            AppButton(
              text: 'Mark as Transfer',
              variant: AppButtonVariant.secondary,
              icon: Icons.swap_horiz_rounded,
              onPressed: () {
                HapticsHelper.medium();
                if (onMarkAsTransfer != null) onMarkAsTransfer!();
                Navigator.pop(context);
              },
            ),

            const SizedBox(height: AppSpacing.sm),

            AppButton(
              text: 'Delete Transaction',
              variant: AppButtonVariant.destructive,
              icon: Icons.delete_outline_rounded,
              onPressed: () {
                HapticsHelper.warning();
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Delete Transaction?'),
                    content: const Text('This will remove this transaction and its sources from your financial records.'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          onDeleted();
                          Navigator.pop(context);
                        },
                        child: const Text('Delete', style: TextStyle(color: AppColors.lightExpense)),
                      ),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTypography.body.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          Text(
            value,
            style: AppTypography.headline.copyWith(
              color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
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
}
