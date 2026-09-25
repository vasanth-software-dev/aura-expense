import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_card.dart';
import '../../core/widgets/app_budget_card.dart';
import '../../core/widgets/app_sync_status_card.dart';
import '../../core/widgets/app_transaction_tile.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onAddExpenseTap;
  final VoidCallback onSeeAllTransactionsTap;
  final VoidCallback onReviewQueueTap;
  final VoidCallback onEmailSyncTap;
  final VoidCallback onReportsTap;

  const HomeScreen({
    super.key,
    required this.onAddExpenseTap,
    required this.onSeeAllTransactionsTap,
    required this.onReviewQueueTap,
    required this.onEmailSyncTap,
    required this.onReportsTap,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Sample production state
  double _totalSpent = 24680.0;
  double _budgetLimit = 30000.0;
  SyncState _syncState = SyncState.success;
  int _needsReviewCount = 1;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.05),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic));

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: SlideTransition(
            position: _slideAnimation,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              children: [
                const SizedBox(height: AppSpacing.sm),

                // Greeting & Date Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Good morning',
                          style: AppTypography.caption.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'September 25',
                          style: AppTypography.title.copyWith(
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    // Profile / Status indicator
                    GestureDetector(
                      onTap: () {
                        HapticsHelper.light();
                        widget.onEmailSyncTap();
                      },
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: (isDark ? AppColors.darkSurfaceSecondary : AppColors.lightSurfaceSecondary),
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: const Text('🇮🇳', style: TextStyle(fontSize: 20)),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppSpacing.xl),

                // Hero Spent This Month
                Center(
                  child: Column(
                    children: [
                      Text(
                        CurrencyFormatter.format(_totalSpent),
                        style: AppTypography.heroAmount.copyWith(
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        'Spent this month',
                        style: AppTypography.callout.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                // Quick Actions
                Row(
                  children: [
                    _buildQuickAction(
                      icon: Icons.add_rounded,
                      label: 'Add Expense',
                      onTap: widget.onAddExpenseTap,
                      isDark: isDark,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _buildQuickAction(
                      icon: Icons.sync_rounded,
                      label: 'Sync Email',
                      onTap: widget.onEmailSyncTap,
                      isDark: isDark,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _buildQuickAction(
                      icon: Icons.checklist_rounded,
                      label: 'Review',
                      badge: _needsReviewCount > 0 ? '$_needsReviewCount' : null,
                      onTap: widget.onReviewQueueTap,
                      isDark: isDark,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    _buildQuickAction(
                      icon: Icons.bar_chart_rounded,
                      label: 'Reports',
                      onTap: widget.onReportsTap,
                      isDark: isDark,
                    ),
                  ],
                ),

                const SizedBox(height: AppSpacing.lg),

                // Sync Status Card
                AppSyncStatusCard(
                  state: _syncState,
                  lastSyncedText: '5 minutes ago',
                  newTransactionsCount: 4,
                  needsReviewCount: _needsReviewCount,
                  duplicatesSkippedCount: 2,
                  onSyncNow: () {
                    setState(() => _syncState = SyncState.syncing);
                    Future.delayed(const Duration(seconds: 2), () {
                      if (mounted) setState(() => _syncState = SyncState.success);
                    });
                  },
                  onReviewTap: widget.onReviewQueueTap,
                ),

                const SizedBox(height: AppSpacing.md),

                // Budget Card
                AppBudgetCard(
                  spent: _totalSpent,
                  totalLimit: _budgetLimit,
                  onTap: widget.onReportsTap,
                ),

                const SizedBox(height: AppSpacing.xl),

                // Spending Donut / Category Summary Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Spending by Category',
                      style: AppTypography.sectionTitle.copyWith(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    GestureDetector(
                      onTap: widget.onReportsTap,
                      child: Text(
                        'Details',
                        style: AppTypography.callout.copyWith(
                          color: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppSpacing.md),

                // Minimal Category Breakdown Bars
                AppCard(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    children: [
                      _buildCategoryRow('🥤 Food & Dining', 8420.0, 0.34, AppColors.food, isDark),
                      const SizedBox(height: AppSpacing.sm),
                      _buildCategoryRow('🛍 Shopping', 6210.0, 0.25, AppColors.shopping, isDark),
                      const SizedBox(height: AppSpacing.sm),
                      _buildCategoryRow('🧾 Bills & Utilities', 4850.0, 0.20, AppColors.bills, isDark),
                      const SizedBox(height: AppSpacing.sm),
                      _buildCategoryRow('🚕 Transportation', 2800.0, 0.11, AppColors.transport, isDark),
                      const SizedBox(height: AppSpacing.sm),
                      _buildCategoryRow('📦 Others', 2400.0, 0.10, AppColors.other, isDark),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.xl),

                // Recent Transactions Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent',
                      style: AppTypography.sectionTitle.copyWith(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    GestureDetector(
                      onTap: widget.onSeeAllTransactionsTap,
                      child: Text(
                        'See All',
                        style: AppTypography.callout.copyWith(
                          color: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppSpacing.sm),

                // Recent Transactions List (Clean iOS card container)
                AppCard(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      AppTransactionTile(
                        iconEmoji: '🥤',
                        title: 'Swiggy',
                        categoryName: 'Food',
                        paymentMethod: 'UPI',
                        amount: 438.0,
                        type: 'DEBIT',
                        time: 'Today',
                        categoryColor: AppColors.food,
                      ),
                      Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                      AppTransactionTile(
                        iconEmoji: '🛍',
                        title: 'Amazon',
                        categoryName: 'Shopping',
                        paymentMethod: 'UPI',
                        amount: 799.0,
                        type: 'DEBIT',
                        time: 'Yesterday',
                        categoryColor: AppColors.shopping,
                      ),
                      Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                      AppTransactionTile(
                        iconEmoji: '🚇',
                        title: 'Metro',
                        categoryName: 'Transport',
                        paymentMethod: 'UPI',
                        amount: 60.0,
                        type: 'DEBIT',
                        time: 'Yesterday',
                        categoryColor: AppColors.transport,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.xxxl),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isDark,
    String? badge,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticsHelper.light();
          onTap();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: AppRadius.medium,
            border: Border.all(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              width: 0.5,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    icon,
                    size: 22,
                    color: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                  ),
                  if (badge != null)
                    Positioned(
                      top: -6,
                      right: -10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: const BoxDecoration(
                          color: AppColors.lightExpense,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          badge,
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: AppTypography.subcaption.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryRow(String name, double amount, double ratio, Color color, bool isDark) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              name,
              style: AppTypography.callout.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            Text(
              CurrencyFormatter.format(amount),
              style: AppTypography.callout.copyWith(
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: ratio,
            minHeight: 6,
            backgroundColor: isDark ? AppColors.darkSurfaceSecondary : AppColors.lightSurfaceSecondary,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
