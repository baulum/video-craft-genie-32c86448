
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
    }`}>
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">ClipFarm</span>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-700 hover:text-gray-900 font-medium">Features</a>
          <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 font-medium">How it Works</a>
          <a href="#testimonials" className="text-gray-700 hover:text-gray-900 font-medium">Testimonials</a>
          <a href="#pricing" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</a>
        </nav>
        
        <div className="hidden md:flex items-center gap-4">
          <Button variant="outline" className="font-medium">Login</Button>
          <Button className="font-medium bg-gradient-to-r from-purple-600 to-blue-500 text-white">Sign Up Free</Button>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-700" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-md py-4 px-6 flex flex-col gap-4 border-t animate-fade-in">
          <a href="#features" className="text-gray-700 py-2 hover:text-gray-900 font-medium">Features</a>
          <a href="#how-it-works" className="text-gray-700 py-2 hover:text-gray-900 font-medium">How it Works</a>
          <a href="#testimonials" className="text-gray-700 py-2 hover:text-gray-900 font-medium">Testimonials</a>
          <a href="#pricing" className="text-gray-700 py-2 hover:text-gray-900 font-medium">Pricing</a>
          <div className="flex flex-col gap-2 pt-2">
            <Button variant="outline" className="w-full font-medium">Login</Button>
            <Button className="w-full font-medium bg-gradient-to-r from-purple-600 to-blue-500 text-white">Sign Up Free</Button>
          </div>
        </div>
      )}
    </header>
  );
}
