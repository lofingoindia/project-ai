import 'package:hero_kids/pages/my_books_page.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:io' show File;
import 'my_orders_page.dart';
import 'login_page.dart';
import 'services/localization_service.dart';
import 'services/cart_service.dart';
import 'widgets/language_selector.dart';
import 'widgets/app_footer.dart';

class MyAccountPage extends StatefulWidget {
  @override
  State<MyAccountPage> createState() => _MyAccountPageState();
}

class _MyAccountPageState extends State<MyAccountPage> {
  final LocalizationService _localizationService = LocalizationService();
  bool _profileLoading = false;
  String? _profileError;
  
  // User data variables
  String _userName = '';
  String? _profileImageUrl;
  XFile? _selectedImage;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
    _loadProfile();
    _loadSavedImage();
  }

  Future<void> _checkAuthStatus() async {
    final user = Supabase.instance.client.auth.currentUser;
    setState(() {
      _isLoggedIn = user != null;
    });
  }

  Future<void> _loadSavedImage() async {
    final prefs = await SharedPreferences.getInstance();
    final savedPath = prefs.getString('profile_image_path');
    if (savedPath != null) {
      // On web we can't access local file paths. Keep savedPath as url only.
      if (!kIsWeb && File(savedPath).existsSync()) {
        setState(() {
          _selectedImage = XFile(savedPath);
        });
      }
    }
  }

  Future<void> _saveImagePath(String path) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('profile_image_path', path);
  }

  Future<void> _loadProfile() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    
    setState(() { 
      _profileLoading = true; 
      _profileError = null; 
    });
    
    // Since there's a database schema mismatch, let's just use auth user data for now
    try {
      final name = user.userMetadata?['name'] ?? '';
      final email = user.email ?? '';
      final profileImageUrl = user.userMetadata?['profile_image_url'];
      
      setState(() {
        _userName = name;
        _profileImageUrl = profileImageUrl;
        _nameController.text = name;
        _emailController.text = email;
      });
    } catch (e) {
      print('Profile loading error: $e');
      setState(() { 
        _profileError = null; // Don't show error to user
        _userName = '';
      });
    } finally {
      setState(() { _profileLoading = false; });
    }
  }

  Future<void> _pickImageForDialog(ImageSource source, StateSetter dialogSetState) async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1024,
        maxHeight: 1024,
      );
      
      if (image != null) {
        setState(() {
          _selectedImage = image;
        });
        
        // Update dialog immediately
        dialogSetState(() {});
      }
    } catch (e) {
      print('Error picking image: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${'my_account_error_selecting_image'.tr}${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  // Remove old loading/error

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Widget _buildMenuCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Color(0xFFB47AFF).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: Color(0xFFB47AFF),
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios,
                color: Colors.black26,
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoginPromptCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Color(0xFF784D9C).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.person_outline,
                size: 50,
                color: Color(0xFF784D9C),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'my_account_not_logged_in_title'.tr,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'my_account_not_logged_in_subtitle'.tr,
              style: TextStyle(
                fontSize: 14,
                color: Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF784D9C),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 2,
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => LoginPage()),
                  ).then((_) {
                    // Refresh auth status when returning from login
                    _checkAuthStatus();
                    _loadProfile();
                  });
                },
                icon: Icon(Icons.login, size: 22),
                label: Text(
                  'my_account_login_button'.tr,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: _localizationService.textDirection,
      child: Scaffold(
        backgroundColor: const Color(0xFFF9F7FC),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          iconTheme: const IconThemeData(color: Colors.black),
          title: Text('my_account'.tr, style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          automaticallyImplyLeading: false,
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: LanguageSelector(
                onLanguageChanged: (String languageCode) {
                  setState(() {
                    // Rebuild the entire page to reflect language changes
                  });
                },
              ),
            ),
          ],
        ),
        body: SingleChildScrollView(
          child: Column(
            children: [
              Center(
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width < 650 ? double.infinity : 1000
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
              if (_profileLoading)
                Center(child: CircularProgressIndicator()),
              if (_profileError != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Text(_profileError!, style: TextStyle(color: Colors.red)),
                ),
              
              // Show login prompt if not logged in
              if (!_isLoggedIn) ...[
                _buildLoginPromptCard(),
                const SizedBox(height: 24),
                
                // Menu Options for non-logged-in users
                _buildMenuCard(
                  title: 'my_account_my_books'.tr,
                  subtitle: 'my_account_books_subtitle'.tr,
                  icon: Icons.library_books,
                  onTap: () {
                    // Navigate to Books page
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => MyBooksPage()),
                    );
                  },
                ),
                const SizedBox(height: 16),
                _buildMenuCard(
                  title: 'my_orders'.tr,
                  subtitle: 'my_account_orders_subtitle'.tr,
                  icon: Icons.shopping_bag,
                  onTap: () {
                    // Navigate to My Orders page
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => MyOrdersPage()),
                    );
                  },
                ),
                const SizedBox(height: 16),
                // _buildMenuCard(
                //   title: 'my_account_support'.tr,
                //   subtitle: 'my_account_support_subtitle'.tr,
                //   icon: Icons.support_agent,
                //   onTap: () {
                //     // Navigate to Support page
                //     Navigator.push(
                //       context,
                //       MaterialPageRoute(builder: (context) => SupportPage()),
                //     );
                //   },
                // ),
              ],
              
              // Show profile card only if logged in
              if (_isLoggedIn) ...[
              // Profile Card
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 60,
                        backgroundColor: Color(0xFF784D9C),
                        backgroundImage: _buildProfileImageProvider(),
                        child: (_selectedImage == null && _profileImageUrl == null) ? Text(
                          _userName.isNotEmpty 
                              ? _userName.substring(0, 1).toUpperCase() + (_userName.length > 1 ? _userName.substring(1, 2).toUpperCase() : 'S')
                              : 'US',
                          style: TextStyle(fontSize: 48, color: Colors.white, fontWeight: FontWeight.bold),
                        ) : null,
                      ),
                      const SizedBox(height: 16),
                      Text(_userName.isNotEmpty ? _userName : 'my_account_user'.tr, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: 120,
                        height: 42,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Color(0xFF784D9C),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                            elevation: 2,
                          ),
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (context) {
                                bool dialogLoading = false;
                                String? dialogError;
                                XFile? dialogSelectedImage = _selectedImage; // Track dialog's image state
                                
                                return StatefulBuilder(
                                  builder: (context, setStateDialog) {
                                    return Dialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                      child: Padding(
                                        padding: const EdgeInsets.all(24.0),
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          children: [
                                            Text('my_account_edit_profile'.tr, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                                            const SizedBox(height: 16),
                                            Center(
                                              child: GestureDetector(
                                                onTap: () {
                                                  showDialog(
                                                    context: context,
                                                    builder: (context) => AlertDialog(
                                                      title: Text('my_account_select_image_source'.tr),
                                                      content: Column(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          ListTile(
                                                            leading: Icon(Icons.camera_alt, color: Color(0xFFB47AFF)),
                                                            title: Text('my_account_camera'.tr),
                                                            onTap: () async {
                                                              Navigator.of(context).pop();
                                                              await _pickImageForDialog(ImageSource.camera, setStateDialog);
                                                              dialogSelectedImage = _selectedImage;
                                                            },
                                                          ),
                                                          ListTile(
                                                            leading: Icon(Icons.photo_library, color: Color(0xFFB47AFF)),
                                                            title: Text('my_account_gallery'.tr),
                                                            onTap: () async {
                                                              Navigator.of(context).pop();
                                                              await _pickImageForDialog(ImageSource.gallery, setStateDialog);
                                                              dialogSelectedImage = _selectedImage;
                                                            },
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  );
                                                },
                                                child: Stack(
                                                  children: [
                                                    Container(
                                                      width: 90,
                                                      height: 90,
                                                      decoration: BoxDecoration(
                                                        color: Color(0xFFB47AFF).withOpacity(0.3),
                                                        shape: BoxShape.circle,
                                                        border: Border.all(color: Color(0xFFB47AFF).withOpacity(0.3), width: 3, style: BorderStyle.solid),
                                                      ),
                                                      child: ClipOval(
                                                        child: dialogSelectedImage != null
                                                            ? FutureBuilder<ImageProvider>(
                                                                future: _imageProviderFromXFile(dialogSelectedImage!),
                                                                builder: (context, snap) {
                                                                  if (snap.connectionState != ConnectionState.done) {
                                                                    return const Center(child: CircularProgressIndicator(strokeWidth: 2));
                                                                  }
                                                                  return Image(image: snap.data ?? const AssetImage('assets/logo.png'), fit: BoxFit.cover);
                                                                },
                                                              )
                                                            : _profileImageUrl != null
                                                                ? Image.network(_profileImageUrl!, fit: BoxFit.cover)
                                                                : Center(
                                                                    child: Text(
                                                                      _userName.isNotEmpty
                                                                          ? _userName.substring(0, 1).toUpperCase() + (_userName.length > 1 ? _userName.substring(1, 2).toUpperCase() : 'S')
                                                                          : 'US',
                                                                      style: TextStyle(fontSize: 36, color: Color(0xFFB47AFF), fontWeight: FontWeight.bold),
                                                                    ),
                                                                  ),
                                                      ),
                                                    ),
                                                    Positioned(
                                                      bottom: 0,
                                                      right: 0,
                                                      child: Container(
                                                        width: 28,
                                                        height: 28,
                                                        decoration: BoxDecoration(
                                                          color: Color(0xFFB47AFF),
                                                          shape: BoxShape.circle,
                                                          border: Border.all(color: Colors.white, width: 2),
                                                        ),
                                                        child: Icon(Icons.camera_alt, color: Colors.white, size: 16),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 20),
                                            TextField(
                                              controller: _nameController,
                                              decoration: InputDecoration(
                                                hintText: _userName.isNotEmpty ? _userName : 'my_account_enter_name'.tr,
                                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            TextField(
                                              controller: _passwordController,
                                              obscureText: true,
                                              decoration: InputDecoration(
                                                hintText: 'my_account_new_password'.tr,
                                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            TextField(
                                              controller: _confirmPasswordController,
                                              obscureText: true,
                                              decoration: InputDecoration(
                                                hintText: 'my_account_confirm_password'.tr,
                                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                              ),
                                            ),
                                            const SizedBox(height: 20),
                                            if (dialogError != null) ...[
                                              Text(dialogError!, style: TextStyle(color: Colors.red)),
                                              const SizedBox(height: 8),
                                            ],
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: ElevatedButton(
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: Color(0xFFF3F0F8),
                                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                                      elevation: 0,
                                                    ),
                                                    onPressed: dialogLoading ? null : () => Navigator.of(context).pop(),
                                                    child: Text('cancel'.tr, style: TextStyle(color: Color(0xFF7A6F92), fontWeight: FontWeight.bold)),
                                                  ),
                                                ),
                                                const SizedBox(width: 16),
                                                Expanded(
                                                  child: ElevatedButton(
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: Color(0xFF784D9C),
                                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                                    ),
                                                    onPressed: dialogLoading
                                                        ? null
                                                        : () async {
                                                            setStateDialog(() { dialogLoading = true; dialogError = null; });
                                                            final user = Supabase.instance.client.auth.currentUser;
                                                            if (user == null) {
                                                              setStateDialog(() { dialogError = 'my_account_not_logged_in'.tr; dialogLoading = false; });
                                                              return;
                                                            }
                                                            if (_passwordController.text.isNotEmpty && _passwordController.text != _confirmPasswordController.text) {
                                                              setStateDialog(() { dialogError = 'my_account_passwords_no_match'.tr; dialogLoading = false; });
                                                              return;
                                                            }
                                                            try {
                                                              // Save image path locally if an image was selected
                                                              if (_selectedImage != null) {
                                                                await _saveImagePath(_selectedImage!.path);
                                                              }
                                                              
                                                              // Update auth user data directly since profile table has schema issues
                                                              if (_emailController.text.trim() != user.email && _emailController.text.trim().isNotEmpty) {
                                                                await Supabase.instance.client.auth.updateUser(
                                                                  UserAttributes(
                                                                    email: _emailController.text.trim(),
                                                                    data: {'name': _nameController.text.trim()},
                                                                  ),
                                                                );
                                                              } else {
                                                                // Just update the user metadata with the name
                                                                await Supabase.instance.client.auth.updateUser(
                                                                  UserAttributes(
                                                                    data: {'name': _nameController.text.trim()},
                                                                  ),
                                                                );
                                                              }
                                                              
                                                              if (_passwordController.text.isNotEmpty && _passwordController.text.length >= 6) {
                                                                await Supabase.instance.client.auth.updateUser(
                                                                  UserAttributes(password: _passwordController.text),
                                                                );
                                                              }                                                              // Update local state
                                                              setState(() {
                                                                _userName = _nameController.text.trim();
                                                              });
                                                              
                                                              // Clear password fields
                                                              _passwordController.clear();
                                                              _confirmPasswordController.clear();
                                                              
                                                              Navigator.of(context).pop();
                                                              ScaffoldMessenger.of(context).showSnackBar(
                                                                SnackBar(
                                                                  content: Text('my_account_profile_updated'.tr),
                                                                  backgroundColor: Colors.green,
                                                                ),
                                                              );
                                                            } catch (e) {
                                                              setStateDialog(() { dialogError = '${'my_account_update_error'.tr}${e.toString()}'; });
                                                            } finally {
                                                              setStateDialog(() { dialogLoading = false; });
                                                            }
                                                          },
                                                    child: dialogLoading
                                                        ? SizedBox(height: 15, width: 15, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                                        : Text('save'.tr, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                );
                              },
                            );
                          },
                          icon: Icon(Icons.edit, color: Colors.white, size: 18),
                          label: Text(
                            'edit'.tr, 
                            style: TextStyle(
                              color: Colors.white, 
                              fontWeight: FontWeight.w600,
                              fontSize: 14
                            )
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Menu Options
              _buildMenuCard(
                title: 'my_account_my_books'.tr,
                subtitle: 'my_account_books_subtitle'.tr,
                icon: Icons.library_books,
                onTap: () {
                  // Navigate to Books page
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => MyBooksPage()),
                  );
                },
              ),
              const SizedBox(height: 16),
              _buildMenuCard(
                title: 'my_orders'.tr,
                subtitle: 'my_account_orders_subtitle'.tr,
                icon: Icons.shopping_bag,
                onTap: () {
                  // Navigate to My Orders page
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => MyOrdersPage()),
                  );
                },
              ),
              // const SizedBox(height: 16),
              // _buildMenuCard(
              //   title: 'language'.tr,
              //   subtitle: _localizationService.currentLanguage == 'en' 
              //       ? 'my_account_language_subtitle_english'.tr 
              //       : 'my_account_language_subtitle_arabic'.tr,
              //   icon: Icons.language,
              //   onTap: () async {
              //     await _localizationService.toggleLanguage();
              //     setState(() {});
              //     ScaffoldMessenger.of(context).showSnackBar(
              //       SnackBar(
              //         content: Text(
              //           '${'my_account_language_changed'.tr}${_localizationService.currentLanguage == "en" ? "English" : "العربية"}',
              //         ),
              //         backgroundColor: Color(0xFF784D9C),
              //         duration: Duration(seconds: 1),
              //         behavior: SnackBarBehavior.floating,
              //       ),
              //     );
              //   },
              // ),
              // const SizedBox(height: 16),
              // _buildMenuCard(
              //   title: 'my_account_support'.tr,
              //   subtitle: 'my_account_support_subtitle'.tr,
              //   icon: Icons.support_agent,
              //   onTap: () {
              //     // Navigate to Support page
              //     Navigator.push(
              //       context,
              //       MaterialPageRoute(builder: (context) => SupportPage()),
              //     );
              //   },
              // ),
              const SizedBox(height: 16),
              _buildMenuCard(
                title: 'logout'.tr,
                subtitle: 'my_account_logout_subtitle'.tr,
                icon: Icons.logout,
                onTap: () {
                  _showLogoutDialog();
                },
              ),
              ], // End of if (_isLoggedIn)
            ],
                    ),
                  ),
                ),
              ),
              // Add footer at the bottom (scrollable)
              AppFooter(),
            ],
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Directionality(
          textDirection: _localizationService.textDirection,
          child: AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            title: Text(
              'logout'.tr,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: Colors.black87,
              ),
            ),
            content: Text(
              'my_account_logout_confirm'.tr,
              style: TextStyle(
                fontSize: 16,
                color: Colors.black54,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Close dialog
                },
                child: Text(
                  'cancel'.tr,
                  style: TextStyle(
                    color: Color(0xFF7A6F92),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF784D9C),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 2,
                ),
                onPressed: () async {
                  Navigator.of(context).pop(); // Close dialog
                  await _performLogout();
                },
                child: Text(
                  'logout'.tr,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _performLogout() async {
    try {
      // Prepare cart for logout - copy server cart to local storage
      final cartService = CartService();
      await cartService.prepareForLogout();
      
      // Clear saved image path first (faster)
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('profile_image_path');

      // Sign out from Supabase
      await Supabase.instance.client.auth.signOut();

      // Update the state to show login prompt
      if (mounted) {
        setState(() {
          _isLoggedIn = false;
          _userName = '';
          _profileImageUrl = null;
          _selectedImage = null;
        });
        
        // Clear text controllers
        _nameController.clear();
        _emailController.clear();
        _passwordController.clear();
        _confirmPasswordController.clear();
        
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('logout'.tr + ' ' + 'success'.tr),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }

    } catch (e) {
      // Show error message if logout fails
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'my_account_error_logging_out'.tr}${e.toString()}'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  // Helper to build profile background image provider for CircleAvatar
  ImageProvider? _buildProfileImageProvider() {
    if (_selectedImage != null) {
      if (kIsWeb) {
        // For web we can't synchronously provide MemoryImage here; return null so child displays after FutureBuilder elsewhere if needed
        return null;
      } else {
        return FileImage(File(_selectedImage!.path));
      }
    }
    if (_profileImageUrl != null && _profileImageUrl!.isNotEmpty) {
      return NetworkImage(_profileImageUrl!);
    }
    return null;
  }

  // Convert XFile to ImageProvider asynchronously
  Future<ImageProvider> _imageProviderFromXFile(XFile file) async {
    if (kIsWeb) {
      final bytes = await file.readAsBytes();
      return MemoryImage(bytes);
    } else {
      return FileImage(File(file.path));
    }
  }
}
