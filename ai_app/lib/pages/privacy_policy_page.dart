import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../widgets/app_footer.dart';
import '../services/localization_service.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({Key? key}) : super(key: key);

  bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;

  @override
  Widget build(BuildContext context) {
    final isMobile = _isMobile(context);
    
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Color(0xFF784D9C)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'privacy_policy_title'.tr,
          style: GoogleFonts.tajawal(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF784D9C),
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Center(
              child: Container(
                constraints: BoxConstraints(maxWidth: isMobile ? double.infinity : 900),
                padding: EdgeInsets.all(isMobile ? 20 : 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                // Header Section
                Center(
                  child: Column(
                    children: [
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF784D9C), Color(0xFF9B6BBF)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Icon(
                          Icons.privacy_tip_outlined,
                          size: 48,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(height: 20),
                      Text(
                        'privacy_policy_title'.tr,
                        style: GoogleFonts.tajawal(
                          fontSize: isMobile ? 28 : 36,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF784D9C),
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'privacy_policy_last_updated'.tr,
                        style: GoogleFonts.tajawal(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 40),

                // Introduction
                _buildSection(
                  'privacy_policy_introduction_title'.tr,
                  'privacy_policy_introduction_text'.tr,
                  isMobile,
                ),

                // Information We Collect
                _buildSection(
                  'privacy_policy_info_collect_title'.tr,
                  '',
                  isMobile,
                ),
                _buildSubSection(
                  'privacy_policy_personal_info_title'.tr,
                  'privacy_policy_personal_info_text'.tr,
                  isMobile,
                ),
                _buildSubSection(
                  'privacy_policy_usage_info_title'.tr,
                  'privacy_policy_usage_info_text'.tr,
                  isMobile,
                ),
                _buildSubSection(
                  'privacy_policy_cookies_title'.tr,
                  'privacy_policy_cookies_text'.tr,
                  isMobile,
                ),

                // How We Use Your Information
                _buildSection(
                  'privacy_policy_how_use_title'.tr,
                  'privacy_policy_how_use_text'.tr,
                  isMobile,
                ),

                // Information Sharing
                _buildSection(
                  'privacy_policy_sharing_title'.tr,
                  'privacy_policy_sharing_text'.tr,
                  isMobile,
                ),

                // Children's Privacy
                _buildSection(
                  'privacy_policy_children_title'.tr,
                  'privacy_policy_children_text'.tr,
                  isMobile,
                ),

                // Data Security
                _buildSection(
                  'privacy_policy_security_title'.tr,
                  'privacy_policy_security_text'.tr,
                  isMobile,
                ),

                // Your Rights
                _buildSection(
                  'privacy_policy_rights_title'.tr,
                  'privacy_policy_rights_text'.tr,
                  isMobile,
                ),

                // Data Retention
                _buildSection(
                  'privacy_policy_retention_title'.tr,
                  'privacy_policy_retention_text'.tr,
                  isMobile,
                ),

                // International Users
                _buildSection(
                  'privacy_policy_international_title'.tr,
                  'privacy_policy_international_text'.tr,
                  isMobile,
                ),

                // Changes to Privacy Policy
                _buildSection(
                  'privacy_policy_changes_title'.tr,
                  'privacy_policy_changes_text'.tr,
                  isMobile,
                ),

                // Contact Information
                _buildSection(
                  'privacy_policy_contact_title'.tr,
                  'privacy_policy_contact_text'.tr,
                  isMobile,
                ),
                Container(
                  margin: EdgeInsets.only(top: 16, bottom: 40),
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Color(0xFFF5F5F5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Color(0xFF784D9C).withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildContactRow(Icons.email, 'privacy_policy_contact_email'.tr, isMobile),
                      SizedBox(height: 12),
                      _buildContactRow(Icons.phone, 'privacy_policy_contact_phone'.tr, isMobile),
                      SizedBox(height: 12),
                      _buildContactRow(
                        Icons.location_on,
                        'privacy_policy_contact_address'.tr,
                        isMobile,
                      ),
                    ],
                  ),
                ),
                  ],
                ),
              ),
            ),
            // Add footer at the bottom (scrollable)
            AppFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content, bool isMobile) {
    return Padding(
      padding: EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.tajawal(
              fontSize: isMobile ? 20 : 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF784D9C),
            ),
          ),
          SizedBox(height: 12),
          if (content.isNotEmpty)
            Text(
              content,
              style: GoogleFonts.tajawal(
                fontSize: isMobile ? 14 : 16,
                color: Colors.grey[800],
                height: 1.6,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSubSection(String title, String content, bool isMobile) {
    return Padding(
      padding: EdgeInsets.only(left: 16, bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.tajawal(
              fontSize: isMobile ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
          ),
          SizedBox(height: 8),
          Text(
            content,
            style: GoogleFonts.tajawal(
              fontSize: isMobile ? 14 : 16,
              color: Colors.grey[700],
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text, bool isMobile) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Color(0xFF784D9C)),
        SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.tajawal(
              fontSize: isMobile ? 14 : 16,
              color: Colors.grey[800],
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }
}
