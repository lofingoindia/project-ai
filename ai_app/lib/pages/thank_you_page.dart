import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../main_navigation.dart';
import '../services/localization_service.dart';

class ThankYouPage extends StatefulWidget {
  final String orderId;

  const ThankYouPage({
    Key? key,
    required this.orderId,
  }) : super(key: key);

  @override
  State<ThankYouPage> createState() => _ThankYouPageState();
}

class _ThankYouPageState extends State<ThankYouPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.5, 1.0, curve: Curves.easeIn),
    ));

    // Start the animation
    _animationController.forward();

    // Navigate to My Orders after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        // Navigate back to main navigation and switch to profile tab with orders
        Navigator.of(context).popUntil((route) => route.isFirst);
        
        // Use a post-frame callback to ensure navigation is complete
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            MainNavigation.switchToProfileAndNavigateToOrders(context);
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF784D9C),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated checkmark
            AnimatedBuilder(
              animation: _scaleAnimation,
              builder: (context, child) {
                return Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.check,
                      color: Color(0xFF784D9C),
                      size: 60,
                    ),
                  ),
                );
              },
            ),
            
            const SizedBox(height: 40),
            
            // Thank you text
            FadeTransition(
              opacity: _fadeAnimation,
              child: Text(
                'thank_you_page_title'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Success message
            FadeTransition(
              opacity: _fadeAnimation,
              child: Text(
                'thank_you_page_success_message'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 18,
                  color: Colors.white.withOpacity(0.9),
                ),
                textAlign: TextAlign.center,
              ),
            ),
            
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
