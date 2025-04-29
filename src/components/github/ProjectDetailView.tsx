import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, GitFork, Clock, ExternalLink, Code, BookmarkPlus, BookmarkMinus, Bug, GitBranch, Info, Users, Calendar, BookOpen } from 'lucide-react';
import { GitHubProjectData, GitHubIssue, LearningResource } from '@/types/github';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { isProjectBookmarked, addBookmarkedProject, removeBookmarkedProject } from '@/lib/github-utils';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDistanceToNow, format } from 'date-fns';
import AiInsight from '../ai-insight/AiInsight';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectDetailViewProps {
  project: GitHubProjectData | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkChange?: () => void;
}

interface WatchersCount {
  watchers_count?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ProjectDetailView({ project, isOpen: dialogIsOpen, onClose: handleClose, onBookmarkChange }: ProjectDetailViewProps) {
  const [bookmarked, setBookmarked] = useState(project ? isProjectBookmarked(project.id) : false);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [allIssues, setAllIssues] = useState<GitHubIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [issueFilter, setIssueFilter] = useState<'all' | 'beginner'>('beginner');
  
  // Sample learning resources - in a real app, these would be fetched from a database or API
  const sampleResources: LearningResource[] = [
    { 
      title: "Official Documentation", 
      url: project?.homepage || project?.html_url || '', 
      type: "documentation", 
      source: "Project Website" 
    },
    { 
      title: "GitHub Repository", 
      url: project?.html_url || '', 
      type: "documentation", 
      source: "GitHub" 
    },
  ];
  
  useEffect(() => {
    const fetchIssues = async () => {
      if (!project?.full_name) return;
      
      setLoadingIssues(true);
      try {
        // Fetch beginner-friendly issues first
        const beginnerResponse = await fetch(`/api/github?repo=${encodeURIComponent(project.full_name)}`);
        
        if (!beginnerResponse.ok) {
          throw new Error('Failed to fetch beginner issues');
        }
        
        const beginnerData = await beginnerResponse.json();
        
        if (beginnerData.beginner_issues) {
          setIssues(beginnerData.beginner_issues);
        }
        
        // Now fetch all open issues
        const allIssuesResponse = await fetch(`/api/github/issues?repo=${encodeURIComponent(project.full_name)}`);
        
        if (!allIssuesResponse.ok) {
          throw new Error('Failed to fetch all issues');
        }
        
        const allIssuesData = await allIssuesResponse.json();
        
        if (allIssuesData.issues) {
          setAllIssues(allIssuesData.issues);
        }
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setLoadingIssues(false);
      }
    };
    
    fetchIssues();
  }, [project]);
  
  // Update when dialog is opened
  useEffect(() => {
    if (dialogIsOpen && project) {
      // Could refresh data here if needed
    }
  }, [dialogIsOpen, project]);
  
  const handleBookmarkToggle = () => {
    if (!project) return;
    
    if (bookmarked) {
      removeBookmarkedProject(project.id);
      setBookmarked(false);
    } else {
      addBookmarkedProject(project);
      setBookmarked(true);
    }
    
    if (onBookmarkChange) {
      onBookmarkChange();
    }
  };
  
  const formatCount = (count: number | undefined): string => {
    if (!count) return '0';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };
  
  const getUpdatedTimeAgo = () => {
    if (!project?.updated_at) return null;
    try {
      return formatDistanceToNow(new Date(project.updated_at), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getCreatedDate = () => {
    if (!project?.created_at) return null;
    try {
      return format(new Date(project.created_at), 'MMM d, yyyy');
    } catch {
      return null;
    }
  };
  
  // Check for watchers or stars as fallback
  const getWatchersCount = () => {
    if (!project) return 0;
    // Handle the watchers_count which might not be in the type definition
    return (project as GitHubProjectData & WatchersCount).watchers_count !== undefined 
      ? (project as GitHubProjectData & WatchersCount).watchers_count 
      : project.stargazers_count;
  };
  
  // Function to get displayed issues based on filter
  const getDisplayedIssues = () => {
    return issueFilter === 'beginner' ? issues : allIssues;
  };
  
  if (!project) {
    return (
      <DialogHeader className="pb-2">
        <DialogTitle className="flex items-center gap-2 text-xl">
          Project not found
        </DialogTitle>
      </DialogHeader>
    );
  }
  
  return (
    <>
      <DialogHeader className="pb-2">
        <DialogTitle className="flex items-center gap-2 text-xl">
          {project?.avatar_url && (
            <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-primary/10">
              <Image
                src={project.avatar_url}
                alt={`${project?.full_name.split('/')[0]} avatar`}
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
          )}
          <span className="truncate">{project?.full_name}</span>
        </DialogTitle>
        <DialogDescription className="mt-1.5 text-base">{project?.description || 'No description available'}</DialogDescription>
      </DialogHeader>
      
      <div className="my-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {project?.language && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Code className="h-3.5 w-3.5" />
              {project.language}
            </Badge>
          )}
          
          {project?.topics && project.topics.map(topic => (
            <Badge key={topic} variant="outline" className="bg-background/50 dark:bg-card/50">
              {topic}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-secondary/40 dark:bg-secondary/20 backdrop-blur-sm rounded-md flex flex-col items-center">
            <Star className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mb-1" />
            <span className="text-lg font-semibold">{formatCount(project.stargazers_count)}</span>
            <span className="text-xs text-muted-foreground">Stars</span>
          </div>
          
          {project.forks_count !== undefined && (
            <div className="p-3 bg-secondary/40 dark:bg-secondary/20 backdrop-blur-sm rounded-md flex flex-col items-center">
              <GitFork className="h-5 w-5 text-primary/70 mb-1" />
              <span className="text-lg font-semibold">{formatCount(project.forks_count)}</span>
              <span className="text-xs text-muted-foreground">Forks</span>
            </div>
          )}
          
          {project.open_issues_count !== undefined && (
            <div className="p-3 bg-secondary/40 dark:bg-secondary/20 backdrop-blur-sm rounded-md flex flex-col items-center">
              <Bug className="h-5 w-5 text-destructive/80 mb-1" />
              <span className="text-lg font-semibold">{formatCount(project.open_issues_count)}</span>
              <span className="text-xs text-muted-foreground">Open Issues</span>
            </div>
          )}
          
          {/* Use the helper function for watchers count */}
          <div className="p-3 bg-secondary/40 dark:bg-secondary/20 backdrop-blur-sm rounded-md flex flex-col items-center">
            <Users className="h-5 w-5 text-blue-500 dark:text-blue-400 mb-1" />
            <span className="text-lg font-semibold">{formatCount(getWatchersCount())}</span>
            <span className="text-xs text-muted-foreground">Watchers</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-5 text-sm text-muted-foreground">
          {project.updated_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Updated {getUpdatedTimeAgo()}</span>
            </div>
          )}
          
          {getCreatedDate() && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Created on {getCreatedDate()}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-end gap-2 mb-6">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleBookmarkToggle}
          >
            {bookmarked ? (
              <>
                <BookmarkMinus className="h-4 w-4 text-primary" />
                <span>Remove Bookmark</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" />
                <span>Bookmark</span>
              </>
            )}
          </Button>
          
          <Button
            variant="default"
            className="gap-2"
            onClick={() => window.open(project?.html_url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" />
            <span>View on GitHub</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="insight" className="mt-2">
        <TabsList className="w-full mb-1">
          <TabsTrigger value="insight" className="flex-1">AI Insight</TabsTrigger>
          <TabsTrigger value="contribute" className="flex-1">Contribute</TabsTrigger>
          <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insight" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              AI Project Insight
            </h3>
            <AiInsight project={project} />
          </div>
        </TabsContent>
        
        <TabsContent value="contribute" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-green-500 dark:text-green-400" />
                Contribution Opportunities
              </h3>
              
              <div className="flex items-center">
                <Select 
                  value={issueFilter} 
                  onValueChange={(value: string) => setIssueFilter(value as 'all' | 'beginner')}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Filter issues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Issues</SelectItem>
                    <SelectItem value="beginner">Beginner Friendly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {loadingIssues ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : getDisplayedIssues().length > 0 ? (
              <div className="space-y-3">
                {getDisplayedIssues().map(issue => (
                  <div key={issue.id} className="p-3 border dark:border-muted/30 rounded-md bg-secondary/10 hover:bg-secondary/20 dark:hover:bg-secondary/20 transition-colors">
                    <a 
                      href={issue.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {issue.title}
                    </a>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {issue.labels && issue.labels.map(label => (
                        <Badge 
                          key={label.name} 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: `#${label.color}15`, 
                            borderColor: `#${label.color}40`,
                            color: `#${label.color}`
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-secondary/10 dark:bg-secondary/20 rounded-md">
                <p className="text-center text-muted-foreground">
                  {issueFilter === 'beginner' 
                    ? "No beginner-friendly issues found at this time. Try viewing all issues or check the project's GitHub page."
                    : "No open issues found at this time. Check the project's GitHub page for other ways to contribute."}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              Learning Resources
            </h3>
            
            <div className="space-y-3">
              {sampleResources.map((resource, index) => (
                <div key={index} className="p-3 border dark:border-muted/30 rounded-md bg-secondary/10 hover:bg-secondary/20 transition-colors">
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    {resource.title}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">Source: {resource.source}</p>
                </div>
              ))}
              
              <div className="p-3 border dark:border-muted/30 rounded-md bg-secondary/10">
                <p className="text-sm text-muted-foreground">
                  More learning resources for {project?.language || 'this technology'} coming soon!
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
} 