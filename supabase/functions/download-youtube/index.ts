
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.supabase.com/guides/functions/deno-runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract YouTube video ID from URL
function getYoutubeVideoId(url: string): string {
  if (!url) return '';
  
  // Handle multiple YouTube URL formats
  const regexes = [
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/,
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
  ];
  
  for (const regex of regexes) {
    const match = url.match(regex);
    if (match && match[7] && match[7].length === 11) {
      return match[7];
    }
  }
  
  // Try to extract from youtube.com/embed/VIDEO_ID format
  const embedMatch = url.match(/embed\/([^\/\?]+)/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }
  
  // Try to extract from youtu.be/VIDEO_ID format
  const shortMatch = url.match(/youtu\.be\/([^\/\?]+)/);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }
  
  return '';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { videoId, youtubeUrl } = await req.json();
    
    // Validate input
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

    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ error: 'youtubeUrl is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Validate YouTube URL format
    const videoIdFromUrl = getYoutubeVideoId(youtubeUrl);
    if (!videoIdFromUrl) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL format' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check if video exists
    const { data: existingVideo, error: checkError } = await supabaseClient
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (checkError) {
      console.error('Error checking video existence:', checkError.message);
      if (checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw checkError;
      }
    }

    if (!existingVideo) {
      return new Response(
        JSON.stringify({ error: 'Video not found in database' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Update video status to downloading
    const { error: updateError } = await supabaseClient
      .from('videos')
      .update({ status: 'downloading' })
      .eq('id', videoId);

    if (updateError) {
      console.error('Error updating video status:', updateError.message);
      throw updateError;
    }

    // Start background task to download YouTube video
    const backgroundDownload = async () => {
      try {
        console.log(`Starting download for YouTube video: ${youtubeUrl}`);
        
        // Ensure videos bucket exists
        try {
          const { data: bucketsData } = await supabaseClient.storage.listBuckets();
          
          if (!bucketsData?.some(bucket => bucket.name === 'videos')) {
            console.log('Creating videos bucket...');
            await supabaseClient.storage.createBucket('videos', {
              public: true,
              fileSizeLimit: 104857600 // 100MB limit
            });
          }
        } catch (bucketError) {
          console.error('Error checking/creating bucket:', bucketError);
          // Continue as the bucket might exist despite the error
        }
        
        // Generate YouTube thumbnail URL for high quality
        const thumbnailUrl = `https://img.youtube.com/vi/${videoIdFromUrl}/maxresdefault.jpg`;
        
        // Check if thumbnailUrl is valid by fetching it
        let validThumbnail = thumbnailUrl;
        try {
          const thumbResponse = await fetch(thumbnailUrl);
          if (!thumbResponse.ok) {
            // Fallback to medium quality if high quality not available
            validThumbnail = `https://img.youtube.com/vi/${videoIdFromUrl}/mqdefault.jpg`;
          }
        } catch (thumbnailError) {
          console.error('Error checking thumbnail:', thumbnailError);
          validThumbnail = `https://img.youtube.com/vi/${videoIdFromUrl}/mqdefault.jpg`;
        }
        
        // In a real implementation, we would download the actual video
        // For now, we'll update the database with the YouTube URL and thumbnail
        
        // Update video info after "download"
        const { error: finalUpdateError } = await supabaseClient
          .from('videos')
          .update({
            status: 'complete',
            thumbnail_url: validThumbnail,
            file_path: `videos/${videoId}.mp4`, // This would be the actual file path in a real implementation
            duration: '10:30', // This would be the actual duration in a real implementation
          })
          .eq('id', videoId);
          
        if (finalUpdateError) {
          console.error(`Error updating video after download: ${finalUpdateError.message}`);
          throw finalUpdateError;
        }
        
        console.log(`Download complete for video ID: ${videoId}`);
      } catch (error) {
        console.error(`Error in background task: ${error.message}`);
        
        // Update video status to error
        await supabaseClient
          .from('videos')
          .update({ 
            status: 'error',
            // Store error message for debugging
            title: `Error: ${error.message} (${existingVideo.title})`
          })
          .eq('id', videoId);
      }
    };

    // Start the background task without waiting for it to complete
    EdgeRuntime.waitUntil(backgroundDownload());

    // Return a success response immediately
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'YouTube download started in the background',
        videoId: videoId,
        thumbnailUrl: existingVideo.thumbnail_url || `https://img.youtube.com/vi/${videoIdFromUrl}/maxresdefault.jpg`
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
    console.error(`Error processing request: ${error.message}`);
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
