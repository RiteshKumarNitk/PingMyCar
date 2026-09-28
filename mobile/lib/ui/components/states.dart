import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_error.dart';
import '../../providers.dart';
import '../theme.dart';
import 'app_button.dart';

/// Useful empty state: what this list is for + the one action that fills it.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.actionIcon,
    this.onAction,
    this.secondaryLabel,
    this.onSecondary,
  });

  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final IconData? actionIcon;
  final VoidCallback? onAction;
  final String? secondaryLabel;
  final VoidCallback? onSecondary;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.xl, vertical: Space.xxl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(color: c.primarySoft, borderRadius: BorderRadius.circular(Radii.lg)),
            child: Icon(icon, color: c.primary, size: 28),
          ),
          const SizedBox(height: Space.md),
          Text(title, textAlign: TextAlign.center, style: t.titleMedium),
          const SizedBox(height: Space.xs),
          Text(message, textAlign: TextAlign.center, style: t.bodyMedium),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: Space.lg),
            AppButton(label: actionLabel!, icon: actionIcon, onPressed: onAction, expand: false),
          ],
          if (secondaryLabel != null && onSecondary != null) ...[
            const SizedBox(height: Space.xs),
            AppButton(label: secondaryLabel!, onPressed: onSecondary, variant: AppButtonVariant.ghost, expand: false),
          ],
        ],
      ),
    );
  }
}

/// Consistent error UI for every failure class (401/403/404/409/422/429/5xx,
/// timeout, offline). Never shows raw API errors — only the friendly
/// [ApiException.message] plus a clear next step.
class ErrorState extends ConsumerWidget {
  const ErrorState({super.key, required this.error, this.onRetry});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final e = error is ApiException ? error as ApiException : null;
    final kind = e?.kind ?? ApiErrorKind.unknown;

    final (IconData icon, String title) = switch (kind) {
      ApiErrorKind.network => (Icons.wifi_off_outlined, 'No internet connection'),
      ApiErrorKind.unauthorized => (Icons.lock_outline, 'Please sign in again'),
      ApiErrorKind.forbidden => (Icons.block_outlined, "You don't have access"),
      ApiErrorKind.notFound => (Icons.search_off_outlined, 'Not found'),
      ApiErrorKind.conflict => (Icons.sync_problem_outlined, "Couldn't complete that"),
      ApiErrorKind.validation => (Icons.error_outline, 'Check the details'),
      ApiErrorKind.rateLimited => (Icons.hourglass_empty_outlined, 'Too many attempts'),
      ApiErrorKind.server || ApiErrorKind.unknown => (Icons.cloud_off_outlined, 'Something went wrong'),
    };
    final message = e?.message ?? 'Something went wrong. Please try again.';

    final canGoBack = context.canPop();
    final Widget? primary = switch (kind) {
      ApiErrorKind.unauthorized => AppButton(
          label: 'Sign in again',
          icon: Icons.login_outlined,
          expand: false,
          onPressed: () => ref.read(authControllerProvider.notifier).forceSignOut(),
        ),
      ApiErrorKind.forbidden || ApiErrorKind.notFound => canGoBack
          ? AppButton(label: 'Go back', icon: Icons.arrow_back_outlined, expand: false, onPressed: () => context.pop())
          : null,
      _ => onRetry == null
          ? null
          : AppButton(label: 'Retry', icon: Icons.refresh_outlined, expand: false, onPressed: onRetry),
    };

    return Semantics(
      liveRegion: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Space.xl, vertical: Space.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: c.surface2, borderRadius: BorderRadius.circular(Radii.lg)),
              child: Icon(icon, color: c.slate, size: 28),
            ),
            const SizedBox(height: Space.md),
            Text(title, textAlign: TextAlign.center, style: t.titleMedium),
            const SizedBox(height: Space.xs),
            Text(message, textAlign: TextAlign.center, style: t.bodyMedium),
            if (primary != null) ...[const SizedBox(height: Space.lg), primary],
          ],
        ),
      ),
    );
  }
}

/// A scrollable centered wrapper so empty/error states still support
/// pull-to-refresh and never overflow on small screens or with the keyboard.
class ScrollableCenter extends StatelessWidget {
  const ScrollableCenter({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: Center(child: child),
        ),
      ),
    );
  }
}

/// Pulsing placeholder block. Static when the OS requests reduced motion.
class SkeletonBox extends StatefulWidget {
  const SkeletonBox({super.key, this.width = double.infinity, required this.height, this.radius = Radii.md});

  final double width;
  final double height;
  final double radius;

  @override
  State<SkeletonBox> createState() => _SkeletonBoxState();
}

class _SkeletonBoxState extends State<SkeletonBox> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 900), lowerBound: 0.55, upperBound: 1);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.maybeDisableAnimationsOf(context) == true) {
      _controller.stop();
      _controller.value = 1;
    } else if (!_controller.isAnimating) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return FadeTransition(
      opacity: _controller,
      child: Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(color: c.skeleton, borderRadius: BorderRadius.circular(widget.radius)),
      ),
    );
  }
}

/// A list of card-shaped skeleton rows, announced as loading.
class LoadingSkeleton extends StatelessWidget {
  const LoadingSkeleton({super.key, this.rows = 4, this.rowHeight = 76, this.header = true});

  final int rows;
  final double rowHeight;
  final bool header;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Loading',
      liveRegion: true,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.all(Space.page),
        children: [
          if (header) ...[
            const SkeletonBox(width: 160, height: 18),
            const SizedBox(height: Space.md),
          ],
          for (var i = 0; i < rows; i++) ...[
            SkeletonBox(height: rowHeight, radius: Radii.lg),
            const SizedBox(height: Space.sm),
          ],
        ],
      ),
    );
  }
}

/// Section title with an optional trailing text action.
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.xs),
      child: Row(
        children: [
          Expanded(child: Semantics(header: true, child: Text(title, style: Theme.of(context).textTheme.titleMedium))),
          if (actionLabel != null && onAction != null)
            TextButton(onPressed: onAction, child: Text(actionLabel!)),
        ],
      ),
    );
  }
}

/// Subtle privacy indicator ("Private conversation", "No phone number shared").
class PrivacyLabel extends StatelessWidget {
  const PrivacyLabel(this.text, {super.key, this.icon = Icons.lock_outline, this.center = false});

  final String text;
  final IconData icon;
  final bool center;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: center ? MainAxisAlignment.center : MainAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: c.muted),
        const SizedBox(width: 6),
        Flexible(child: Text(text, style: Theme.of(context).textTheme.bodySmall)),
      ],
    );
  }
}

/// Compact metric tile for the dashboard.
class StatTile extends StatelessWidget {
  const StatTile({super.key, required this.icon, required this.label, required this.value, this.tone, this.onTap});

  final IconData icon;
  final String label;
  final int value;

  /// Accent color (defaults to primary).
  final Color? tone;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    final t = Theme.of(context).textTheme;
    final accent = tone ?? c.primary;
    return Semantics(
      button: onTap != null,
      label: '$label: $value',
      excludeSemantics: true,
      child: Material(
        color: c.surface,
        borderRadius: BorderRadius.circular(Radii.lg),
        child: InkWell(
          borderRadius: BorderRadius.circular(Radii.lg),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(Space.sm + 2),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Radii.lg),
              border: Border.all(color: c.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 20, color: accent),
                const SizedBox(height: Space.sm),
                Text('$value', style: t.headlineSmall?.copyWith(fontWeight: FontWeight.w700, height: 1)),
                const SizedBox(height: 4),
                Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: t.bodySmall?.copyWith(color: c.slate)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
