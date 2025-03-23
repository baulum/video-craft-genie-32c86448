
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShorts } from "@/hooks/use-shorts";
import { ShortsList } from "./ShortsList";

export const ShortsGallery = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { 
    shorts, 
    isLoading, 
    playing, 
    fetchShorts, 
    handleDelete, 
    handleDownload, 
    handleShare, 
    handlePlayPause 
  } = useShorts();

  const filteredShorts = activeTab === "all" 
    ? shorts 
    : shorts.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Shorts Gallery</h1>
        <Button onClick={fetchShorts} variant="outline" disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Shorts</TabsTrigger>
          <TabsTrigger value="popular">Top 10 Popular</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="pt-4">
          <ShortsList
            shorts={shorts}
            playing={playing}
            isLoading={isLoading}
            onPlayPause={handlePlayPause}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </TabsContent>
        
        <TabsContent value="popular" className="pt-4">
          <ShortsList
            shorts={filteredShorts}
            playing={playing}
            isLoading={isLoading}
            onPlayPause={handlePlayPause}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
