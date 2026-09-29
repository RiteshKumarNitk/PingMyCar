import 'package:flutter/material.dart';
import '../theme.dart';

/// "Exit OwnerPing?" — shown when Back is pressed at the root (Home tab).
/// Returns true only when the owner explicitly chooses Exit; Cancel, a tap
/// outside or another Back press all mean "stay".
Future<bool> confirmExit(BuildContext context) async {
  final c = AppColors.of(context);
  final t = Theme.of(context).textTheme;
  final exit = await showDialog<bool>(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (context) => Dialog(
      backgroundColor: c.navy,
      surfaceTintColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: Space.xl),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Radii.xl),
        side: BorderSide(color: c.onNavy.withValues(alpha: 0.10)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(Space.xl, Space.xl, Space.xl, Space.md),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: c.accent.withValues(alpha: 0.16),
                borderRadius: BorderRadius.circular(Radii.md),
              ),
              child: Icon(Icons.logout_rounded, color: c.accent),
            ),
            const SizedBox(height: Space.md),
            Semantics(
              header: true,
              child: Text('Exit OwnerPing?', style: t.titleLarge?.copyWith(color: c.onNavy)),
            ),
            const SizedBox(height: Space.xs),
            Text(
              'Are you sure you want to close the app?',
              style: t.bodyMedium?.copyWith(color: c.onNavy.withValues(alpha: 0.75)),
            ),
            const SizedBox(height: Space.lg),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  style: TextButton.styleFrom(foregroundColor: c.accent),
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: Space.xs),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: c.danger,
                    foregroundColor: Colors.white,
                    minimumSize: const Size(96, kMinTouch),
                  ),
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Exit'),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  return exit == true;
}
