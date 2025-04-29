export interface GitHubProjectData {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  avatar_url: string;
  topics?: string[];
  contributor_count?: number;
  open_issues_count?: number;
  created_at?: string;
  updated_at?: string;
  homepage?: string;
  forks_count?: number;
  license?: {
    name: string;
    url?: string;
  };
  is_bookmarked?: boolean;
}

export interface GitHubTrendingParams {
  language?: string;
  since?: 'daily' | 'weekly' | 'monthly';
  spoken_language?: string;
  topic?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  labels: {
    name: string;
    color: string;
  }[];
  created_at: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  description?: string;
}

export interface RelatedProject {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  relationship: 'similar' | 'complementary' | 'alternative';
}

export interface UserPreferences {
  favoriteLanguages: string[];
  favoriteTopics: string[];
  bookmarkedProjects: GitHubProjectData[];
  viewHistory: string[]; // repo full_names
}

export interface ProjectStats {
  commitActivity?: {
    week: string;
    count: number;
  }[];
  contributorGrowth?: {
    month: string;
    count: number;
  }[];
  issuesClosedRate?: number;
  avgTimeToClose?: number;
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'tutorial' | 'documentation' | 'article' | 'course';
  source: string;
}

export interface ProjectUpdate {
  title: string;
  version?: string;
  date: string;
  breaking_changes: boolean;
  summary: string;
  url: string;
}

export type ProjectFilter = 'all' | 'trending' | 'beginner-friendly' | 'recently-updated' | 'bookmarked';
export type ProjectTimeFilter = 'daily' | 'weekly' | 'monthly';
export type ProjectSortOption = 'stars' | 'forks' | 'updated' | 'created'; 