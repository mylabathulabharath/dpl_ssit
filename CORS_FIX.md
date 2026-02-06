# CORS Fix for Video Upload

## Problem
The video upload is failing with a CORS error because the server doesn't allow the `ngrok-skip-browser-warning` header in the CORS preflight response.

## Error Message
```
Access to XMLHttpRequest at 'https://reinaldo-knaggy-ellison.ngrok-free.dev/api/upload' 
from origin 'http://localhost:8082' has been blocked by CORS policy: 
Request header field ngrok-skip-browser-warning is not allowed by 
Access-Control-Allow-Headers in preflight response.
```

## Solution

You need to update your server's CORS configuration to allow the `ngrok-skip-browser-warning` header.

### Option 1: Express.js with cors middleware

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: '*', // or specify your frontend URL
  allowedHeaders: [
    'Content-Type',
    'ngrok-skip-browser-warning'  // Add this header
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: false
}));

// Your upload route
app.post('/api/upload', upload.single('video'), (req, res) => {
  // ... your upload logic
});
```

### Option 2: Manual CORS handling

```javascript
const express = require('express');
const app = express();

// Handle preflight OPTIONS requests
app.options('/api/upload', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
  res.sendStatus(200);
});

// Your upload route
app.post('/api/upload', upload.single('video'), (req, res) => {
  // Set CORS headers on actual response too
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
  
  // ... your upload logic
});
```

### Option 3: Using a CORS middleware function

```javascript
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, ngrok-skip-browser-warning');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

app.use(corsMiddleware);
app.post('/api/upload', upload.single('video'), (req, res) => {
  // ... your upload logic
});
```

### Option 4: FastAPI (Python)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Content-Type", "ngrok-skip-browser-warning"],  # Add this
)

@app.post("/api/upload")
async def upload_video(file: UploadFile):
    # ... your upload logic
```

## Testing

After updating your server:

1. Restart your server
2. Try uploading a video again
3. Check the browser console - the CORS error should be gone

## Note

If you're not using ngrok, you can remove the `ngrok-skip-browser-warning` header from the client code in `services/video-upload-service.ts` (line 129-132), but it's better to keep it for flexibility.

