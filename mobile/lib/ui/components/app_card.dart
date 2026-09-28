import 'package:flutter/material.dart';
import '../theme.dart';

/// Grouping surface: white, 16px radius, hairline border, near-flat shadow.
/// Use only where grouping helps — not around every section.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(Space.md),
    this.onTap,
    this.color,
    this.borderColor,
    this.semanticLabel,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final radius = BorderRadius.circular(Radii.lg);
    Widget content = Padding(padding: padding, child: child);
    if (onTap != null) {
      content = InkWell(borderRadius: radius, onTap: onTap, child: content);
    }
    return Semantics(
      container: true,
      button: onTap != null,
      label: semanticLabel,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color ?? c.surface,
          borderRadius: radius,
          border: Border.all(color: borderColor ?? c.border),
          boxShadow: Shadows.card(context),
        ),
        child: Material(type: MaterialType.transparency, borderRadius: radius, child: content),
      ),
    );
  }
}
