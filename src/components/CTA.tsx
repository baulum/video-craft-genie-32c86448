
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-500 text-white">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Content?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of content creators who are maximizing their reach with AI-powered short videos.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 hover:text-purple-700 text-lg h-12 px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
