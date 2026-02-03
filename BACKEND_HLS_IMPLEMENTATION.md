# Backend HLS Implementation Examples

This document provides practical backend implementation examples for generating and serving HLS master playlists.

## Architecture Overview

```
┌─────────────────┐
│  Video Upload   │
│  (1080p + 720p) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Transcoding    │
│  → HLS Segments │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Master │
│   Playlist      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Store URL in   │
│   Database      │
└─────────────────┘
```

## Option 1: Firebase Storage + Cloud Functions

### Step 1: Video Structure in Firebase Storage

```
gs://your-bucket/
  videos/
    lesson-123/
      master.m3u8
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

### Step 2: Cloud Function to Generate Master Playlist

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();

/**
 * Triggered when video transcoding is complete
 * Generates master playlist and updates Firestore
 */
exports.generateMasterPlaylist = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    
    // Check if this is a variant playlist (1080p or 720p)
    if (!filePath.includes('/playlist.m3u8')) {
      return null;
    }
    
    // Extract lesson ID and quality from path
    // Path format: videos/lesson-123/1080p/playlist.m3u8
    const pathParts = filePath.split('/');
    const lessonId = pathParts[1]; // lesson-123
    const quality = pathParts[2]; // 1080p or 720p
    
    // Check if both 1080p and 720p playlists exist
    const bucket = storage.bucket(object.bucket);
    const [files1080p, files720p] = await Promise.all([
      bucket.file(`videos/${lessonId}/1080p/playlist.m3u8`).exists(),
      bucket.file(`videos/${lessonId}/720p/playlist.m3u8`).exists(),
    ]);
    
    if (files1080p[0] && files720p[0]) {
      // Both playlists exist, generate master playlist
      await generateAndUploadMasterPlaylist(bucket, lessonId);
      
      // Update Firestore with master playlist URL
      const masterPlaylistUrl = `https://storage.googleapis.com/${object.bucket}/videos/${lessonId}/master.m3u8`;
      await updateTopicVideoUrl(lessonId, masterPlaylistUrl);
    }
    
    return null;
  });

async function generateAndUploadMasterPlaylist(bucket, lessonId) {
  const baseUrl = `https://storage.googleapis.com/${bucket.name}`;
  
  const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
${baseUrl}/videos/${lessonId}/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
${baseUrl}/videos/${lessonId}/720p/playlist.m3u8
`;
  
  const masterPlaylistFile = bucket.file(`videos/${lessonId}/master.m3u8`);
  await masterPlaylistFile.save(masterPlaylist, {
    metadata: {
      contentType: 'application/vnd.apple.mpegurl',
      cacheControl: 'public, max-age=3600',
    },
  });
  
  // Make it publicly readable
  await masterPlaylistFile.makePublic();
  
  return masterPlaylistFile.publicUrl();
}

async function updateTopicVideoUrl(lessonId, videoUrl) {
  // Find the course that contains this topic
  const coursesRef = admin.firestore().collection('courses');
  const snapshot = await coursesRef.get();
  
  for (const doc of snapshot.docs) {
    const course = doc.data();
    const topicIndex = course.topics.findIndex(t => t.id === lessonId);
    
    if (topicIndex !== -1) {
      const topics = [...course.topics];
      topics[topicIndex] = {
        ...topics[topicIndex],
        videoUrl: videoUrl,
      };
      
      await coursesRef.doc(doc.id).update({
        topics: topics,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      break;
    }
  }
}
```

### Step 3: CORS Configuration for Firebase Storage

Create a `cors.json` file:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Range"
    ],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:
```bash
gsutil cors set cors.json gs://your-bucket
```

## Option 2: Node.js/Express Backend

### Master Playlist Generation Service

```javascript
// services/hls-service.js
const fs = require('fs').promises;
const path = require('path');

class HLSService {
  constructor(baseUrl, storagePath) {
    this.baseUrl = baseUrl; // e.g., 'https://api.yourapp.com'
    this.storagePath = storagePath; // e.g., './storage/videos'
  }

  /**
   * Generate master playlist for a lesson
   */
  async generateMasterPlaylist(lessonId, options = {}) {
    const {
      bandwidth1080p = 5000000,
      bandwidth720p = 2500000,
      resolution1080p = '1920x1080',
      resolution720p = '1280x720',
      codecs = 'avc1.640028,mp4a.40.2', // H.264 + AAC
    } = options;

    const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth1080p},RESOLUTION=${resolution1080p},CODECS="${codecs}"
${this.baseUrl}/api/videos/${lessonId}/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth720p},RESOLUTION=${resolution720p},CODECS="${codecs}"
${this.baseUrl}/api/videos/${lessonId}/720p/playlist.m3u8
`;

    const masterPath = path.join(this.storagePath, lessonId, 'master.m3u8');
    await fs.mkdir(path.dirname(masterPath), { recursive: true });
    await fs.writeFile(masterPath, masterPlaylist);

    return `${this.baseUrl}/api/videos/${lessonId}/master.m3u8`;
  }

  /**
   * Get actual bitrate from video file (optional, for accurate bandwidth)
   */
  async getVideoBitrate(videoPath) {
    // Use ffprobe to get actual bitrate
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    try {
      const { stdout } = await execPromise(
        `ffprobe -v error -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
      );
      return parseInt(stdout.trim());
    } catch (error) {
      console.error('Error getting bitrate:', error);
      return null;
    }
  }
}

module.exports = HLSService;
```

### Express Routes

```javascript
// routes/video-routes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const HLSService = require('../services/hls-service');

const hlsService = new HLSService(
  process.env.API_BASE_URL || 'https://api.yourapp.com',
  './storage/videos'
);

// Serve master playlist
router.get('/:lessonId/master.m3u8', async (req, res) => {
  try {
    const { lessonId } = req.params;
    const masterPath = path.join('./storage/videos', lessonId, 'master.m3u8');
    
    // Check if master playlist exists
    try {
      await fs.access(masterPath);
    } catch {
      // Generate if doesn't exist
      await hlsService.generateMasterPlaylist(lessonId);
    }
    
    const masterPlaylist = await fs.readFile(masterPath, 'utf8');
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(masterPlaylist);
  } catch (error) {
    console.error('Error serving master playlist:', error);
    res.status(500).json({ error: 'Failed to serve master playlist' });
  }
});

// Serve variant playlists
router.get('/:lessonId/:quality/playlist.m3u8', async (req, res) => {
  try {
    const { lessonId, quality } = req.params;
    
    if (!['1080p', '720p'].includes(quality)) {
      return res.status(400).json({ error: 'Invalid quality' });
    }
    
    const playlistPath = path.join(
      './storage/videos',
      lessonId,
      quality,
      'playlist.m3u8'
    );
    
    const playlist = await fs.readFile(playlistPath, 'utf8');
    
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(playlist);
  } catch (error) {
    console.error('Error serving variant playlist:', error);
    res.status(500).json({ error: 'Failed to serve playlist' });
  }
});

// Serve video segments
router.get('/:lessonId/:quality/segments/:segment', async (req, res) => {
  try {
    const { lessonId, quality, segment } = req.params;
    const segmentPath = path.join(
      './storage/videos',
      lessonId,
      quality,
      'segments',
      segment
    );
    
    // Check if segment exists
    try {
      await fs.access(segmentPath);
    } catch {
      return res.status(404).json({ error: 'Segment not found' });
    }
    
    const stat = await fs.stat(segmentPath);
    const file = await fs.readFile(segmentPath);
    
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('Accept-Ranges', 'bytes');
    
    res.send(file);
  } catch (error) {
    console.error('Error serving segment:', error);
    res.status(500).json({ error: 'Failed to serve segment' });
  }
});

module.exports = router;
```

## Option 3: Python/Flask Backend

```python
# app/services/hls_service.py
import os
from pathlib import Path

class HLSService:
    def __init__(self, base_url, storage_path):
        self.base_url = base_url
        self.storage_path = Path(storage_path)
    
    def generate_master_playlist(self, lesson_id, options=None):
        if options is None:
            options = {}
        
        bandwidth_1080p = options.get('bandwidth_1080p', 5000000)
        bandwidth_720p = options.get('bandwidth_720p', 2500000)
        resolution_1080p = options.get('resolution_1080p', '1920x1080')
        resolution_720p = options.get('resolution_720p', '1280x720')
        codecs = options.get('codecs', 'avc1.640028,mp4a.40.2')
        
        master_playlist = f"""#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH={bandwidth_1080p},RESOLUTION={resolution_1080p},CODECS="{codecs}"
{self.base_url}/api/videos/{lesson_id}/1080p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH={bandwidth_720p},RESOLUTION={resolution_720p},CODECS="{codecs}"
{self.base_url}/api/videos/{lesson_id}/720p/playlist.m3u8
"""
        
        master_path = self.storage_path / lesson_id / 'master.m3u8'
        master_path.parent.mkdir(parents=True, exist_ok=True)
        master_path.write_text(master_playlist)
        
        return f"{self.base_url}/api/videos/{lesson_id}/master.m3u8"
```

```python
# app/routes/video_routes.py
from flask import Blueprint, send_file, jsonify
from pathlib import Path
from app.services.hls_service import HLSService

video_bp = Blueprint('video', __name__, url_prefix='/api/videos')
hls_service = HLSService(
    base_url='https://api.yourapp.com',
    storage_path='./storage/videos'
)

@video_bp.route('/<lesson_id>/master.m3u8')
def get_master_playlist(lesson_id):
    master_path = Path(f'./storage/videos/{lesson_id}/master.m3u8')
    
    # Generate if doesn't exist
    if not master_path.exists():
        hls_service.generate_master_playlist(lesson_id)
    
    return send_file(
        master_path,
        mimetype='application/vnd.apple.mpegurl',
        as_attachment=False
    )

@video_bp.route('/<lesson_id>/<quality>/playlist.m3u8')
def get_variant_playlist(lesson_id, quality):
    if quality not in ['1080p', '720p']:
        return jsonify({'error': 'Invalid quality'}), 400
    
    playlist_path = Path(f'./storage/videos/{lesson_id}/{quality}/playlist.m3u8')
    
    if not playlist_path.exists():
        return jsonify({'error': 'Playlist not found'}), 404
    
    return send_file(
        playlist_path,
        mimetype='application/vnd.apple.mpegurl',
        as_attachment=False
    )
```

## Video Transcoding Workflow

### Using FFmpeg

```bash
# Transcode to 1080p HLS
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -vf scale=1920:1080 \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename "videos/lesson-123/1080p/segment_%03d.ts" \
  videos/lesson-123/1080p/playlist.m3u8

# Transcode to 720p HLS
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -vf scale=1280:720 \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename "videos/lesson-123/720p/segment_%03d.ts" \
  videos/lesson-123/720p/playlist.m3u8
```

### Using AWS MediaConvert / Google Cloud Video Intelligence

For production, consider using cloud transcoding services:
- **AWS MediaConvert**: Automatic HLS generation with multiple qualities
- **Google Cloud Video Intelligence**: Similar service
- **Mux**: Video API with automatic transcoding

## Testing Your Implementation

### 1. Test Master Playlist
```bash
curl -I https://your-api.com/api/videos/lesson-123/master.m3u8
```

### 2. Test Variant Playlists
```bash
curl https://your-api.com/api/videos/lesson-123/1080p/playlist.m3u8
curl https://your-api.com/api/videos/lesson-123/720p/playlist.m3u8
```

### 3. Test in Browser
Open master playlist URL in VLC or HLS.js test page:
- https://hls-js.netlify.app/demo/

### 4. Test Network Adaptation
Use browser DevTools Network Throttling:
- Fast 3G: Should use 720p
- Slow 3G: Should use 720p
- WiFi: Should use 1080p

## Database Update

After generating master playlist, update your database:

```typescript
// In your course creation/update service
const masterPlaylistUrl = await generateMasterPlaylist(lessonId);

// Update topic in Firestore
await updateDoc(courseRef, {
  topics: topics.map(topic => 
    topic.id === lessonId 
      ? { ...topic, videoUrl: masterPlaylistUrl }
      : topic
  )
});
```

## Next Steps

1. **Choose your backend option** (Firebase Functions, Node.js, Python)
2. **Set up video transcoding pipeline** (FFmpeg or cloud service)
3. **Implement master playlist generation**
4. **Update database with master playlist URLs**
5. **Test with different network conditions**
6. **Monitor quality switching in production**

