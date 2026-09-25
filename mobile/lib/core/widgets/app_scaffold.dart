import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import '../utils/haptics_helper.dart';

class AppScaffold extends StatelessWidget {
  final String? title;
  final String? largeTitle;
  final Widget? subtitle;
  final List<Widget>? actions;
  final Widget body;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final Future<void> Function()? onRefresh;

  const AppScaffold({
    super.key,
    this.title,
    this.largeTitle,
    this.subtitle,
    this.actions,
    required this.body,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? AppColors.darkBackground : AppColors.lightBackground;

    Widget content = body;

    if (onRefresh != null) {
      content = RefreshIndicator(
        onRefresh: () async {
          HapticsHelper.light();
          await onRefresh!();
        },
        color: isDark ? AppColors.darkAccent : AppColors.lightAccent,
        backgroundColor: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        child: content,
      );
    }

    return Scaffold(
      backgroundColor: bg,
      appBar: (title != null || actions != null)
          ? AppBar(
              title: title != null
                  ? Text(
                      title!,
                      style: AppTypography.headline.copyWith(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    )
                  : null,
              actions: actions,
              backgroundColor: bg,
              elevation: 0,
            )
          : null,
      body: SafeArea(
        bottom: bottomNavigationBar == null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (largeTitle != null) ...[
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                  vertical: AppSpacing.xs,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (subtitle != null) ...[
                      subtitle!,
                      const SizedBox(height: 2),
                    ],
                    Text(
                      largeTitle!,
                      style: AppTypography.largeTitle.copyWith(
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            Expanded(child: content),
          ],
        ),
      ),
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}
