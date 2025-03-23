
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
        const { count: totalVideos, error: videosError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true });
        
        if (videosError) throw videosError;
        
        // Get total shorts count
        const { count: totalShorts, error: shortsError } = await supabase
          .from('shorts')
          .select('*', { count: 'exact', head: true });
          
        if (shortsError) throw shortsError;
        
        // Get processing videos count
        const { count: processingCount, error: processingError } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'processing');
        
        if (processingError) throw processingError;
        
        // Calculate conversion rate (shorts per video)
        const conversionRate = totalVideos > 0 
          ? Math.round((totalShorts / totalVideos) * 100) 
          : 0;
        
        setStats({
          totalVideos: totalVideos || 0,
          shortsGenerated: totalShorts || 0,
          processing: processingCount || 0,
          conversionRate: conversionRate
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Set up subscription for real-time updates
    const videosChannel = supabase
      .channel('public:videos')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'videos' 
      }, () => {
        fetchStats();
      })
      .subscribe();
      
    const shortsChannel = supabase
      .channel('public:shorts-stats')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shorts' 
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(videosChannel);
      supabase.removeChannel(shortsChannel);
    };
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
