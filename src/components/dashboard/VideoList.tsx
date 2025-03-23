import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Upload, Film, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { showToast } from "@/utils/toast-helper";
import { VideoListActions } from "./VideoListActions";

export const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const loadVideos = async () => {
    try {
      setLoading(true);
      console.log("Fetching videos from Supabase...");
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error loading videos:", error);
        throw error;
      }
      
      console.log(`Successfully loaded ${data?.length || 0} videos`);
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      showToast.error(
        "Failed to Load Videos",
        "There was an error loading your videos. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadVideos();
    
    // Subscribe to changes
    const channel = supabase
      .channel('public:videos')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'videos' 
      }, () => {
        loadVideos();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const handleDelete = () => {
    loadVideos();
  };
  
  const handleReprocess = () => {
    loadVideos();
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const filteredVideos = searchQuery
    ? videos.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;
    
  const getStatusBadge = (status) => {
    switch (status) {
      case 'complete':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-amber-500">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status || 'Pending'}
          </Badge>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Input placeholder="Search videos..." className="max-w-sm" disabled />
        </div>
        
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-36 h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">No Videos Found</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Film className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-muted-foreground mb-4">
            You haven't uploaded any videos yet. Get started by uploading your first video.
          </p>
          <Link to="/dashboard?tab=upload">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Search videos..." 
          value={searchQuery}
          onChange={handleSearch}
          className="max-w-sm"
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSearchQuery("")}
          >
            Clear
          </Button>
        )}
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredVideos.length === 0 ? (
              <div className="p-6 text-center">
                <p>No videos match your search.</p>
              </div>
            ) : (
              filteredVideos.map((video) => (
                <div key={video.id} className="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex-shrink-0 w-36 h-20 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mr-4">
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/640x360?text=Video";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        <Film className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{video.title}</h3>
                      <VideoListActions 
                        videoId={video.id} 
                        onDelete={handleDelete}
                        onReprocess={video.status === 'error' ? handleReprocess : undefined}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>Status: {getStatusBadge(video.status)}</span>
                      <span>•</span>
                      <span>Source: {video.source === 'youtube' ? 'YouTube' : 'Uploaded'}</span>
                      {video.duration && (
                        <>
                          <span>•</span>
                          <span>Duration: {video.duration}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Added: {new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {video.error_message && (
                      <div className="mt-2 text-sm text-red-500">
                        <AlertTriangle className="inline h-3 w-3 mr-1" />
                        Error: {video.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
