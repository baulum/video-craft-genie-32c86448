
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, RefreshCw, Download } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface VideoPreviewProps {
  video: {
    id?: string;
    url: string;
    title: string;
    source: "file" | "youtube";
  };
  onStartProcessing: () => void;
  onNewUpload: () => void;
}

export const VideoPreview = ({ video, onStartProcessing, onNewUpload }: VideoPreviewProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateShorts = async () => {
    if (!video.id) {
      toast({
        title: "Error",
        description: "Video ID is missing. Please upload the video again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-shorts', {
        body: { videoId: video.id }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Processing Started",
        description: "Your video is being analyzed and shorts are being generated.",
        variant: "default",
      });
      
      onStartProcessing();
    } catch (error) {
      console.error('Error generating shorts:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to start shorts generation.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{video.title}</span>
            <Button variant="outline" size="sm" onClick={onNewUpload}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Upload Another Video
            </Button>
          </CardTitle>
          <CardDescription>
            {video.source === "youtube" 
              ? "Imported from YouTube" 
              : "Uploaded from your device"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
            {video.source === "youtube" ? (
              <iframe
                src={video.url}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 bg-gray-200 dark:bg-gray-700">
                <p>Video preview would be shown here</p>
                {/* In a real app, this would be a video player */}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Ready to create shorts from this video
          </div>
          <Button onClick={handleGenerateShorts} disabled={isProcessing}>
            <Scissors className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : "Generate Shorts"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
