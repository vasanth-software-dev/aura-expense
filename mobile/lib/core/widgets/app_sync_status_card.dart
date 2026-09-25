import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/haptics_helper.dart';
import 'app_card.dart';

enum SyncState { idle, syncing, success, error }

class AppSyncStatusCard extends StatelessWidget {
  final SyncState state;
  final String lastSyncedText;
  final int newTransactionsCount;
  final int needsReviewCount;
  final int duplicatesSkippedCount;
  final VoidCallback? onSyncNow;
  final VoidCallback? onReviewTap;

  const AppSyncStatusCard({
    super.key,
    this.state = SyncState.idle,
    required this.lastSyncedText,
    this.newTransactionsCount = 0,
    this.needsReviewCount = 0,
    this.duplicatesSkippedCount = 0,
    this.onSyncNow,
    this.onReviewTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget iconWidget;
    String statusTitle;
    String statusSubtitle;

    switch (state) {
      case SyncState.syncing:
        iconWidget = SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(
              isDark ? AppColors.darkAccent : AppColors.lightAccent,
            ),
          ),
        );
        statusTitle = 'Syncing transactions...';
        statusSubtitle = 'Checking your connected accounts';
        break;
      case SyncState.error:
        iconWidget = Icon(
          Icons.error_outline,
          size: 22,
          color: isDark ? AppColors.darkExpense : AppColors.lightExpense,
        );
        statusTitle = "Couldn't sync";
        statusSubtitle = 'Your account needs attention';
        break;
      case SyncState.success:
      case SyncState.idle:
      default:
        iconWidget = Icon(
          Icons.check_circle_outline,
          size: 22,
          color: isDark ? AppColors.darkIncome : AppColors.lightIncome,
        );
        statusTitle = 'All caught up';
        statusSubtitle = 'Last synced $lastSyncedText';
        break;
    }

    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        children: [
          Row(
            children: [
              iconWidget,
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      statusTitle,
                      style: AppTypography.headline.copyWith(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      statusSubtitle,
                      style: AppTypography.caption.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (state != SyncState.syncing && onSyncNow != null)
                TextButton(
                  onPressed: () {
                    HapticsHelper.light();
                    onSyncNow!();
                  },
                  child: Text(
                    state == SyncState.error ? 'Try Again' : 'Sync Now',
                    style: AppTypography.callout.copyWith(
                      color: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          if (needsReviewCount > 0 || newTransactionsCount > 0) ...[
            const SizedBox(height: AppSpacing.sm),
            Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
            const SizedBox(height: AppSpacing.xs),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (newTransactionsCount > 0)
                  Text(
                    '$newTransactionsCount new transactions',
                    style: AppTypography.caption.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                if (needsReviewCount > 0)
                  GestureDetector(
                    onTap: () {
                      HapticsHelper.light();
                      if (onReviewTap != null) onReviewTap!();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: (isDark ? AppColors.darkWarning : AppColors.lightWarning)
                            .withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$needsReviewCount needs review →',
                        style: AppTypography.caption.copyWith(
                          color: isDark ? AppColors.darkWarning : AppColors.lightWarning,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
