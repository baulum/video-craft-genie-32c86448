
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
      
      if (!data || data.length === 0) {
        setShorts([]);
        setIsLoading(false);
        return;
      }
      
      // Instead of checking and refreshing each URL which can cause errors,
      // let's ensure that shorts with valid data are properly displayed
      const validShorts = data.filter(short => 
        short.id && (short.url || short.file_path)
      );
      
      setShorts(validShorts);
      
      // Only show success toast when shorts are loaded, not when the array is empty
      if (validShorts.length > 0) {
        showToast.success(
          "Shorts Loaded",
          `${validShorts.length} shorts retrieved successfully`
        );
      }
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

      // Delete from database first
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
      
      // Then try to delete the file if it exists (but don't block on this)
      if (shortToDelete.file_path) {
        try {
          const { error: storageError } = await supabase.storage
            .from('shorts')
            .remove([shortToDelete.file_path]);

          if (storageError) {
            console.warn("Error removing file from storage:", storageError);
          }
        } catch (error) {
          console.warn("Error checking file existence:", error);
        }
      }
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
      if (!short.url) {
        showToast.error("Download Failed", "No URL available for this short");
        return;
      }

      // Create a hidden anchor and trigger download using the existing URL
      const a = document.createElement('a');
      a.href = short.url;
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
      let shareUrl = short.url;
      
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
      // Don't show error if user canceled the share dialog
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
      // Find the current short to get its views count
      const currentShort = shorts.find(s => s.id === shortId);
      if (!currentShort) return;
      
      // Update views count in database
      await supabase
        .from('shorts')
        .update({ views: (currentShort.views || 0) + 1 })
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
