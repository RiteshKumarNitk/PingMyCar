import 'package:flutter/material.dart';

/// OwnerPing design tokens — the ONLY place colors, spacing, radii and
/// elevation are defined. Screens read them through [AppColors.of] /
/// Theme.of(context); no screen hardcodes a color.
///
/// OwnerPing is a dark-blue brand: deep navy is the chrome (hero headers,
/// bottom navigation, text ink), a deep blue is the primary (filled buttons,
/// selection), and an electric blue [accent] marks active/unread states and
/// anything that sits on navy. Green is reserved for success/active status,
/// amber for warnings and red for errors/destructive actions.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.navy,
    required this.navyTop,
    required this.onNavy,
    required this.primary,
    required this.onPrimary,
    required this.primaryInk,
    required this.primarySoft,
    required this.accent,
    required this.comm,
    required this.commSoft,
    required this.success,
    required this.successSoft,
    required this.warning,
    required this.warningSoft,
    required this.danger,
    required this.dangerSoft,
    required this.background,
    required this.surface,
    required this.surface2,
    required this.border,
    required this.inputBorder,
    required this.ink,
    required this.slate,
    required this.muted,
    required this.skeleton,
  });

  /// Logo navy (tile base) — brand chrome, hero headers.
  final Color navy;

  /// Logo navy glow (tile top) — top of the brand gradient.
  final Color navyTop;
  final Color onNavy;

  /// Deep blue — filled buttons, selection, focus.
  final Color primary;

  /// Text/icons on [primary] (white, AA or better).
  final Color onPrimary;

  /// Blue for text, links and icons on the page surfaces (AA contrast).
  final Color primaryInk;
  final Color primarySoft;

  /// Electric blue for active states on navy (tab bar, hero chips).
  final Color accent;

  /// Communication: messages, unread indicators (the "ping").
  final Color comm;
  final Color commSoft;

  final Color success;
  final Color successSoft;
  final Color warning;
  final Color warningSoft;
  final Color danger;
  final Color dangerSoft;

  final Color background;
  final Color surface;

  /// Inset panels, skeleton base, table headers.
  final Color surface2;
  final Color border;
  final Color inputBorder;

  /// Text: primary ink, secondary slate, tertiary muted.
  final Color ink;
  final Color slate;
  final Color muted;
  final Color skeleton;

  /// Vertical brand gradient, like the logo tile (glow at the top).
  LinearGradient get brandGradient => LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [navyTop, navy],
      );

  static const light = AppColors(
    navy: Color(0xFF0B1630),
    navyTop: Color(0xFF1A3A6E),
    onNavy: Color(0xFFFFFFFF),
    primary: Color(0xFF1E40AF),
    onPrimary: Color(0xFFFFFFFF),
    primaryInk: Color(0xFF1D4ED8),
    primarySoft: Color(0xFFE8EEFC),
    accent: Color(0xFF6EA8FF),
    comm: Color(0xFF2563EB),
    commSoft: Color(0xFFE8EFFC),
    success: Color(0xFF1E8A4C),
    successSoft: Color(0xFFE6F5EC),
    warning: Color(0xFFA86A12),
    warningSoft: Color(0xFFFDF3DE),
    danger: Color(0xFFD0342C),
    dangerSoft: Color(0xFFFCEBEA),
    background: Color(0xFFF3F5F9),
    surface: Color(0xFFFFFFFF),
    surface2: Color(0xFFECEFF4),
    border: Color(0xFFE1E5EC),
    inputBorder: Color(0xFFD0D6E0),
    ink: Color(0xFF0B1630),
    slate: Color(0xFF4A5568),
    muted: Color(0xFF778196),
    skeleton: Color(0xFFE4E8EF),
  );

  static const dark = AppColors(
    navy: Color(0xFF0B1630),
    navyTop: Color(0xFF1A3A6E),
    onNavy: Color(0xFFFFFFFF),
    primary: Color(0xFF2563EB),
    onPrimary: Color(0xFFFFFFFF),
    primaryInk: Color(0xFF8AB4FF),
    primarySoft: Color(0xFF15264A),
    accent: Color(0xFF7CB4FF),
    comm: Color(0xFF6EA8FF),
    commSoft: Color(0xFF14243F),
    success: Color(0xFF4CCB7E),
    successSoft: Color(0xFF10291C),
    warning: Color(0xFFF0B54A),
    warningSoft: Color(0xFF2D2310),
    danger: Color(0xFFF2766E),
    dangerSoft: Color(0xFF331719),
    background: Color(0xFF070E1E),
    surface: Color(0xFF0F1A31),
    surface2: Color(0xFF16233F),
    border: Color(0xFF213155),
    inputBorder: Color(0xFF2C3D63),
    ink: Color(0xFFE8EDF5),
    slate: Color(0xFFAAB5C6),
    muted: Color(0xFF7F8BA0),
    skeleton: Color(0xFF1B2742),
  );

  static AppColors of(BuildContext context) => Theme.of(context).extension<AppColors>()!;

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) {
    if (other is! AppColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return AppColors(
      navy: l(navy, other.navy),
      navyTop: l(navyTop, other.navyTop),
      onNavy: l(onNavy, other.onNavy),
      primary: l(primary, other.primary),
      onPrimary: l(onPrimary, other.onPrimary),
      primaryInk: l(primaryInk, other.primaryInk),
      primarySoft: l(primarySoft, other.primarySoft),
      accent: l(accent, other.accent),
      comm: l(comm, other.comm),
      commSoft: l(commSoft, other.commSoft),
      success: l(success, other.success),
      successSoft: l(successSoft, other.successSoft),
      warning: l(warning, other.warning),
      warningSoft: l(warningSoft, other.warningSoft),
      danger: l(danger, other.danger),
      dangerSoft: l(dangerSoft, other.dangerSoft),
      background: l(background, other.background),
      surface: l(surface, other.surface),
      surface2: l(surface2, other.surface2),
      border: l(border, other.border),
      inputBorder: l(inputBorder, other.inputBorder),
      ink: l(ink, other.ink),
      slate: l(slate, other.slate),
      muted: l(muted, other.muted),
      skeleton: l(skeleton, other.skeleton),
    );
  }
}

/// 4-pt spacing scale.
abstract final class Space {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 20.0;
  static const xl = 24.0;
  static const xxl = 32.0;

  /// Horizontal page gutter.
  static const page = 20.0;
}

abstract final class Radii {
  static const sm = 8.0;
  static const md = 12.0; // buttons, inputs
  static const lg = 16.0; // cards
  static const xl = 20.0; // sheets, hero cards
  static const pill = 999.0;
}

/// Minimum touch target (Material/WCAG).
const double kMinTouch = 48;

abstract final class Shadows {
  /// Very light card elevation — borders carry most of the separation.
  static List<BoxShadow> card(BuildContext context) => Theme.of(context).brightness == Brightness.dark
      ? const []
      : const [BoxShadow(color: Color(0x0D152033), blurRadius: 3, offset: Offset(0, 1))];

  static List<BoxShadow> raised(BuildContext context) => Theme.of(context).brightness == Brightness.dark
      ? const []
      : const [BoxShadow(color: Color(0x1A152033), blurRadius: 16, offset: Offset(0, 6), spreadRadius: -6)];
}

/// Fast, professional motion; collapses to zero when the OS asks for
/// reduced motion.
abstract final class Motion {
  static const fast = Duration(milliseconds: 150);
  static const medium = Duration(milliseconds: 220);

  static Duration of(BuildContext context, Duration d) =>
      MediaQuery.maybeDisableAnimationsOf(context) == true ? Duration.zero : d;
}

/// QR rendering colors — fixed in both themes. A QR must stay dark-on-light
/// with high contrast to scan reliably, so it never follows dark mode.
abstract final class QrColors {
  static const paper = Color(0xFFFFFFFF);
  static const ink = Color(0xFF152033);
  static const placeholder = Color(0xFF7B8698);
}
