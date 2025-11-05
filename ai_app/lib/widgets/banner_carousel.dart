// import 'package:flutter/material.dart';
// import 'package:google_fonts/google_fonts.dart';

// class BannerCarousel extends StatelessWidget {
//   const BannerCarousel({Key? key}) : super(key: key);

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       height: 120,
//       child: ListView(
//         scrollDirection: Axis.horizontal,
//         children: [
//           _buildBannerCard(
//             context,
//             'Free Shipping',
//             'On orders over \$50',
//             Icons.local_shipping_outlined,
//             Colors.blue,
//           ),
//           _buildBannerCard(
//             context,
//             'Secure Payment',
//             '100% secure payment',
//             Icons.security_outlined,
//             Colors.green,
//           ),
//           _buildBannerCard(
//             context,
//             '24/7 Support',
//             'Contact us anytime',
//             Icons.support_agent_outlined,
//             Colors.purple,
//           ),
//           _buildBannerCard(
//             context,
//             'Money Back',
//             '30 days guarantee',
//             Icons.money_outlined,
//             Colors.orange,
//           ),
//         ],
//       ),
//     );
//   }

//   Widget _buildBannerCard(
//     BuildContext context,
//     String title,
//     String subtitle,
//     IconData icon,
//     Color color,
//   ) {
//     return Container(
//       width: 200,
//       margin: const EdgeInsets.only(right: 16),
//       padding: const EdgeInsets.all(16),
//       decoration: BoxDecoration(
//         color: color.withOpacity(0.1),
//         borderRadius: BorderRadius.circular(12),
//         border: Border.all(
//           color: color.withOpacity(0.2),
//           width: 1,
//         ),
//       ),
//       child: Row(
//         children: [
//           Icon(
//             icon,
//             color: color,
//             size: 32,
//           ),
//           const SizedBox(width: 12),
//           Expanded(
//             child: Column(
//               crossAxisAlignment: CrossAxisAlignment.start,
//               mainAxisAlignment: MainAxisAlignment.center,
//               children: [
//                 Text(
//                   title,
//                   style: GoogleFonts.tajawal(
//                     fontSize: 14,
//                     fontWeight: FontWeight.w600,
//                     color: color,
//                   ),
//                 ),
//                 const SizedBox(height: 4),
//                 Text(
//                   subtitle,
//                   style: GoogleFonts.tajawal(
//                     fontSize: 12,
//                     color: Colors.black54,
//                   ),
//                 ),
//               ],
//             ),
//           ),
//         ],
//       ),
//     );
//   }
// }
