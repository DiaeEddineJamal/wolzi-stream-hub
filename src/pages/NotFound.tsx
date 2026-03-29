
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound: React.FC = () => {
  useEffect(() => {
    let el = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('name', 'robots')
      document.head.appendChild(el)
    }
    el.setAttribute('content', 'noindex, follow')
  }, [])
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--wolzi-bg))] p-4 text-center">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">404</h1>
      <h2 className="text-xl md:text-3xl font-semibold mb-6 text-wolzi-accent">Page Not Found</h2>
      
      <p className="text-gray-300 max-w-md mx-auto mb-8">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      
      <Button asChild size="lg" className="bg-wolzi-accent hover:bg-wolzi-accent-hover">
        <Link to="/" className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
