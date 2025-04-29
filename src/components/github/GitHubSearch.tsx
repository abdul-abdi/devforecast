'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GitHubProjectData } from '@/types/github';
import ProjectCard from './ProjectCard';
import ProjectDetailView from './ProjectDetailView';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDebounce } from '../../lib/hooks';

export default function GitHubSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GitHubProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<GitHubProjectData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Update debounced search query
  useEffect(() => {
    setDebouncedSearchQuery(debouncedQuery);
  }, [debouncedQuery]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    const searchRepositories = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/github/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
        
        if (!response.ok) {
          throw new Error('Failed to search repositories');
        }
        
        const data = await response.json();
        setSearchResults(data.repositories || []);
      } catch (error) {
        console.error('Error searching repositories:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchRepositories();
  }, [debouncedSearchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    inputRef.current?.focus();
  };

  const handleProjectClick = useCallback((project: GitHubProjectData) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  }, []);

  const handleDetailClose = useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  const handleBookmarkChange = useCallback(() => {
    // You can add bookmark refresh logic here if needed
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center border rounded-md bg-background shadow-sm focus-within:ring-1 focus-within:ring-primary/40">
          <Search className="ml-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search GitHub repositories..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isSearching && (
            <Loader2 className="mr-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {searchQuery && !isSearching && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full mr-1"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {searchResults.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleProjectClick}
              onBookmarkChange={handleBookmarkChange}
            />
          ))}
        </div>
      )}

      {debouncedSearchQuery && searchResults.length === 0 && !isSearching && (
        <div className="text-center p-8 bg-secondary/20 rounded-md">
          <p className="text-muted-foreground">No repositories found for &quot;{debouncedSearchQuery}&quot;</p>
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ProjectDetailView
            project={selectedProject}
            isOpen={isDetailOpen}
            onClose={handleDetailClose}
            onBookmarkChange={handleBookmarkChange}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 