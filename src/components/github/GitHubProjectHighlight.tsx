// 'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Bookmark, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GitHubProjectData, ProjectFilter, ProjectTimeFilter } from '@/types/github';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProjectFilters from './ProjectFilters';
import ProjectCard from './ProjectCard';
import ProjectDetailView from './ProjectDetailView';
import { 
  getBookmarkedProjects, 
  getFavoriteLanguages,
  getFavoriteTopics,
  addToViewHistory
} from '@/lib/github-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useGitHubProjects } from '@/lib/api-hooks';

const LANGUAGES = [
  { value: 'JavaScript', label: 'JavaScript' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Python', label: 'Python' },
  { value: 'Java', label: 'Java' },
  { value: 'C#', label: 'C#' },
  { value: 'Go', label: 'Go' },
  { value: 'Rust', label: 'Rust' },
  { value: 'PHP', label: 'PHP' },
  { value: 'Ruby', label: 'Ruby' },
  { value: 'Swift', label: 'Swift' },
  { value: 'Kotlin', label: 'Kotlin' }
];

const TOPICS = [
  { value: 'web', label: 'Web Development' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'machine-learning', label: 'Machine Learning' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'devops', label: 'DevOps' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'gamedev', label: 'Game Dev' },
  { value: 'security', label: 'Security' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'node', label: 'Node.js' },
  { value: 'django', label: 'Django' },
  { value: 'flask', label: 'Flask' }
];

export default function GitHubProjectHighlight() {
  // State for filters
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [timeFilter, setTimeFilter] = useState<ProjectTimeFilter>('daily');
  const [selectedProject, setSelectedProject] = useState<GitHubProjectData | null>(null);
  
  // User preferences
  const [favoriteLanguages, setFavoriteLanguages] = useState<string[]>([]);
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  
  // Local bookmarked projects state
  const [bookmarkedProjects, setBookmarkedProjects] = useState<GitHubProjectData[]>([]);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  
  // Use our custom hook for GitHub projects data (not used for bookmarks)
  const { 
    data: apiProjects, 
    isLoading: apiLoading, 
    error: apiError, 
    refresh: apiRefresh 
  } = useGitHubProjects(
    filter === 'bookmarked' ? undefined : filter, // Don't fetch if we're showing bookmarks
    undefined, // No language filter
    timeFilter, 
    undefined // No topic filter
  );

  // Derived state for whichever data source we're using
  const projects = filter === 'bookmarked' ? bookmarkedProjects : apiProjects;
  const isLoading = filter === 'bookmarked' ? bookmarkLoading : apiLoading;
  const error = filter === 'bookmarked' ? null : apiError;
  
  // Load user preferences on mount
  useEffect(() => {
    setFavoriteLanguages(getFavoriteLanguages());
    setFavoriteTopics(getFavoriteTopics());
  }, []);

  // Load bookmarked projects when needed
  const loadBookmarkedProjects = useCallback(() => {
    if (filter === 'bookmarked') {
      setBookmarkLoading(true);
      // Small delay to simulate async to match UX, not necessary but smoother
      setTimeout(() => {
        const savedProjects = getBookmarkedProjects();
        setBookmarkedProjects(savedProjects);
        setBookmarkLoading(false);
      }, 200);
    }
  }, [filter]);

  // Handle filter changes - load bookmarks when needed
  useEffect(() => {
    loadBookmarkedProjects();
  }, [filter, loadBookmarkedProjects]);

  // Listen for bookmark storage events (for multi-tab coordination)
  useEffect(() => {
    // Function to update bookmarks if they change in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('devforecast_bookmark')) {
        if (filter === 'bookmarked') {
          loadBookmarkedProjects();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [filter, loadBookmarkedProjects]);

  const handleProjectClick = (project: GitHubProjectData) => {
    setSelectedProject(project);
    addToViewHistory(project.full_name);
  };

  const handleModalClose = () => {
    setSelectedProject(null);
  };

  // Function to refresh current view
  const refreshView = () => {
    if (filter === 'bookmarked') {
      loadBookmarkedProjects();
    } else {
      apiRefresh();
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter: ProjectFilter) => {
    // Clear selected project when changing filters
    setSelectedProject(null);
    setFilter(newFilter);
  };

  // Animation variants for staggered list items - simplified for performance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Reduced from 0.1 for faster overall animation
        ease: [0.25, 0.1, 0.25, 1] // More performant ease function
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 }, // Reduced y distance from 20 to 10
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        ease: [0.25, 0.1, 0.25, 1], // More performant ease function
        duration: 0.3 // Explicitly define a short duration
      }
    }
  };

  return (
    <Card className="w-full shadow-lg border-opacity-50 hover:border-opacity-100 transition-all duration-300 backdrop-blur-[2px] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <motion.div 
            initial={{ x: -10, opacity: 0 }} // Reduced x distance from -20 to -10
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.25 }} // Reduced from 0.3
          >
            <CardTitle className="flex items-center gap-2">
              {filter === 'bookmarked' ? (
                <Bookmark className="h-5 w-5 text-primary" />
              ) : (
                <TrendingUp className="h-5 w-5 text-primary" />
              )}
              <span>{filter === 'bookmarked' ? 'Bookmarked Projects' : 'Open Source Highlights'}</span>
            </CardTitle>
          </motion.div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshView}
            disabled={isLoading}
            title="Refresh projects"
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh projects</span>
          </Button>
        </div>
        
        {/* Filters */}
        <motion.div 
          initial={{ y: 5, opacity: 0 }} // Reduced y distance from 10 to 5
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }} // Reduced duration and delay
          className="mt-4"
        >
          <ProjectFilters
            filter={filter}
            timeFilter={timeFilter}
            language={null}
            topic={null}
            languages={LANGUAGES}
            topics={TOPICS}
            onFilterChange={handleFilterChange}
            onTimeFilterChange={setTimeFilter}
            onLanguageChange={() => {}}
            onTopicChange={() => {}}
            favoriteLanguages={favoriteLanguages}
            favoriteTopics={favoriteTopics}
          />
        </motion.div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }} // Reduced y distance from 20 to 10
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }} // Reduced delay from 0.05 to 0.03
                  className="space-y-2 p-3 border rounded-lg bg-card/60 backdrop-blur-[2px]"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                  <Skeleton className="h-24 w-full rounded-md" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 rounded-md"
            >
              <p className="text-destructive dark:text-destructive mb-2 font-medium">Error Loading Projects</p>
              <p className="text-sm text-destructive/80 dark:text-destructive/90">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshView}
                className="mt-3"
                disabled={isLoading}
              >
                Try Again
              </Button>
            </motion.div>
          ) : projects && projects.length > 0 ? (
            <motion.div 
              key="projects"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {projects.map((project, index) => (
                <motion.div 
                  key={`${project.id}-${index}`}
                  variants={itemVariants}
                  className="h-full"
                >
                  <ProjectCard 
                    project={project}
                    onClick={handleProjectClick}
                    onBookmarkChange={filter === 'bookmarked' ? refreshView : undefined}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="no-projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 px-4"
            >
              <Info className="h-10 w-10 mb-3 text-muted-foreground/60" />
              {filter === 'bookmarked' ? (
                <>
                  <p className="mb-1">No bookmarked projects found</p>
                  <p className="text-sm text-muted-foreground/80">
                    Browse projects and click the bookmark icon to save them here
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-1">No project data available</p>
                  <p className="text-sm text-muted-foreground/80">Try changing filters or refresh to see projects</p>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshView}
                className="mt-4"
              >
                Refresh
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProjectDetailView 
              project={selectedProject}
              onClose={handleModalClose}
              onBookmarkChange={filter === 'bookmarked' ? refreshView : undefined} isOpen={false}            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
