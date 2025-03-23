
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Eye } from "lucide-react";
import { useState } from "react";
import { Short } from "@/types/supabase";
import { showToast } from "@/utils/toast-helper";

interface ShortPreviewCardProps {
  short: Short;
}

export const ShortPreviewCard = ({ short }: ShortPreviewCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Generate a fallback thumbnail if none is provided
  const thumbnailUrl = short.thumbnail_url || 
    `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjExMzYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzM2NTFDOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iI2ZmZmZmZiI+JHtzaG9ydC50aXRsZX08L3RleHQ+PC9zdmc+`;

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="overflow-hidden w-full">
      <CardContent className="p-0 aspect-[9/16] relative bg-gray-100 dark:bg-gray-800">
        {isPlaying ? (
          <video 
            className="w-full h-full object-cover"
            src={short.url}
            autoPlay
            controls
            onError={(e) => {
              console.error("Video playback error:", e);
              showToast.error("Playback Error", "Could not play this short. The video may be missing or corrupted.");
              setIsPlaying(false);
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
              onClick={togglePlayPause}
              size="lg" 
              className="rounded-full w-12 h-12 bg-black/30 hover:bg-black/50 backdrop-blur-sm"
            >
              <Play className="h-6 w-6" />
            </Button>
            
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {short.views || 0}
            </div>
            
            {short.metadata?.duration && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {short.metadata.duration}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={togglePlayPause} className="text-xs">
          {isPlaying ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <div className="text-xs truncate font-medium max-w-32">
          {short.title}
        </div>
      </CardFooter>
    </Card>
  );
};
