
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share, Trash2, Play, Pause, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/utils/toast-helper";
import { Short } from "@/types/supabase";

export const ShortsGallery = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [shorts, setShorts] = useState<Short[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    fetchShorts();
  }, []);

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
        short.id === shortId ? { ...short, views: short.views + 1 } : short
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

  const filteredShorts = activeTab === "all" 
    ? shorts 
    : shorts.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Shorts Gallery</h1>
        <Button onClick={fetchShorts} variant="outline" disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Shorts</TabsTrigger>
          <TabsTrigger value="popular">Top 10 Popular</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          {shorts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                {isLoading ? "Loading shorts..." : "No shorts found. Generate some shorts from your videos!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shorts.map(short => (
                <ShortCard 
                  key={short.id}
                  short={short}
                  isPlaying={playing === short.id}
                  onPlayPause={() => handlePlayPause(short.id)}
                  onDelete={() => handleDelete(short.id)}
                  onDownload={() => handleDownload(short)}
                  onShare={() => handleShare(short)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="pt-4">
          {filteredShorts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                {isLoading ? "Loading shorts..." : "No shorts found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShorts.map(short => (
                <ShortCard 
                  key={short.id}
                  short={short}
                  isPlaying={playing === short.id}
                  onPlayPause={() => handlePlayPause(short.id)}
                  onDelete={() => handleDelete(short)}
                  onDownload={() => handleDownload(short)}
                  onShare={() => handleShare(short)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ShortCardProps {
  short: Short;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onShare: () => void;
}

const ShortCard = ({ short, isPlaying, onPlayPause, onDelete, onDownload, onShare }: ShortCardProps) => {
  // Generate a fallback thumbnail if none is provided
  const thumbnailUrl = short.thumbnail_url || 
    `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjExMzYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzM2NTFDOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iI2ZmZmZmZiI+JHtzaG9ydC50aXRsZX08L3RleHQ+PC9zdmc+`;

  // If URL is missing but we have file_path, try to get a signed URL
  useEffect(() => {
    if (!short.url && short.file_path) {
      const getSignedUrl = async () => {
        try {
          const { data } = await supabase.storage
            .from('shorts')
            .createSignedUrl(short.file_path as string, 604800); // 7 days
            
          if (data && data.signedUrl) {
            // We can't modify the original short directly, so this is just for display
            const videoElement = document.getElementById(`video-${short.id}`) as HTMLVideoElement;
            if (videoElement) {
              videoElement.src = data.signedUrl;
            }
          }
        } catch (error) {
          console.error("Error getting signed URL:", error);
        }
      };
      
      getSignedUrl();
    }
  }, [short.id, short.url, short.file_path]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg line-clamp-1">{short.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 aspect-[9/16] relative bg-gray-100 dark:bg-gray-800">
        {isPlaying ? (
          <video 
            id={`video-${short.id}`}
            className="w-full h-full object-cover"
            src={short.url}
            autoPlay
            controls
            onError={(e) => {
              console.error("Video playback error:", e);
              showToast.error("Playback Error", "Could not play this short. The video may be missing or corrupted.");
            }}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={thumbnailUrl} 
              alt={short.title}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // Set a colored background with text as fallback
                target.onerror = null; // Prevent infinite error loop
                target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjExMzYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzM2NTFDOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iI2ZmZmZmZiI+JHtzaG9ydC50aXRsZX08L3RleHQ+PC9zdmc+`;
              }}
            />
            <Button 
              onClick={onPlayPause}
              size="lg" 
              className="rounded-full w-16 h-16 bg-black/30 hover:bg-black/50 backdrop-blur-sm"
            >
              <Play className="h-8 w-8" />
            </Button>
            
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {short.views || 0}
            </div>
            
            {(short.metadata?.duration || short.duration) && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {short.metadata?.duration || short.duration}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={onPlayPause}>
          {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={onShare}>
            <Share className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
