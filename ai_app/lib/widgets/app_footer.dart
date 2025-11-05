import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../pages/privacy_policy_page.dart';
import '../pages/customer_support_page.dart';
import '../services/localization_service.dart';

class AppFooter extends StatelessWidget {
  const AppFooter({Key? key}) : super(key: key);

  bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;

  @override
  Widget build(BuildContext context) {
    // Only show footer on web (both mobile web and desktop web)
    // Hide footer on mobile application
    if (!kIsWeb) {
      return SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF784D9C),
            Color(0xFF784D9C),
             Color(0xFF784D9C),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            offset: Offset(0, -2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Main Footer Content
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: _isMobile(context) ? 20 : 60, 
              vertical: _isMobile(context) ? 30 : 40,
            ),
            child: _isMobile(context) 
              ? _buildMobileFooterContent(context)
              : _buildDesktopFooterContent(context),
          ),
          
          // Bottom Bar
          Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(
              horizontal: _isMobile(context) ? 20 : 60, 
              vertical: 20,
            ),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.2),
            ),
            child: _isMobile(context) 
              ? _buildMobileBottomBar(context)
              : _buildDesktopBottomBar(context),
          ),
        ],
      ),
    );
  }

  // Mobile footer content - stacked vertically
  Widget _buildMobileFooterContent(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Brand Section
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'footer_hero_kids'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 12),
            Text(
              'footer_tagline'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 14,
                color: Colors.white.withOpacity(0.9),
                height: 1.6,
              ),
            ),
            SizedBox(height: 16),
            // Social Media Icons
            Row(
              children: [
                _buildSocialIcon(FontAwesomeIcons.facebook),
                SizedBox(width: 12),
                _buildSocialIcon(FontAwesomeIcons.instagram),
                SizedBox(width: 12),
                _buildSocialIcon(FontAwesomeIcons.twitter),
                SizedBox(width: 12),
                _buildSocialIcon(FontAwesomeIcons.youtube),
              ],
            ),
          ],
        ),
        SizedBox(height: 30),
        
        // Support Section
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'footer_support'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 12),
            _buildFooterLink(context, 'footer_customer_support'.tr, () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CustomerSupportPage(),
                ),
              );
            }),
            _buildFooterLink(context, 'footer_privacy_policy'.tr, () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => PrivacyPolicyPage(),
                ),
              );
            }),
          ],
        ),
        SizedBox(height: 30),
        
        // Contact Section
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'footer_contact_us'.tr,
              style: GoogleFonts.tajawal(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 12),
            _buildContactInfo(
              FontAwesomeIcons.envelope,
              'footer_contact_email'.tr,
            ),
            SizedBox(height: 8),
            _buildContactInfo(
              FontAwesomeIcons.phone,
              'footer_contact_phone'.tr,
            ),
            SizedBox(height: 8),
            _buildContactInfo(
              FontAwesomeIcons.locationDot,
              'footer_contact_address'.tr,
            ),
          ],
        ),
      ],
    );
  }

  // Desktop footer content - row layout
  Widget _buildDesktopFooterContent(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Brand Section
        Expanded(
          flex: 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'footer_hero_kids'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 16),
              Text(
                'footer_tagline'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 14,
                  color: Colors.white.withOpacity(0.9),
                  height: 1.6,
                ),
              ),
              SizedBox(height: 20),
              // Social Media Icons
              Row(
                children: [
                  _buildSocialIcon(FontAwesomeIcons.facebook),
                  SizedBox(width: 12),
                  _buildSocialIcon(FontAwesomeIcons.instagram),
                  SizedBox(width: 12),
                  _buildSocialIcon(FontAwesomeIcons.twitter),
                  SizedBox(width: 12),
                  _buildSocialIcon(FontAwesomeIcons.youtube),
                ],
              ),
            ],
          ),
        ),
        SizedBox(width: 60),
        
        // Support Section
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'footer_support'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 16),
              _buildFooterLink(context, 'footer_customer_support'.tr, () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CustomerSupportPage(),
                  ),
                );
              }),
              _buildFooterLink(context, 'footer_privacy_policy'.tr, () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PrivacyPolicyPage(),
                  ),
                );
              }),
              _buildFooterLink(context, 'footer_terms_of_service'.tr, () {}),
              _buildFooterLink(context, 'footer_shipping_info'.tr, () {}),
            ],
          ),
        ),
        
        // Contact Section
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'footer_contact_us'.tr,
                style: GoogleFonts.tajawal(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              ),
              SizedBox(height: 16),
              _buildContactInfo(
                FontAwesomeIcons.envelope,
                'footer_contact_email'.tr,
              ),
              SizedBox(height: 12),
              _buildContactInfo(
                FontAwesomeIcons.phone,
                'footer_contact_phone'.tr,
              ),
              SizedBox(height: 12),
              _buildContactInfo(
                FontAwesomeIcons.locationDot,
                'footer_contact_address'.tr,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Mobile bottom bar - stacked
  Widget _buildMobileBottomBar(BuildContext context) {
    return Column(
      children: [
        Text(
          '© ${DateTime.now().year} ${'footer_hero_kids'.tr}. ${'footer_all_rights_reserved'.tr}',
          style: GoogleFonts.tajawal(
            fontSize: 13,
            color: Colors.white.withOpacity(0.8),
          ),
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 12),
        Wrap(
          alignment: WrapAlignment.center,
          children: [
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PrivacyPolicyPage(),
                  ),
                );
              },
              style: TextButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
              child: Text(
                'footer_privacy_policy'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 13,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ),
            Text(
              '|',
              style: TextStyle(color: Colors.white.withOpacity(0.5)),
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CustomerSupportPage(),
                  ),
                );
              },
              style: TextButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              ),
              child: Text(
                'footer_customer_support'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 13,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Desktop bottom bar - row layout
  Widget _buildDesktopBottomBar(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          '© ${DateTime.now().year} ${'footer_hero_kids'.tr}. ${'footer_all_rights_reserved'.tr}',
          style: GoogleFonts.tajawal(
            fontSize: 13,
            color: Colors.white.withOpacity(0.8),
          ),
        ),
        Row(
          children: [
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PrivacyPolicyPage(),
                  ),
                );
              },
              style: TextButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: Text(
                'footer_privacy_policy'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 13,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ),
            Text(
              '|',
              style: TextStyle(color: Colors.white.withOpacity(0.5)),
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CustomerSupportPage(),
                  ),
                );
              },
              style: TextButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              child: Text(
                'footer_customer_support'.tr,
                style: GoogleFonts.tajawal(
                  fontSize: 13,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSocialIcon(IconData icon) {
    return Container(
      padding: EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        shape: BoxShape.circle,
      ),
      child: FaIcon(
        icon,
        size: 18,
        color: Colors.white,
      ),
    );
  }

  Widget _buildFooterLink(BuildContext context, String text, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 6),
        child: Text(
          text,
          style: GoogleFonts.tajawal(
            fontSize: 14,
            color: Colors.white.withOpacity(0.9),
            decoration: TextDecoration.none,
          ),
        ),
      ),
    );
  }

  Widget _buildContactInfo(IconData icon, String text) {
    return Row(
      children: [
        FaIcon(
          icon,
          size: 14,
          color: Colors.white.withOpacity(0.9),
        ),
        SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.tajawal(
              fontSize: 13,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ),
      ],
    );
  }
}