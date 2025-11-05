import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'pages/books_page.dart';
import 'services/localization_service.dart';

class SupportPage extends StatefulWidget {
  const SupportPage({Key? key}) : super(key: key);

  @override
  State<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends State<SupportPage> {
  final _emailController = TextEditingController();
  final _messageController = TextEditingController();
  String? _selectedCategory;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submitSupportTicket() async {
    // Debug print to check values
    // print('Email: ${_emailController.text}');
    // print('Category: $_selectedCategory');
    // print('Message: ${_messageController.text}');

    if (_emailController.text.trim().isEmpty ||
        _selectedCategory == null ||
        _messageController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('support_page_fill_all_fields'.tr),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      // Insert data directly into the support_tickets table
      await Supabase.instance.client
          .from('support_tickets')
          .insert({
            'email': _emailController.text.trim(),
            'category': _selectedCategory,
            'message': _messageController.text.trim(),
          });

      // Clear the form
      _emailController.clear();
      _messageController.clear();
      setState(() {
        _selectedCategory = null;
      });

      // Show success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('support_page_success'.tr),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      // Show error message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'support_page_error'.tr}${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 650;
    final double maxWidth = isMobile ? double.infinity : 1000;
    final double cardWidth = isMobile ? screenWidth * 0.92 : 460;
    final double sectionWidth = isMobile ? screenWidth * 0.92 : 420;
    final double horizontalPad = isMobile ? 12 : 32;
    final double verticalPad = isMobile ? 18 : 40;
    final double fontSizeTitle = isMobile ? 19 : 24;
    final double fontSizeBody = isMobile ? 13 : 15;
    final double inputPad = isMobile ? 10 : 16;
    
    return Scaffold(
      backgroundColor: const Color(0xFFF9F7FC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        title: Text(
          'support_page_title'.tr,
          style: GoogleFonts.tajawal(
            color: Colors.black87,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Column(
              children: [
                SizedBox(height: isMobile ? 10 : 20),
                // Logo and form card
                  Column(
                  children: [
                    // Logo (blank space)
                    Container(
                    width: screenWidth < 500 ? 80 : 120,
                    height: screenWidth < 500 ? 32 : 48,
                    margin: EdgeInsets.only(bottom: screenWidth < 500 ? 10 : 16),
                    decoration: BoxDecoration(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  // Form card with W image inside
                  Container(
                    width: cardWidth,
                    padding: EdgeInsets.symmetric(horizontal: horizontalPad, vertical: verticalPad),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('support_page_how_can_help'.tr, style: TextStyle(fontSize: fontSizeTitle, fontWeight: FontWeight.bold)),
                        SizedBox(height: 8),
                        Text('support_page_subtitle'.tr, style: TextStyle(color: Colors.black54, fontSize: fontSizeBody)),
                        SizedBox(height: 16),
                        TextField(
                          controller: _emailController,
                          decoration: InputDecoration(
                            hintText: 'support_page_email_hint'.tr,
                            filled: true,
                            fillColor: Color(0xFFF9F7FC),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                            contentPadding: EdgeInsets.symmetric(horizontal: inputPad, vertical: inputPad),
                          ),
                          keyboardType: TextInputType.emailAddress,
                        ),
                        SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: _selectedCategory,
                          items: [
                            DropdownMenuItem(value: 'General', child: Text('support_page_category_general'.tr)),
                            DropdownMenuItem(value: 'Order', child: Text('support_page_category_order'.tr)),
                            DropdownMenuItem(value: 'Payment', child: Text('support_page_category_payment'.tr)),
                            DropdownMenuItem(value: 'Other', child: Text('support_page_category_other'.tr)),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedCategory = value;
                            });
                          },
                          decoration: InputDecoration(
                            hintText: 'support_page_category_hint'.tr,
                            filled: true,
                            fillColor: Color(0xFFF9F7FC),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                            contentPadding: EdgeInsets.symmetric(horizontal: inputPad, vertical: inputPad),
                          ),
                        ),
                        SizedBox(height: 12),
                        TextField(
                          controller: _messageController,
                          maxLines: 4,
                          decoration: InputDecoration(
                            hintText: 'support_page_message_hint'.tr,
                            filled: true,
                            fillColor: Color(0xFFF9F7FC),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                            contentPadding: EdgeInsets.symmetric(horizontal: inputPad, vertical: inputPad),
                          ),
                        ),
                        SizedBox(height: 16),
                        Align(
                          alignment: Alignment.center,
                          child: SizedBox(
                            width: screenWidth < 500 ? cardWidth * 0.5 : 120,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Color(0xFF784D9C),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                padding: EdgeInsets.symmetric(vertical: screenWidth < 500 ? 10 : 12),
                              ),
                              onPressed: _isSubmitting ? null : _submitSupportTicket,
                              child: _isSubmitting
                                  ? SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : Text('support_page_submit'.tr, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                        SizedBox(height: 20),
                        // W image inside the form card
                        // Center(
                        //   child: Container(
                        //     width: screenWidth < 500 ? cardWidth * 0.9 : 320,
                        //     height: screenWidth < 500 ? 160 : 200,
                        //     child: Image.asset(
                        //       'assets/pw copy.png',
                        //       fit: BoxFit.contain,
                        //     ),
                        //   ),
                        // ),
                      ],
                    ),
                  ),
                  ],
                ),
              SizedBox(height: isMobile ? 16 : 24),
            // Banner section with boy image
            Container(
              width: double.infinity,
              color: const Color(0xFFF9F7FC),
              child: Column(
                children: [
                  // Boy image
                  // Center(
                  //   child: Container(
                  //     width: sectionWidth,
                  //     height: screenWidth < 500 ? 200 : 280,
                  //     margin: EdgeInsets.symmetric(vertical: screenWidth < 500 ? 8 : 16),
                  //     decoration: BoxDecoration(
                  //       borderRadius: BorderRadius.circular(16),
                  //     ),
                  //     child: ClipRRect(
                  //       borderRadius: BorderRadius.circular(16),
                  //       child: Image.asset(
                  //         'assets/banner copy.png',
                  //         fit: BoxFit.cover,
                  //         width: double.infinity,
                  //       ),
                  //     ),
                  //   ),
                  // ),
                ],
              ),
            ),
            // Banner section with boy image and purple section
            Container(
              width: double.infinity,
              child: Column(
                children: [
                  // Boy image with full width
                  // Container(
                  //   width: double.infinity,
                  //   height: screenWidth < 500 ? 250 : 350,
                  //   decoration: BoxDecoration(
                  //     image: DecorationImage(
                  //       image: AssetImage('assets/banner copy.png'),
                  //       fit: BoxFit.cover,
                  //     ),
                  //   ),
                  // ),
                  // Purple section directly attached
                  Container(
                    width: double.infinity,
                    // color: Color(0xFFB47AFF),
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(24, 30, 24, 32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Text(
                          //   "Bring your child's imagination to life!",
                          //   style: TextStyle(
                          //     fontSize: screenWidth < 500 ? 18 : 22, 
                          //     color: Colors.white, 
                          //     fontWeight: FontWeight.bold,
                          //     height: 1.2,
                          //   ),
                          // ),
                          SizedBox(height: 12),
                          // Text(
                          //   'Make them the hero of their own\nmagical adventure with a hyper-personalised storybook!',
                          //   style: TextStyle(
                          //     color: Colors.white, 
                          //     fontSize: screenWidth < 500 ? 14 : 16,
                          //     height: 1.4,
                          //   ),
                          // ),
                          // SizedBox(height: 20),
                          SizedBox(
                            width: screenWidth < 500 ? 160 : 180,
                            // child: ElevatedButton(
                            //   style: ElevatedButton.styleFrom(
                            //     backgroundColor: Colors.white,
                            //     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                            //     padding: EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                            //   ),
                            //   onPressed: () {
                            //     // Navigate to books page
                            //     Navigator.push(
                            //       context,
                            //       MaterialPageRoute(builder: (context) => const BooksPage()),
                            //     );
                            //   },
                            //   // child: Text(
                            //   //   'View All Books', 
                            //   //   style: TextStyle(
                            //   //     color: Color(0xFFB47AFF), 
                            //   //     fontWeight: FontWeight.bold,
                            //   //     fontSize: 14,
                            //   //   )
                            //   // ),
                            // ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Footer Section
            _buildFooterSection(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFooterSection() {
    return Container(
      width: double.infinity,
      color: Colors.grey[50],
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Logo and description
          // Row(
          //   crossAxisAlignment: CrossAxisAlignment.start,
          //   children: [
          //     // Logo placeholder
          //     Container(
          //       width: 120,
          //       height: 40,
          //       decoration: BoxDecoration(
          //         color: Color(0xFF8B5CF6),
          //         borderRadius: BorderRadius.circular(8),
          //       ),
          //       child: Center(
          //         child: Text(
          //           'WonderWraps',
          //           style: GoogleFonts.tajawal(
          //             color: Colors.white,
          //             fontSize: 16,
          //             fontWeight: FontWeight.bold,
          //           ),
          //         ),
          //       ),
          //     ),
          //   ],
          // ),
          
          // SizedBox(height: 16),
          
          // Text(
          //   'Create hyper-personalised storybooks that make your child the hero, with quick customisation and speedy delivery!',
          //   style: GoogleFonts.tajawal(
          //     fontSize: 14,
          //     color: Colors.grey[700],
          //     height: 1.5,
          //   ),
          // ),
          
          SizedBox(height: 24),
          
          // Social media icons
          // Row(
          //   children: [
          //     _buildSocialIcon(Icons.facebook, () {}),
          //     SizedBox(width: 16),
          //     _buildSocialIcon(Icons.camera_alt, () {}), // Instagram
          //     SizedBox(width: 16),
          //     _buildSocialIcon(Icons.music_note, () {}), // TikTok
          //   ],
          // ),
          
          SizedBox(height: 32),
          
          // Footer links sections
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            // children: [
            //   _buildFooterLinkSection('About ', [
            //     'Contact us',
            //     'FAQs',
            //     'Books',
            //     'Blog',
            //     'Login',
            //     'Sign up',
            //   ]),
              
            //   SizedBox(height: 24),
              
            //   _buildFooterLinkSection('Customer Area', [
            //     'My Account',
            //     'Orders',
            //     'Terms',
            //     'Privacy Policy',
            //   ]),
              
            //   SizedBox(height: 32),
              
            //   // Newsletter subscription
            //   _buildNewsletterSection(),
              
            //   SizedBox(height: 32),
              
            //   // Payment methods
            //   _buildPaymentMethodsSection(),
              
            //   SizedBox(height: 24),
              
            //   // Copyright
            //   Text(
            //     '— © 2025 All rights reserved.',
            //     style: GoogleFonts.tajawal(
            //       fontSize: 12,
            //       color: Colors.grey[600],
            //     ),
            //   ),
              
            //   SizedBox(height: 8),
              
            //   Row(
            //     children: [
            //       Text(
            //         'Developed by',
            //         style: GoogleFonts.tajawal(
            //           fontSize: 12,
            //           color: Colors.grey[600],
            //         ),
            //       ),
            //       SizedBox(width: 8),
            //       Container(
            //         padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            //         decoration: BoxDecoration(
            //           color: Colors.black,
            //           borderRadius: BorderRadius.circular(4),
            //         ),
            //         child: Text(
            //           'Nivedita',
            //           style: GoogleFonts.tajawal(
            //             fontSize: 10,
            //             color: Colors.white,
            //             fontWeight: FontWeight.bold,
            //           ),
            //         ),
            //       ),
            //     ],
            //   ),
            // ],
          ),
        ],
      ),
    );
  }

  // Widget _buildSocialIcon(IconData icon, VoidCallback onTap) {
  //   return GestureDetector(
  //     onTap: onTap,
  //     child: Container(
  //       width: 40,
  //       height: 40,
  //       decoration: BoxDecoration(
  //         color: Color(0xFF8B5CF6),
  //         shape: BoxShape.circle,
  //       ),
  //       child: Icon(
  //         icon,
  //         color: Colors.white,
  //         size: 20,
  //       ),
  //     ),
  //   );
  // }

// 


}