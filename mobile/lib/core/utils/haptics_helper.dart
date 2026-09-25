import 'package:flutter/services.dart';

class HapticsHelper {
  /// Light haptic feedback for regular taps, toggles, chips
  static void light() {
    HapticFeedback.lightImpact();
  }

  /// Medium haptic feedback for primary actions, bottom sheet open, segment change
  static void medium() {
    HapticFeedback.mediumImpact();
  }

  /// Heavy haptic feedback for review confirm, swipe action trigger
  static void heavy() {
    HapticFeedback.heavyImpact();
  }

  /// Success haptic feedback for transaction added, sync completed
  static void success() {
    HapticFeedback.mediumImpact();
  }

  /// Warning / destructive haptic feedback for delete, budget threshold
  static void warning() {
    HapticFeedback.heavyImpact();
  }

  /// Selection click for picker wheels, date change
  static void selectionClick() {
    HapticFeedback.selectionClick();
  }
}
