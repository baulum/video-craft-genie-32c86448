
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Link as LinkIcon, Youtube } from "lucide-react";
import { toast } from "sonner";

export const VideoUpload = () => {
  const [uploadMethod, setUploadMethod] = useState<"file" | "url" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    simulateUpload(file.name);
  };

  const handleYoutubeUpload = () => {
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    simulateUpload(youtubeUrl);
  };

  // Simulate file upload with progress
  const simulateUpload = (fileName: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success("Upload completed successfully!");
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  return (
    <div className="grid gap-6">
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
            <CardTitle>Uploading...</CardTitle>
            <CardDescription>Your video is being uploaded. Please don't close this window.</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-right mt-2">{uploadProgress}%</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              After upload completes, we'll process your video for shorts generation.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
