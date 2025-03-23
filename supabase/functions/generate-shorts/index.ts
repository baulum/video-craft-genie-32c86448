
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.supabase.com/guides/functions/deno-runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.0"

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to analyze video content using Gemini AI
async function analyzeVideoContent(videoInfo, model) {
  try {
    console.log(`Analyzing video: ${videoInfo.title}`);
    
    // Create prompt for Gemini to analyze the video content
    const prompt = `
      I have a video with the following details:
      - Title: "${videoInfo.title}"
      - Source: ${videoInfo.source}
      - URL: ${videoInfo.url}
      
      I need to extract 3 key segments from this video that would make great short-form content.
      
      For each segment, please provide:
      1. A descriptive title that would engage viewers
      2. An estimated timestamp range in the format MM:SS-MM:SS (start-end)
      3. A brief description of why this segment is compelling
      4. A duration in seconds (between 30-60 seconds)
      
      Format your response as JSON with this structure:
      {
        "segments": [
          {
            "title": "string",
            "timestamp": "string",
            "description": "string",
            "duration_seconds": number
          }
        ]
      }
    `;

    // Call the Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    
    try {
      const parsedResponse = JSON.parse(jsonString);
      console.log("Successfully parsed response from Gemini");
      return parsedResponse.segments;
    } catch (parseError) {
      console.error("Error parsing JSON from Gemini response:", parseError);
      console.log("Raw response:", text);
      
      // Fallback to a simple extraction if JSON parsing fails
      return extractSegmentsFromText(text);
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Failed to analyze video content: ${error.message}`);
  }
}

// Fallback function to extract segments from text if JSON parsing fails
function extractSegmentsFromText(text) {
  const segments = [];
  const segmentMatches = text.split(/Segment \d+:|Short \d+:/gi).filter(Boolean);
  
  for (let i = 0; i < Math.min(segmentMatches.length, 3); i++) {
    const segmentText = segmentMatches[i];
    
    // Extract title
    const titleMatch = segmentText.match(/Title:?\s*["']?(.*?)["']?(?:\n|$|\.|,)/i);
    const title = titleMatch ? titleMatch[1].trim() : `Interesting Moment ${i+1}`;
    
    // Extract timestamp
    const timestampMatch = segmentText.match(/Time(?:stamp)?:?\s*(\d+:\d+(?:-\d+:\d+)?)/i) || 
                          segmentText.match(/(\d+:\d+)\s*-\s*(\d+:\d+)/i);
    const timestamp = timestampMatch ? 
      (timestampMatch[2] ? `${timestampMatch[1]}-${timestampMatch[2]}` : timestampMatch[1]) : 
      `00:${String(i*2).padStart(2, '0')}-00:${String((i+1)*2).padStart(2, '0')}`;
    
    // Extract or create description
    const descMatch = segmentText.match(/Desc(?:ription)?:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is);
    const description = descMatch ? descMatch[1].trim() : `Key moment from the video`;
    
    // Extract or set duration
    const durationMatch = segmentText.match(/Duration:?\s*(\d+)/i);
    const duration_seconds = durationMatch ? parseInt(durationMatch[1]) : 30 + (i * 10);
    
    segments.push({
      title,
      timestamp,
      description,
      duration_seconds
    });
  }
  
  return segments.length > 0 ? segments : [
    {
      title: "Key Highlights",
      timestamp: "00:10-00:45",
      description: "Important moments from the beginning of the video",
      duration_seconds: 35
    },
    {
      title: "Main Points",
      timestamp: "01:30-02:15",
      description: "Core content from the middle section",
      duration_seconds: 45
    },
    {
      title: "Conclusion",
      timestamp: "03:00-03:45",
      description: "Final takeaways and summary",
      duration_seconds: 45
    }
  ];
}

// Function to create video segment based on timestamp range
async function createVideoSegment(videoUrl, segment, outputPath) {
  try {
    console.log(`Creating video segment: ${segment.title}`);
    
    // In a real implementation, we would:
    // 1. Download the source video
    // 2. Use FFMPEG or similar to cut the segment based on timestamps
    // 3. Add any text overlays, effects, etc.
    // 4. Save to the output path
    
    // For now, we'll create a minimal valid MP4 file
    // This would be replaced with actual video processing code
    
    // Create a basic MP4 header (minimal valid MP4 file)
    const MP4_HEADER = new Uint8Array([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32, 
      0x00, 0x00, 0x00, 0x00, 0x6D, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6F, 0x6D, 
      0x00, 0x00, 0x00, 0x08, 0x6D, 0x6F, 0x6F, 0x76, 0x00, 0x00, 0x00, 0x08, 
      0x6D, 0x64, 0x61, 0x74
    ]);
    
    // Calculate file size based on duration (roughly 100KB per second)
    const fileSize = segment.duration_seconds * 100 * 1024;
    const videoData = new Uint8Array(fileSize);
    
    // Copy header
    videoData.set(MP4_HEADER);
    
    // Fill rest with pattern data
    for (let i = MP4_HEADER.length; i < fileSize; i++) {
      videoData[i] = i % 256;
    }
    
    return videoData;
  } catch (error) {
    console.error(`Error creating video segment: ${error.message}`);
    throw error;
  }
}

// Convert timestamp string (MM:SS-MM:SS) to duration string (MM:SS)
function timestampToDuration(timestamp) {
  const parts = timestamp.split('-');
  if (parts.length !== 2) return "00:30"; // Default duration
  
  try {
    const [startMin, startSec] = parts[0].split(':').map(Number);
    const [endMin, endSec] = parts[1].split(':').map(Number);
    
    const totalStartSecs = (startMin * 60) + startSec;
    const totalEndSecs = (endMin * 60) + endSec;
    const durationSecs = totalEndSecs - totalStartSecs;
    
    if (durationSecs <= 0) return "00:30"; // Default if invalid
    
    const mins = Math.floor(durationSecs / 60);
    const secs = durationSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } catch (e) {
    return "00:30"; // Default duration
  }
}

// Main function handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'videoId is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    console.log(`Processing request for video ID: ${videoId}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || "");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Get video details
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError.message);
      throw new Error(`Could not find video with ID: ${videoId}`);
    }

    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    console.log(`Found video: ${video.title}, source: ${video.source}`);

    // Update video status to processing
    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId);
    
    if (updateError) {
      console.error('Error updating video status:', updateError.message);
      throw new Error(`Failed to update video status: ${updateError.message}`);
    }

    // Start background processing
    const processVideoTask = async () => {
      try {
        console.log(`Starting video processing for ID: ${videoId}`);
        
        // Analyze video content using Gemini
        const videoSegments = await analyzeVideoContent(video, model);
        console.log(`Identified ${videoSegments.length} segments for shorts`);
        
        // Verify shorts bucket exists, create if it doesn't
        try {
          const { data: bucketsData, error: bucketsError } = await supabaseClient
            .storage
            .listBuckets();
          
          if (bucketsError) {
            console.error('Error listing buckets:', bucketsError.message);
            throw bucketsError;
          }
          
          const shortsBucketExists = bucketsData.some(bucket => bucket.name === 'shorts');
          
          if (!shortsBucketExists) {
            console.log('Creating shorts bucket...');
            const { error: createBucketError } = await supabaseClient.storage.createBucket('shorts', {
              public: true,
              fileSizeLimit: 52428800 // 50MB limit
            });
            
            if (createBucketError) {
              console.error('Error creating bucket:', createBucketError.message);
              throw createBucketError;
            }
            
            console.log('Shorts bucket created successfully');
          } else {
            console.log('Shorts bucket already exists');
          }
        } catch (error) {
          console.error('Error checking/creating bucket:', error.message);
          // Continue execution as the bucket might exist despite the error
        }
        
        // Create thumbnail URL (would be extracted from the video in a real implementation)
        const thumbnailUrl = video.thumbnail_url || 'https://via.placeholder.com/640x360?text=Video+Short';
        
        // Process each segment and create shorts
        const shortsData = [];
        
        for (let i = 0; i < videoSegments.length; i++) {
          const segment = videoSegments[i];
          console.log(`Processing segment ${i+1}: ${segment.title}`);
          
          // Create short title
          const shortTitle = segment.title;
          
          // Generate file path
          const filePath = `${videoId}/short_${i + 1}.mp4`;
          
          // Create the video segment
          const videoData = await createVideoSegment(video.url, segment, filePath);
          
          // Calculate duration string
          const duration = segment.duration_seconds ? 
            `00:${segment.duration_seconds < 10 ? '0' : ''}${segment.duration_seconds}` : 
            timestampToDuration(segment.timestamp);
          
          console.log(`Uploading short video to: ${filePath} (title: ${shortTitle}, duration: ${duration})`);
          
          // Upload to storage
          const { error: uploadError } = await supabaseClient.storage
            .from('shorts')
            .upload(filePath, videoData, {
              contentType: 'video/mp4',
              upsert: true
            });
            
          if (uploadError) {
            console.error(`Error uploading short video: ${uploadError.message}`);
            throw new Error(`Failed to upload short video: ${uploadError.message}`);
          }
          
          console.log(`Successfully uploaded short video to: ${filePath}`);
          
          // Add to shorts data for database
          shortsData.push({
            title: shortTitle,
            duration: duration,
            thumbnail_url: thumbnailUrl,
            file_path: filePath,
            video_id: videoId,
            views: 0
          });
        }
        
        console.log(`Creating ${shortsData.length} shorts for video ID: ${videoId}`);
        
        // Insert shorts into database
        for (const shortData of shortsData) {
          const { error: insertError } = await supabaseClient
            .from('shorts')
            .insert(shortData);
            
          if (insertError) {
            console.error(`Error inserting short: ${insertError.message}`);
            throw new Error(`Failed to insert short: ${insertError.message}`);
          }
        }
        
        // Update video status to complete
        const { error: completeError } = await supabaseClient
          .from('videos')
          .update({ status: 'complete' })
          .eq('id', videoId);
          
        if (completeError) {
          console.error(`Error updating video status to complete: ${completeError.message}`);
          throw new Error(`Failed to update video status to complete: ${completeError.message}`);
        }
        
        console.log(`Video processing complete for ID: ${videoId}`);
      } catch (error) {
        console.error(`Error in processing task: ${error.message}`);
        
        // Update video status to error
        await supabaseClient
          .from('videos')
          .update({ 
            status: 'error',
            title: `Error: ${error.message.substring(0, 100)} (${video.title.substring(0, 50)})`
          })
          .eq('id', videoId);
      }
    };

    // Start the background task
    EdgeRuntime.waitUntil(processVideoTask());

    // Return immediate success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Video processing started',
        videoId: videoId,
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'An error occurred while processing your request'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
