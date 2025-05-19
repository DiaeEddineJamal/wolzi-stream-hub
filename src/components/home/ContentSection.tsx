
import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import MediaCard from "./MediaCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  year?: string;
  mediaType: "movie" | "tv" | "anime";
}

interface ContentSectionProps {
  title: string;
  items: ContentItem[];
  viewMoreLink?: string;
  className?: string;
  showViewMore?: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  items,
  viewMoreLink,
  className,
  showViewMore = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className={cn("py-6", className)}>
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {title}
          </h2>
          
          {showViewMore && viewMoreLink && (
            <Button
              asChild
              variant="ghost"
              className="text-gray-400 hover:text-white flex items-center gap-1"
              size="sm"
            >
              <a href={viewMoreLink}>
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <MediaCard
                {...item}
                showHover={hoveredIndex === index}
                size="medium"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContentSection;
