import { useState } from 'react';
import Image from 'next/image';
import { Star, GitFork, Clock, BookmarkPlus, BookmarkMinus, ExternalLink, Code } from 'lucide-react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GitHubProjectData } from '@/types/github';
import { isProjectBookmarked, addBookmarkedProject, removeBookmarkedProject } from '@/lib/github-utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: GitHubProjectData;
  onClick: (project: GitHubProjectData) => void;
  compact?: boolean;
  onBookmarkChange?: () => void; // Optional callback when bookmark state changes
}

export default function ProjectCard({ project, onClick, compact = false, onBookmarkChange }: ProjectCardProps) {
  const [bookmarked, setBookmarked] = useState(isProjectBookmarked(project.id));

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (bookmarked) {
      removeBookmarkedProject(project.id);
      setBookmarked(false);
    } else {
      addBookmarkedProject(project);
      setBookmarked(true);
    }
    
    // Call the callback if provided
    if (onBookmarkChange) {
      onBookmarkChange();
    }
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    window.open(project.html_url, '_blank', 'noopener,noreferrer');
  };

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };
  
  // Format update time if available
  const getUpdatedTimeAgo = () => {
    if (!project.updated_at) return null;
    try {
      return formatDistanceToNow(new Date(project.updated_at), { addSuffix: true });
    } catch {
      return null;
    }
  };

  return (
    <Card 
      className={`w-full ${compact ? 'h-full' : ''} transition-all duration-300 hover:shadow-md cursor-pointer relative overflow-hidden backdrop-blur-[2px] border hover:border-primary/60 group`} 
      onClick={() => onClick(project)}
    >
      {/* Gradient background hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/10 dark:to-primary/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className={compact ? 'p-3 pb-2 sm:p-4 sm:pb-2' : 'p-3 pb-2 sm:p-5 sm:pb-3'}>
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
          {project.avatar_url && (
            <div className="relative h-4 w-4 sm:h-5 sm:w-5 rounded-full overflow-hidden ring-1 ring-primary/10">
              <Image
                src={project.avatar_url}
                alt={`${project.full_name.split('/')[0]} avatar`}
                fill
                sizes="(max-width: 640px) 16px, 20px"
                className="object-cover"
              />
            </div>
          )}
          <CardTitle className={`${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-md'} font-medium truncate`}>
            {project.full_name}
          </CardTitle>
        </div>
        
        <CardDescription className={`${compact ? 'line-clamp-2 min-h-[2.5rem]' : 'line-clamp-3 min-h-[3.75rem]'} text-xs sm:text-sm`}>
          {project.description || 'No description available'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className={compact ? 'p-3 pt-0 sm:p-4 sm:pt-0' : 'p-3 pt-0 sm:p-5 sm:pt-0'}>
        <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3 min-h-[1.75rem]">
          {project.language && (
            <Badge variant="secondary" className="flex items-center gap-1 font-normal text-[10px] sm:text-xs">
              <Code className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {project.language}
            </Badge>
          )}
          
          {project.topics && project.topics.slice(0, compact ? 1 : 2).map(topic => (
            <Badge key={topic} variant="outline" className="font-normal text-[10px] sm:text-xs bg-background/50 dark:bg-card/50">
              {topic}
            </Badge>
          ))}
          
          {project.topics && project.topics.length > (compact ? 1 : 2) && (
            <Badge variant="outline" className="font-normal text-[10px] sm:text-xs bg-background/50 dark:bg-card/50">
              +{project.topics.length - (compact ? 1 : 2)} more
            </Badge>
          )}
        </div>
        
        <div className="flex items-center text-[10px] sm:text-xs text-muted-foreground gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500 dark:text-yellow-400" />
            <span>{formatCount(project.stargazers_count)}</span>
          </div>
          
          {project.forks_count !== undefined && project.forks_count > 0 && (
            <div className="flex items-center gap-1">
              <GitFork className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary/70" />
              <span>{formatCount(project.forks_count)}</span>
            </div>
          )}
          
          {getUpdatedTimeAgo() && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
              <span className="truncate max-w-[80px] sm:max-w-none">{getUpdatedTimeAgo()}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      {!compact && (
        <CardFooter className="p-3 pt-2 sm:p-5 sm:pt-3 flex justify-end gap-1 sm:gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                  onClick={handleExternalClick}
                >
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sr-only">Open in GitHub</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open in GitHub</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                  onClick={handleBookmarkToggle}
                >
                  {bookmarked ? (
                    <BookmarkMinus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  ) : (
                    <BookmarkPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="sr-only">{bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      )}
    </Card>
  );
} 