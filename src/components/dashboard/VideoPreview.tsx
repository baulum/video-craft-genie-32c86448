
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, RefreshCw, Download, Check, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  // Check processing status periodically if processing
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
            toast({
              title: "Processing Complete",
              description: "Your shorts have been generated successfully!",
              variant: "default",
            });
          } else if (data.status === 'error') {
            setProcessingStatus("error");
            setIsProcessing(false);
            setErrorMessage(data.error_message || "An error occurred during processing. Please try again.");
            toast({
              title: "Processing Failed",
              description: data.error_message || "There was an error generating your shorts.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [video.id, processingStatus]);

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
    setProcessingStatus("processing");
    setErrorMessage(null);
    
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
      setProcessingStatus("error");
      setIsProcessing(false);
      setErrorMessage(error instanceof Error ? error.message : "Failed to start shorts generation.");
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to start shorts generation.",
        variant: "destructive",
      });
    }
  };

  const getProcessingStatusUI = () => {
    switch (processingStatus) {
      case "processing":
        return (
          <div className="flex items-center space-x-2 text-amber-500">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Processing your video...</span>
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
            {video.source === "youtube" ? (
              <iframe
                src={video.url.replace('watch?v=', 'embed/')}
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
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          {processingStatus === "processing" ? (
            <div className="flex items-center space-x-2 text-amber-500">
              <Clock className="h-4 w-4 animate-pulse" />
              <span>Processing your video...</span>
            </div>
          ) : processingStatus === "success" ? (
            <div className="flex items-center space-x-2 text-green-500">
              <Check className="h-4 w-4" />
              <span>Shorts generated successfully!</span>
            </div>
          ) : processingStatus === "error" ? (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || "Failed to generate shorts. Please try again."}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-gray-500">
              Ready to create shorts from this video
            </div>
          )}
          <Button 
            onClick={handleGenerateShorts} 
            disabled={isProcessing || processingStatus === "success"}
            className={`sm:ml-auto ${processingStatus === "success" ? "bg-green-500 hover:bg-green-600" : ""}`}
          >
            <Scissors className="h-4 w-4 mr-2" />
            {isProcessing ? "Processing..." : processingStatus === "success" ? "Shorts Generated" : "Generate Shorts"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
