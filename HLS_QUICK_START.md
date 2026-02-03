# HLS Adaptive Streaming - Quick Start Guide

## TL;DR

1. **Backend**: Generate a master playlist (`.m3u8`) that references both 1080p and 720p HLS streams
2. **Database**: Store the master playlist URL in `topic.videoUrl`
3. **Frontend**: No changes needed! `expo-av` automatically handles adaptive streaming

## The Solution

### What You Have
- ✅ 1080p video transcoded to HLS
- ✅ 720p video transcoded to HLS
- ✅ `expo-av` Video component (already supports HLS)

### What You Need
- 📝 Master playlist file that lists both qualities
- 🔧 Backend endpoint/service to generate/serve it
- 💾 Update database to store master playlist URL

## Master Playlist Format

Create a file called `master.m3u8`:

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
720p/playlist.m3u8
```

## File Structure

```
videos/
  lesson-123/
    master.m3u8          ← Point videoUrl to this
    1080p/
      playlist.m3u8
      segment_000.ts
      segment_001.ts
      ...
    720p/
      playlist.m3u8
      segment_000.ts
      segment_001.ts
      ...
```

## Implementation Steps

### Step 1: Generate Master Playlist (Backend)

**Option A: Static Generation (After Transcoding)**
```javascript
// After both 1080p and 720p are transcoded
const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
${baseUrl}/videos/${lessonId}/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
${baseUrl}/videos/${lessonId}/720p/playlist.m3u8
`;

// Save to storage
await saveToStorage(`videos/${lessonId}/master.m3u8`, masterPlaylist);
```

**Option B: Dynamic Endpoint**
```javascript
// GET /api/videos/:lessonId/master.m3u8
app.get('/api/videos/:lessonId/master.m3u8', (req, res) => {
  const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
${baseUrl}/api/videos/${req.params.lessonId}/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
${baseUrl}/api/videos/${req.params.lessonId}/720p/playlist.m3u8
`;
  
  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.send(masterPlaylist);
});
```

### Step 2: Update Database

Store master playlist URL instead of single video URL:

```typescript
// In your course service
const masterPlaylistUrl = `https://your-cdn.com/videos/${lessonId}/master.m3u8`;

// Update Firestore
await updateDoc(courseRef, {
  topics: topics.map(topic => 
    topic.id === lessonId 
      ? { ...topic, videoUrl: masterPlaylistUrl }
      : topic
  )
});
```

### Step 3: Frontend (No Changes Needed!)

Your existing code already works:

```typescript
// app/course/[id]/lesson/[lessonId].tsx
const videoUri = currentTopic?.videoUrl; // This is now master.m3u8

<VideoPlayer source={{ uri: videoUri }} ... />
```

`expo-av` will:
1. ✅ Download master playlist
2. ✅ Select appropriate quality (1080p or 720p)
3. ✅ Automatically switch based on network conditions
4. ✅ Handle buffering and quality changes

## How It Works

```
User opens video
    ↓
Player requests master.m3u8
    ↓
Player reads available qualities
    ↓
Player selects quality based on:
  - Network speed
  - Device capabilities
  - Buffer health
    ↓
Player downloads segments from selected quality
    ↓
If network slows: Switch to 720p
If network improves: Switch to 1080p
```

## Testing

### 1. Verify Master Playlist
```bash
curl https://your-api.com/videos/lesson-123/master.m3u8
```

Should return:
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/playlist.m3u8
```

### 2. Test in App
- Fast WiFi: Should start with 1080p
- Slow connection: Should start with 720p
- Network changes: Should switch automatically

### 3. Monitor Quality Switches
Add logging to see quality changes (optional):
```typescript
// In video-player.tsx, you can monitor status changes
const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
  if (status.isLoaded) {
    // Status contains info about current quality
    console.log('Video status:', status);
  }
};
```

## Common Issues

### ❌ "Playlist not found"
- Check that master.m3u8 is accessible
- Verify CORS headers are set
- Check file paths are correct

### ❌ "Not switching qualities"
- Verify BANDWIDTH values are realistic
- Check both variant playlists are accessible
- Network might be stable (no need to switch)

### ❌ "Buffering"
- Add lower quality (480p) for very slow connections
- Reduce segment duration (6-8 seconds)
- Check CDN performance

## Bandwidth Values

Adjust based on your actual video bitrates:

```javascript
// Check actual bitrate
ffprobe -v error -show_entries format=bit_rate -of default=noprint_wrappers=1 video.mp4

// Set BANDWIDTH to ~1.2x actual bitrate for safety
// Example: If 1080p video is 4 Mbps, set BANDWIDTH=5000000 (5 Mbps)
```

## CORS Headers

Ensure your server sends:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Range
Content-Type: application/vnd.apple.mpegurl
```

## Next Steps

1. ✅ Choose backend implementation (see `BACKEND_HLS_IMPLEMENTATION.md`)
2. ✅ Generate master playlists for existing videos
3. ✅ Update database with master playlist URLs
4. ✅ Test with different network conditions
5. ✅ Monitor in production

## Resources

- **Full Guide**: `HLS_ADAPTIVE_STREAMING.md`
- **Backend Examples**: `BACKEND_HLS_IMPLEMENTATION.md`
- **HLS Spec**: https://tools.ietf.org/html/rfc8216
- **expo-av Docs**: https://docs.expo.dev/versions/latest/sdk/av/

