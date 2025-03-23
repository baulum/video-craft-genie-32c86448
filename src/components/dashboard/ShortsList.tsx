
import React from "react";
import { Short } from "@/types/supabase";
import { ShortCard } from "./ShortCard";

interface ShortsListProps {
  shorts: Short[];
  playing: string | null;
  isLoading: boolean;
  onPlayPause: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (short: Short) => void;
  onShare: (short: Short) => void;
}

export const ShortsList = ({ 
  shorts, 
  playing, 
  isLoading,
  onPlayPause, 
  onDelete, 
  onDownload, 
  onShare 
}: ShortsListProps) => {
  if (shorts.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">
          {isLoading ? "Loading shorts..." : "No shorts found. Generate some shorts from your videos!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shorts.map(short => (
        <ShortCard 
          key={short.id}
          short={short}
          isPlaying={playing === short.id}
          onPlayPause={() => onPlayPause(short.id)}
          onDelete={() => onDelete(short.id)}
          onDownload={() => onDownload(short)}
          onShare={() => onShare(short)}
        />
      ))}
    </div>
  );
};
