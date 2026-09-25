import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'bootstrap.dart';
import 'core/api_client.dart';
import 'providers.dart';
import 'services/fcm/fcm_bootstrap.dart';
import 'ui/router.dart';
import 'ui/theme.dart';

Future<void> main() async {
  final firebaseOk = await bootstrapFirebase();

  final container = ProviderContainer();

  // Any 401 anywhere funnels through here: the router's auth redirect sends
  // the owner back to Google sign-in. No second login mechanism is created.
  sessionExpired.addListener(() {
    container.read(authControllerProvider.notifier).forceSignOut();
  });

  // Bind FCM listeners (token refresh, foreground messages, notification
  // taps). Token registration itself happens after sign-in + permission.
  // firebaseOk is false on web or when native config is missing — FCM then
  // no-ops instead of crashing.
  unawaited(bootstrapFcm(container, firebaseAvailable: firebaseOk));

  // Restore session from the stored bearer token, if any.
  unawaited(container.read(authControllerProvider.notifier).restoreSession());

  runApp(UncontrolledProviderScope(container: container, child: const PingMyCarApp()));
}

class PingMyCarApp extends ConsumerWidget {
  const PingMyCarApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'PingMyCar',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      routerConfig: ref.watch(routerProvider),
    );
  }
}
