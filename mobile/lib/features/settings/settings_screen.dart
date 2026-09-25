import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_card.dart';

class SettingsScreen extends StatelessWidget {
  final VoidCallback onEmailSyncTap;
  final VoidCallback onBudgetsTap;

  const SettingsScreen({
    super.key,
    required this.onEmailSyncTap,
    required this.onBudgetsTap,
  });

  void _showPrivacyDialog(BuildContext context) {
    HapticsHelper.medium();
    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: AppRadius.large),
          title: const Text('Privacy & Security'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Your financial data is private.',
                style: AppTypography.headline.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              _buildPrivacyPoint('✓ OAuth authentication (Google & Microsoft)'),
              _buildPrivacyPoint('✓ AES-256-GCM token encryption at rest'),
              _buildPrivacyPoint('✓ No UPI PIN stored'),
              _buildPrivacyPoint('✓ No bank passwords stored'),
              _buildPrivacyPoint('✓ No OTPs or CVVs stored'),
              _buildPrivacyPoint('✓ Zero advertising data sharing'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Done'),
            ),
          ],
        );
      },
    );
  }

  void _showExportDialog(BuildContext context) {
    HapticsHelper.medium();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Export Financial Data'),
        content: const Text('Choose your preferred export format for all transactions, categories, and accounts.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Exporting CSV to Downloads...')),
              );
            },
            child: const Text('Export CSV'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Exporting JSON to Downloads...')),
              );
            },
            child: const Text('Export JSON'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    HapticsHelper.warning();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete your account?'),
        content: const Text(
          'This permanently removes your financial data, transactions, and connected accounts. This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Account and financial records permanently deleted.'),
                  backgroundColor: AppColors.lightExpense,
                ),
              );
            },
            child: const Text(
              'Delete Account',
              style: TextStyle(color: AppColors.lightExpense, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyPoint(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Text(text, style: AppTypography.callout),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          children: [
            const SizedBox(height: AppSpacing.sm),

            // Profile Section
            _buildSectionHeader('ACCOUNT', isDark),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSettingRow(
                    icon: Icons.person_outline_rounded,
                    title: 'Profile',
                    subtitle: 'Arun Kumar · arun@example.com',
                    showChevron: true,
                    onTap: () {},
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Connections Section
            _buildSectionHeader('CONNECTIONS', isDark),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSettingRow(
                    icon: Icons.account_balance_outlined,
                    title: 'Bank Accounts',
                    subtitle: 'HDFC, SBI, ICICI (3 accounts)',
                    showChevron: true,
                    onTap: () {},
                    isDark: isDark,
                  ),
                  _buildDivider(isDark),
                  _buildSettingRow(
                    icon: Icons.mail_outline_rounded,
                    title: 'Email Accounts',
                    subtitle: 'Gmail connected',
                    showChevron: true,
                    onTap: onEmailSyncTap,
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Automation Section
            _buildSectionHeader('AUTOMATION', isDark),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSettingRow(
                    icon: Icons.sync_rounded,
                    title: 'Email Sync',
                    subtitle: 'Every hour · Automatic ON',
                    showChevron: true,
                    onTap: onEmailSyncTap,
                    isDark: isDark,
                  ),
                  _buildDivider(isDark),
                  _buildSettingRow(
                    icon: Icons.sms_outlined,
                    title: 'SMS Detection',
                    subtitle: 'Android financial SMS parsing enabled',
                    showChevron: true,
                    onTap: () {},
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Personalization Section
            _buildSectionHeader('PERSONALIZATION', isDark),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSettingRow(
                    icon: Icons.pie_chart_outline_rounded,
                    title: 'Budgets & Limits',
                    subtitle: '₹30,000 monthly limit',
                    showChevron: true,
                    onTap: onBudgetsTap,
                    isDark: isDark,
                  ),
                  _buildDivider(isDark),
                  _buildSettingRow(
                    icon: Icons.category_outlined,
                    title: 'Categories',
                    subtitle: '15 active categories',
                    showChevron: true,
                    onTap: () {},
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Security & Privacy Section
            _buildSectionHeader('SECURITY & PRIVACY', isDark),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSettingRow(
                    icon: Icons.shield_outlined,
                    title: 'Privacy & Security Controls',
                    subtitle: 'Encrypted tokens · Zero passwords stored',
                    showChevron: true,
                    onTap: () => _showPrivacyDialog(context),
                    isDark: isDark,
                  ),
                  _buildDivider(isDark),
                  _buildSettingRow(
                    icon: Icons.file_download_outlined,
                    title: 'Export Financial Data',
                    subtitle: 'CSV or JSON backup',
                    showChevron: true,
                    onTap: () => _showExportDialog(context),
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Danger Zone Section
            _buildSectionHeader('DANGER ZONE', isDark),
            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildSettingRow(
                    icon: Icons.delete_forever_outlined,
                    title: 'Delete Account',
                    subtitle: 'Permanently remove all data',
                    titleColor: isDark ? AppColors.darkExpense : AppColors.lightExpense,
                    showChevron: true,
                    onTap: () => _showDeleteAccountDialog(context),
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xxxl),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: AppSpacing.xs),
      child: Text(
        title,
        style: AppTypography.subcaption.copyWith(
          color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildSettingRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool showChevron = false,
    Color? titleColor,
    required bool isDark,
  }) {
    return InkWell(
      onTap: () {
        HapticsHelper.light();
        onTap();
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 12),
        child: Row(
          children: [
            Icon(
              icon,
              size: 22,
              color: titleColor ?? (isDark ? AppColors.darkAccent : AppColors.lightAccent),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.headline.copyWith(
                      color: titleColor ?? (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.caption.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (showChevron)
              const Icon(Icons.chevron_right, size: 18, color: AppColors.lightTextTertiary),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
      height: 0.5,
      indent: 48,
    );
  }
}
