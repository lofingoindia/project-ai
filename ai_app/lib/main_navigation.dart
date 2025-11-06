import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'home_page.dart';
import 'pages/books_page.dart';
import 'pages/cart_page.dart';
import 'my_account_page.dart';
import 'my_orders_page.dart';
import 'services/localization_service.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({Key? key}) : super(key: key);

  @override
  State<MainNavigation> createState() => _MainNavigationState();

  // Static method to switch tabs from anywhere in the app
  static void switchTab(BuildContext context, int tabIndex) {
    final state = context.findAncestorStateOfType<_MainNavigationState>();
    state?.switchToTab(tabIndex);
  }

  // Static method to switch to Shop tab with age filter
  static void switchToShopWithAgeFilter(BuildContext context, String ageFilter) {
    final state = context.findAncestorStateOfType<_MainNavigationState>();
    state?.switchToShopWithAge(ageFilter);
  }

  // Static method to switch to Profile tab and navigate to Orders
  static void switchToProfileAndNavigateToOrders(BuildContext context) {
    final state = context.findAncestorStateOfType<_MainNavigationState>();
    state?.switchToProfileWithOrdersNavigation();
  }

  // Static method to refresh cart
  static void refreshCart(BuildContext context) {
    final state = context.findAncestorStateOfType<_MainNavigationState>();
    state?._refreshCartIfVisible();
  }
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  String? _pendingAgeFilter; // Store age filter to pass to BooksPage
  int _booksPageKey = 0; // Key to force BooksPage recreation
  
  // Create global keys for each navigator to maintain their state
  final List<GlobalKey<NavigatorState>> _navigatorKeys = [
    GlobalKey<NavigatorState>(),
    GlobalKey<NavigatorState>(),
    GlobalKey<NavigatorState>(),
    GlobalKey<NavigatorState>(),
  ];

  // Responsive helper functions
  bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;

  // Method to switch tabs programmatically
  void switchToTab(int index) {
    if (index >= 0 && index < 4) {
      setState(() {
        _currentIndex = index;
      });
      
      // If switching to cart tab (index 2), refresh the cart
      if (index == 2) {
        // Small delay to ensure the page is built before refreshing
        Future.delayed(const Duration(milliseconds: 100), () {
          _refreshCartIfVisible();
        });
      }
    }
  }

  // Helper method to refresh cart
  void _refreshCartIfVisible() {
    try {
      final navigator = _navigatorKeys[2].currentState;
      if (navigator != null) {
        // Navigate to a fresh cart page
        navigator.pushReplacement(
          MaterialPageRoute(builder: (context) => CartPage()),
        );
      }
    } catch (e) {
      print('Error refreshing cart: $e');
    }
  }

  // Method to switch to Shop tab with age filter
  void switchToShopWithAge(String ageFilter) {
    // First, reset the Shop tab navigator to ensure fresh state
    _navigatorKeys[1].currentState?.popUntil((route) => route.isFirst);
    
    setState(() {
      _pendingAgeFilter = ageFilter;
      _currentIndex = 1; // Switch to Shop tab (index 1)
    });
    
    // Force rebuild of the navigator
    Future.microtask(() {
      if (mounted) {
        _navigatorKeys[1].currentState?.pushReplacement(
          MaterialPageRoute(
            builder: (context) => BooksPage(initialAgeFilter: ageFilter),
          ),
        );
      }
    });
  }

  // Method to switch to Profile tab and navigate to Orders
  void switchToProfileWithOrdersNavigation() {
    // First, reset the Profile tab navigator to ensure fresh state
    _navigatorKeys[3].currentState?.popUntil((route) => route.isFirst);
    
    setState(() {
      _currentIndex = 3; // Switch to Profile tab (index 3)
    });
    
    // Navigate to Orders page within the Profile tab after switching
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) {
        _navigatorKeys[3].currentState?.push(
          MaterialPageRoute(
            builder: (context) => MyOrdersPage(),
          ),
        );
      }
    });
  }

  // Build each tab with its own Navigator
  Widget _buildNavigator(int index) {
    return Navigator(
      key: _navigatorKeys[index],
      onGenerateRoute: (RouteSettings settings) {
        return MaterialPageRoute(
          builder: (context) {
            switch (index) {
              case 0:
                return HomePage();
              case 1:
                // Pass the pending age filter to BooksPage
                final ageFilter = _pendingAgeFilter;
                // Clear the pending filter after using it
                if (_pendingAgeFilter != null) {
                  Future.microtask(() {
                    if (mounted) {
                      setState(() {
                        _pendingAgeFilter = null;
                      });
                    }
                  });
                }
                // Use a key to force recreation when needed
                return BooksPage(
                  key: ValueKey('books_$_booksPageKey'),
                  initialAgeFilter: ageFilter,
                );
              case 2:
                return CartPage();
              case 3:
                return MyAccountPage();
              default:
                return HomePage();
            }
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = _isMobile(context);
    final localizationService = LocalizationService();
    
    return Directionality(
      textDirection: localizationService.textDirection,
      child: WillPopScope(
        onWillPop: () async {
          // Handle back button: pop current tab's navigation stack
          final isFirstRouteInCurrentTab =
              !await _navigatorKeys[_currentIndex].currentState!.maybePop();
          
          // If we're on the first route of the current tab
          if (isFirstRouteInCurrentTab) {
            // If not on Home tab, switch to Home tab
            if (_currentIndex != 0) {
              setState(() {
                _currentIndex = 0;
              });
              return false;
            }
          }
          // If on Home tab and first route, allow app to exit
          return isFirstRouteInCurrentTab;
        },
        child: Scaffold(
          appBar: isMobile ? null : _buildWebAppBar(context),
          body: Stack(
            children: List.generate(
              4,
              (index) => Offstage(
                offstage: _currentIndex != index,
                child: _buildNavigator(index),
              ),
            ),
          ),
          bottomNavigationBar: isMobile ? _buildMobileBottomNav(context) : null,
        ),
      ),
    );
  }

  // Build web/desktop top app bar
  PreferredSizeWidget _buildWebAppBar(BuildContext context) {
    final localizationService = LocalizationService();
    final isRTL = localizationService.isRTL;
    
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      toolbarHeight: 70,
      automaticallyImplyLeading: false,
      shadowColor: Colors.black.withOpacity(0.05),
      surfaceTintColor: Colors.white,
      bottom: PreferredSize(
        preferredSize: Size.fromHeight(1),
        child: Container(
          height: 1,
          color: Colors.grey[200],
        ),
      ),
      title: Row(
        children: [
          if (isRTL) ...[
            // RTL: Navigation items on the left
            SizedBox(width: 40),
            _buildWebNavItem(
              index: 0,
              label: 'home'.tr,
            ),
            SizedBox(width: 40),
            _buildWebNavItem(
              index: 1,
              label: 'library'.tr,
            ),
            SizedBox(width: 40),
            _buildWebIconNavItem(
              index: 2,
              icon: FontAwesomeIcons.cartShopping,
              activeIcon: FontAwesomeIcons.cartShopping,
              showBadge: true,
            ),
            SizedBox(width: 40),
            _buildWebIconNavItem(
              index: 3,
              icon: FontAwesomeIcons.user,
              activeIcon: FontAwesomeIcons.solidUser,
            ),
            Spacer(),
            // RTL: Logo on the right side
            InkWell(
              onTap: () {
                // Navigate to home screen (index 0)
                if (_currentIndex != 0) {
                  // Clear any pending filters
                  if (_currentIndex == 1) {
                    _pendingAgeFilter = null;
                    _booksPageKey++;
                  }
                  
                  // Reset navigation stacks
                  for (int i = 0; i < _navigatorKeys.length; i++) {
                    _navigatorKeys[i].currentState?.popUntil((route) => route.isFirst);
                  }
                  
                  setState(() {
                    _currentIndex = 0;
                  });
                }
              },
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: EdgeInsets.only(right: 40),
                child: Image.asset(
                  'assets/logs copy.png',
                  height: 190,
                  width: 190,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    // Fallback icon if image fails to load
                    return Container(
                      width: 40,
                      height: 40,
                      padding: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF784D9C),
                            Color(0xFF9B6BBF),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: FaIcon(
                        FontAwesomeIcons.bookOpen,
                        color: Colors.white,
                        size: 18,
                      ),
                    );
                  },
                ),
              ),
            ),
          ] else ...[
            // LTR: Logo on the left
            InkWell(
              onTap: () {
                // Navigate to home screen (index 0)
                if (_currentIndex != 0) {
                  // Clear any pending filters
                  if (_currentIndex == 1) {
                    _pendingAgeFilter = null;
                    _booksPageKey++;
                  }
                  
                  // Reset navigation stacks
                  for (int i = 0; i < _navigatorKeys.length; i++) {
                    _navigatorKeys[i].currentState?.popUntil((route) => route.isFirst);
                  }
                  
                  setState(() {
                    _currentIndex = 0;
                  });
                }
              },
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: EdgeInsets.only(left: 40),
                child: Image.asset(
                  'assets/logs copy.png',
                  height: 190,
                  width: 190,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    // Fallback icon if image fails to load
                    return Container(
                      width: 40,
                      height: 40,
                      padding: EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF784D9C),
                            Color(0xFF9B6BBF),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: FaIcon(
                        FontAwesomeIcons.bookOpen,
                        color: Colors.white,
                        size: 18,
                      ),
                    );
                  },
                ),
              ),
            ),
            Spacer(),
            // LTR: Navigation items on the right
            _buildWebNavItem(
              index: 0,
              label: 'home'.tr,
            ),
            SizedBox(width: 40),
            _buildWebNavItem(
              index: 1,
              label: 'library'.tr,
            ),
            SizedBox(width: 40),
            _buildWebIconNavItem(
              index: 2,
              icon: FontAwesomeIcons.cartShopping,
              activeIcon: FontAwesomeIcons.cartShopping,
              showBadge: true,
            ),
            SizedBox(width: 40),
            _buildWebIconNavItem(
              index: 3,
              icon: FontAwesomeIcons.user,
              activeIcon: FontAwesomeIcons.solidUser,
            ),
            SizedBox(width: 40),
          ],
        ],
      ),
      centerTitle: false,
    );
  }

  // Build web navigation item - simple text-based design
  Widget _buildWebNavItem({
    required int index,
    required String label,
    bool showBadge = false,
    int badgeCount = 0,
  }) {
    final isSelected = _currentIndex == index;
    
    return InkWell(
      onTap: () {
        if (index != _currentIndex) {
          if (_currentIndex == 1) {
            _pendingAgeFilter = null;
            _booksPageKey++;
          }
          
          for (int i = 0; i < _navigatorKeys.length; i++) {
            if (i == index || i == _currentIndex) {
              _navigatorKeys[i].currentState?.popUntil((route) => route.isFirst);
            }
          }
          
          if (index == 1 && _pendingAgeFilter == null) {
            Future.microtask(() {
              if (mounted) {
                _navigatorKeys[1].currentState?.pushReplacement(
                  MaterialPageRoute(
                    builder: (context) => BooksPage(
                      key: ValueKey('books_$_booksPageKey'),
                    ),
                  ),
                );
              }
            });
          }
        }
        setState(() {
          _currentIndex = index;
        });
      },
      borderRadius: BorderRadius.circular(8),
      splashColor: Color(0xFF784D9C).withOpacity(0.1),
      highlightColor: Color(0xFF784D9C).withOpacity(0.05),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 16,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? Color(0xFF784D9C) : Colors.grey[700],
                letterSpacing: 0.2,
              ),
            ),
            // Badge for notifications
            if (showBadge && badgeCount > 0) ...[
              SizedBox(width: 6),
              Container(
                constraints: BoxConstraints(minWidth: 20, minHeight: 20),
                padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    badgeCount.toString(),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[800],
                      height: 1.2,
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // Build web navigation item with icon - for cart and profile
  Widget _buildWebIconNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    bool showBadge = false,
    int badgeCount = 0,
  }) {
    final isSelected = _currentIndex == index;
    
    return InkWell(
      onTap: () {
        if (index != _currentIndex) {
          if (_currentIndex == 1) {
            _pendingAgeFilter = null;
            _booksPageKey++;
          }
          
          for (int i = 0; i < _navigatorKeys.length; i++) {
            if (i == index || i == _currentIndex) {
              _navigatorKeys[i].currentState?.popUntil((route) => route.isFirst);
            }
          }
          
          if (index == 1 && _pendingAgeFilter == null) {
            Future.microtask(() {
              if (mounted) {
                _navigatorKeys[1].currentState?.pushReplacement(
                  MaterialPageRoute(
                    builder: (context) => BooksPage(
                      key: ValueKey('books_$_booksPageKey'),
                    ),
                  ),
                );
              }
            });
          }
          
          // If switching TO Cart tab, refresh the cart
          if (index == 2) {
            Future.delayed(const Duration(milliseconds: 100), () {
              _refreshCartIfVisible();
            });
          }
        }
        setState(() {
          _currentIndex = index;
        });
      },
      borderRadius: BorderRadius.circular(8),
      splashColor: Color(0xFF784D9C).withOpacity(0.1),
      highlightColor: Color(0xFF784D9C).withOpacity(0.05),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            FaIcon(
              isSelected ? activeIcon : icon,
              size: 22,
              color: isSelected ? Color(0xFF784D9C) : Colors.grey[700],
            ),
            // Badge for notifications
            if (showBadge && badgeCount > 0)
              Positioned(
                right: -1,
                top: -6,
                child: Container(
                  constraints: BoxConstraints(minWidth: 20, minHeight: 16),
                  padding: EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.red[500],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Center(
                    child: Text(
                      badgeCount.toString(),
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        height: 1.0,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // Build mobile bottom navigation bar
  Widget _buildMobileBottomNav(BuildContext context) {
    return Container(
      color: const Color.fromARGB(0, 201, 131, 131),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 16),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: const Color.fromARGB(255, 255, 255, 255),
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 16,
              offset: Offset(0, 4),
              spreadRadius: -2,
            ),
          ],
        ),
        height: 62,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(
              index: 0,
              icon: FontAwesomeIcons.house,
              activeIcon: FontAwesomeIcons.house,
              label: 'home'.tr,
            ),
            _buildNavItem(
              index: 1,
              icon: FontAwesomeIcons.book,
              activeIcon: FontAwesomeIcons.book,
              label: 'library'.tr,
            ),
            _buildNavItem(
              index: 2,
              icon: FontAwesomeIcons.cartShopping,
              activeIcon: FontAwesomeIcons.cartShopping,
              label: 'cart'.tr,
            ),
            _buildNavItem(
              index: 3,
              icon: FontAwesomeIcons.user,
              activeIcon: FontAwesomeIcons.solidUser,
              label: 'profile'.tr,
            ),
          ],
        ),
      ),
    );
  }

  // Build custom navigation item with elegant styling
  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData activeIcon,
    required String label,
  }) {
    final isSelected = _currentIndex == index;
    
    return Expanded(
      child: InkWell(
        onTap: () {
          // Reset the navigation stack for the tab being switched to
          if (index != _currentIndex) {
            // If switching away from Shop tab, clear any pending filters
            if (_currentIndex == 1) {
              _pendingAgeFilter = null;
              _booksPageKey++;
            }
            
            // Reset ALL navigation stacks to their root pages
            for (int i = 0; i < _navigatorKeys.length; i++) {
              if (i == index || i == _currentIndex) {
                _navigatorKeys[i].currentState?.popUntil((route) => route.isFirst);
              }
            }
            
            // If switching TO Shop tab, force a fresh BooksPage without filters
            if (index == 1 && _pendingAgeFilter == null) {
              Future.microtask(() {
                if (mounted) {
                  _navigatorKeys[1].currentState?.pushReplacement(
                    MaterialPageRoute(
                      builder: (context) => BooksPage(
                        key: ValueKey('books_$_booksPageKey'),
                      ),
                    ),
                  );
                }
              });
            }
            
            // If switching TO Cart tab, refresh the cart
            if (index == 2) {
              Future.delayed(const Duration(milliseconds: 100), () {
                _refreshCartIfVisible();
              });
            }
          }
          setState(() {
            _currentIndex = index;
          });
        },
        borderRadius: BorderRadius.circular(24),
        splashColor: Color(0xFF784D9C).withOpacity(0.1),
        highlightColor: Color(0xFF784D9C).withOpacity(0.05),
        child: Container(
          margin: EdgeInsets.symmetric(horizontal: 2),
          padding: EdgeInsets.symmetric(
            horizontal: isSelected ? 8 : 8,
            vertical: 10
          ),
          decoration: isSelected
              ? BoxDecoration(
                  color: Color(0xFF784D9C),
                  borderRadius: BorderRadius.circular(24),
                )
              : null,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FaIcon(
                isSelected ? activeIcon : icon,
                size: 20,
                color: isSelected ? Colors.white : Color(0xFF784D9C),
              ),
              if (isSelected) ...[
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
