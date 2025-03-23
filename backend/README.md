
# Video Processing Backend

This is a Flask-based backend for processing videos and generating shorts.

## Setup

### Prerequisites
- Docker and Docker Compose (recommended)
- Python 3.9+
- FFmpeg

### Running with Docker
1. Build the Docker image:
   ```
   docker build -t video-processor-backend .
   ```

2. Run the container:
   ```
   docker run -p 5000:5000 video-processor-backend
   ```

### Running without Docker
1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the Flask application:
   ```
   python app.py
   ```

## API Endpoints

### GET /
Health check endpoint that returns a status message.

### POST /api/process-video
Process a video and generate shorts based on the provided segments.

**Request Body:**
```json
{
  "videoId": "string",
  "videoUrl": "string",
  "segments": [
    {
      "title": "string",
      "description": "string",
      "timestamp": "string",
      "duration_seconds": number
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Video processing completed",
  "segments": [
    {
      "title": "string",
      "description": "string",
      "timestamp": "string",
      "duration": "string",
      "video_filename": "string",
      "thumbnail_filename": "string",
      "segment_index": number
    }
  ]
}
```
