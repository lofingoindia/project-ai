import 'package:supabase_flutter/supabase_flutter.dart';

/// Lightweight Supabase Realtime connectivity checker.
/// Subscribes to a simple channel and reports when the status becomes SUBSCRIBED.
class RealtimeService {
  final SupabaseClient _client = Supabase.instance.client;
  RealtimeChannel? _channel;

  void connect({void Function(bool connected)? onStatus}) {
    _channel ??= _client.channel('connection_test');

    _channel!.subscribe((status, [error]) {
      switch (status) {
        case RealtimeSubscribeStatus.subscribed:
          if (onStatus != null) onStatus(true);
          break;
        case RealtimeSubscribeStatus.closed:
        case RealtimeSubscribeStatus.channelError:
          if (onStatus != null) onStatus(false);
          break;
        default:
          break;
      }
    });
  }

  void dispose() {
    _channel?.unsubscribe();
    _channel = null;
  }
}


