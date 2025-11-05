import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/localization_service.dart';
import '../widgets/language_selector.dart';

/// Example Settings Page showing how to implement localization
/// This demonstrates:
/// - Using translation keys with .tr extension
/// - RTL support with Directionality widget
/// - Language selector integration
/// - Rebuilding UI on language change
class SettingsPage extends StatefulWidget {
  const SettingsPage({Key? key}) : super(key: key);

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  final LocalizationService _localizationService = LocalizationService();

  @override
  Widget build(BuildContext context) {
    // Wrap entire page with Directionality for RTL support
    return Directionality(
      textDirection: _localizationService.textDirection,
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          title: Text(
            'settings'.tr, // Using .tr extension for translation
            style: GoogleFonts.tajawal(
              fontWeight: FontWeight.bold,
            ),
          ),
          backgroundColor: const Color(0xFF784D9C),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Language Section
            _buildSectionHeader('language'.tr),
            _buildCard(
              child: Column(
                children: [
                  _buildSettingTile(
                    icon: Icons.language,
                    title: 'language'.tr,
                    subtitle: _localizationService.currentLanguage == 'en'
                        ? 'english'.tr
                        : 'arabic'.tr,
                    trailing: LanguageSelector(
                      onLanguageChanged: (languageCode) {
                        // Rebuild the entire page when language changes
                        setState(() {});
                      },
                    ),
                  ),
                  _buildDivider(),
                  _buildSettingTile(
                    icon: Icons.translate,
                    title: 'Language Direction',
                    subtitle: _localizationService.isRTL ? 'RTL (Arabic)' : 'LTR (English)',
                    trailing: Icon(
                      _localizationService.isRTL
                          ? Icons.format_textdirection_r_to_l
                          : Icons.format_textdirection_l_to_r,
                      color: const Color(0xFF784D9C),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Account Section
            _buildSectionHeader('my_account'.tr),
            _buildCard(
              child: Column(
                children: [
                  _buildSettingTile(
                    icon: Icons.person,
                    title: 'profile'.tr,
                    subtitle: 'Edit your profile information',
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildSettingTile(
                    icon: Icons.shopping_bag,
                    title: 'my_orders'.tr,
                    subtitle: 'View your order history',
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildSettingTile(
                    icon: Icons.favorite,
                    title: 'favorites'.tr,
                    subtitle: 'Your favorite books',
                    onTap: () {},
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Actions Section
            _buildSectionHeader('Common Actions'),
            _buildCard(
              child: Column(
                children: [
                  _buildSettingTile(
                    icon: Icons.save,
                    title: 'save'.tr,
                    onTap: () {
                      _showMessage('success'.tr);
                    },
                  ),
                  _buildDivider(),
                  _buildSettingTile(
                    icon: Icons.edit,
                    title: 'edit'.tr,
                    onTap: () {
                      _showMessage('info'.tr);
                    },
                  ),
                  _buildDivider(),
                  _buildSettingTile(
                    icon: Icons.cancel,
                    title: 'cancel'.tr,
                    onTap: () {
                      _showMessage('warning'.tr);
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Quick Language Toggle Button
            ElevatedButton.icon(
              onPressed: () async {
                await _localizationService.toggleLanguage();
                setState(() {});
                _showMessage(
                  'Language changed to ${_localizationService.currentLanguage.toUpperCase()}',
                );
              },
              icon: const Icon(Icons.swap_horiz),
              label: Text(
                'Toggle Language (EN ↔ AR)',
                style: GoogleFonts.tajawal(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF784D9C),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Logout Button
            OutlinedButton.icon(
              onPressed: () {
                _showConfirmDialog();
              },
              icon: const Icon(Icons.logout),
              label: Text(
                'logout'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red, width: 2),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Language Info
            Center(
              child: Text(
                'Current Language: ${_localizationService.currentLanguage.toUpperCase()}',
                style: GoogleFonts.tajawal(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4, right: 4),
      child: Text(
        title,
        style: GoogleFonts.tajawal(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.grey[800],
        ),
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFF784D9C).withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          color: const Color(0xFF784D9C),
          size: 24,
        ),
      ),
      title: Text(
        title,
        style: GoogleFonts.tajawal(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Colors.grey[800],
        ),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: GoogleFonts.tajawal(
                fontSize: 13,
                color: Colors.grey[600],
              ),
            )
          : null,
      trailing: trailing ??
          (onTap != null
              ? Icon(
                  _localizationService.isRTL
                      ? Icons.arrow_back_ios
                      : Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.grey[400],
                )
              : null),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    );
  }

  Widget _buildDivider() {
    return Divider(
      height: 1,
      thickness: 1,
      indent: 16,
      endIndent: 16,
      color: Colors.grey[200],
    );
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.tajawal(),
        ),
        backgroundColor: const Color(0xFF784D9C),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showConfirmDialog() {
    showDialog(
      context: context,
      builder: (context) => Directionality(
        textDirection: _localizationService.textDirection,
        child: AlertDialog(
          title: Text(
            'confirm'.tr,
            style: GoogleFonts.tajawal(fontWeight: FontWeight.bold),
          ),
          content: Text(
            'Are you sure you want to logout?',
            style: GoogleFonts.tajawal(),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'no'.tr,
                style: GoogleFonts.tajawal(color: Colors.grey),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                _showMessage('Logged out successfully');
              },
              child: Text(
                'yes'.tr,
                style: GoogleFonts.tajawal(color: const Color(0xFF784D9C)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
