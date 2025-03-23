
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Bell, Shield, EyeOff, Zap, Lock, Volume2, MonitorSmartphone } from "lucide-react";

export const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      weekly_digest: false,
      marketing: false,
    },
    privacy: {
      profile_visibility: "public",
      search_indexing: true,
      content_visibility: "public",
      analytics_tracking: true,
    },
    preferences: {
      theme: "system",
      video_quality: "auto",
      auto_play: true,
      sound_effects: true,
    },
    security: {
      two_factor: false,
      login_notifications: true,
      session_timeout: "30min",
    }
  });

  const handleSave = async (section) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    
    toast("Settings updated", {
      description: `Your ${section} settings have been saved.`,
    });
  };

  return (
    <Tabs defaultValue="notifications" className="space-y-6">
      <TabsList className="grid grid-cols-4 w-full max-w-2xl">
        <TabsTrigger value="notifications" className="flex items-center">
          <Bell className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="privacy" className="flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Privacy</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center">
          <Zap className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Preferences</span>
        </TabsTrigger>
        <TabsTrigger value="security" className="flex items-center">
          <Lock className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Security</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Control how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about your account via email
                </p>
              </div>
              <Switch 
                id="email-notifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, email: checked}
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications directly to your device
                </p>
              </div>
              <Switch 
                id="push-notifications"
                checked={settings.notifications.push}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, push: checked}
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of your account activity
                </p>
              </div>
              <Switch 
                id="weekly-digest"
                checked={settings.notifications.weekly_digest}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, weekly_digest: checked}
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Marketing Communications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and promotions
                </p>
              </div>
              <Switch 
                id="marketing"
                checked={settings.notifications.marketing}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    notifications: {...settings.notifications, marketing: checked}
                  })
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleSave('notification')} 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="privacy">
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Manage your data and privacy preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <Select 
                value={settings.privacy.profile_visibility}
                onValueChange={(value) => 
                  setSettings({
                    ...settings, 
                    privacy: {...settings.privacy, profile_visibility: value}
                  })
                }
              >
                <SelectTrigger id="profile-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="search-indexing">Search Engine Indexing</Label>
                <p className="text-sm text-muted-foreground">
                  Allow search engines to index your profile
                </p>
              </div>
              <Switch 
                id="search-indexing"
                checked={settings.privacy.search_indexing}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    privacy: {...settings.privacy, search_indexing: checked}
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-visibility">Content Visibility</Label>
              <Select 
                value={settings.privacy.content_visibility}
                onValueChange={(value) => 
                  setSettings({
                    ...settings, 
                    privacy: {...settings.privacy, content_visibility: value}
                  })
                }
              >
                <SelectTrigger id="content-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics-tracking">Analytics & Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to collect anonymous usage data to improve the service
                </p>
              </div>
              <Switch 
                id="analytics-tracking"
                checked={settings.privacy.analytics_tracking}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    privacy: {...settings.privacy, analytics_tracking: checked}
                  })
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleSave('privacy')} 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={settings.preferences.theme}
                onValueChange={(value) => 
                  setSettings({
                    ...settings, 
                    preferences: {...settings.preferences, theme: value}
                  })
                }
              >
                <SelectTrigger id="theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-quality">Default Video Quality</Label>
              <Select 
                value={settings.preferences.video_quality}
                onValueChange={(value) => 
                  setSettings({
                    ...settings, 
                    preferences: {...settings.preferences, video_quality: value}
                  })
                }
              >
                <SelectTrigger id="video-quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="high">High (1080p)</SelectItem>
                  <SelectItem value="medium">Medium (720p)</SelectItem>
                  <SelectItem value="low">Low (480p)</SelectItem>
                  <SelectItem value="data-saver">Data Saver (360p)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-play">Autoplay Videos</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically play videos when scrolling
                </p>
              </div>
              <Switch 
                id="auto-play"
                checked={settings.preferences.auto_play}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    preferences: {...settings.preferences, auto_play: checked}
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-effects">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Enable UI sound effects in the app
                </p>
              </div>
              <Switch 
                id="sound-effects"
                checked={settings.preferences.sound_effects}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    preferences: {...settings.preferences, sound_effects: checked}
                  })
                }
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleSave('preferences')} 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage your account security and authentication options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch 
                id="two-factor"
                checked={settings.security.two_factor}
                onCheckedChange={(checked) => {
                  if (checked) {
                    toast("Coming soon", {
                      description: "Two-factor authentication will be available soon!",
                    });
                  }
                  setSettings({
                    ...settings, 
                    security: {...settings.security, two_factor: checked}
                  });
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="login-notifications">Login Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for new logins to your account
                </p>
              </div>
              <Switch 
                id="login-notifications"
                checked={settings.security.login_notifications}
                onCheckedChange={(checked) => 
                  setSettings({
                    ...settings, 
                    security: {...settings.security, login_notifications: checked}
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout</Label>
              <Select 
                value={settings.security.session_timeout}
                onValueChange={(value) => 
                  setSettings({
                    ...settings, 
                    security: {...settings.security, session_timeout: value}
                  })
                }
              >
                <SelectTrigger id="session-timeout">
                  <SelectValue placeholder="Select timeout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15min">15 minutes</SelectItem>
                  <SelectItem value="30min">30 minutes</SelectItem>
                  <SelectItem value="1hour">1 hour</SelectItem>
                  <SelectItem value="4hours">4 hours</SelectItem>
                  <SelectItem value="1day">1 day</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
            <div>
              <Button variant="destructive" className="w-full">
                <EyeOff className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => handleSave('security')} 
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
