import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Short } from "@/types/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scissors, Download, Share2, ExternalLink } from "lucide-react";

export const ShortsGallery = () => {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShorts() {
      try {
        const { data, error } = await supabase
          .from('shorts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setShorts(data || []);
      } catch (error) {
        console.error('Error loading shorts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadShorts();
  }, []);

  // If no shorts are available yet, show a placeholder
  if (!loading && shorts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Your Shorts</h2>
        <div className="text-center py-12">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No shorts generated yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Upload a video and let our AI generate engaging short-form content for you automatically.
          </p>
          <Button>Upload a Video</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Shorts</h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download All
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[9/16] bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* This would use actual data in a real implementation */}
          {[
            {
              id: 1,
              title: "10 Quick Tips for Better Sleep",
              thumbnail: "https://images.unsplash.com/photo-1541480601022-2308c0f02487?q=80&w=2070&auto=format&fit=crop",
              duration: "00:58"
            },
            {
              id: 2,
              title: "How to Stay Productive All Day",
              thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop",
              duration: "01:12"
            },
            {
              id: 3,
              title: "3 Exercises for Better Posture",
              thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2020&auto=format&fit=crop",
              duration: "00:45"
            },
            {
              id: 4,
              title: "Simple Meditation Techniques",
              thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2022&auto=format&fit=crop",
              duration: "01:05"
            },
            {
              id: 5,
              title: "Quick Healthy Breakfast Ideas",
              thumbnail: "https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?q=80&w=2070&auto=format&fit=crop",
              duration: "00:52"
            },
            {
              id: 6,
              title: "Home Office Setup Tips",
              thumbnail: "https://images.unsplash.com/photo-1593642532744-d377ab507dc8?q=80&w=2069&auto=format&fit=crop",
              duration: "01:18"
            }
          ].map((short) => (
            <Card key={short.id} className="overflow-hidden group">
              <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-800">
                <img 
                  src={short.thumbnail} 
                  alt={short.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm" className="mr-2">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {short.duration}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1">{short.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Generated today</span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
