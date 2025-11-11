import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'login_page.dart';
import 'my_account_page.dart';
import 'services/cart_service.dart';
import 'services/localization_service.dart';


class SignUpPage extends StatefulWidget {
  const SignUpPage({Key? key}) : super(key: key);

  @override
  State<SignUpPage> createState() => _SignUpPageState();
}

class _SignUpPageState extends State<SignUpPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final CartService _cartService = CartService();
  final LocalizationService _localizationService = LocalizationService();
  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 650;
    final containerWidth = isMobile ? screenWidth * 0.9 : 380.0;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF9F7FC),
      body: Stack(
        children: [
          Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(horizontal: isMobile ? 20 : 0, vertical: 40),
              child: Directionality(
                textDirection: _localizationService.textDirection,
                child: Container(
                width: containerWidth,
                padding: EdgeInsets.symmetric(
                  vertical: isMobile ? 30 : 40, 
                  horizontal: isMobile ? 24 : 32
                ),
                decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: ListView(
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Color(0xFFF3EBFF),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.star_rounded,
                    color: Color.fromARGB(255, 109, 61, 172),
                    size: 40,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'signup_page_title'.tr,
                  style: GoogleFonts.tajawal(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1A1A1A),
                    letterSpacing: -0.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'signup_page_subtitle'.tr,
                  style: GoogleFonts.tajawal(
                    fontSize: 15,
                    color: Color(0xFF666666),
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    hintText: 'signup_page_enter_name'.tr,
                    hintStyle: GoogleFonts.tajawal(color: Color(0xFF999999)),
                    filled: true,
                    fillColor: Color(0xFFF8F9FA),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Color(0xFFB47AFF), width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    hintText: 'signup_page_enter_email'.tr,
                    hintStyle: GoogleFonts.tajawal(color: Color(0xFF999999)),
                    filled: true,
                    fillColor: Color(0xFFF8F9FA),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Color(0xFFB47AFF), width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    hintText: 'signup_page_enter_password'.tr,
                    hintStyle: GoogleFonts.tajawal(color: Color(0xFF999999)),
                    filled: true,
                    fillColor: Color(0xFFF8F9FA),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Color(0xFFB47AFF), width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: Color(0xFF999999),
                      ),
                      onPressed: () {
                        setState(() {
                          _obscurePassword = !_obscurePassword;
                        });
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                if (_error != null) ...[
                  Text(_error!, style: GoogleFonts.tajawal(color: Colors.red)),
                  const SizedBox(height: 8),
                ],
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFF784D9C),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    onPressed: _loading ? null : _signUp,
                    child: _loading
                        ? SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : Text(
                            'signup_page_button'.tr,
                            style: GoogleFonts.tajawal(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.5,
                            ),
                          ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'signup_page_already_member'.tr,
                      style: GoogleFonts.tajawal(
                        color: Color(0xFF666666),
                        fontSize: 14,
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => LoginPage()),
                        );
                      },
                      child: Text(
                        'signup_page_login'.tr,
                        style: GoogleFonts.tajawal(
                          color: Color(0xFFB47AFF),
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          ),
        ),
      ),
        Positioned(
          top: MediaQuery.of(context).padding.top + 10,
          left: _localizationService.textDirection == TextDirection.ltr ? 10 : null,
          right: _localizationService.textDirection == TextDirection.rtl ? 10 : null,
          child: IconButton(
            icon: Icon(
              _localizationService.textDirection == TextDirection.ltr 
                ? Icons.arrow_back_ios 
                : Icons.arrow_forward_ios,
              color: Color(0xFF784D9C),
            ),
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
        ),
        ],
      ),
    );
  }

  Future<void> _signUp() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final name = _nameController.text.trim();
    
    try {
      // First, try to sign up the user
      final response = await Supabase.instance.client.auth.signUp(
        email: email,
        password: password,
        data: {'name': name, 'full_name': name, 'email_confirm': false},
      );
      
      // If user was created (regardless of email confirmation)
      if (response.user != null) {
        // Create user profile in app_users table
        try {
          await Supabase.instance.client
              .from('app_users')
              .insert({
                'full_name': name,
                'email': email,
                'role': 'user',
                'is_active': true,
              });
        } catch (profileError) {
          // Non-blocking error
        }
        
        // Try to sign in immediately regardless of email confirmation status
        try {
          await Supabase.instance.client.auth.signInWithPassword(
            email: email,
            password: password,
          );
          // If sign in successful, migrate cart
          await _cartService.migrateLocalCartToServer();
        } catch (signInError) {
          // If sign in fails due to email confirmation, continue anyway
        }
        
        // Always navigate to MyAccountPage - user account was created successfully
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => MyAccountPage()),
          (route) => false,
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('signup_page_account_created'.tr),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        setState(() {
          _error = 'signup_page_error_creation_failed'.tr;
        });
      }
    } on AuthException catch (e) {
      // Handle specific Supabase auth errors
      if (e.message.contains('User already registered')) {
        setState(() {
          _error = 'An account with this email already exists. Please try logging in instead.';
        });
      } else {
        setState(() {
          _error = 'Signup failed: ${e.message}';
        });
      }
    } catch (e) {
      setState(() {
        _error = '${'signup_page_error_signup'.tr}${e.toString()}';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }
}
