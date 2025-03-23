
import { ArrowRight } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Paste Your YouTube URL",
      description: "Start by entering the URL of your YouTube video, or upload a video file directly.",
      color: "from-purple-600 to-purple-400"
    },
    {
      number: "02",
      title: "AI Analysis & Processing",
      description: "Our AI analyzes your content to identify the most engaging and shareable moments.",
      color: "from-blue-600 to-blue-400"
    },
    {
      number: "03",
      title: "Review & Customize",
      description: "Preview the generated shorts and make adjustments to captions, transitions, and timing.",
      color: "from-indigo-600 to-indigo-400"
    },
    {
      number: "04",
      title: "Export & Share",
      description: "Download your shorts in high quality or share them directly to your social platforms.",
      color: "from-purple-600 to-blue-600"
    }
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How ClipFarm Works</h2>
          <p className="text-xl text-gray-600">
            Creating viral shorts has never been easier with our simple four-step process.
          </p>
        </div>
        
        <div className="relative max-w-5xl mx-auto">
          {/* Connector line */}
          <div className="absolute top-1/4 left-8 h-3/4 w-0.5 bg-gradient-to-b from-purple-600 to-blue-600 hidden md:block"></div>
          
          <div className="space-y-12 relative">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0 z-10">
                  <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {step.number}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-8 shadow-lg md:ml-4 flex-grow">
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block h-8 w-8 text-gray-300 mx-auto mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
