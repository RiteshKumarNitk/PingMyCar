import 'package:flutter/material.dart';
import '../theme.dart';

class NavDestinationSpec {
  const NavDestinationSpec(this.path, this.icon, this.selectedIcon, this.label);
  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

/// Four-tab owner navigation: Home, Messages, Vehicles, Profile, on a
/// deep-navy bar (both themes) with rounded top corners. Outlined icons when
/// inactive, filled on a soft blue pill when active; Messages carries the
/// unread count. NavigationBar pads for the bottom safe area itself.
class PrimaryBottomNavigation extends StatelessWidget {
  const PrimaryBottomNavigation({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    this.unreadCount = 0,
  });

  static const destinations = [
    NavDestinationSpec('/home', Icons.home_outlined, Icons.home, 'Home'),
    NavDestinationSpec('/messages', Icons.chat_bubble_outline, Icons.chat_bubble, 'Messages'),
    NavDestinationSpec('/vehicles', Icons.directions_car_outlined, Icons.directions_car, 'Vehicles'),
    NavDestinationSpec('/profile', Icons.person_outline, Icons.person, 'Profile'),
  ];

  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    final c = AppColors.of(context);
    const top = BorderRadius.vertical(top: Radius.circular(Radii.xl));
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: top,
        boxShadow: const [BoxShadow(color: Color(0x140B1630), blurRadius: 10, offset: Offset(0, -2))],
      ),
      child: ClipRRect(
        borderRadius: top,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: c.navy,
            border: Border(top: BorderSide(color: c.onNavy.withValues(alpha: 0.06))),
          ),
          child: NavigationBar(
            selectedIndex: selectedIndex,
            onDestinationSelected: onSelected,
            animationDuration: Motion.of(context, Motion.medium),
            destinations: [
              for (final d in destinations)
                NavigationDestination(
                  tooltip: '',
                  icon: _withBadge(d, Icon(d.icon), c),
                  selectedIcon: _withBadge(d, Icon(d.selectedIcon), c),
                  label: d.label,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _withBadge(NavDestinationSpec d, Widget icon, AppColors c) {
    if (d.path != '/messages' || unreadCount <= 0) return icon;
    return Badge(
      label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
      backgroundColor: const Color(0xFF3B82F6),
      textColor: Colors.white,
      child: icon,
    );
  }
}
