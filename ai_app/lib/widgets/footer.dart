import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../pages/books_page.dart';
import '../my_account_page.dart';
import '../my_orders_page.dart';
import '../support.dart';

class Footer extends StatelessWidget {
  final GlobalKey? faqSectionKey;
  
  const Footer({Key? key, this.faqSectionKey}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Colors.white,
      child: Column(
        children: [
          // Newsletter Section
          Container(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(
              children: [
                Text(
                  'Subscribe to Our Newsletter',
                  style: GoogleFonts.tajawal(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  constraints: const BoxConstraints(maxWidth: 400),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Enter your email',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey.shade300),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF784D9C),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Subscribe'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(),
          // Footer Links
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Wrap(
              spacing: 48,
              runSpacing: 24,
              alignment: WrapAlignment.center,
              children: [
                _buildFooterSection(
                  context,
                  'About',
                  ['About Us', 'Contact Us', 'Blog'],
                  ['about', 'contact', 'blog'],
                ),
                _buildFooterSection(
                  context,
                  'Customer Area',
                  ['My Account', 'Orders', 'Books'],
                  ['account', 'orders', 'books'],
                ),
                _buildFooterSection(
                  context,
                  'Help',
                  ['FAQs', 'Shipping Policy', 'Return Policy'],
                  ['faq', 'shipping', 'return'],
                ),
              ],
            ),
          ),
          const Divider(),
          // Social Media and Payment Methods
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Column(
              children: [
                // Social Media Icons
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildSocialIcon(FontAwesomeIcons.facebook),
                    _buildSocialIcon(FontAwesomeIcons.instagram),
                    _buildSocialIcon(FontAwesomeIcons.pinterest),
                  ],
                ),
                const SizedBox(height: 24),
                // Payment Methods
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _buildPaymentIcon('VISA'),
                    _buildPaymentIcon('MC'),
                    _buildPaymentIcon('PayPal'),
                    _buildPaymentIcon('AMEX'),
                  ],
                ),
                const SizedBox(height: 24),
                // Copyright
                Text(
                  '© ${DateTime.now().year} All rights reserved.',
                  style: GoogleFonts.tajawal(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterSection(BuildContext context, String title, List<String> items, List<String> actions) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.tajawal(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 16),
        ...items.asMap().entries.map((entry) {
          int index = entry.key;
          String item = entry.value;
          String action = actions[index];
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: TextButton(
              onPressed: () => _handleNavigation(context, action),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(0, 0),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                item,
                style: GoogleFonts.tajawal(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  void _handleNavigation(BuildContext context, String action) {
    switch (action) {
      case 'faq':
        // Scroll to FAQ section if we have the key, otherwise navigate to home
        if (faqSectionKey != null && faqSectionKey!.currentContext != null) {
          Scrollable.ensureVisible(
            faqSectionKey!.currentContext!,
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeInOut,
          );
        }
        break;
      case 'books':
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const BooksPage()),
        );
        break;
      case 'account':
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => MyAccountPage()),
        );
        break;
      case 'orders':
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => MyOrdersPage()),
        );
        break;
      case 'contact':
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => SupportPage()),
        );
        break;
      // case 'about':
      // case 'blog':
      // case 'shipping':
      // case 'return':
      //   // For now, show a dialog or snackbar indicating coming soon
      //   ScaffoldMessenger.of(context).showSnackBar(
      //     SnackBar(
      //       content: Text('${action.toUpperCase()} page coming soon!'),
      //       backgroundColor: const Color(0xFF9C4DFF),
      //     ),
      // //   ); nn nb  bnnbn
      default:
        break;
    }
  }

  Widget _buildSocialIcon(IconData icon) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      child: IconButton(
        icon: FaIcon(icon),
        onPressed: () {},
        color: const Color(0xFF9C4DFF),
      ),
    );
  }

  Widget _buildPaymentIcon(String name) {
    Color textColor;
    switch (name) {
      case 'VISA':
        textColor = Colors.blue[700]!;
        break;
      case 'MC':
        textColor = Colors.red[700]!;
        break;
      case 'PayPal':
        textColor = Colors.blue[600]!;
        break;
      case 'AMEX':
        textColor = Colors.blue[900]!;
        break;
      default:
        textColor = Colors.grey[700]!;
    }
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Text(
        name,
        style: GoogleFonts.tajawal(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: textColor,
        ),
      ),
    );
  }
}
