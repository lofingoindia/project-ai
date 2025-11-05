# Country Flag Assets

This directory contains SVG flag images for all countries supported in the WonderWraps app.

## Files
- All flags are in SVG format for crisp display at any size
- Named using ISO 3166-1 alpha-2 country codes (e.g., `us.svg` for United States)
- `xx.svg` serves as a generic/fallback flag for "Other" countries

## Usage
These flags are used in:
- Country selection dropdown in preferences
- App bar currency/country display
- Any other location where country identification is needed

## Supported Countries
The flags cover all countries listed in the `_countryFlags` mapping in `home_page.dart`, including:
- Major countries (US, UK, Germany, France, Japan, etc.)
- Regional options (India, China, Brazil, etc.)
- Additional countries and territories
- Generic fallback option

## Source
Flags were downloaded from flagcdn.com using their public SVG API.

## Maintenance
To add new flags:
1. Download the SVG from `https://flagcdn.com/{country_code}.svg`
2. Save as `{country_code}.svg` in this directory
3. Update the `_countryFlags` mapping in `home_page.dart`
4. Run `flutter pub get` to refresh assets
