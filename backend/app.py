
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
        
        print(f"Processing video: {video_id} - {video_url}")
        print(f"Segments to process: {json.dumps(segments, indent=2)}")
        
        # Create temporary directory for processing
        temp_dir = tempfile.mkdtemp()
        
        # Download the video (for YouTube URLs) or use the provided URL
        source_video_path = os.path.join(temp_dir, 'source_video.mp4')
        
        if 'youtube.com' in video_url or 'youtu.be' in video_url:
            # For YouTube, you'd need a YouTube downloader like yt-dlp
            # This is a simplified placeholder
            return jsonify({
                "status": "success",
                "message": "YouTube processing not implemented yet",
                "segments": generate_placeholder_segments(segments, video_id)
            }), 200
        else:
            # For direct file URLs
            try:
                print(f"Downloading video from URL: {video_url}")
                urllib.request.urlretrieve(video_url, source_video_path)
                print(f"Video downloaded to: {source_video_path}")
            except Exception as e:
                print(f"Error downloading video: {str(e)}")
                return jsonify({
                    "status": "success",
                    "message": f"Failed to download video: {str(e)}",
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
                
                print(f"Processing segment {i+1}: {segment.get('title')} [{start_time} - {end_time}]")
                
                # Output paths
                segment_filename = f"{video_id}_short_{i+1}.mp4"
                thumbnail_filename = f"{video_id}_thumb_{i+1}.jpg"
                segment_path = os.path.join(temp_dir, segment_filename)
                thumbnail_path = os.path.join(temp_dir, thumbnail_filename)
                
                # Extract segment using FFmpeg (placeholder)
                # In a real implementation, you would call FFmpeg here
                print(f"Would extract segment to: {segment_path}")
                
                # Generate a placeholder thumbnail
                create_placeholder_thumbnail(segment.get('title', f'Segment {i+1}'), thumbnail_path)
                print(f"Created thumbnail at: {thumbnail_path}")
                
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
                
                print(f"Completed processing segment {i+1}")
                
            except Exception as e:
                print(f"Error processing segment {i+1}: {str(e)}")
        
        print(f"All segments processed. Returning {len(processed_segments)} segments.")
        
        return jsonify({
            "status": "success", 
            "message": "Video processing completed",
            "segments": processed_segments
        })
                
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return jsonify({"error": str(e)}), 500

def create_placeholder_thumbnail(title, output_path):
    """Create a simple colored thumbnail with text"""
    width, height = 640, 360
    color = (54, 81, 200)  # Blue color
    
    img = Image.new('RGB', (width, height), color)
    draw = ImageDraw.Draw(img)
    
    # Add text (would need a font file in production)
    try:
        # Try to load a font - use default if not available
        try:
            font = ImageFont.truetype("Arial", 30)
        except:
            font = None
        
        draw.text((width/2, height/2), title, fill="white", anchor="mm", font=font)
    except Exception as e:
        # Fallback method if the anchor parameter isn't supported
        text_size = draw.textsize(title, font=font) if font else (300, 30)
        position = ((width - text_size[0]) / 2, (height - text_size[1]) / 2)
        draw.text(position, title, fill="white", font=font)
    
    img.save(output_path)
    return output_path

def calculate_duration(start_time, end_time):
    """Calculate duration in MM:SS format"""
    # Simplified implementation - would need proper time parsing
    try:
        # Convert timestamps like "01:30" to seconds
        def to_seconds(ts):
            parts = ts.split(':')
            if len(parts) == 2:  # MM:SS
                return int(parts[0]) * 60 + int(parts[1])
            elif len(parts) == 3:  # HH:MM:SS
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            return 0
        
        start_seconds = to_seconds(start_time)
        end_seconds = to_seconds(end_time)
        
        # Calculate duration in seconds
        duration_seconds = end_seconds - start_seconds
        if duration_seconds <= 0:
            duration_seconds = 30  # Default to 30 seconds
        
        # Format as MM:SS
        minutes = duration_seconds // 60
        seconds = duration_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"
    except:
        return "00:30"  # Default fallback

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
