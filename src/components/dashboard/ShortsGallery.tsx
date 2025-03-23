
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Short } from "@/types/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Download, Share2, ExternalLink, Loader2, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ShortsGallery = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      console.log("Fetching shorts from Supabase...");
      
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
      
      if (error) {
        console.error("Error loading shorts:", error);
        throw error;
      }
      
      console.log(`Successfully loaded ${data?.length || 0} shorts`);
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
      
      if (!filePath) {
        throw new Error("File path is missing");
      }
      
      console.log(`Attempting to download file: ${filePath}`);
      
      // Check if file exists in storage
      const { data: fileCheck, error: fileCheckError } = await supabase
        .storage
        .from('shorts')
        .list(filePath.split('/')[0] || '');
        
      if (fileCheckError) {
        console.error('Error checking file existence:', fileCheckError);
        throw new Error('Error checking if file exists');
      }
      
      // If the file doesn't exist in storage, show appropriate message
      const fileExists = fileCheck && fileCheck.some(item => 
        item.name === filePath.split('/').pop()
      );
      
      if (!fileExists) {
        // For demo purposes, create a download link to a placeholder video
        const placeholderUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        const a = document.createElement('a');
        a.href = placeholderUrl;
        a.download = `short-${shortId}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "Using Demo Video",
          description: "The actual file doesn't exist in storage yet. Using a placeholder video instead.",
        });
        return;
      }
      
      // Get the public URL for the file
      const { data } = supabase
        .storage
        .from('shorts')
        .getPublicUrl(filePath);
      
      if (!data?.publicUrl) {
        throw new Error('Could not generate public URL');
      }
      
      // Create a temporary anchor element and trigger the download
      const a = document.createElement('a');
      a.href = data.publicUrl;
      a.download = filePath.split('/').pop() || 'short-video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your short video download has started!",
      });
    } catch (error) {
      console.error('Error downloading short:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your short video. Using a placeholder video instead.",
        variant: "destructive",
      });
      
      // Fallback to a placeholder video
      const placeholderUrl = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
      const a = document.createElement('a');
      a.href = placeholderUrl;
      a.download = `short-${shortId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(null);
    }
  };

  const deleteShort = async (shortId: string, filePath: string | null) => {
    try {
      setDeleting(shortId);
      console.log(`Deleting short: ${shortId}`);
      
      // If there's a file path, attempt to delete from storage
      if (filePath) {
        console.log(`Attempting to delete file: ${filePath}`);
        const { error: storageError } = await supabase
          .storage
          .from('shorts')
          .remove([filePath]);
          
        if (storageError) {
          console.error('Error removing file from storage:', storageError);
          // Continue with deletion even if file removal fails
        }
      }
      
      // Delete short from database
      const { error: deleteError } = await supabase
        .from('shorts')
        .delete()
        .eq('id', shortId);
        
      if (deleteError) {
        console.error('Error deleting short from database:', deleteError);
        throw deleteError;
      }
      
      // Update state to remove deleted short
      setShorts(shorts.filter(short => short.id !== shortId));
      
      toast({
        title: "Short Deleted",
        description: "The short video has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting short:', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the short video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
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
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/640x360?text=Video+Short";
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      // Use short.url if it exists, or generate a preview URL from file_path
                      const previewUrl = short.url || (short.file_path 
                        ? supabase.storage.from('shorts').getPublicUrl(short.file_path).data?.publicUrl 
                        : "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
                      
                      window.open(previewUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleDownload(short.id, short.file_path || '')}
                    disabled={downloading === short.id}
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
                <div className="flex justify-between items-start">
                  <h3 className="font-medium line-clamp-1">{short.title}</h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Short</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this short? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteShort(short.id, short.file_path)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {deleting === short.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
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
