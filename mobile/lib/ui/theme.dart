import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'theme/tokens.dart';

export 'theme/tokens.dart';

/// OwnerPing mobile theme, built entirely from [AppColors] tokens.
/// Light and dark variants share one builder so every component style is
/// defined once.
class AppTheme {
  static ThemeData light() => _build(AppColors.light, Brightness.light);
  static ThemeData dark() => _build(AppColors.dark, Brightness.dark);

  /// Type hierarchy: Display › Headline › Title › Body › Label › Caption
  /// (bodySmall). System font (Roboto / SF Pro) — modern, legible, no
  /// bundled assets. Only display/headline/title-large are semibold+.
  static TextTheme _text(AppColors c) {
    const base = TextStyle(leadingDistribution: TextLeadingDistribution.even);
    return TextTheme(
      displaySmall: base.copyWith(fontSize: 32, height: 1.15, fontWeight: FontWeight.w700, letterSpacing: -0.8, color: c.ink),
      headlineMedium: base.copyWith(fontSize: 26, height: 1.2, fontWeight: FontWeight.w700, letterSpacing: -0.5, color: c.ink),
      headlineSmall: base.copyWith(fontSize: 22, height: 1.25, fontWeight: FontWeight.w600, letterSpacing: -0.3, color: c.ink),
      titleLarge: base.copyWith(fontSize: 18, height: 1.3, fontWeight: FontWeight.w600, letterSpacing: -0.2, color: c.ink),
      titleMedium: base.copyWith(fontSize: 16, height: 1.35, fontWeight: FontWeight.w600, color: c.ink),
      titleSmall: base.copyWith(fontSize: 14, height: 1.35, fontWeight: FontWeight.w600, color: c.ink),
      bodyLarge: base.copyWith(fontSize: 16, height: 1.5, fontWeight: FontWeight.w400, color: c.ink),
      bodyMedium: base.copyWith(fontSize: 14, height: 1.45, fontWeight: FontWeight.w400, color: c.slate),
      bodySmall: base.copyWith(fontSize: 12, height: 1.4, fontWeight: FontWeight.w400, color: c.muted),
      labelLarge: base.copyWith(fontSize: 15, height: 1.2, fontWeight: FontWeight.w600, letterSpacing: 0.1),
      labelMedium: base.copyWith(fontSize: 13, height: 1.2, fontWeight: FontWeight.w500, color: c.slate),
      labelSmall: base.copyWith(fontSize: 11, height: 1.2, fontWeight: FontWeight.w600, letterSpacing: 0.6, color: c.muted),
    );
  }

  /// Inactive tab items on the navy bar (≈5:1 on navy).
  static const _navInactive = Color(0xFF8E9DBA);

  static ThemeData _build(AppColors c, Brightness brightness) {
    final scheme = ColorScheme(
      brightness: brightness,
      primary: c.primary,
      onPrimary: c.onPrimary,
      primaryContainer: c.primarySoft,
      onPrimaryContainer: c.primaryInk,
      secondary: c.comm,
      onSecondary: Colors.white,
      secondaryContainer: c.commSoft,
      onSecondaryContainer: c.comm,
      tertiary: c.navy,
      onTertiary: c.onNavy,
      error: c.danger,
      onError: Colors.white,
      errorContainer: c.dangerSoft,
      onErrorContainer: c.danger,
      surface: c.surface,
      onSurface: c.ink,
      onSurfaceVariant: c.slate,
      surfaceContainerLowest: c.surface,
      surfaceContainerLow: c.surface,
      surfaceContainer: c.surface2,
      surfaceContainerHigh: c.surface2,
      surfaceContainerHighest: c.surface2,
      outline: c.inputBorder,
      outlineVariant: c.border,
      shadow: const Color(0xFF000000),
      inverseSurface: c.navy,
      onInverseSurface: c.onNavy,
      inversePrimary: c.primarySoft,
    );
    // Merge onto the platform typography so every style (including the ones
    // handed to component themes) carries the platform font family —
    // Roboto on Android, SF Pro on iOS.
    final platform = Typography.material2021(platform: defaultTargetPlatform);
    final text = (brightness == Brightness.light ? platform.black : platform.white).merge(_text(c));
    final buttonShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.md));
    const buttonSize = Size(64, 52);

    OutlineInputBorder inputBorder(Color color, [double width = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(Radii.md),
          borderSide: BorderSide(color: color, width: width),
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      textTheme: text,
      scaffoldBackgroundColor: c.background,
      extensions: [c],
      splashFactory: InkRipple.splashFactory,
      visualDensity: VisualDensity.standard,
      materialTapTargetSize: MaterialTapTargetSize.padded,
      pageTransitionsTheme: const PageTransitionsTheme(builders: {
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
      }),
      appBarTheme: AppBarTheme(
        backgroundColor: c.background,
        surfaceTintColor: Colors.transparent,
        foregroundColor: c.ink,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleSpacing: Space.page,
        titleTextStyle: text.titleLarge,
      ),
      cardTheme: CardThemeData(
        color: c.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.lg),
          side: BorderSide(color: c.border),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: c.primary,
          foregroundColor: c.onPrimary,
          disabledBackgroundColor: c.primary.withValues(alpha: 0.4),
          disabledForegroundColor: c.onPrimary.withValues(alpha: 0.6),
          minimumSize: buttonSize,
          textStyle: text.labelLarge,
          shape: buttonShape,
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: c.ink,
          backgroundColor: c.surface,
          minimumSize: buttonSize,
          side: BorderSide(color: c.inputBorder),
          textStyle: text.labelLarge,
          shape: buttonShape,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: c.primaryInk,
          minimumSize: const Size(48, kMinTouch),
          textStyle: text.labelLarge?.copyWith(fontSize: 14),
          shape: buttonShape,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(minimumSize: const Size(kMinTouch, kMinTouch)),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        border: inputBorder(c.inputBorder),
        enabledBorder: inputBorder(c.inputBorder),
        focusedBorder: inputBorder(c.primary, 1.6),
        errorBorder: inputBorder(c.danger),
        focusedErrorBorder: inputBorder(c.danger, 1.6),
        labelStyle: text.bodyMedium,
        floatingLabelStyle: text.bodyMedium?.copyWith(color: c.primaryInk, fontWeight: FontWeight.w500),
        hintStyle: text.bodyMedium?.copyWith(color: c.muted),
        helperStyle: text.bodySmall,
        errorStyle: text.bodySmall?.copyWith(color: c.danger),
      ),
      // Deep-navy tab bar in both modes: white active icon on a soft blue
      // pill, electric-blue active label, muted blue-grey inactive items.
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        indicatorColor: c.accent.withValues(alpha: 0.18),
        indicatorShape: const StadiumBorder(),
        elevation: 0,
        height: 68,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith(
          (s) => IconThemeData(size: 24, color: s.contains(WidgetState.selected) ? c.onNavy : _navInactive),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (s) => text.labelMedium?.copyWith(
            fontSize: 12,
            color: s.contains(WidgetState.selected) ? c.accent : _navInactive,
            fontWeight: s.contains(WidgetState.selected) ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
      ),
      listTileTheme: ListTileThemeData(
        iconColor: c.slate,
        textColor: c.ink,
        minVerticalPadding: 12,
        contentPadding: const EdgeInsets.symmetric(horizontal: Space.md),
        titleTextStyle: text.titleSmall?.copyWith(fontWeight: FontWeight.w500, fontSize: 15),
        subtitleTextStyle: text.bodySmall?.copyWith(color: c.slate, fontSize: 13),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? Colors.white : null),
        trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.success : null),
      ),
      segmentedButtonTheme: SegmentedButtonThemeData(
        style: SegmentedButton.styleFrom(
          selectedBackgroundColor: c.primarySoft,
          selectedForegroundColor: c.primaryInk,
          foregroundColor: c.slate,
          side: BorderSide(color: c.border),
          textStyle: text.labelMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: c.navy,
        contentTextStyle: text.bodyMedium?.copyWith(color: c.onNavy),
        actionTextColor: c.accent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.md)),
        insetPadding: const EdgeInsets.fromLTRB(Space.md, 0, Space.md, Space.md),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.xl)),
        titleTextStyle: text.titleLarge,
        contentTextStyle: text.bodyMedium,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(Radii.xl))),
      ),
      popupMenuTheme: PopupMenuThemeData(
        color: c.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.md),
          side: BorderSide(color: c.border),
        ),
        textStyle: text.bodyLarge?.copyWith(fontSize: 15),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: c.primaryInk),
      dividerTheme: DividerThemeData(color: c.border, space: 1, thickness: 1),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: c.primary,
        foregroundColor: c.onPrimary,
        // Flat, like every other surface — no heavy drop shadow.
        elevation: 0,
        focusElevation: 0,
        hoverElevation: 0,
        highlightElevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.lg)),
        extendedTextStyle: text.labelLarge,
      ),
    );
  }
}
