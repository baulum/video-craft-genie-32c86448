
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Download, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mock data for generated shorts
const mockShorts = [
  {
    id: 1,
    title: "React Tips #1: Hooks Basics",
    thumbnail: "https://picsum.photos/seed/short1/300/500",
    duration: "0:42",
    views: 1240,
    sourceVideo: "How to Build a React Application",
    downloadUrl: "#download-link-1"
  },
  {
    id: 2,
    title: "TypeScript Interfaces vs Types",
    thumbnail: "https://picsum.photos/seed/short2/300/500",
    duration: "0:58",
    views: 890,
    sourceVideo: "Advanced TypeScript Patterns",
    downloadUrl: "#download-link-2"
  },
  {
    id: 3,
    title: "NextJS App Router Explained",
    thumbnail: "https://picsum.photos/seed/short3/300/500",
    duration: "1:15",
    views: 560,
    sourceVideo: "Introduction to NextJS",
    downloadUrl: "#download-link-3"
  }
];

export const ShortsGallery = () => {
  const [selectedShort, setSelectedShort] = useState<number | null>(null);

  const handleDownload = (id: number) => {
    toast.success(`Short #${id} downloaded successfully!`);
  };

  const handleShare = (id: number) => {
    toast.success(`Link to short #${id} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Shorts</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Sort
          </Button>
        </div>
      </div>

      {mockShorts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockShorts.map((short) => (
            <Card key={short.id} className="overflow-hidden">
              <div 
                className="relative aspect-[9/16] cursor-pointer" 
                onClick={() => setSelectedShort(selectedShort === short.id ? null : short.id)}
              >
                <img 
                  src={short.thumbnail} 
                  alt={short.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {short.duration}
                </div>
              </div>
              
              <CardHeader className="p-3">
                <CardTitle className="text-sm">{short.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground">
                  From: {short.sourceVideo}
                </p>
                <p className="text-xs mt-1">
                  {short.views.toLocaleString()} views
                </p>
              </CardContent>
              
              <CardFooter className="p-3 flex justify-between">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleShare(short.id)}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleDownload(short.id)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mt-8 flex justify-center">
            <div className="text-center max-w-md">
              <Film className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No shorts yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload a video and use the "Generate Shorts" feature to create short clips.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
