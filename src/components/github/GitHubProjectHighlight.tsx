'use client';

import { useEffect, useState } from 'react';
import { Star, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GitHubProjectData } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import AiInsight from '../ai-insight/AiInsight';
import Image from 'next/image';

const PROJECT_COUNT = 6;

export default function GitHubProjectHighlight(/*{ onProjectDataChange }: GitHubProjectHighlightProps*/) {
  const [projects, setProjects] = useState<GitHubProjectData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<GitHubProjectData | null>(null);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    setProjects(null);

    try {
      const response = await fetch(`/api/github?count=${PROJECT_COUNT}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitHub API authentication error: The provided token is invalid or has expired');
        } else if (response.status === 404) {
          throw new Error('Repositories not found: The requested repositories could not be found or are private');
        } else if (response.status === 429) {
          throw new Error('GitHub API rate limit exceeded: Please try again later or configure a GitHub API token');
        } else {
          throw new Error(data.details || 'Failed to fetch project data');
        }
      }

      // Check if data is an array, if not, wrap it in one for compatibility
      // Also handles cases where data might be null or undefined unexpectedly
      const projectsArray = Array.isArray(data)
        ? data
        : data && typeof data === 'object' ? [data] : []; // Wrap object, ensure it's not null/undefined

      // Check if the resulting array is empty or contains invalid data
      if (projectsArray.length === 0) {
        console.error("API returned empty or invalid data:", data);
        throw new Error('No valid project data received from the API.');
      }

      setProjects(projectsArray);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while fetching project data';
      setError(message);
      console.error('GitHub fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleProjectClick = (project: GitHubProjectData) => {
    setSelectedProject(project);
  };

  const handleModalClose = () => {
    setSelectedProject(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Open Source Highlights</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchProjectData}
            disabled={loading}
            title="Get new projects"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: PROJECT_COUNT }).map((_, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-lg">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md">
            <p className="text-destructive mb-2 font-medium">Error Loading Projects</p>
            <p className="text-sm text-destructive/80">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjectData}
              className="mt-3"
              disabled={loading}
            >
              Try Again
            </Button>
          </div>
        ) : projects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="p-3 border rounded-lg hover:bg-accent/50 dark:hover:bg-accent/10 transition-all duration-200 hover:scale-[1.02] text-left space-y-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background"
              >
                <div className="flex items-center gap-2 mb-1">
                  {project.avatar_url && (
                    <Image
                      src={project.avatar_url}
                      alt={`${project.full_name.split('/')[0]} avatar`}
                      className="h-5 w-5 rounded-full"
                      width={20}
                      height={20}
                    />
                  )}
                  <span className="font-semibold truncate text-primary-foreground dark:text-primary">
                    {project.full_name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description || 'No description available'}
                </p>
                <div className="flex items-center gap-4 text-xs pt-1 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{formatCount(project.stargazers_count)}</span>
                  </div>
                  {project.language && (
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-foreground/50" />
                      <span>{project.language}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-6">
            No project data available
          </p>
        )}
      </CardContent>
      {selectedProject && (
        <Dialog open={!!selectedProject} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedProject.avatar_url && (
                  <Image
                    src={selectedProject.avatar_url}
                    alt={`${selectedProject.full_name.split('/')[0]} avatar`}
                    className="h-6 w-6 rounded-full"
                    width={24}
                    height={24}
                  />
                )}
                {selectedProject.full_name}
              </DialogTitle>
              <DialogDescription>{selectedProject.description || 'No description available'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 text-sm py-4">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground font-medium">Full Name</span>
                <span className="text-right">{selectedProject.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Language</span>
                <span>{selectedProject.language || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Stars</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>{formatCount(selectedProject.stargazers_count)}</span>
                </div>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground font-medium">GitHub Link</span>
                <a 
                  href={selectedProject.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary hover:underline break-all text-right"
                >
                  {selectedProject.html_url}
                </a>
              </div>
            </div>
            <hr className="my-2 border-border" />
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Insight
              </h4>
              <AiInsight project={selectedProject} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
