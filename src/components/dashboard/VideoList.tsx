
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, PlayCircle, MoreVertical, Edit, Trash2, Clock, Eye, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

// Mock data for videos
const mockVideos = [
  {
    id: 1,
    title: "How to Build a React Application",
    thumbnail: "https://picsum.photos/seed/video1/300/200",
    duration: "15:42",
    status: "complete",
    uploaded: "2 days ago",
    shortsGenerated: 3,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" // Example video URL
  },
  {
    id: 2,
    title: "Advanced TypeScript Patterns",
    thumbnail: "https://picsum.photos/seed/video2/300/200",
    duration: "24:18",
    status: "complete",
    uploaded: "1 week ago",
    shortsGenerated: 5,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" // Example video URL
  },
  {
    id: 3,
    title: "Introduction to NextJS",
    thumbnail: "https://picsum.photos/seed/video3/300/200",
    duration: "18:05",
    status: "processing",
    uploaded: "3 hours ago",
    progress: 65,
    shortsGenerated: 0,
    videoUrl: null // No URL while processing
  }
];

export const VideoList = () => {
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  
  const handleGenerateShorts = (videoId: number) => {
    toast.success(`Starting shorts generation for video #${videoId}`);
  };
  
  const handleDeleteVideo = (videoId: number) => {
    toast.success(`Video #${videoId} deleted successfully`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Videos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="relative">
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-40 object-cover cursor-pointer"
                onClick={() => video.status === "complete" && setSelectedVideo(video.id)}
              />
              
              {video.status === "processing" ? (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                  <Clock className="h-10 w-10 mb-2 animate-pulse" />
                  <span className="text-sm font-medium">Processing...</span>
                  <Progress value={video.progress} className="w-2/3 h-1 mt-2" />
                </div>
              ) : (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm line-clamp-2 mr-2">{video.title}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Video Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled={video.status === "processing"}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={video.status === "processing"}>
                      <Scissors className="h-4 w-4 mr-2" />
                      Generate Shorts
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={video.status === "processing"}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteVideo(video.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                <span>Uploaded {video.uploaded}</span>
                <span>{video.shortsGenerated} shorts</span>
              </div>
              
              <div className="flex space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex-1" disabled={video.status === "processing"}>
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                  </DialogTrigger>
                  {video.status === "complete" && (
                    <DialogContent className="sm:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle>{video.title}</DialogTitle>
                        <DialogDescription>
                          Uploaded {video.uploaded}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                        <iframe
                          src={video.videoUrl}
                          title={video.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
                <Button 
                  size="sm" 
                  className="flex-1" 
                  variant="outline" 
                  disabled={video.status === "processing"}
                  onClick={() => handleGenerateShorts(video.id)}
                >
                  <Scissors className="h-4 w-4 mr-1" />
                  Create Shorts
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
