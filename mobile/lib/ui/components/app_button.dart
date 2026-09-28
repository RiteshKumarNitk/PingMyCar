import 'package:flutter/material.dart';
import '../theme.dart';

enum AppButtonVariant { primary, secondary, success, danger, ghost }

/// The one button. Consistent height/radius per variant; `loading` swaps the
/// icon for a spinner and disables the button, so a mutation can never be
/// submitted twice.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant = AppButtonVariant.primary,
    this.loading = false,
    this.expand = true,
    this.compact = false,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final AppButtonVariant variant;
  final bool loading;

  /// Full width (default) or intrinsic width.
  final bool expand;

  /// 44px instead of 52px — for secondary rows of actions.
  final bool compact;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final enabled = onPressed != null && !loading;
    final size = Size(expand ? double.infinity : 64, compact ? 44 : 52);

    final Color spinnerColor = switch (variant) {
      AppButtonVariant.primary || AppButtonVariant.success || AppButtonVariant.danger => Colors.white,
      _ => c.primary,
    };

    final Widget leading = loading
        ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: spinnerColor))
        : (icon != null ? Icon(icon, size: 20) : const SizedBox.shrink());
    final hasLeading = loading || icon != null;

    final child = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (hasLeading) ...[leading, const SizedBox(width: 10)],
        Flexible(child: Text(label, overflow: TextOverflow.ellipsis, maxLines: 1)),
      ],
    );

    final action = enabled ? onPressed : null;
    final Widget button = switch (variant) {
      AppButtonVariant.primary => FilledButton(
          onPressed: action,
          style: FilledButton.styleFrom(minimumSize: size),
          child: child,
        ),
      AppButtonVariant.success => FilledButton(
          onPressed: action,
          style: FilledButton.styleFrom(minimumSize: size, backgroundColor: c.success),
          child: child,
        ),
      AppButtonVariant.danger => FilledButton(
          onPressed: action,
          style: FilledButton.styleFrom(minimumSize: size, backgroundColor: c.danger),
          child: child,
        ),
      AppButtonVariant.secondary => OutlinedButton(
          onPressed: action,
          style: OutlinedButton.styleFrom(minimumSize: size),
          child: child,
        ),
      AppButtonVariant.ghost => TextButton(
          onPressed: action,
          style: TextButton.styleFrom(minimumSize: size, foregroundColor: c.slate),
          child: child,
        ),
    };

    return Semantics(
      button: true,
      enabled: enabled,
      label: semanticLabel,
      // While loading, announce it instead of the stale label.
      value: loading ? 'In progress' : null,
      child: button,
    );
  }
}
