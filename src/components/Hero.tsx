
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Background gradient */}
      <div className="absolute top-0 -left-64 -z-10 opacity-20 blur-3xl">
        <div className="aspect-square h-[50rem] bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full" />
      </div>
      <div className="absolute top-96 -right-64 -z-10 opacity-20 blur-3xl">
        <div className="aspect-square h-[40rem] bg-gradient-to-tr from-blue-500 to-purple-600 rounded-full" />
      </div>
      
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block px-3 py-1 mb-6 text-sm font-medium text-purple-800 bg-purple-100 rounded-full">
            Turn Your YouTube Content Into Viral Shorts
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
            Create Engaging Short Videos Automatically
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            ClipFarm intelligently analyzes your YouTube videos, extracts the best moments, and transforms them into captivating shorts with beautiful captions - all with just a few clicks.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="text-lg h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="text-lg h-12 px-8">
              Watch Demo
            </Button>
          </div>
        </div>
        
        {/* Video showcase */}
        <div className="relative mx-auto max-w-5xl rounded-xl shadow-2xl overflow-hidden">
          <div className="aspect-video bg-gradient-to-r from-purple-600/20 to-blue-500/20 backdrop-blur">
            {/* Placeholder for video/screenshot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white/90 p-5 shadow-lg">
                <svg className="w-12 h-12 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
