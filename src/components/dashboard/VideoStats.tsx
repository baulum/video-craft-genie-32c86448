
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Scissors, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const VideoStats = () => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    shortsGenerated: 0,
    processing: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        // Get total videos count
        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('id, status', { count: 'exact' });
        
        if (videosError) throw videosError;
        
        // Get total shorts count
        const { data: shorts, error: shortsError } = await supabase
          .from('shorts')
          .select('id', { count: 'exact' });
          
        if (shortsError) throw shortsError;
        
        // Calculate processing videos
        const processingVideos = videos?.filter(v => v.status === 'processing').length || 0;
        
        // Calculate conversion rate (shorts per video)
        const totalVideosCount = videos?.length || 0;
        const totalShortsCount = shorts?.length || 0;
        const conversionRate = totalVideosCount > 0 
          ? Math.round((totalShortsCount / totalVideosCount) * 100) 
          : 0;
        
        setStats({
          totalVideos: totalVideosCount,
          shortsGenerated: totalShortsCount,
          processing: processingVideos,
          conversionRate: conversionRate
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : stats.totalVideos}</div>
          <p className="text-xs text-muted-foreground">
            Videos uploaded to your account
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Shorts Generated</CardTitle>
          <Scissors className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : stats.shortsGenerated}</div>
          <p className="text-xs text-muted-foreground">
            AI-generated short clips
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Processing</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : stats.processing}</div>
          <p className="text-xs text-muted-foreground">
            {stats.processing === 1 ? 'Video being analyzed' : 'Videos in queue'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? '...' : `${stats.conversionRate}%`}</div>
          <p className="text-xs text-muted-foreground">
            Shorts per video ratio
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
