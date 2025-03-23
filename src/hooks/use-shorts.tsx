
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Short } from "@/types/supabase";
import { showToast } from "@/utils/toast-helper";

export const useShorts = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);

  const fetchShorts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shorts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("Fetched shorts:", data);
      setShorts(data || []);
      
      // For each short, check if the signed URL is expired and refresh if needed
      if (data && data.length > 0) {
        const updatedShorts = await Promise.all(data.map(async (short) => {
          // If url exists but might be expired, refresh it
          if (short.file_path) {
            try {
              const { data: { signedUrl } } = await supabase.storage
                .from('shorts')
                .createSignedUrl(short.file_path, 604800); // 7 days
                
              if (signedUrl) {
                return { ...short, url: signedUrl };
              }
            } catch (error) {
              console.error(`Error refreshing signed URL for short ${short.id}:`, error);
            }
          }
          return short;
        }));
        
        setShorts(updatedShorts);
      }

      showToast.success(
        "Shorts Loaded",
        `${data?.length || 0} shorts retrieved successfully`
      );
    } catch (error) {
      console.error("Error fetching shorts:", error);
      showToast.error(
        "Failed to Load Shorts",
        error instanceof Error ? error.message : "An error occurred loading your shorts"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (shortId: string) => {
    try {
      // Find the short to get the file path
      const shortToDelete = shorts.find(s => s.id === shortId);
      if (!shortToDelete) return;

      // Delete the file from storage if file_path exists
      if (shortToDelete.file_path) {
        const { error: storageError } = await supabase.storage
          .from('shorts')
          .remove([shortToDelete.file_path]);

        if (storageError) {
          console.warn("Error removing file from storage:", storageError);
          // Continue with DB deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('shorts')
        .delete()
        .eq('id', shortId);

      if (error) throw error;

      // Update local state
      setShorts(shorts.filter(short => short.id !== shortId));
      
      showToast.success(
        "Short Deleted",
        "The short has been successfully deleted"
      );
    } catch (error) {
      console.error("Error deleting short:", error);
      showToast.error(
        "Delete Failed",
        error instanceof Error ? error.message : "Failed to delete the short"
      );
    }
  };

  const handleDownload = async (short: Short) => {
    try {
      if (!short.file_path) {
        showToast.error("Download Failed", "No file path available for this short");
        return;
      }

      console.log("Attempting to download file from path:", short.file_path);
      
      // Get a fresh signed URL for the file
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('shorts')
        .createSignedUrl(short.file_path, 60); // 1 minute expiry for download
        
      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        throw new Error("Failed to generate download link");
      }
      
      if (!signedUrlData || !signedUrlData.signedUrl) {
        throw new Error("No signed URL received from server");
      }
      
      // Create a hidden anchor and trigger download
      const a = document.createElement('a');
      a.href = signedUrlData.signedUrl;
      a.download = `${short.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      showToast.success("Download Started", "Your short is being downloaded");
    } catch (error) {
      console.error("Error downloading short:", error);
      showToast.error(
        "Download Failed",
        error instanceof Error ? error.message : "Failed to download the short"
      );
    }
  };

  const handleShare = async (short: Short) => {
    try {
      // Get a fresh signed URL that lasts longer for sharing
      let shareUrl = short.url;
      
      if (short.file_path) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('shorts')
          .createSignedUrl(short.file_path, 604800); // 7 days for sharing
          
        if (!signedUrlError && signedUrlData && signedUrlData.signedUrl) {
          shareUrl = signedUrlData.signedUrl;
        }
      }
      
      if (!shareUrl) {
        throw new Error("No URL available to share");
      }
      
      if (navigator.share) {
        await navigator.share({
          title: short.title,
          text: short.description || `Check out this short: ${short.title}`,
          url: shareUrl
        });
        
        showToast.success("Shared Successfully", "Your short has been shared");
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(shareUrl);
        showToast.success("Link Copied", "Short URL copied to clipboard");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      if (error instanceof Error && error.name !== 'AbortError') {
        showToast.error(
          "Share Failed", 
          error.message
        );
      }
    }
  };

  const incrementViews = async (shortId: string) => {
    try {
      // Update views count in database
      await supabase
        .from('shorts')
        .update({ views: shorts.find(s => s.id === shortId)?.views + 1 || 1 })
        .eq('id', shortId);
      
      // Update local state
      setShorts(shorts.map(short => 
        short.id === shortId ? { ...short, views: (short.views || 0) + 1 } : short
      ));
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const handlePlayPause = (shortId: string) => {
    if (playing === shortId) {
      setPlaying(null);
    } else {
      setPlaying(shortId);
      incrementViews(shortId);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  return {
    shorts,
    isLoading,
    playing,
    fetchShorts,
    handleDelete,
    handleDownload,
    handleShare,
    handlePlayPause
  };
};
