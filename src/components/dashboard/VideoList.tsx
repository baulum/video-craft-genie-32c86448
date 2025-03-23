
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, PlayCircle, MoreVertical, Edit, Trash2, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

// Mock data for videos
const mockVideos = [
  {
    id: 1,
    title: "How to Build a React Application",
    thumbnail: "https://picsum.photos/seed/video1/300/200",
    duration: "15:42",
    status: "complete",
    uploaded: "2 days ago",
    shortsGenerated: 3
  },
  {
    id: 2,
    title: "Advanced TypeScript Patterns",
    thumbnail: "https://picsum.photos/seed/video2/300/200",
    duration: "24:18",
    status: "complete",
    uploaded: "1 week ago",
    shortsGenerated: 5
  },
  {
    id: 3,
    title: "Introduction to NextJS",
    thumbnail: "https://picsum.photos/seed/video3/300/200",
    duration: "18:05",
    status: "processing",
    uploaded: "3 hours ago",
    progress: 65,
    shortsGenerated: 0
  }
];

export const VideoList = () => {
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
                className="w-full h-40 object-cover"
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
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Scissors className="h-4 w-4 mr-2" />
                      Generate Shorts
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">
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
                <Button size="sm" className="flex-1" disabled={video.status === "processing"}>
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Play
                </Button>
                <Button size="sm" className="flex-1" variant="outline" disabled={video.status === "processing"}>
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
