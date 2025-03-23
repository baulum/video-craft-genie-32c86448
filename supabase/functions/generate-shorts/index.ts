
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.supabase.com/guides/functions/deno-runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.0"
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

// Import utility modules
import { analyzeVideoContent, extractSegmentsFromText } from "./utils/aiAnalyzer.ts";
import { createVideoSegment, generateFallbackThumbnail, dataURLtoBuffer } from "./utils/videoProcessor.ts";
import { ensureStorageBuckets, uploadToStorage } from "./utils/storageManager.ts";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`Processing video ID: ${videoId}`);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Initialized Gemini AI with model: gemini-1.5-flash");

    // Get video details
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError);
      throw new Error(`Could not find video with ID: ${videoId}`);
    }

    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    console.log(`Found video: ${video.title}, source: ${video.source}, url: ${video.url}`);

    // Update video status to processing
    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId);
    
    if (updateError) {
      console.error('Error updating video status:', updateError);
      throw new Error(`Failed to update video status: ${updateError.message}`);
    }

    // Start background processing
    const processVideoTask = async () => {
      try {
        await processVideo(videoId, video, supabaseClient, model);
      } catch (error) {
        console.error(`Error in processing task:`, error);
        
        // Update video status to error
        await supabaseClient
          .from('videos')
          .update({ 
            status: 'error', 
            error_message: error.message
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
    console.error(`Error:`, error);
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

/**
 * Main video processing function
 * @param videoId ID of the video to process
 * @param video Video object with details
 * @param supabaseClient Supabase client instance
 * @param model Gemini AI model
 */
async function processVideo(videoId: string, video: any, supabaseClient: any, model: any) {
  console.log(`Starting video processing for ID: ${videoId}`);
  
  try {
    // Analyze video content using Gemini
    const videoSegments = await analyzeVideoContent(video, model);
    console.log(`Identified ${videoSegments.length} segments for shorts`);
    
    // Ensure shorts bucket exists
    const bucketCreated = await ensureStorageBuckets(supabaseClient);
    
    if (!bucketCreated) {
      console.error('Failed to ensure storage buckets exist');
      throw new Error('Storage setup failed');
    }
    
    console.log('Storage buckets created/verified successfully');
    
    // Process each segment and create shorts
    const shortsData = [];
    
    for (let i = 0; i < videoSegments.length; i++) {
      try {
        const segment = videoSegments[i];
        console.log(`Processing segment ${i+1}: ${segment.title}`);
        
        // Generate file paths for this short
        const videoFilePath = `${videoId}_short_${i + 1}.mp4`;
        const thumbnailFilePath = `${videoId}_thumb_${i + 1}.jpg`;
        
        // Create video segment using Flask backend
        const { metadata } = await createVideoSegment(videoId, segment, video.url, supabaseClient);
        
        // Generate a fallback thumbnail 
        console.log(`Generating fallback thumbnail for: ${metadata.title}`);
        const fallbackThumb = generateFallbackThumbnail(metadata.title);
        const fallbackBuffer = dataURLtoBuffer(fallbackThumb);
        
        // Upload placeholder video file (in production, you'd use a real video file)
        console.log(`Uploading placeholder for segment "${metadata.title}" to ${videoFilePath}`);
        const placeholderVideo = new Uint8Array(1024); // Just a placeholder
        
        // Upload placeholder to storage
        const videoUploadResult = await uploadToStorage(
          supabaseClient,
          'shorts',
          videoFilePath,
          placeholderVideo,
          'video/mp4'
        );
        
        if (!videoUploadResult.success) {
          console.error(`Failed to upload video placeholder:`, videoUploadResult.error);
          continue;
        }
        
        // Upload thumbnail to storage
        const thumbUploadResult = await uploadToStorage(
          supabaseClient,
          'shorts',
          thumbnailFilePath,
          fallbackBuffer,
          'image/svg+xml'
        );
        
        if (!thumbUploadResult.success) {
          console.error(`Error uploading thumbnail:`, thumbUploadResult.error);
          continue;
        }
        
        if (!videoUploadResult.publicUrl || !thumbUploadResult.publicUrl) {
          console.error('Failed to generate public URLs for files');
          continue;
        }
        
        console.log(`Generated public URLs for video and thumbnail:`, {
          videoUrl: videoUploadResult.publicUrl,
          thumbnailUrl: thumbUploadResult.publicUrl
        });
        
        // Add to shorts data for database
        shortsData.push({
          title: metadata.title,
          description: metadata.description,
          duration: metadata.duration,
          timestamp: metadata.timestamp,
          thumbnail_url: thumbUploadResult.publicUrl,
          file_path: videoFilePath,
          video_id: videoId,
          views: 0,
          url: videoUploadResult.publicUrl,
          metadata: metadata
        });
      } catch (segmentError) {
        console.error(`Error processing segment ${i+1}:`, segmentError);
        // Continue to next segment if one fails
      }
    }
    
    console.log(`Creating ${shortsData.length} shorts entries in database`);
    
    // Insert shorts into database
    for (const shortData of shortsData) {
      const { error: insertError } = await supabaseClient
        .from('shorts')
        .insert(shortData);
        
      if (insertError) {
        console.error(`Error inserting short:`, insertError);
      } else {
        console.log(`Successfully inserted short: ${shortData.title}`);
      }
    }
    
    // Update video status to complete
    const { error: completeError } = await supabaseClient
      .from('videos')
      .update({ status: 'complete' })
      .eq('id', videoId);
      
    if (completeError) {
      console.error(`Error updating video status to complete:`, completeError);
      throw new Error(`Failed to update video status to complete: ${completeError.message}`);
    }
    
    console.log(`Video processing complete for ID: ${videoId}`);
  } catch (error) {
    console.error(`Error in video processing:`, error);
    throw error;
  }
}
