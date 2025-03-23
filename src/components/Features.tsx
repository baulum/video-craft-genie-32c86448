
import { 
  Sparkles, 
  Film, 
  Type, 
  Wand2, 
  Scissors, 
  Share2, 
  Upload, 
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function Features() {
  const features = [
    {
      icon: <Upload className="h-10 w-10 text-purple-600" />,
      title: "Simple Upload",
      description: "Upload YouTube videos directly with a URL or upload your own video files."
    },
    {
      icon: <Sparkles className="h-10 w-10 text-purple-600" />,
      title: "AI-Powered Analysis",
      description: "Our intelligent algorithm identifies the most engaging parts of your content."
    },
    {
      icon: <Scissors className="h-10 w-10 text-purple-600" />,
      title: "Automatic Editing",
      description: "Create perfect clips with smart editing that captures key moments."
    },
    {
      icon: <Type className="h-10 w-10 text-purple-600" />,
      title: "Beautiful Captions",
      description: "Generate eye-catching captions that improve viewer engagement."
    },
    {
      icon: <Wand2 className="h-10 w-10 text-purple-600" />,
      title: "One-Click Magic",
      description: "Transform long-form content into shorts with a single click."
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-purple-600" />,
      title: "Performance Tracking",
      description: "Monitor how your shorts perform with detailed analytics."
    },
    {
      icon: <Film className="h-10 w-10 text-purple-600" />,
      title: "Multiple Formats",
      description: "Export in various formats optimized for different platforms."
    },
    {
      icon: <Share2 className="h-10 w-10 text-purple-600" />,
      title: "Easy Sharing",
      description: "Share your shorts directly to social media platforms."
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Powerful Features To Maximize Your Content</h2>
          <p className="text-xl text-gray-600">
            ClipFarm combines cutting-edge AI with an intuitive interface to help you create viral-worthy shorts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="mb-5">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
