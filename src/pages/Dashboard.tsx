
import { useState, useEffect } from "react";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Upload, 
  Scissors, 
  Film, 
  History, 
  LogOut, 
  Settings,
  Plus,
  ListFilter,
  Search,
  User
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { VideoUpload } from "@/components/dashboard/VideoUpload";
import { VideoList } from "@/components/dashboard/VideoList";
import { VideoStats } from "@/components/dashboard/VideoStats";
import { ShortsGallery } from "@/components/dashboard/ShortsGallery";
import { Profile } from "@/components/dashboard/Profile";
import { Settings as SettingsComponent } from "@/components/dashboard/Settings";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "sonner";

// Mock authentication check - this would be replaced with a real auth check
const isAuthenticated = true; // Replace with actual auth state

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tabFromQuery = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabFromQuery || "videos");
  const { toast } = useToast();

  // Update URL when tab changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(location.search);
    newSearchParams.set('tab', activeTab);
    navigate({ search: newSearchParams.toString() }, { replace: true });
  }, [activeTab, navigate, location.search]);

  // Handle global errors
  useEffect(() => {
    const originalError = console.error;
    
    // Override console.error to catch and display critical errors as toasts
    console.error = (...args) => {
      // Call the original console.error first
      originalError(...args);
      
      // Extract meaningful error message
      const errorMessage = args
        .map(arg => {
          if (arg instanceof Error) return arg.message;
          if (typeof arg === 'string') return arg;
          return '';
        })
        .filter(Boolean)
        .join(' ');
      
      // Only show toast for relevant errors (avoid spamming the user)
      if (errorMessage && !errorMessage.includes('solana') && !errorMessage.includes('provider.js')) {
        toast.error("An error occurred. Please try again or contact support if the issue persists.");
      }
    };
    
    // Handle wallet provider errors specifically
    const handleWalletError = (event) => {
      // Ignore specific errors related to wallet providers that aren't critical
      if (event.message && (
        event.message.includes('solana') || 
        event.message.includes('redefine property') ||
        event.message.includes('provider.js')
      )) {
        event.preventDefault();
        return;
      }
    };
    
    window.addEventListener('error', handleWalletError);
    
    return () => {
      console.error = originalError;
      window.removeEventListener('error', handleWalletError);
    };
  }, [toast]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50 dark:bg-gray-900">
        {/* Add Toaster component for notifications */}
        <Toaster position="top-right" />
        
        <Sidebar>
          <SidebarHeader className="flex flex-row items-center justify-between px-4 py-2">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold">ClipFarm</span>
            </Link>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === "videos"} 
                      onClick={() => setActiveTab("videos")}
                      tooltip="Videos"
                    >
                      <Video />
                      <span>Videos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === "upload"} 
                      onClick={() => setActiveTab("upload")}
                      tooltip="Upload"
                    >
                      <Upload />
                      <span>Upload</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === "shorts"} 
                      onClick={() => setActiveTab("shorts")}
                      tooltip="Shorts"
                    >
                      <Scissors />
                      <span>Shorts</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === "history"} 
                      onClick={() => setActiveTab("history")}
                      tooltip="History"
                    >
                      <History />
                      <span>History</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === "profile"} 
                      onClick={() => setActiveTab("profile")}
                      tooltip="Profile"
                    >
                      <User />
                      <span>Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeTab === "settings"} 
                      onClick={() => setActiveTab("settings")}
                      tooltip="Settings"
                    >
                      <Settings />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/login" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                    <LogOut />
                    <span>Logout</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="container py-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="shorts">Shorts</TabsTrigger>
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ListFilter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button size="sm" onClick={() => setActiveTab("upload")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Video
                  </Button>
                </div>
              </div>

              <TabsContent value="videos" className="space-y-6">
                <VideoStats />
                <VideoList />
              </TabsContent>
              
              <TabsContent value="upload">
                <VideoUpload />
              </TabsContent>
              
              <TabsContent value="shorts">
                <ShortsGallery />
              </TabsContent>
              
              <TabsContent value="history">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-4">Processing History</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    View the history of all your processed videos and generated shorts.
                  </p>
                  <div className="mt-8 flex justify-center">
                    <div className="text-center max-w-md">
                      <History className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium">No history yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Your processing history will appear here once you've uploaded and processed videos.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="profile">
                <Profile />
              </TabsContent>
              
              <TabsContent value="settings">
                <SettingsComponent />
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
