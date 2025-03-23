
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoWithThumbnail } from "@/types/supabase";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { format } from 'date-fns';
import { MoreVertical, Edit, Trash2, Play } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const VideoList = () => {
  const [videos, setVideos] = useState<VideoWithThumbnail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Ensure valid thumbnail URLs
        const videosWithValidThumbnails = data?.map(video => ({
          ...video,
          thumbnail_url: video.thumbnail_url || 'https://via.placeholder.com/640x360?text=No+Thumbnail'
        })) || [];
        
        setVideos(videosWithValidThumbnails);
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, []);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {loading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <Card key={`skeleton-${index}`} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden animate-pulse">
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </Card>
        ))
      ) : videos.length > 0 ? (
        videos.map((video) => (
          <Card key={video.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden relative">
            <div className="w-full h-48 relative">
              <img 
                src={video.thumbnail_url || 'https://via.placeholder.com/640x360?text=No+Thumbnail'} 
                alt={video.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/640x360?text=Error+Loading+Image';
                }}
              />
              {video.status === 'processing' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-white font-medium">Processing...</div>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{video.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uploaded on {video.created_at ? format(new Date(video.created_at), 'MMM dd, yyyy') : 'Unknown Date'}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Status: <span className={`font-medium ${
                  video.status === 'complete' ? 'text-green-500' : 
                  video.status === 'processing' ? 'text-amber-500' : 
                  video.status === 'error' ? 'text-red-500' : 'text-gray-500'
                }`}>{video.status}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="absolute top-2 right-2 bg-black/40 rounded-full p-1">
                <MoreVertical className="h-4 w-4 text-white hover:text-gray-200 cursor-pointer" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/video/${video.id}`} className="flex items-center">
                    <Play className="mr-2 h-4 w-4" /> Watch
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))
      ) : (
        <div className="col-span-full text-center p-8">
          <Play className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-1">No videos found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Upload your first video to get started with ClipFarm
          </p>
          <Link to="/dashboard?tab=upload" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Upload video
          </Link>
        </div>
      )}
    </div>
  );
};
