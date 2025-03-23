
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import urllib.request
import subprocess
import json
import uuid
import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/')
def index():
    return jsonify({"status": "Flask backend for video processing is running"})

@app.route('/api/process-video', methods=['POST'])
def process_video():
    try:
        data = request.json
        
        if not data or 'videoUrl' not in data or 'segments' not in data or 'videoId' not in data:
            return jsonify({"error": "Missing required parameters"}), 400
        
        video_url = data['videoUrl']
        segments = data['segments']
        video_id = data['videoId']
        
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        
        # Download the video (for YouTube URLs) or use the provided URL
        source_video_path = os.path.join(temp_dir, 'source_video.mp4')
        
        if 'youtube.com' in video_url or 'youtu.be' in video_url:
            # For YouTube, you'd need a YouTube downloader like yt-dlp
            # This is a simplified placeholder
            return jsonify({
                "error": "YouTube processing not implemented yet",
                "segments": generate_placeholder_segments(segments, video_id)
            }), 200
        else:
            # For direct file URLs
            try:
                urllib.request.urlretrieve(video_url, source_video_path)
            except Exception as e:
                return jsonify({
                    "error": f"Failed to download video: {str(e)}",
                    "segments": generate_placeholder_segments(segments, video_id)
                }), 200
        
        # Process each segment
        processed_segments = []
        
        for i, segment in enumerate(segments):
            try:
                # Parse timestamp
                timestamp = segment.get('timestamp', '00:00-00:30')
                parts = timestamp.split('-')
                start_time = parts[0].strip()
                end_time = parts[1].strip() if len(parts) > 1 else '00:30'
                
                # Output paths
                segment_filename = f"{video_id}_short_{i+1}.mp4"
                thumbnail_filename = f"{video_id}_thumb_{i+1}.jpg"
                segment_path = os.path.join(temp_dir, segment_filename)
                thumbnail_path = os.path.join(temp_dir, thumbnail_filename)
                
                # Extract segment using FFmpeg (placeholder)
                # In a real implementation, you would call FFmpeg here
                
                # Generate a placeholder thumbnail
                create_placeholder_thumbnail(segment.get('title', f'Segment {i+1}'), thumbnail_path)
                
                # In a real implementation, these files would be uploaded to Supabase storage
                # Here we just prepare the response
                processed_segments.append({
                    "title": segment.get('title', f'Segment {i+1}'),
                    "description": segment.get('description', ''),
                    "timestamp": timestamp,
                    "duration": calculate_duration(start_time, end_time),
                    "video_filename": segment_filename,
                    "thumbnail_filename": thumbnail_filename,
                    "segment_index": i + 1
                })
                
            except Exception as e:
                print(f"Error processing segment {i+1}: {str(e)}")
        
        return jsonify({
            "status": "success", 
            "message": "Video processing completed",
            "segments": processed_segments
        })
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def create_placeholder_thumbnail(title, output_path):
    """Create a simple colored thumbnail with text"""
    width, height = 640, 360
    color = (54, 81, 200)  # Blue color
    
    img = Image.new('RGB', (width, height), color)
    draw = ImageDraw.Draw(img)
    
    # Add text (would need a font file in production)
    draw.text((width/2, height/2), title, fill="white", anchor="mm")
    
    img.save(output_path)
    return output_path

def calculate_duration(start_time, end_time):
    """Calculate duration in MM:SS format"""
    # Simplified implementation - would need proper time parsing
    return "00:30"  # Placeholder

def generate_placeholder_segments(segments, video_id):
    """Generate placeholder segment data when video processing fails"""
    result = []
    
    for i, segment in enumerate(segments):
        result.append({
            "title": segment.get('title', f'Segment {i+1}'),
            "description": segment.get('description', ''),
            "timestamp": segment.get('timestamp', '00:00-00:30'),
            "duration": "00:30",
            "video_filename": f"{video_id}_short_{i+1}.mp4",
            "thumbnail_filename": f"{video_id}_thumb_{i+1}.jpg",
            "segment_index": i + 1
        })
    
    return result

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
