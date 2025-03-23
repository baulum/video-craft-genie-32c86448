
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.supabase.com/guides/functions/deno-runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

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
    // Get the request body
    const { videoId, youtubeUrl } = await req.json()
    
    if (!videoId || !youtubeUrl) {
      return new Response(
        JSON.stringify({ error: 'videoId and youtubeUrl are required' }),
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

    // Update video status to downloading
    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ status: 'downloading' })
      .eq('id', videoId)

    if (updateError) {
      throw updateError
    }

    // Start background task to download YouTube video
    const backgroundDownload = async () => {
      try {
        console.log(`Starting download for YouTube video: ${youtubeUrl}`)
        
        // Here we would normally use a library like yt-dlp to download the video
        // But since we can't install external libraries in Edge Functions easily,
        // we'll simulate the download

        // Simulate video processing time (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 10000))
        
        // Update video info after "download"
        const thumbnailUrl = `https://img.youtube.com/vi/${getYoutubeVideoId(youtubeUrl)}/maxresdefault.jpg`
        
        await supabaseClient
          .from('videos')
          .update({
            status: 'complete',
            thumbnail_url: thumbnailUrl,
            file_path: `videos/${videoId}.mp4`, // This would be the actual file path in a real implementation
            duration: '10:30', // This would be the actual duration in a real implementation
          })
          .eq('id', videoId)
          
        console.log(`Download complete for video ID: ${videoId}`)
      } catch (error) {
        console.error(`Error in background task: ${error.message}`)
        
        // Update video status to error
        await supabaseClient
          .from('videos')
          .update({ status: 'error' })
          .eq('id', videoId)
      }
    }

    // Start the background task without waiting for it to complete
    EdgeRuntime.waitUntil(backgroundDownload())

    // Return a success response immediately
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'YouTube download started in the background'
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
      JSON.stringify({ error: error.message }),
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

// Helper function to extract YouTube video ID from URL
function getYoutubeVideoId(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : ''
}
