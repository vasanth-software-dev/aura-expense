import 'package:flutter/material.dart';

class AppRadius {
  static const double sm = 10.0;
  static const double md = 14.0;
  static const double lg = 20.0;
  static const double xl = 28.0;
  static const double pill = 999.0;

  static const BorderRadius small = BorderRadius.all(Radius.circular(sm));
  static const BorderRadius medium = BorderRadius.all(Radius.circular(md));
  static const BorderRadius large = BorderRadius.all(Radius.circular(lg));
  static const BorderRadius extraLarge = BorderRadius.all(Radius.circular(xl));
  static const BorderRadius roundedPill = BorderRadius.all(Radius.circular(pill));

  // Bottom sheet top-only radius
  static const BorderRadius bottomSheet = BorderRadius.only(
    topLeft: Radius.circular(28.0),
    topRight: Radius.circular(28.0),
  );
}
