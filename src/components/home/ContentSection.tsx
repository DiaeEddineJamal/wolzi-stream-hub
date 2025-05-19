
import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import MediaCard from "./MediaCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ContentItem {
  id: string;
  title: string;
  posterUrl: string;
  rating?: number;
  year?: string;
  mediaType: "movie" | "tv" | "anime";
  description?: string;
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
              className="text-wolzi-light-gray hover:text-white flex items-center gap-1"
              size="sm"
            >
              <a href={viewMoreLink}>
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {items.map((item, index) => (
              <CarouselItem 
                key={item.id} 
                className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <MediaCard
                    {...item}
                    showHover={hoveredIndex === index}
                    size="medium"
                    description={item.description || `Watch ${item.title} online. ${item.mediaType === "tv" ? "TV Series" : item.mediaType === "anime" ? "Anime" : "Movie"} from ${item.year || "recent years"}.`}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-1 bg-wolzi-dark-blue/60 hover:bg-wolzi-dark-blue/80 border-wolzi-gray/30" />
          <CarouselNext className="right-1 bg-wolzi-dark-blue/60 hover:bg-wolzi-dark-blue/80 border-wolzi-gray/30" />
        </Carousel>
      </div>
    </section>
  );
};

export default ContentSection;
