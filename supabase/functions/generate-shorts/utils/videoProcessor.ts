
import { generateFallbackThumbnail, dataURLtoBuffer } from "./videoProcessor";

/**
 * Create a video segment using the external Flask backend
 * @param videoId ID of the parent video
 * @param segmentData Segment data with title, timestamp, etc.
 * @param videoUrl URL of the original video
 * @param supabaseClient Supabase client instance
 * @returns Video and thumbnail metadata
 */
export async function createVideoSegment(videoId: string, segmentData: any, videoUrl: string, supabaseClient: any) {
  console.log(`Creating video segment: ${segmentData.title}`);
  
  try {
    // Parse timestamp to get start and end times
    const { startTime, endTime } = parseTimeRange(segmentData.timestamp);
    const duration = endTime - startTime;
    
    console.log(`Processing segment from ${startTime}s to ${endTime}s (duration: ${duration}s)`);
    
    // For now, we'll generate fallback responses as we're migrating to the Flask backend
    // The Flask backend will handle the actual video processing
    console.log(`Using fallback response while Flask backend is being set up`);
    
    // Generate fallback thumbnail
    console.log(`Generating fallback thumbnail for: ${segmentData.title}`);
    const fallbackThumb = generateFallbackThumbnail(segmentData.title);
    const fallbackBuffer = dataURLtoBuffer(fallbackThumb);
    
    return {
      videoBuffer: new Uint8Array(1024), // Just a placeholder until Flask backend is working
      thumbnailBuffer: fallbackBuffer,
      metadata: {
        title: segmentData.title,
        description: segmentData.description,
        timestamp: segmentData.timestamp,
        duration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
      }
    };
  } catch (error) {
    console.error(`Error creating video segment:`, error);
    throw error;
  }
}

// Function to parse a timestamp string from format like "MM:SS-MM:SS"
function parseTimeRange(timestamp: string): { startTime: number, endTime: number } {
  const parts = timestamp.split('-');
  if (parts.length !== 2) {
    return { startTime: 0, endTime: 30 }; // Default 30 seconds if invalid format
  }
  
  const startTime = timestampToSeconds(parts[0].trim());
  const endTime = timestampToSeconds(parts[1].trim());
  
  return { startTime, endTime };
}

// Converts a timestamp string to seconds
function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':');
  if (parts.length === 2) {
    // MM:SS format
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

/**
 * Function to generate a fallback thumbnail
 * @param title Title text to display on the thumbnail
 * @returns SVG data URL
 */
export function generateFallbackThumbnail(title: string) {
  // Create a colored background with the title text
  const svg = `<svg width="640" height="1136" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#3651C8"/>
    <text x="50%" y="50%" font-size="32" text-anchor="middle" alignment-baseline="middle" fill="#ffffff">${title}</text>
  </svg>`;
  
  // Convert SVG to a base64 data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Function to convert a data URL to a buffer
 * @param dataUrl Data URL string
 * @returns Uint8Array buffer
 */
export function dataURLtoBuffer(dataUrl: string) {
  const base64 = dataUrl.split(',')[1];
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
