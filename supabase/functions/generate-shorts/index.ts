
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

    // Update video status to processing
    await supabaseClient
      .from('videos')
      .update({ status: 'processing' })
      .eq('id', videoId)

    // Start background processing
    const processVideoTask = async () => {
      try {
        console.log(`Starting video processing for ID: ${videoId}`)
        
        // Simulate transcription and shorts generation
        // In a real implementation, you would:
        // 1. Download the video from Supabase Storage or another source
        // 2. Transcribe using OpenAI Whisper API
        // 3. Segment the video based on content
        // 4. Generate shorts with subtitles
        // 5. Upload shorts back to Supabase Storage
        
        // Simulate processing time (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 10000))
        
        // Simulate creating 3 shorts
        const shortsData = [
          {
            title: `Short 1 from ${video.title}`,
            duration: "00:45",
            thumbnail_url: video.thumbnail_url,
            file_path: `shorts/${videoId}/short_1.mp4`,
            video_id: videoId
          },
          {
            title: `Short 2 from ${video.title}`,
            duration: "00:35",
            thumbnail_url: video.thumbnail_url,
            file_path: `shorts/${videoId}/short_2.mp4`,
            video_id: videoId
          },
          {
            title: `Short 3 from ${video.title}`,
            duration: "00:55",
            thumbnail_url: video.thumbnail_url,
            file_path: `shorts/${videoId}/short_3.mp4`,
            video_id: videoId
          }
        ]
        
        // Insert shorts into database
        for (const shortData of shortsData) {
          const { error: insertError } = await supabaseClient
            .from('shorts')
            .insert(shortData)
            
          if (insertError) {
            console.error(`Error inserting short: ${insertError.message}`)
          }
        }
        
        // Update video status to complete
        await supabaseClient
          .from('videos')
          .update({ status: 'complete' })
          .eq('id', videoId)
          
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
