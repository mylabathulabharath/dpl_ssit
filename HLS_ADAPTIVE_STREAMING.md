# HLS Adaptive Bitrate Streaming Implementation Guide

## Overview
This guide explains how to implement adaptive bitrate streaming using HLS (HTTP Live Streaming) with multiple quality levels (1080p and 720p) that automatically adapt to network conditions.

## How HLS Adaptive Streaming Works

1. **Master Playlist (.m3u8)**: A master playlist file that lists all available quality variants
2. **Variant Playlists**: Each quality level (1080p, 720p) has its own playlist file
3. **Automatic Adaptation**: The player automatically switches between qualities based on:
   - Available bandwidth
   - Buffer health
   - Device capabilities

## Backend Structure

### File Organization
```
videos/
  ├── lesson-123/
  │   ├── master.m3u8          # Master playlist (references both qualities)
  │   ├── 1080p/
  │   │   ├── playlist.m3u8    # 1080p variant playlist
  │   │   └── segments/        # 1080p video segments (.ts files)
  │   └── 720p/
  │       ├── playlist.m3u8    # 720p variant playlist
  │       └── segments/        # 720p video segments (.ts files)
```

### Master Playlist Format (master.m3u8)

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
720p/playlist.m3u8
```

**Key Parameters:**
- `BANDWIDTH`: Estimated bitrate in bits per second
  - 1080p: ~5 Mbps (5000000)
  - 720p: ~2.5 Mbps (2500000)
- `RESOLUTION`: Video resolution (width x height)
- `CODECS`: Video and audio codec information

### Backend Implementation Options

#### Option 1: Static Master Playlist Generation (Recommended for Start)
Generate the master playlist when video is uploaded/transcoded:

```python
# Example Python/Flask backend
def generate_master_playlist(lesson_id, base_url):
    """
    Generate HLS master playlist for a lesson
    """
    master_content = """#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
{base_url}/videos/{lesson_id}/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
{base_url}/videos/{lesson_id}/720p/playlist.m3u8
""".format(base_url=base_url, lesson_id=lesson_id)
    
    # Save to storage
    save_to_storage(f"videos/{lesson_id}/master.m3u8", master_content)
    
    return f"{base_url}/videos/{lesson_id}/master.m3u8"
```

#### Option 2: Dynamic Master Playlist Endpoint
Create an API endpoint that generates the master playlist on-the-fly:

```python
@app.route('/api/videos/<lesson_id>/master.m3u8')
def get_master_playlist(lesson_id):
    base_url = request.host_url.rstrip('/')
    
    master_playlist = f"""#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
{base_url}/api/videos/{lesson_id}/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
{base_url}/api/videos/{lesson_id}/720p/playlist.m3u8
"""
    
    return Response(
        master_playlist,
        mimetype='application/vnd.apple.mpegurl',
        headers={
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*'
        }
    )
```

## Frontend Implementation

### Current Setup
Your `expo-av` Video component already supports HLS! You just need to:
1. Point the `source.uri` to the master playlist URL
2. The player will automatically handle adaptive streaming

### Update Video URL in Database
Instead of storing a single video URL, store the master playlist URL:

```typescript
// In your Topic type (already has videoUrl)
videoUrl: string; // This should now point to master.m3u8
```

### Example Usage
```typescript
// In app/course/[id]/lesson/[lessonId].tsx
const videoUri = currentTopic?.videoUrl || 'fallback-url';

// If videoUrl is master.m3u8, expo-av will automatically:
// 1. Download the master playlist
// 2. Select appropriate quality based on network
// 3. Switch between 1080p and 720p as needed
<VideoPlayer source={{ uri: videoUri }} ... />
```

## Network Speed Detection (Optional Enhancement)

You can add manual quality selection if needed:

```typescript
import * as Network from 'expo-network';

const getOptimalVideoUrl = async (lessonId: string) => {
  const networkState = await Network.getNetworkStateAsync();
  
  // For very slow connections, you might want to force 720p
  if (networkState.type === Network.NetworkStateType.CELLULAR_2G) {
    return `${baseUrl}/videos/${lessonId}/720p/playlist.m3u8`;
  }
  
  // Otherwise, use master playlist for adaptive streaming
  return `${baseUrl}/videos/${lessonId}/master.m3u8`;
};
```

## Best Practices

### 1. Bandwidth Estimation
Adjust bandwidth values based on your actual video bitrates:
- Check your 1080p video's actual bitrate
- Check your 720p video's actual bitrate
- Set BANDWIDTH to ~1.2x the actual bitrate for safety

### 2. Segment Duration
- Recommended: 6-10 seconds per segment
- Shorter segments = faster adaptation but more requests
- Longer segments = fewer requests but slower adaptation

### 3. CORS Headers
Ensure your server sends proper CORS headers for HLS:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Range
```

### 4. CDN Considerations
- Use a CDN (CloudFront, Cloudflare) for better performance
- Enable HTTP/2 for better multiplexing
- Consider adding more quality levels (480p, 360p) for very slow connections

## Testing

### Test Different Network Conditions
1. **Fast WiFi**: Should start with 1080p
2. **Slow WiFi**: Should start with 720p or switch down
3. **Cellular**: Should adapt based on signal strength
4. **Throttled Network**: Use browser DevTools or network throttling

### Verify Playlist Accessibility
```bash
# Test master playlist
curl https://your-api.com/videos/lesson-123/master.m3u8

# Test variant playlists
curl https://your-api.com/videos/lesson-123/1080p/playlist.m3u8
curl https://your-api.com/videos/lesson-123/720p/playlist.m3u8
```

## Troubleshooting

### Player not switching qualities
- Check that BANDWIDTH values are correct
- Verify both variant playlists are accessible
- Check network conditions (player may stick to one quality if network is stable)

### Playback issues
- Ensure all .ts segments are accessible
- Check CORS headers
- Verify MIME types are correct (application/vnd.apple.mpegurl)

### Buffering
- Add lower quality variants (480p, 360p)
- Reduce segment duration
- Check CDN performance

## Next Steps

1. **Backend**: Implement master playlist generation/endpoint
2. **Database**: Update videoUrl to point to master.m3u8
3. **Testing**: Test with different network conditions
4. **Monitoring**: Add analytics to track quality switches
5. **Enhancement**: Add more quality levels if needed

