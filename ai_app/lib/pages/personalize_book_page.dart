import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/book.dart';
import 'start_personalisation_page.dart';

class PersonalizeBookPage extends StatefulWidget {
  final Book book;
  final String bookTitle;
  final String bookDescription;
  final Color accentColor;

  const PersonalizeBookPage({
    Key? key,
    required this.book,
    required this.bookTitle,
    required this.bookDescription,
    required this.accentColor,
  }) : super(key: key);

  @override
  State<PersonalizeBookPage> createState() => _PersonalizeBookPageState();
}

class _PersonalizeBookPageState extends State<PersonalizeBookPage> {
  String _selectedLanguage = 'English';
  int _currentPage = 0;

  final List<String> _languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
  ];

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _startPersonalisation() async {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StartPersonalisationPage(
          book: widget.book,
          bookTitle: widget.bookTitle,
          bookDescription: widget.bookDescription,
          accentColor: widget.accentColor,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFF5F3FF), // Light purple background like in image
      body: SafeArea(
        child: Column(
          children: [
            // Header with back button
            _buildHeader(),
            
            // Main content
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Book preview section
                    _buildBookPreviewSection(),
                    
                    // Price and info section
                    _buildInfoSection(),
                    
                    // Language dropdown
                    _buildLanguageSection(),
                    
                    SizedBox(height: 40),
                    
                    // Bottom text section
                    _buildBottomTextSection(),
                    
                    SizedBox(height: 40),
                    
                    // Hero image section (banner)
                    _buildHeroImageSection(),
                    
                    SizedBox(height: 40),
                    
                    // Purple CTA section
                    _buildPurpleCTASection(),
                    
                    SizedBox(height: 40),
                    
                    // FAQ Section
                    _buildFAQSection(),
                    
                    SizedBox(height: 40),
                    
                    // Footer sections
                    _buildFooterSection(),
                    
                    SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
            // Bottom Personalise button
            _buildBottomButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: Icon(Icons.arrow_back, color: Colors.black),
          ),
          Spacer(),
        ],
      ),
    );
  }

  Widget _buildBookPreviewSection() {
    return Container(
      height: 300,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Book image with 3D effect
          Container(
            width: 200,
            height: 280,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 20,
                  offset: Offset(8, 8),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: widget.book.displayImage.isNotEmpty
                  ? Image.network(
                      widget.book.displayImage,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                widget.accentColor.withOpacity(0.7),
                                widget.accentColor.withOpacity(0.9),
                              ],
                            ),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.menu_book, size: 60, color: Colors.white),
                                SizedBox(height: 8),
                                Text(
                                  widget.bookTitle,
                                  style: GoogleFonts.libreBaskerville(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    )
                  : Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            widget.accentColor.withOpacity(0.7),
                            widget.accentColor.withOpacity(0.9),
                          ],
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.menu_book, size: 60, color: Colors.white),
                            SizedBox(height: 8),
                            Text(
                              widget.bookTitle,
                              style: GoogleFonts.libreBaskerville(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ),
            ),
          ),
          
          // Navigation arrows
          Positioned(
            left: 20,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(Icons.arrow_back_ios, size: 16, color: Colors.grey[600]),
            ),
          ),
          
          Positioned(
            right: 20,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[600]),
            ),
          ),
          
          // Page indicators
          Positioned(
            bottom: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (index) {
                return Container(
                  margin: EdgeInsets.symmetric(horizontal: 4),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: index == _currentPage ? widget.accentColor : Colors.grey[300],
                  ),
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoSection() {
    return Container(
      margin: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Price section with ENDING SOON badge
          Container(
            padding: EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (widget.book.discountPercentage > 0) ...[
                      Text(
                        '\$${widget.book.price.toStringAsFixed(2)}',
                        style: GoogleFonts.tajawal(
                          fontSize: 16,
                          decoration: TextDecoration.lineThrough,
                          color: Colors.grey[500],
                        ),
                      ),
                      SizedBox(width: 8),
                    ],
                    Text(
                      '\$${widget.book.discountedPrice.toStringAsFixed(2)}',
                      style: GoogleFonts.tajawal(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: widget.accentColor,
                      ),
                    ),
                  ],
                ),
                
                SizedBox(height: 12),
                
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.red[400],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'ENDING SOON',
                    style: GoogleFonts.tajawal(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Info grid
          Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('IDEAL FOR', 'Girl')),
                    Expanded(child: _buildInfoItem('AGE RANGE', '${widget.book.ageMin} - ${widget.book.ageMax} years old')),
                  ],
                ),
                
                SizedBox(height: 20),
                
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('CHARACTERS', 'Girls')),
                    Expanded(child: _buildInfoItem('GENRE', 'Friendship & Kindness')),
                  ],
                ),
                
                SizedBox(height: 20),
                
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('PAGES', '46 Pages')),
                    Expanded(child: _buildInfoItem('SHIPPING', 'Standard, Express')),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(String title, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          title,
          style: GoogleFonts.tajawal(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: Colors.grey[600],
            letterSpacing: 1,
          ),
        ),
        SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.tajawal(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildLanguageSection() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20),
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedLanguage,
          isExpanded: true,
          onChanged: (String? newValue) {
            if (newValue != null) {
              setState(() {
                _selectedLanguage = newValue;
              });
            }
          },
          items: _languages.map<DropdownMenuItem<String>>((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(
                value,
                style: GoogleFonts.tajawal(
                  fontSize: 16,
                  color: Colors.black87,
                ),
              ),
            );
          }).toList(),
          icon: Icon(Icons.keyboard_arrow_down, color: Colors.grey[600]),
        ),
      ),
    );
  }

  Widget _buildBottomButton() {
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _startPersonalisation,
            style: ElevatedButton.styleFrom(
              backgroundColor: widget.accentColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
            ),
            child: Text(
              'Personalise Now',
              style: GoogleFonts.tajawal(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomTextSection() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          // Bottom text section
          Text(
            'HOW WE MAKE PERSONALIZED THEIR STORIES',
            style: GoogleFonts.tajawal(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
              letterSpacing: 1,
            ),
            textAlign: TextAlign.center,
          ),
          
          SizedBox(height: 16),
          
          Text(
            'Adored by\nmillions worldwide',
            style: GoogleFonts.libreBaskerville(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
              height: 1.3,
            ),
            textAlign: TextAlign.center,
          ),
          
          SizedBox(height: 20),
          
          // Story preview image placeholder
          Container(
            width: 120,
            height: 80,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      widget.accentColor.withOpacity(0.7),
                      widget.accentColor,
                    ],
                  ),
                ),
                child: Center(
                  child: Icon(
                    Icons.auto_stories,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroImageSection() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20),
      width: double.infinity,
      height: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.orange[300]!,
                Colors.pink[200]!,
                Colors.purple[200]!,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.image,
                  size: 48,
                  color: Colors.white.withOpacity(0.8),
                ),
                SizedBox(height: 8),
                Text(
                  'Hero Image Placeholder',
                  style: GoogleFonts.tajawal(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  'Child reading book image will go here',
                  style: GoogleFonts.tajawal(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPurpleCTASection() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20),
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFF8B5CF6),
            Color(0xFFA855F7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Stack(
        children: [
          // Decorative wave pattern at the top
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.elliptical(200, 40),
                  bottomRight: Radius.elliptical(200, 40),
                ),
              ),
            ),
          ),
          
          Padding(
            padding: EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                SizedBox(height: 20),
                
                Text(
                  'Bring your child\'s\nimagination to life!',
                  style: GoogleFonts.libreBaskerville(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    height: 1.2,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                SizedBox(height: 16),
                
                Text(
                  'Make them the hero of their own magical adventure with a hyper-personalised storybook!',
                  style: GoogleFonts.tajawal(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 16,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                
                SizedBox(height: 32),
                
                ElevatedButton(
                  onPressed: () {
                    // Handle view all books
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Color(0xFF8B5CF6),
                    padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'View All Books',
                    style: GoogleFonts.tajawal(
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFAQSection() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 20),
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // FAQ Title
          Text(
            'FAQ',
            style: GoogleFonts.libreBaskerville(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          
          SizedBox(height: 20),
          
          // FAQ Items
          _buildFAQItem(
            'Do you ship to my location?',
            'Yes! We offer worldwide shipping, so no matter where you are, we\'ll make sure your order gets to you. Just enter your shipping details at checkout, and we\'ll handle the rest.',
            isExpanded: true,
          ),
          
          _buildFAQItem(
            'How long does shipping take?',
            '',
          ),
          
          _buildFAQItem(
            'How do I place an order?',
            '',
          ),
          
          _buildFAQItem(
            'What if I\'m not happy with my order?',
            '',
          ),
          
          _buildFAQItem(
            'Can I get a refund for my order?',
            '',
          ),
          
          _buildFAQItem(
            'How can I reach customer support?',
            '',
          ),
          
          _buildFAQItem(
            'What languages are your books available in?',
            '',
          ),
          
          SizedBox(height: 16),
          
          // See All button
          Center(
            child: TextButton(
              onPressed: () {
                // Handle see all FAQ
              },
              child: Text(
                'See All',
                style: GoogleFonts.tajawal(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: widget.accentColor,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFAQItem(String question, String answer, {bool isExpanded = false}) {
    return Container(
      margin: EdgeInsets.only(bottom: 1),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!, width: 1),
        ),
      ),
      child: ExpansionTile(
        title: Text(
          question,
          style: GoogleFonts.tajawal(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        trailing: Icon(
          isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
          color: Colors.grey[600],
          size: 20,
        ),
        initiallyExpanded: isExpanded,
        tilePadding: EdgeInsets.symmetric(horizontal: 0, vertical: 8),
        childrenPadding: EdgeInsets.only(bottom: 16),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: answer.isNotEmpty ? [
          Text(
            answer,
            style: GoogleFonts.tajawal(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ] : [],
        onExpansionChanged: (expanded) {
          // Handle expansion state if needed
        },
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo placeholder
              Container(
                width: 120,
                height: 40,
                decoration: BoxDecoration(
                  color: Color(0xFF8B5CF6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    'WonderWraps',
                    style: GoogleFonts.tajawal(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
          
          SizedBox(height: 16),
          
          Text(
            'Create hyper-personalised storybooks that make your child the hero, with quick customisation and speedy delivery!',
            style: GoogleFonts.tajawal(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
          
          SizedBox(height: 24),
          
          // Social media icons
          Row(
            children: [
              _buildSocialIcon(Icons.facebook, () {}),
              SizedBox(width: 16),
              _buildSocialIcon(Icons.camera_alt, () {}), // Instagram
              SizedBox(width: 16),
              _buildSocialIcon(Icons.music_note, () {}), // TikTok
            ],
          ),
          
          SizedBox(height: 32),
          
          // Footer links sections
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildFooterLinkSection('About WonderWraps', [
                'Contact us',
                'FAQs',
                'Books',
                'Blog',
                'Login',
                'Sign up',
              ]),
              
              SizedBox(height: 24),
              
              _buildFooterLinkSection('Customer Area', [
                'My Account',
                'Orders',
                'Terms',
                'Privacy Policy',
              ]),
              
              SizedBox(height: 32),
              
              // Newsletter subscription
              _buildNewsletterSection(),
              
              SizedBox(height: 32),
              
              // Payment methods
              _buildPaymentMethodsSection(),
              
              SizedBox(height: 24),
              
              // Copyright
              Text(
                'WonderWraps — © 2025 All rights reserved.',
                style: GoogleFonts.tajawal(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              
              SizedBox(height: 8),
              
              Row(
                children: [
                  Text(
                    'Developed by',
                    style: GoogleFonts.tajawal(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  SizedBox(width: 8),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Nivedita',
                      style: GoogleFonts.tajawal(
                        fontSize: 10,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSocialIcon(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Color(0xFF8B5CF6),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: Colors.white,
          size: 20,
        ),
      ),
    );
  }

  Widget _buildFooterLinkSection(String title, List<String> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.tajawal(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        SizedBox(height: 12),
        ...items.map((item) => Padding(
          padding: EdgeInsets.only(bottom: 8),
          child: GestureDetector(
            onTap: () {
              // Handle navigation
            },
            child: Text(
              item,
              style: GoogleFonts.tajawal(
                fontSize: 14,
                color: Colors.grey[700],
              ),
            ),
          ),
        )).toList(),
      ],
    );
  }

  Widget _buildNewsletterSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Subscribe to Our Newsletter',
          style: GoogleFonts.tajawal(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'Don\'t miss out on the newest books.',
          style: GoogleFonts.tajawal(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Enter your email address',
                  hintStyle: GoogleFonts.tajawal(
                    color: Colors.grey[500],
                    fontSize: 14,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: Colors.grey[300]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide(color: widget.accentColor),
                  ),
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  filled: true,
                  fillColor: Colors.white,
                ),
                style: GoogleFonts.tajawal(fontSize: 14),
              ),
            ),
            SizedBox(width: 12),
            ElevatedButton(
              onPressed: () {
                // Handle subscription
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF784D9C),
                padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 0,
              ),
              child: Text(
                'Subscribe',
                style: GoogleFonts.tajawal(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildPaymentMethodsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Payment Methods',
          style: GoogleFonts.tajawal(
            fontSize: 14,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
        SizedBox(height: 12),
        Row(
          children: [
            _buildPaymentMethodIcon('Phonepe', const Color.fromARGB(255, 37, 99, 235)!),
            SizedBox(width: 8),
            _buildPaymentMethodIcon('GPay', const Color.fromARGB(255, 231, 102, 85)!),
            SizedBox(width: 8),
            _buildPaymentMethodIcon('PayPal', const Color.fromARGB(255, 6, 40, 232)!),
            SizedBox(width: 8),
            _buildPaymentMethodIcon('Paytm', const Color.fromARGB(255, 79, 128, 233)!),
          ],
        ),
      ],
    );
  }

  Widget _buildPaymentMethodIcon(String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: GoogleFonts.tajawal(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
