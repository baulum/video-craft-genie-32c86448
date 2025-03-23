
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    bio: "ClipFarm user creating awesome video shorts.",
    avatarUrl: "",
    plan: "free"
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // In a real app with auth, you would use auth.user.id
      // For demo, we'll just show mock data
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      
      if (userProfile) {
        setProfile({
          ...profile,
          ...userProfile,
          name: userProfile.full_name || profile.name,
          avatarUrl: userProfile.avatar_url || profile.avatarUrl
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Upload avatar if selected
      let avatarUrl = profile.avatarUrl;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        
        // Check if user_avatars bucket exists, create if not
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'user_avatars');
        
        if (!bucketExists) {
          await supabase.storage.createBucket('user_avatars', {
            public: true
          });
        }
        
        const { error: uploadError } = await supabase.storage
          .from('user_avatars')
          .upload(filePath, avatarFile);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('user_avatars')
          .getPublicUrl(filePath);
          
        avatarUrl = data.publicUrl;
      }
      
      // In a real app with auth, you would use auth.user.id
      // Here's a demo update that will work even without auth
      const { error } = await supabase
        .from('profiles')
        .upsert({
          // id: auth.user.id (in a real app),
          id: crypto.randomUUID(), // Generate a random UUID for demo
          full_name: profile.name,
          username: profile.username,
          bio: profile.bio,
          avatar_url: avatarUrl,
          plan: profile.plan,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset any changes
    fetchProfile();
  };

  const handleUploadAvatar = () => {
    // Create an input element to handle file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAvatarFile(file);
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfile({...profile, avatarUrl: e.target?.result as string});
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information and profile settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={profile.avatarUrl} />
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {profile.name?.charAt(0) || <User />}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="sm" 
              className="px-4"
              onClick={handleUploadAvatar}
              disabled={!isEditing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={profile.name} 
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={profile.username} 
                onChange={(e) => setProfile({...profile, username: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={profile.email} 
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                value={profile.bio} 
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                disabled={!isEditing}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Subscription Plan</Label>
              <Select 
                disabled={!isEditing} 
                value={profile.plan} 
                onValueChange={(value) => setProfile({...profile, plan: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
