import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/localization_service.dart';

class LanguageSelector extends StatefulWidget {
  final Function(String)? onLanguageChanged;
  
  const LanguageSelector({
    Key? key,
    this.onLanguageChanged,
  }) : super(key: key);

  @override
  State<LanguageSelector> createState() => _LanguageSelectorState();
}

class _LanguageSelectorState extends State<LanguageSelector> {
  final LocalizationService _localizationService = LocalizationService();

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _localizationService.currentLanguage.toUpperCase(),
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF784D9C),
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.language,
              size: 18,
              color: Color(0xFF784D9C),
            ),
          ],
        ),
      ),
      onSelected: (String languageCode) async {
        await _localizationService.changeLanguage(languageCode);
        if (widget.onLanguageChanged != null) {
          widget.onLanguageChanged!(languageCode);
        }
        // Refresh the entire app
        if (mounted) {
          setState(() {});
          // You might want to notify parent widget to rebuild
        }
      },
      itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
        PopupMenuItem<String>(
          value: 'en',
          child: Row(
            children: [
              const Text('🇬🇧', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Text(
                'English',
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: _localizationService.currentLanguage == 'en' 
                      ? FontWeight.w600 
                      : FontWeight.w400,
                ),
              ),
              if (_localizationService.currentLanguage == 'en')
                const Padding(
                  padding: EdgeInsets.only(left: 8),
                  child: Icon(Icons.check, color: Color(0xFF784D9C), size: 18),
                ),
            ],
          ),
        ),
        PopupMenuItem<String>(
          value: 'ar',
          child: Row(
            children: [
              const Text('🇸🇦', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Text(
                'العربية',
                style: GoogleFonts.tajawal(
                  fontSize: 14,
                  fontWeight: _localizationService.currentLanguage == 'ar' 
                      ? FontWeight.w600 
                      : FontWeight.w400,
                ),
              ),
              if (_localizationService.currentLanguage == 'ar')
                const Padding(
                  padding: EdgeInsets.only(left: 8),
                  child: Icon(Icons.check, color: Color(0xFF784D9C), size: 18),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
