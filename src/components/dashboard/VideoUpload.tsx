import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Link as LinkIcon, Youtube, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VideoPreview } from "@/components/dashboard/VideoPreview";
import { supabase } from "@/integrations/supabase/client";
import { VideoInsert } from "@/types/supabase";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const VideoUpload = () => {
  const navigate = useNavigate();
  const [uploadMethod, setUploadMethod] = useState<"file" | "url" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [uploadedVideo, setUploadedVideo] = useState<{
    id?: string;
    url: string;
    title: string;
    source: "file" | "youtube";
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("uploading");
    setErrorMessage(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          title: file.name,
          url: URL.createObjectURL(file),
          source: 'file',
          status: 'pending',
        } as VideoInsert)
        .select()
        .single();

      if (videoError) throw videoError;

      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      setUploadStatus("success");
      
      setUploadedVideo({
        id: videoData.id,
        url: URL.createObjectURL(file),
        title: file.name,
        source: "file"
      });
      
      toast("Upload completed", {
        description: "Your video has been uploaded successfully!"
      });
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus("error");
      setIsUploading(false);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      toast("Upload failed", {
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleYoutubeUpload = async () => {
    if (!youtubeUrl.trim()) {
      toast("Invalid URL", {
        description: "Please enter a valid YouTube URL",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("uploading");
    setErrorMessage(null);

    try {
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          title: `YouTube Video: ${youtubeUrl}`,
          url: youtubeUrl,
          source: 'youtube',
          status: 'pending',
        } as VideoInsert)
        .select()
        .single();

      if (videoError) {
        throw new Error(`Database error: ${videoError.message}`);
      }

      if (!videoData) {
        throw new Error("Failed to create video record");
      }

      setUploadProgress(30);

      const { data, error } = await supabase.functions.invoke('download-youtube', {
        body: { 
          videoId: videoData.id,
          youtubeUrl: youtubeUrl 
        }
      });
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      setUploadProgress(70);

      setTimeout(() => {
        setUploadProgress(100);
        setIsUploading(false);
        setUploadStatus("success");
        
        setUploadedVideo({
          id: videoData.id,
          url: youtubeUrl,
          title: videoData.title || `YouTube Video: ${youtubeUrl}`,
          source: "youtube"
        });
        
        toast("YouTube video added", {
          description: "Your YouTube video has been imported successfully!"
        });
      }, 1000);
    } catch (error) {
      console.error('YouTube import error:', error);
      setUploadStatus("error");
      setIsUploading(false);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred");
      toast("Import failed", {
        description: "Failed to import YouTube video. Please check the URL and try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartProcessing = async () => {
    if (!uploadedVideo) return;
    
    toast("Processing started", {
      description: "Video processing started. You'll be notified when shorts are ready."
    });
    navigate('/dashboard');
  };

  const handleNewUpload = () => {
    setUploadStatus("idle");
    setUploadedVideo(null);
    setUploadProgress(0);
    setYoutubeUrl("");
    setErrorMessage(null);
  };

  if (uploadStatus === "success" && uploadedVideo) {
    return (
      <VideoPreview 
        video={uploadedVideo}
        onStartProcessing={handleStartProcessing}
        onNewUpload={handleNewUpload}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={`border-2 transition-all ${uploadMethod === "file" ? "border-primary" : "border-gray-200 dark:border-gray-800"}`} onClick={() => setUploadMethod("file")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Video File
            </CardTitle>
            <CardDescription>
              Upload a video file directly from your computer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed p-8 text-center">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Drag and drop your video file here
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  MP4, AVI, MOV or MKV (max 500MB)
                </p>
                <Button size="sm" asChild>
                  <label>
                    Browse Files
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="video/*" 
                      onChange={handleFileUpload}
                      disabled={isUploading} 
                    />
                  </label>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-all ${uploadMethod === "url" ? "border-primary" : "border-gray-200 dark:border-gray-800"}`} onClick={() => setUploadMethod("url")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              Import from YouTube
            </CardTitle>
            <CardDescription>
              Import a video by pasting a YouTube URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 py-6">
              <div className="flex items-center gap-2 border rounded-md p-2 bg-white dark:bg-gray-950">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Paste YouTube URL here"
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  disabled={isUploading}
                />
              </div>
              <Button 
                onClick={handleYoutubeUpload} 
                disabled={isUploading || !youtubeUrl.trim()}
                className="w-full"
              >
                <Youtube className="mr-2 h-4 w-4" />
                Import from YouTube
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {isUploading && (
        <Card>
          <CardHeader>
            <CardTitle>
              {uploadStatus === "uploading" ? (
                "Uploading..."
              ) : (
                uploadStatus === "error" ? "Upload Failed" : "Upload Complete"
              )}
            </CardTitle>
            <CardDescription>
              {uploadStatus === "uploading" 
                ? "Your video is being uploaded. Please don't close this window."
                : uploadStatus === "error"
                  ? "There was an error uploading your video."
                  : "Your video has been uploaded successfully."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-right mt-2">{uploadProgress}%</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              {uploadStatus === "uploading" 
                ? "After upload completes, we'll process your video for shorts generation."
                : uploadStatus === "error"
                  ? "Please try again or contact support if the problem persists."
                  : "You can now use this video to generate shorts."
              }
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
