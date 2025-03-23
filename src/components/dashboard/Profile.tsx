
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Upload, CheckCircle, User } from "lucide-react";

export const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    bio: "ClipFarm user creating awesome video shorts.",
    avatarUrl: "",
  });

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsEditing(false);
    
    toast("Profile updated", {
      description: "Your profile has been successfully updated.",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleUploadAvatar = () => {
    // In a real app, this would open a file picker and upload the image
    toast("Feature coming soon", {
      description: "Avatar upload will be available soon!",
    });
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
              <Input 
                id="bio" 
                value={profile.bio} 
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                disabled={!isEditing}
              />
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
