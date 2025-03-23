
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
              // Check if file exists before creating signed URL
              const { data: fileExists } = await supabase.storage
                .from('shorts')
                .list(short.file_path.split('/').slice(0, -1).join('/') || '');
                
              const fileName = short.file_path.split('/').pop();
              const fileExistsInBucket = fileExists?.some(file => file.name === fileName);
              
              if (fileExistsInBucket) {
                const { data: signedUrlData } = await supabase.storage
                  .from('shorts')
                  .createSignedUrl(short.file_path, 604800); // 7 days
                  
                if (signedUrlData?.signedUrl) {
                  return { ...short, url: signedUrlData.signedUrl };
                }
              } else {
                console.log(`File does not exist at path: ${short.file_path}`);
              }
            } catch (error) {
              console.error(`Error refreshing signed URL for short ${short.id}:`, error);
            }
          }
          return short;
        }));
        
        setShorts(updatedShorts);
      }

      // Only show success toast when shorts are loaded, not when the array is empty
      if (data && data.length > 0) {
        showToast.success(
          "Shorts Loaded",
          `${data.length} shorts retrieved successfully`
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

      // Delete the file from storage if file_path exists
      if (shortToDelete.file_path) {
        try {
          // Check if file exists before attempting deletion
          const { data: fileExists } = await supabase.storage
            .from('shorts')
            .list(shortToDelete.file_path.split('/').slice(0, -1).join('/') || '');
            
          const fileName = shortToDelete.file_path.split('/').pop();
          const fileExistsInBucket = fileExists?.some(file => file.name === fileName);
          
          if (fileExistsInBucket) {
            const { error: storageError } = await supabase.storage
              .from('shorts')
              .remove([shortToDelete.file_path]);

            if (storageError) {
              console.warn("Error removing file from storage:", storageError);
              // Continue with DB deletion even if storage deletion fails
            }
          } else {
            console.log(`File does not exist at path: ${shortToDelete.file_path}`);
          }
        } catch (error) {
          console.warn("Error checking file existence:", error);
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
      
      // Check if file exists before creating signed URL
      try {
        const { data: fileExists } = await supabase.storage
          .from('shorts')
          .list(short.file_path.split('/').slice(0, -1).join('/') || '');
          
        const fileName = short.file_path.split('/').pop();
        const fileExistsInBucket = fileExists?.some(file => file.name === fileName);
        
        if (!fileExistsInBucket) {
          throw new Error(`File does not exist at path: ${short.file_path}`);
        }
      } catch (error) {
        console.error("Error checking file existence:", error);
        throw new Error("Failed to verify file existence");
      }
      
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
      let shareUrl = short.url;
      
      // If we have a file_path but no URL, try to get a fresh signed URL for sharing
      if (!shareUrl && short.file_path) {
        try {
          // Check if file exists before creating signed URL
          const { data: fileExists } = await supabase.storage
            .from('shorts')
            .list(short.file_path.split('/').slice(0, -1).join('/') || '');
            
          const fileName = short.file_path.split('/').pop();
          const fileExistsInBucket = fileExists?.some(file => file.name === fileName);
          
          if (fileExistsInBucket) {
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('shorts')
              .createSignedUrl(short.file_path, 604800); // 7 days for sharing
              
            if (!signedUrlError && signedUrlData && signedUrlData.signedUrl) {
              shareUrl = signedUrlData.signedUrl;
            }
          } else {
            throw new Error(`File does not exist at path: ${short.file_path}`);
          }
        } catch (error) {
          console.error("Error checking file existence:", error);
          throw new Error("Could not verify file exists for sharing");
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
