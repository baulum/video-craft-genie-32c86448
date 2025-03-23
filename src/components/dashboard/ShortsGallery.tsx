
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Short } from "@/types/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Download, Share2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const ShortsGallery = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadShorts();

    // Set up real-time subscription for new shorts
    const channel = supabase
      .channel('public:shorts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'shorts' 
      }, (payload) => {
        const newShort = payload.new as Short;
        setShorts(currentShorts => [newShort, ...currentShorts]);
        toast({
          title: "New Short Ready",
          description: "A new short video has been generated and is ready to view!",
          variant: "default",
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadShorts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shorts')
        .select(`
          *,
          videos:video_id (
            title,
            thumbnail_url
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setShorts(data || []);
    } catch (error) {
      console.error('Error loading shorts:', error);
      toast({
        title: "Failed to Load Shorts",
        description: "There was an error loading your shorts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (shortId: string, filePath: string) => {
    try {
      setDownloading(shortId);
      
      // Create a signed URL for downloading
      const { data, error } = await supabase.storage
        .from('shorts')
        .createSignedUrl(filePath, 60); // URL valid for 60 seconds
      
      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }
      
      if (!data?.signedUrl) {
        throw new Error('No signed URL returned');
      }
      
      // Create a download link and trigger the download
      const downloadUrl = data.signedUrl;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filePath.split('/').pop() || 'short-video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your short video download has started!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error downloading short:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your short video. The file may not exist in storage.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const shareShort = (shortId: string) => {
    // In a real app, generate a shareable link
    const shareUrl = `${window.location.origin}/shorts/${shortId}`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Check out this short video!',
        url: shareUrl
      }).catch(err => {
        console.error('Error sharing:', err);
        // Fallback - copy to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback - copy to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard!",
          variant: "default",
        });
      },
      () => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy link. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  // If no shorts are available yet, show a placeholder
  if (!loading && shorts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Your Shorts</h2>
        <div className="text-center py-12">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No shorts generated yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Upload a video and let our AI generate engaging short-form content for you automatically.
          </p>
          <Link to="/dashboard?tab=upload">
            <Button>Upload a Video</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Shorts</h2>
        <Button variant="outline" size="sm" onClick={() => loadShorts()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shorts.map((short) => (
            <Card key={short.id} className="overflow-hidden group">
              <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-800">
                <img 
                  src={short.videos?.thumbnail_url || short.thumbnail_url || "https://via.placeholder.com/640x360?text=Video+Short"}
                  alt={short.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleDownload(short.id, short.file_path || '')}
                    disabled={downloading === short.id || !short.file_path}
                  >
                    {downloading === short.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {short.duration || "00:30"}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1">{short.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(short.created_at || '').toLocaleDateString()}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => shareShort(short.id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
