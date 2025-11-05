import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../models/book.dart';

class ProductMediaViewer extends StatefulWidget {
  final Book book;
  final double height;
  final bool showControls;

  const ProductMediaViewer({
    Key? key,
    required this.book,
    this.height = 200,
    this.showControls = true,
  }) : super(key: key);

  @override
  _ProductMediaViewerState createState() => _ProductMediaViewerState();
}

class _ProductMediaViewerState extends State<ProductMediaViewer> {
  late PageController _pageController;
  VideoPlayerController? _videoController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _initializeVideo();
  }

  void _initializeVideo() {
    if (widget.book.previewVideo != null && widget.book.previewVideo!.isNotEmpty) {
      _videoController = VideoPlayerController.networkUrl(
        Uri.parse(widget.book.previewVideo!)
      )..initialize().then((_) {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    List<Widget> mediaItems = [];

    // Add images
    for (String imageUrl in widget.book.allImages) {
      mediaItems.add(
        Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return const Center(
              child: Icon(
                Icons.image_not_supported,
                size: 40,
                color: Colors.grey,
              ),
            );
          },
        ),
      );
    }

    // Add video if available
    if (_videoController != null && _videoController!.value.isInitialized) {
      mediaItems.add(
        Stack(
          alignment: Alignment.center,
          children: [
            AspectRatio(
              aspectRatio: _videoController!.value.aspectRatio,
              child: VideoPlayer(_videoController!),
            ),
            if (!_videoController!.value.isPlaying)
              IconButton(
                icon: const Icon(Icons.play_arrow),
                color: Colors.white,
                iconSize: 50,
                onPressed: () {
                  setState(() {
                    _videoController!.play();
                  });
                },
              ),
          ],
        ),
      );
    }

    return Container(
      height: widget.height,
      child: Stack(
        children: [
          PageView(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() {
                _currentPage = index;
                if (_videoController != null && _videoController!.value.isPlaying) {
                  _videoController!.pause();
                }
              });
            },
            children: mediaItems,
          ),
          if (widget.showControls && mediaItems.length > 1)
            Positioned(
              bottom: 10,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  mediaItems.length,
                  (index) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _currentPage == index
                          ? Colors.white
                          : Colors.white.withOpacity(0.4),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
