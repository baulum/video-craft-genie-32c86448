import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, RefreshCw, Check, Clock, AlertCircle, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/utils/toast-helper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Short } from "@/types/supabase";
import { ShortPreviewCard } from "@/components/dashboard/ShortPreviewCard";

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
  const [processingStatus, setProcessingStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generatedShorts, setGeneratedShorts] = useState<Short[]>([]);

  useEffect(() => {
    if (!video.id || processingStatus !== "processing") return;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('status, error_message')
          .eq('id', video.id)
          .single();

        if (error) throw error;

        if (data) {
          if (data.status === 'complete') {
            setProcessingStatus("success");
            setIsProcessing(false);
            setProcessingProgress(100);
            showToast.success(
              "Processing Complete",
              "Your shorts have been generated successfully!"
            );
            fetchGeneratedShorts();
          } else if (data.status === 'error') {
            setProcessingStatus("error");
            setIsProcessing(false);
            setErrorMessage(data.error_message || "An error occurred during processing. Please try again.");
            showToast.error(
              "Processing Failed",
              data.error_message || "There was an error generating your shorts."
            );
          } else if (data.status === 'processing') {
            setProcessingProgress(prev => Math.min(prev + 5, 90));
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [video.id, processingStatus]);

  const fetchGeneratedShorts = async () => {
    if (!video.id) return;
    
    try {
      const { data, error } = await supabase
        .from('shorts')
        .select('*')
        .eq('video_id', video.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Retrieved generated shorts:", data);
      setGeneratedShorts(data || []);
    } catch (error) {
      console.error("Error fetching generated shorts:", error);
      showToast.error(
        "Error",
        "Failed to load generated shorts"
      );
    }
  };

  const handleGenerateShorts = async () => {
    if (!video.id) {
      showToast.error(
        "Error",
        "Video ID is missing. Please upload the video again."
      );
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("processing");
    setErrorMessage(null);
    setProcessingProgress(10); // Start with some progress
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-shorts', {
        body: { videoId: video.id }
      });

      if (error) {
        throw error;
      }

      setProcessingProgress(30); // Jump progress after successful invocation
      
      showToast.success(
        "Processing Started",
        "Your video is being analyzed and shorts are being generated. This may take a few minutes."
      );
      
      onStartProcessing();
    } catch (error) {
      console.error('Error generating shorts:', error);
      setProcessingStatus("error");
      setIsProcessing(false);
      setProcessingProgress(0);
      setErrorMessage(error instanceof Error ? error.message : "Failed to start shorts generation.");
      showToast.error(
        "Processing Failed",
        error instanceof Error ? error.message : "Failed to start shorts generation."
      );
    }
  };

  const getProcessingStatusUI = () => {
    switch (processingStatus) {
      case "processing":
        return (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-amber-500">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 animate-pulse" />
                <span>Processing your video...</span>
              </div>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
            <p className="text-xs text-gray-500">
              This process may take several minutes depending on the video length
            </p>
          </div>
        );
      case "success":
        return (
          <div className="flex items-center space-x-2 text-green-500">
            <Check className="h-4 w-4" />
            <span>Shorts generated successfully!</span>
          </div>
        );
      case "error":
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || "Failed to generate shorts. Please try again."}
            </AlertDescription>
          </Alert>
        );
      default:
        return (
          <div className="text-sm text-gray-500">
            Ready to create shorts from this video
          </div>
        );
    }
  };

  const renderVideoPreview = () => {
    if (video.source === "youtube") {
      const youtubeId = getYoutubeVideoId(video.url);
      if (youtubeId) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        );
      }
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-100 dark:bg-gray-800">
        <Video className="h-16 w-16 mb-2 text-gray-400" />
        <p className="text-center max-w-xs">{video.title}</p>
      </div>
    );
  };

  function getYoutubeVideoId(url: string): string | null {
    if (!url) return null;
    
    const regexes = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
    ];
    
    for (const regex of regexes) {
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{video.title}</span>
            <Button variant="outline" size="sm" onClick={onNewUpload} disabled={isProcessing}>
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
            {renderVideoPreview()}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {getProcessingStatusUI()}
          <Button 
            onClick={handleGenerateShorts} 
            disabled={isProcessing || processingStatus === "success"}
            className={`w-full ${processingStatus === "success" ? "bg-green-500 hover:bg-green-600" : ""}`}
          >
            <Scissors className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : processingStatus === "success" ? "Shorts Generated" : "Generate Shorts"}
          </Button>
          
          {processingStatus === "success" && generatedShorts.length > 0 && (
            <div className="mt-4 w-full">
              <p className="text-sm font-medium mb-2">Generated Shorts:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {generatedShorts.map(short => (
                  <ShortPreviewCard key={short.id} short={short} />
                ))}
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      {processingStatus === "success" && generatedShorts.length > 0 && false && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Shorts</CardTitle>
            <CardDescription>
              These shorts were created from your video
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedShorts.map(short => (
                <ShortPreviewCard key={short.id} short={short} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
