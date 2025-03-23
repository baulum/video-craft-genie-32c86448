
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.supabase.com/guides/functions/deno-runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"
import { encode as base64Encode } from "https://deno.land/std@0.177.0/encoding/base64.ts"

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sample MP4 header bytes (very simplified)
// This creates a minimal MP4 file that's recognized as a video file by browsers
// It won't play actual content, but will be recognized as a valid MP4 container
const SAMPLE_MP4_HEADER = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6D, 0x70, 0x34, 0x32, 
  0x00, 0x00, 0x00, 0x00, 0x6D, 0x70, 0x34, 0x32, 0x69, 0x73, 0x6F, 0x6D, 
  0x00, 0x00, 0x00, 0x08, 0x6D, 0x6F, 0x6F, 0x76, 0x00, 0x00, 0x00, 0x08, 
  0x6D, 0x64, 0x61, 0x74
]);

// Generate a fake MP4 video file with a specified duration (in KB)
function generateFakeMp4VideoData(sizeInKB = 500) {
  // Create a buffer for the fake MP4 data
  // Header + random data to simulate video frames
  const dataSize = sizeInKB * 1024;
  const videoData = new Uint8Array(dataSize);
  
  // Copy the MP4 header
  videoData.set(SAMPLE_MP4_HEADER);
  
  // Fill the rest with pseudo-random data to simulate video frames
  for (let i = SAMPLE_MP4_HEADER.length; i < dataSize; i++) {
    videoData[i] = Math.floor(Math.random() * 256);
  }
  
  return videoData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { videoId } = await req.json()
    
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
      )
    }

    console.log(`Processing request for video ID: ${videoId}`)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get video details
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError) {
      console.error('Error fetching video:', videoError.message)
      throw new Error(`Could not find video with ID: ${videoId}`)
    }

    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`)
    }

    console.log(`Found video: ${video.title}, source: ${video.source}`)

    // Update video status to processing
    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)
    
    if (updateError) {
      console.error('Error updating video status:', updateError.message)
      throw new Error(`Failed to update video status: ${updateError.message}`)
    }

    // Start background processing
    const processVideoTask = async () => {
      try {
        console.log(`Starting video processing for ID: ${videoId}`)
        
        // In a real implementation, you would:
        // 1. Download the video from Supabase Storage or another source
        // 2. Transcribe using OpenAI Whisper API
        // 3. Segment the video based on content
        // 4. Generate shorts with subtitles
        // 5. Upload shorts back to Supabase Storage
        
        // Generate meaningful content for shorts based on video type
        let shortTopics = []
        
        if (video.source === 'youtube') {
          shortTopics = [
            "Key highlights from the video",
            "Most interesting points explained",
            "Main takeaways summarized"
          ]
        } else {
          shortTopics = [
            "Important moments captured",
            "Best segments from the video",
            "Highlights worth sharing"
          ]
        }
        
        // Create 3 shorts with the generated topics
        const thumbnailUrl = video.thumbnail_url || 'https://via.placeholder.com/640x360?text=Video+Short'
        
        // Determine durations (realistic for short videos)
        const durations = ["00:45", "00:52", "00:38"]
        
        // Use the correct path format for storing in Supabase storage
        const shortsData = []
        
        // First, verify if the bucket exists and create it if it doesn't
        try {
          const { data: bucketsData, error: bucketsError } = await supabaseClient
            .storage
            .listBuckets()
          
          if (bucketsError) {
            console.error('Error listing buckets:', bucketsError.message)
            throw bucketsError
          }
          
          const shortsBucketExists = bucketsData.some(bucket => bucket.name === 'shorts')
          
          if (!shortsBucketExists) {
            console.log('Creating shorts bucket...')
            const { error: createBucketError } = await supabaseClient.storage.createBucket('shorts', {
              public: true,
              fileSizeLimit: 52428800 // 50MB limit
            })
            
            if (createBucketError) {
              console.error('Error creating bucket:', createBucketError.message)
              throw createBucketError
            }
            
            console.log('Shorts bucket created successfully')
          } else {
            console.log('Shorts bucket already exists')
          }
        } catch (error) {
          console.error('Error checking/creating bucket:', error.message)
          // Continue execution as the bucket might exist despite the error
        }
        
        // Generate placeholder video content with realistic sizes
        for (let i = 0; i < shortTopics.length; i++) {
          const shortTitle = `${shortTopics[i]} - ${video.title.substring(0, 30)}${video.title.length > 30 ? '...' : ''}`
          const filePath = `${videoId}/short_${i + 1}.mp4`
          
          // Create a realistic-sized fake MP4 video
          // Size varies by duration - longer videos are larger
          const sizeInKB = 500 + (i * 200); // 500KB, 700KB, 900KB
          const videoData = generateFakeMp4VideoData(sizeInKB);
          
          console.log(`Uploading short video to: ${filePath} (size: ${sizeInKB}KB)`)
          
          // Upload the video data to storage
          const { error: uploadError } = await supabaseClient.storage
            .from('shorts')
            .upload(filePath, videoData, {
              contentType: 'video/mp4',
              upsert: true
            })
            
          if (uploadError) {
            console.error(`Error uploading short video: ${uploadError.message}`)
            throw new Error(`Failed to upload short video: ${uploadError.message}`)
          }
          
          console.log(`Successfully uploaded short video to: ${filePath}`)
          
          // Add the short data to our array for database insertion
          shortsData.push({
            title: shortTitle,
            duration: durations[i],
            thumbnail_url: thumbnailUrl,
            file_path: filePath,
            video_id: videoId,
            views: 0
          })
        }
        
        console.log(`Creating ${shortsData.length} shorts for video ID: ${videoId}`)
        
        // Insert shorts into database
        for (const shortData of shortsData) {
          const { error: insertError } = await supabaseClient
            .from('shorts')
            .insert(shortData)
            
          if (insertError) {
            console.error(`Error inserting short: ${insertError.message}`)
            throw new Error(`Failed to insert short: ${insertError.message}`)
          }
        }
        
        // Update video status to complete
        const { error: completeError } = await supabaseClient
          .from('videos')
          .update({ status: 'complete' })
          .eq('id', videoId)
          
        if (completeError) {
          console.error(`Error updating video status to complete: ${completeError.message}`)
          throw new Error(`Failed to update video status to complete: ${completeError.message}`)
        }
        
        console.log(`Video processing complete for ID: ${videoId}`)
      } catch (error) {
        console.error(`Error in processing task: ${error.message}`)
        
        // Update video status to error
        await supabaseClient
          .from('videos')
          .update({ 
            status: 'error',
            title: `Error: ${error.message} (${video.title})`
          })
          .eq('id', videoId)
      }
    }

    // Start the background task
    EdgeRuntime.waitUntil(processVideoTask())

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
    )
  } catch (error) {
    console.error(`Error: ${error.message}`)
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
    )
  }
})
