import React from "react";
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
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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
  return (
    <motion.section 
      className={cn("py-8", className)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between mb-6">
          <motion.h2 
            className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {title}
          </motion.h2>
          
          {showViewMore && viewMoreLink && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Button
                asChild
                variant="ghost"
                className="text-wolzi-light-gray hover:text-white hover:bg-wolzi-dark-blue/40 flex items-center gap-1 group"
                size="sm"
              >
                <Link to={viewMoreLink}>
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </motion.div>
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
              >
                <motion.div 
                  className="h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <MediaCard
                    {...item}
                    showHover={true}
                    size="medium"
                    description={item.description || `Watch ${item.title} online. ${item.mediaType === "tv" ? "TV Series" : item.mediaType === "anime" ? "Anime" : "Movie"} from ${item.year || "recent years"}.`}
                  />
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-1 bg-wolzi-dark-blue/70 hover:bg-wolzi-dark-blue/90 border-wolzi-gray/30" />
          <CarouselNext className="right-1 bg-wolzi-dark-blue/70 hover:bg-wolzi-dark-blue/90 border-wolzi-gray/30" />
        </Carousel>
      </div>
    </motion.section>
  );
};

export default ContentSection;
