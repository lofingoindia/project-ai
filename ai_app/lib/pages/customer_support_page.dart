import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../widgets/app_footer.dart';
import '../services/localization_service.dart';

class CustomerSupportPage extends StatefulWidget {
  const CustomerSupportPage({Key? key}) : super(key: key);

  @override
  State<CustomerSupportPage> createState() => _CustomerSupportPageState();
}

class _CustomerSupportPageState extends State<CustomerSupportPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  String _selectedCategory = '';
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _selectedCategory = 'customer_support_general_inquiry'.tr;
  }

  bool _isMobile(BuildContext context) => MediaQuery.of(context).size.width < 650;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submitForm() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isSubmitting = true;
      });

      // Simulate form submission
      await Future.delayed(Duration(seconds: 2));

      setState(() {
        _isSubmitting = false;
      });

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'customer_support_success_message'.tr,
              style: GoogleFonts.tajawal(),
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );

        // Clear form
        _nameController.clear();
        _emailController.clear();
        _subjectController.clear();
        _messageController.clear();
        setState(() {
          _selectedCategory = 'customer_support_general_inquiry'.tr;
        });
      }
    }
  }

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
          'customer_support_title'.tr,
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
                constraints: BoxConstraints(maxWidth: isMobile ? double.infinity : 1000),
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
                          Icons.support_agent,
                          size: 48,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(height: 20),
                      Text(
                        'customer_support_we_are_here'.tr,
                        style: GoogleFonts.tajawal(
                          fontSize: isMobile ? 28 : 36,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF784D9C),
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 8),
                      Text(
                        'customer_support_subtitle'.tr,
                        style: GoogleFonts.tajawal(
                          fontSize: isMobile ? 14 : 16,
                          color: Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 40),

                // Contact Options
                if (!isMobile)
                  Row(
                    children: [
                      Expanded(child: _buildContactCard(
                        icon: FontAwesomeIcons.envelope,
                        title: 'customer_support_email_us'.tr,
                        content: 'customer_support_email'.tr,
                        subtitle: 'customer_support_email_subtitle'.tr,
                        isMobile: false,
                      )),
                      SizedBox(width: 20),
                      Expanded(child: _buildContactCard(
                        icon: FontAwesomeIcons.phone,
                        title: 'customer_support_call_us'.tr,
                        content: 'customer_support_phone'.tr,
                        subtitle: 'customer_support_call_subtitle'.tr,
                        isMobile: false,
                      )),
                      SizedBox(width: 20),
                      Expanded(child: _buildContactCard(
                        icon: FontAwesomeIcons.clock,
                        title: 'customer_support_hours'.tr,
                        content: 'customer_support_hours_time'.tr,
                        subtitle: 'customer_support_hours_days'.tr,
                        isMobile: false,
                      )),
                    ],
                  ),
                if (isMobile) ...[
                  _buildContactCard(
                    icon: FontAwesomeIcons.envelope,
                    title: 'customer_support_email_us'.tr,
                    content: 'customer_support_email'.tr,
                    subtitle: 'customer_support_email_subtitle'.tr,
                    isMobile: true,
                  ),
                  SizedBox(height: 16),
                  _buildContactCard(
                    icon: FontAwesomeIcons.phone,
                    title: 'customer_support_call_us'.tr,
                    content: 'customer_support_phone'.tr,
                    subtitle: 'customer_support_call_subtitle'.tr,
                    isMobile: true,
                  ),
                  SizedBox(height: 16),
                  _buildContactCard(
                    icon: FontAwesomeIcons.clock,
                    title: 'customer_support_hours'.tr,
                    content: 'customer_support_hours_time'.tr,
                    subtitle: 'customer_support_hours_days'.tr,
                    isMobile: true,
                  ),
                ],
                SizedBox(height: 40),

                // Contact Form
                Container(
                  padding: EdgeInsets.all(isMobile ? 20 : 32),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Color(0xFF784D9C).withOpacity(0.2)),
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'customer_support_send_message'.tr,
                          style: GoogleFonts.tajawal(
                            fontSize: isMobile ? 22 : 26,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF784D9C),
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'customer_support_form_subtitle'.tr,
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                        SizedBox(height: 24),

                        // Name Field
                        _buildTextField(
                          controller: _nameController,
                          label: 'customer_support_name'.tr,
                          icon: Icons.person_outline,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'customer_support_name_required'.tr;
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 16),

                        // Email Field
                        _buildTextField(
                          controller: _emailController,
                          label: 'customer_support_email_label'.tr,
                          icon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'customer_support_email_required'.tr;
                            }
                            if (!value.contains('@')) {
                              return 'customer_support_email_invalid'.tr;
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 16),

                        // Category Dropdown
                        Text(
                          'customer_support_category'.tr,
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[700],
                          ),
                        ),
                        SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: _selectedCategory,
                          decoration: InputDecoration(
                            prefixIcon: Icon(Icons.category_outlined, color: Color(0xFF784D9C)),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Color(0xFF784D9C), width: 2),
                            ),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                          items: [
                            'customer_support_general_inquiry',
                            'customer_support_order_status',
                            'customer_support_technical_issue',
                            'customer_support_book_personalization',
                            'customer_support_payment_billing',
                            'customer_support_shipping_delivery',
                            'customer_support_returns_refunds',
                            'customer_support_other',
                          ].map((category) {
                            return DropdownMenuItem(
                              value: category.tr,
                              child: Text(
                                category.tr,
                                style: GoogleFonts.tajawal(),
                              ),
                            );
                          }).toList(),
                          onChanged: (value) {
                            setState(() {
                              _selectedCategory = value!;
                            });
                          },
                        ),
                        SizedBox(height: 16),

                        // Subject Field
                        _buildTextField(
                          controller: _subjectController,
                          label: 'customer_support_subject'.tr,
                          icon: Icons.subject,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'customer_support_subject_required'.tr;
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 16),

                        // Message Field
                        Text(
                          'customer_support_message'.tr,
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[700],
                          ),
                        ),
                        SizedBox(height: 8),
                        TextFormField(
                          controller: _messageController,
                          maxLines: 6,
                          decoration: InputDecoration(
                            hintText: 'customer_support_message_hint'.tr,
                            hintStyle: GoogleFonts.tajawal(color: Colors.grey[400]),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: Color(0xFF784D9C), width: 2),
                            ),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                          style: GoogleFonts.tajawal(),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'customer_support_message_required'.tr;
                            }
                            if (value.length < 10) {
                              return 'customer_support_message_min_length'.tr;
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 24),

                        // Submit Button
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _submitForm,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF784D9C),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: _isSubmitting
                                ? Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      ),
                                      SizedBox(width: 12),
                                      Text(
                                        'customer_support_sending'.tr,
                                        style: GoogleFonts.tajawal(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  )
                                : Text(
                                    'customer_support_send'.tr,
                                    style: GoogleFonts.tajawal(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 40),

                // FAQ Section
                Text(
                  'customer_support_faq'.tr,
                  style: GoogleFonts.tajawal(
                    fontSize: isMobile ? 22 : 26,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF784D9C),
                  ),
                ),
                SizedBox(height: 20),
                _buildFAQItem(
                  'customer_support_faq_how_long'.tr,
                  'customer_support_faq_how_long_answer'.tr,
                  isMobile,
                ),
                _buildFAQItem(
                  'customer_support_faq_edit'.tr,
                  'customer_support_faq_edit_answer'.tr,
                  isMobile,
                ),
                _buildFAQItem(
                  'customer_support_faq_age_groups'.tr,
                  'customer_support_faq_age_groups_answer'.tr,
                  isMobile,
                ),
                _buildFAQItem(
                  'customer_support_faq_track_order'.tr,
                  'customer_support_faq_track_order_answer'.tr,
                  isMobile,
                ),
                _buildFAQItem(
                  'customer_support_faq_refund'.tr,
                  'customer_support_faq_refund_answer'.tr,
                  isMobile,
                ),
                SizedBox(height: 20),
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

  Widget _buildContactCard({
    required IconData icon,
    required String title,
    required String content,
    required String subtitle,
    required bool isMobile,
  }) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFF784D9C).withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Color(0xFF784D9C).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: FaIcon(icon, color: Color(0xFF784D9C), size: 24),
          ),
          SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.tajawal(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[800],
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 8),
          Text(
            content,
            style: GoogleFonts.tajawal(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Color(0xFF784D9C),
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.tajawal(
              fontSize: 12,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    required String? Function(String?) validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.tajawal(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
        SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: Color(0xFF784D9C)),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Color(0xFF784D9C), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.red),
            ),
            filled: true,
            fillColor: Colors.white,
          ),
          style: GoogleFonts.tajawal(),
          validator: validator,
        ),
      ],
    );
  }

  Widget _buildFAQItem(String question, String answer, bool isMobile) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: ExpansionTile(
        title: Text(
          question,
          style: GoogleFonts.tajawal(
            fontSize: isMobile ? 14 : 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey[800],
          ),
        ),
        iconColor: Color(0xFF784D9C),
        collapsedIconColor: Colors.grey[600],
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(
              answer,
              style: GoogleFonts.tajawal(
                fontSize: isMobile ? 13 : 15,
                color: Colors.grey[700],
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
