import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectFilter, ProjectTimeFilter } from "@/types/github";

interface ProjectFiltersProps {
  filter: ProjectFilter;
  timeFilter: ProjectTimeFilter;
  language: string | null;
  topic: string | null;
  languages: { value: string; label: string }[];
  topics: { value: string; label: string }[];
  onFilterChange: (filter: ProjectFilter) => void;
  onTimeFilterChange: (timeFilter: ProjectTimeFilter) => void;
  onLanguageChange: (language: string | null) => void;
  onTopicChange: (topic: string | null) => void;
  favoriteLanguages?: string[];
  favoriteTopics?: string[];
}

export default function ProjectFilters({
  filter,
  timeFilter,
  onFilterChange,
  onTimeFilterChange,
}: ProjectFiltersProps) {
  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue={filter} 
        value={filter}
        onValueChange={(value) => onFilterChange(value as ProjectFilter)}
        className="w-full"
      >
        <TabsList className="flex flex-wrap w-full bg-secondary/40 dark:bg-secondary/20 backdrop-blur-sm p-0.5 overflow-x-auto">
          {/* Mobile view - stacked or scrollable */}
          <TabsTrigger 
            value="all" 
            className="flex-1 min-w-[80px] font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
            All
          </TabsTrigger>
          <TabsTrigger 
            value="trending" 
            className="flex-1 min-w-[80px] font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
            Trending
          </TabsTrigger>
          <TabsTrigger 
            value="beginner-friendly" 
            className="flex-1 min-w-[80px] font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
            For Beginners
          </TabsTrigger>
          <TabsTrigger 
            value="recently-updated" 
            className="flex-1 min-w-[80px] font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
            Recent
          </TabsTrigger>
          <TabsTrigger 
            value="bookmarked" 
            className="flex-1 min-w-[80px] font-medium text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
            Bookmarked
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filter === 'trending' && (
        <div className="flex justify-center">
          <Tabs 
            defaultValue={timeFilter} 
            value={timeFilter}
            onValueChange={(value) => onTimeFilterChange(value as ProjectTimeFilter)}
            className="w-full max-w-xs"
          >
            <TabsList className="flex w-full bg-secondary/40 dark:bg-secondary/20 backdrop-blur-sm p-0.5">
              <TabsTrigger 
                value="daily" 
                className="flex-1 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
                Daily
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="flex-1 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
                Weekly
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="flex-1 text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );
} 