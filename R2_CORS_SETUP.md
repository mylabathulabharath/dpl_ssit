# Cloudflare R2 CORS Configuration

To allow video playback from your R2 bucket, you need to configure CORS settings.

## Option 1: Using Cloudflare Dashboard

1. Go to Cloudflare Dashboard → R2 → Your Bucket
2. Navigate to **Settings** → **CORS Policy**
3. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

## Option 2: Using Wrangler CLI

Create a file `cors.json`:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Then run:
```bash
wrangler r2 bucket cors put <your-bucket-name> --file cors.json
```

## Option 3: Using Cloudflare API

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/cors" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "cors": [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
        "MaxAgeSeconds": 3600
      }
    ]
  }'
```

## Required Settings Explanation

- **AllowedOrigins**: `["*"]` allows all origins (you can restrict to specific domains like `["https://yourdomain.com", "http://localhost:8081"]`)
- **AllowedMethods**: `GET` for fetching video files, `HEAD` for checking availability, `OPTIONS` for preflight
- **AllowedHeaders**: `["*"]` allows all headers (needed for HLS streaming)
- **ExposeHeaders**: Headers that browsers can access from the response
- **MaxAgeSeconds**: How long browsers cache CORS preflight responses

## For Production

For production, restrict origins to your actual domain:

```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://www.yourdomain.com"
    ],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type", "Range", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
```

## Testing

After configuring CORS, test by accessing:
```
https://pub-e12a9e2bfd10445dafbc66e17252efb5.r2.dev/hls/{jobId}/master.m3u8
```

You should be able to access it from your browser without CORS errors.

