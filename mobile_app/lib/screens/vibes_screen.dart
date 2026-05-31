import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import 'details_screen.dart';

class VibesScreen extends StatefulWidget {
  const VibesScreen({Key? key}) : super(key: key);

  @override
  State<VibesScreen> createState() => _VibesScreenState();
}

class _VibesScreenState extends State<VibesScreen> {
  List<Vibe> _vibes = [];
  bool _loading = true;
  int _activeIdx = 0;
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    _loadVibes();
  }

  Future<void> _loadVibes() async {
    try {
      final list = await ApiService.getVibes();
      setState(() {
        _vibes = list;
      });
    } catch (e) {
      print('Failed to load vibes: $e');
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Color(0xFF22C55E))),
      );
    }

    if (_vibes.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          title: const Text('NWN Vibes', style: TextStyle(color: Colors.white)),
          backgroundColor: Colors.black,
        ),
        body: const Center(
          child: Text(
            'No vibes published yet.',
            style: TextStyle(color: Colors.white70),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        scrollDirection: Axis.vertical,
        controller: _pageController,
        onPageChanged: (idx) {
          setState(() {
            _activeIdx = idx;
          });
        },
        itemCount: _vibes.length,
        itemBuilder: (context, idx) {
          return VibePlayerItem(
            vibe: _vibes[idx],
            isActive: idx == _activeIdx,
          );
        },
      ),
    );
  }
}

class VibePlayerItem extends StatefulWidget {
  final Vibe vibe;
  final bool isActive;

  const VibePlayerItem({Key? key, required this.vibe, required this.isActive}) : super(key: key);

  @override
  State<VibePlayerItem> createState() => _VibePlayerItemState();
}

class _VibePlayerItemState extends State<VibePlayerItem> {
  late VideoPlayerController _controller;
  bool _initialized = false;
  bool _liked = false;
  int _likesCount = 0;

  @override
  void initState() {
    super.initState();
    _likesCount = widget.vibe.likes.length;
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.vibe.videoUrl))
      ..initialize().then((_) {
        setState(() {
          _initialized = true;
        });
        if (widget.isActive) {
          _controller.play();
          _controller.setLooping(true);
        }
      });
  }

  @override
  void didUpdateWidget(covariant VibePlayerItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_initialized) {
      if (widget.isActive) {
        _controller.play();
        _controller.setLooping(true);
      } else {
        _controller.pause();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _toggleLike() async {
    try {
      final res = await ApiService.toggleLikeVibe(widget.vibe.id);
      setState(() {
        _liked = res['liked'] ?? false;
        _likesCount = res['likesCount'] ?? _likesCount;
      });
    } catch (e) {
      print('Failed to toggle like: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Video Player Background
        _initialized
            ? GestureDetector(
                onTap: () {
                  if (_controller.value.isPlaying) {
                    _controller.pause();
                  } else {
                    _controller.play();
                  }
                },
                child: VideoPlayer(_controller),
              )
            : const Center(child: CircularProgressIndicator(color: Colors.white30)),

        // Gradient overlay
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.3),
                Colors.transparent,
                Colors.transparent,
                Colors.black.withOpacity(0.6),
              ],
            ),
          ),
        ),

        // Action Overlay buttons right side
        Positioned(
          right: 16,
          bottom: 120,
          child: Column(
            children: [
              // Like icon button
              GestureDetector(
                onTap: _toggleLike,
                child: Column(
                  children: [
                    Icon(
                      LucideIcons.heart,
                      color: _liked ? Colors.redAccent : Colors.white,
                      size: 32,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$_likesCount',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Visit stay navigate icon button
              GestureDetector(
                onTap: () {
                  if (widget.vibe.property?.id != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DetailsScreen(propertyId: widget.vibe.property!.id),
                      ),
                    );
                  }
                },
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(color: Color(0xFF22C55E), shape: BoxShape.circle),
                      child: const Icon(LucideIcons.home, color: Colors.white, size: 24),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Visit Stay',
                      style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    )
                  ],
                ),
              )
            ],
          ),
        ),

        // Host profile information overlay bottom left
        Positioned(
          left: 16,
          bottom: 40,
          right: 80,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: const BoxDecoration(color: Color(0xFF22C55E), shape: BoxShape.circle),
                    child: Center(
                      child: Text(
                        (widget.vibe.owner?.name ?? 'H').substring(0, 1).toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.vibe.owner?.name ?? 'Host',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Text(
                        widget.vibe.property?.name ?? 'Stay Property',
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      )
                    ],
                  )
                ],
              ),
              const SizedBox(height: 10),
              Text(
                widget.vibe.caption,
                style: const TextStyle(color: Colors.white, fontSize: 13, height: 1.3),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              )
            ],
          ),
        )
      ],
    );
  }
}
