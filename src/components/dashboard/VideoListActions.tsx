import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/utils/toast-helper";
import { MoreHorizontal, Trash2, RefreshCw, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface VideoListActionsProps {
  videoId: string;
  onDelete: () => void;
  onReprocess?: () => void;
}

export const VideoListActions = ({ videoId, onDelete, onReprocess }: VideoListActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      console.log(`Deleting video with ID: ${videoId}`);

      // Delete associated shorts first
      const { data: shorts, error: shortsError } = await supabase
        .from('shorts')
        .select('id, file_path')
        .eq('video_id', videoId);

      if (shortsError) {
        console.error('Error fetching associated shorts:', shortsError);
      } else if (shorts?.length) {
        console.log(`Found ${shorts.length} shorts to delete`);
        
        // Delete shorts files from storage
        for (const short of shorts) {
          if (short.file_path) {
            console.log(`Deleting file: ${short.file_path}`);
            const { error: storageError } = await supabase
              .storage
              .from('shorts')
              .remove([short.file_path]);
              
            if (storageError) {
              console.error(`Error removing short file ${short.file_path}:`, storageError);
            }
          }
        }
        
        // Delete shorts from database
        const { error: deleteError } = await supabase
          .from('shorts')
          .delete()
          .eq('video_id', videoId);
          
        if (deleteError) {
          console.error('Error deleting associated shorts:', deleteError);
        }
      }

      // Get video details to delete file
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('file_path')
        .eq('id', videoId)
        .single();
      
      if (videoError) {
        console.error('Error fetching video details:', videoError);
      } else if (video?.file_path) {
        // Delete video file from storage
        console.log(`Deleting video file: ${video.file_path}`);
        const { error: storageError } = await supabase
          .storage
          .from('videos')
          .remove([video.file_path]);
        
        if (storageError) {
          console.error('Error removing video file:', storageError);
        }
      }

      // Delete video from database
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);
        
      if (deleteError) {
        throw deleteError;
      }

      showToast.success(
        "Video Deleted",
        "The video and all associated shorts have been deleted."
      );
      
      // Trigger parent component to update
      onDelete();
      
    } catch (error) {
      console.error('Error deleting video:', error);
      showToast.error(
        "Delete Failed",
        "There was an error deleting the video. Please try again."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleReprocess = async () => {
    if (!onReprocess) return;
    
    try {
      setIsReprocessing(true);
      
      // Update video status to pending
      const { error: updateError } = await supabase
        .from('videos')
        .update({ status: 'pending' })
        .eq('id', videoId);
        
      if (updateError) throw updateError;
      
      // Call generate-shorts edge function
      const { error } = await supabase.functions.invoke('generate-shorts', {
        body: { videoId }
      });
      
      if (error) throw error;
      
      showToast.success(
        "Processing Started",
        "The video is being reprocessed to generate shorts."
      );
      
      // Trigger parent component to update
      onReprocess();
      
    } catch (error) {
      console.error('Error reprocessing video:', error);
      showToast.error(
        "Reprocess Failed",
        "There was an error reprocessing the video. Please try again."
      );
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onReprocess && (
            <DropdownMenuItem 
              onClick={(e) => {
                e.preventDefault();
                handleReprocess();
              }} 
              disabled={isReprocessing}
              className="text-blue-600 focus:text-blue-600"
            >
              {isReprocessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>Reprocess</span>
                </>
              )}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              setShowDeleteDialog(true);
            }}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This will also remove all generated shorts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
