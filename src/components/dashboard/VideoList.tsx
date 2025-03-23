// If this component exists and needs to be updated to use our new types
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
        setVideos(data || []);
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
        <p>Loading videos...</p>
      ) : videos.length > 0 ? (
        videos.map((video) => (
          <Card key={video.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            {video.thumbnail_url ? (
              <img src={video.thumbnail_url} alt={video.title} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <Play className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{video.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uploaded on {video.created_at ? format(new Date(video.created_at), 'MMM dd, yyyy') : 'Unknown Date'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="absolute top-2 right-2">
                <MoreVertical className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" />
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
        <p>No videos found.</p>
      )}
    </div>
  );
};
