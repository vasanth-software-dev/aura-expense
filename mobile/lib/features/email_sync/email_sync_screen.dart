import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_radius.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_typography.dart';
import '../../core/utils/haptics_helper.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_card.dart';
import '../sync_lab/sync_lab_screen.dart';

class EmailSyncScreen extends StatefulWidget {
  const EmailSyncScreen({super.key});

  @override
  State<EmailSyncScreen> createState() => _EmailSyncScreenState();
}

class _EmailSyncScreenState extends State<EmailSyncScreen> {
  bool _isGmailConnected = true;
  bool _isOutlookConnected = false;
  bool _isSyncing = false;
  bool _autoSync = true;
  String _syncFrequency = 'Every hour';
  String _importHistory = 'Last 3 months';

  void _triggerSync() {
    HapticsHelper.medium();
    setState(() => _isSyncing = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _isSyncing = false);
        HapticsHelper.success();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ Sync completed: 4 new transactions imported, 2 duplicates skipped'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : AppColors.lightBackground,
      appBar: AppBar(
        title: const Text('Email Synchronization'),
        actions: [
          IconButton(
            icon: const Icon(Icons.science_outlined),
            tooltip: 'Live Sync Lab',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (ctx) => const SyncLabScreen(initialTabIndex: 1)),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          children: [
            const SizedBox(height: AppSpacing.md),

            // Live Sync Lab Banner
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (isDark ? AppColors.darkAccent : AppColors.lightAccent).withOpacity(0.12),
                      borderRadius: AppRadius.medium,
                    ),
                    child: Icon(
                      Icons.science_rounded,
                      color: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Test Real-Time Sync',
                          style: AppTypography.headline.copyWith(
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'Test live SMS and bank email parsing with real templates.',
                          style: AppTypography.caption.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  AppButton(
                    text: 'Open Lab',
                    height: 32,
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (ctx) => const SyncLabScreen(initialTabIndex: 1)),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Connected Accounts Section
            Text(
              'Connected Accounts',
              style: AppTypography.sectionTitle.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

            // Gmail Card
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.12),
                          borderRadius: AppRadius.medium,
                        ),
                        alignment: Alignment.center,
                        child: const Text('G', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.red)),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Google Gmail',
                              style: AppTypography.headline.copyWith(
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                            ),
                            Text(
                              _isGmailConnected ? 'user@gmail.com' : 'Not connected',
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (_isGmailConnected)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (isDark ? AppColors.darkIncome : AppColors.lightIncome).withOpacity(0.15),
                            borderRadius: AppRadius.roundedPill,
                          ),
                          child: Text(
                            'Connected ✓',
                            style: AppTypography.caption.copyWith(
                              color: isDark ? AppColors.darkIncome : AppColors.lightIncome,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (_isGmailConnected) ...[
                    const SizedBox(height: AppSpacing.md),
                    Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Last Synced',
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                            Text(
                              'Today, 7:42 AM',
                              style: AppTypography.headline.copyWith(
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                            ),
                          ],
                        ),
                        AppButton(
                          text: 'Sync Now',
                          isLoading: _isSyncing,
                          height: 38,
                          onPressed: _triggerSync,
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                    const SizedBox(height: AppSpacing.xs),
                    SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        'Automatic sync',
                        style: AppTypography.headline.copyWith(
                          color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                        ),
                      ),
                      value: _autoSync,
                      activeColor: isDark ? AppColors.darkAccent : AppColors.lightAccent,
                      onChanged: (val) => setState(() => _autoSync = val),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Sync frequency',
                          style: AppTypography.headline.copyWith(
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                        ),
                        Text(
                          _syncFrequency,
                          style: AppTypography.callout.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Import history',
                          style: AppTypography.headline.copyWith(
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                        ),
                        Text(
                          _importHistory,
                          style: AppTypography.callout.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Center(
                      child: TextButton(
                        onPressed: () {
                          HapticsHelper.warning();
                          setState(() => _isGmailConnected = false);
                        },
                        child: Text(
                          'Disconnect Gmail',
                          style: TextStyle(
                            color: isDark ? AppColors.darkExpense : AppColors.lightExpense,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    const SizedBox(height: AppSpacing.md),
                    AppButton(
                      text: 'Connect Gmail',
                      icon: Icons.link_rounded,
                      width: double.infinity,
                      onPressed: () {
                        HapticsHelper.medium();
                        setState(() => _isGmailConnected = true);
                      },
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Outlook Card
            AppCard(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.12),
                          borderRadius: AppRadius.medium,
                        ),
                        alignment: Alignment.center,
                        child: const Text('O', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.blue)),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Microsoft Outlook',
                              style: AppTypography.headline.copyWith(
                                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                              ),
                            ),
                            Text(
                              _isOutlookConnected ? 'user@outlook.com' : 'Not connected',
                              style: AppTypography.caption.copyWith(
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  AppButton(
                    text: _isOutlookConnected ? 'Disconnect Outlook' : 'Connect Outlook',
                    variant: _isOutlookConnected ? AppButtonVariant.destructive : AppButtonVariant.primary,
                    width: double.infinity,
                    onPressed: () {
                      HapticsHelper.medium();
                      setState(() => _isOutlookConnected = !_isOutlookConnected);
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Sync History Section
            Text(
              'Sync History',
              style: AppTypography.sectionTitle.copyWith(
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

            AppCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  _buildHistoryTile(
                    time: 'Today, 7:42 AM',
                    provider: 'Gmail',
                    checked: 18,
                    imported: 4,
                    duplicates: 2,
                    needsReview: 1,
                    isDark: isDark,
                  ),
                  Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                  _buildHistoryTile(
                    time: 'Today, 6:42 AM',
                    provider: 'Gmail',
                    checked: 12,
                    imported: 2,
                    duplicates: 1,
                    needsReview: 0,
                    isDark: isDark,
                  ),
                  Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder, height: 1),
                  _buildHistoryTile(
                    time: 'Yesterday, 7:40 PM',
                    provider: 'Gmail',
                    checked: 24,
                    imported: 5,
                    duplicates: 3,
                    needsReview: 2,
                    isDark: isDark,
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryTile({
    required String time,
    required String provider,
    required int checked,
    required int imported,
    required int duplicates,
    required int needsReview,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '✓ $time ($provider)',
                style: AppTypography.headline.copyWith(
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                '$imported imported',
                style: AppTypography.callout.copyWith(
                  color: isDark ? AppColors.darkIncome : AppColors.lightIncome,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '$checked emails checked · $duplicates duplicates skipped · $needsReview needs review',
            style: AppTypography.caption.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
