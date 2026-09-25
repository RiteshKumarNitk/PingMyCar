import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Bottom navigation shell — four destinations to keep it uncluttered;
/// Stickers lives in Home quick actions and in Profile.
class HomeShell extends StatelessWidget {
  const HomeShell({super.key, required this.child});

  final Widget child;

  static const _destinations = [
    _Dest('/home', Icons.home_outlined, Icons.home, 'Home'),
    _Dest('/messages', Icons.mail_outline, Icons.mail, 'Messages'),
    _Dest('/vehicles', Icons.directions_car_outlined, Icons.directions_car, 'Vehicles'),
    _Dest('/profile', Icons.person_outline, Icons.person, 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final index = _destinations.indexWhere((d) => location.startsWith(d.path));
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index < 0 ? 0 : index,
        onDestinationSelected: (i) => context.go(_destinations[i].path),
        destinations: [
          for (final d in _destinations)
            NavigationDestination(
              icon: Icon(d.outline),
              selectedIcon: Icon(d.filled),
              label: d.label,
            ),
        ],
      ),
    );
  }
}

class _Dest {
  const _Dest(this.path, this.outline, this.filled, this.label);
  final String path;
  final IconData outline;
  final IconData filled;
  final String label;
}
