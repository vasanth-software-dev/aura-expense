import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';

class AppProgressBar extends StatelessWidget {
  final double progress; // 0.0 to 1.0+
  final double height;
  final Color? color;
  final Color? backgroundColor;

  const AppProgressBar({
    super.key,
    required this.progress,
    this.height = 8.0,
    this.color,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final clampedProgress = progress.clamp(0.0, 1.0);

    Color barColor = color ??
        (progress > 1.0
            ? (isDark ? AppColors.darkExpense : AppColors.lightExpense)
            : progress > 0.8
                ? (isDark ? AppColors.darkWarning : AppColors.lightWarning)
                : (isDark ? AppColors.darkAccent : AppColors.lightAccent));

    final trackColor = backgroundColor ??
        (isDark ? AppColors.darkSurfaceSecondary : AppColors.lightSurfaceSecondary);

    return LayoutBuilder(
      builder: (context, constraints) {
        return Container(
          width: constraints.maxWidth,
          height: height,
          decoration: BoxDecoration(
            color: trackColor,
            borderRadius: AppRadius.roundedPill,
          ),
          child: Stack(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeOutCubic,
                width: constraints.maxWidth * clampedProgress,
                height: height,
                decoration: BoxDecoration(
                  color: barColor,
                  borderRadius: AppRadius.roundedPill,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
