import 'package:flutter/material.dart';
import '../theme.dart';

class NavDestinationSpec {
  const NavDestinationSpec(this.path, this.icon, this.selectedIcon, this.label);
  final String path;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

/// Four-tab owner navigation: Home, Messages, Vehicles, Profile. Outlined
/// icons when inactive, filled when active; Messages carries the unread
/// count.
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
    return DecoratedBox(
      decoration: BoxDecoration(border: Border(top: BorderSide(color: c.border))),
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
    );
  }

  Widget _withBadge(NavDestinationSpec d, Widget icon, AppColors c) {
    if (d.path != '/messages' || unreadCount <= 0) return icon;
    return Badge(
      label: Text(unreadCount > 99 ? '99+' : '$unreadCount'),
      backgroundColor: c.comm,
      textColor: Colors.white,
      child: icon,
    );
  }
}
