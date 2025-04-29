import { GitHubProjectData, UserPreferences, ProjectFilter, ProjectTimeFilter } from '@/types/github';

// Local storage keys
const BOOKMARK_KEY = 'devforecast_bookmarked_projects';
const LANGUAGE_PREFS_KEY = 'devforecast_language_preferences';
const TOPIC_PREFS_KEY = 'devforecast_topic_preferences';
const VIEW_HISTORY_KEY = 'devforecast_view_history';

/**
 * Get bookmarked projects from local storage
 */
export function getBookmarkedProjects(): GitHubProjectData[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const bookmarksJson = localStorage.getItem(BOOKMARK_KEY);
    if (!bookmarksJson) return [];
    
    return JSON.parse(bookmarksJson);
  } catch (error) {
    console.error('Error loading bookmarked projects:', error);
    return [];
  }
}

/**
 * Add a project to bookmarks
 */
export function addBookmarkedProject(project: GitHubProjectData): void {
  if (typeof window === 'undefined') return;
  
  try {
    const bookmarks = getBookmarkedProjects();
    
    // Check if project is already bookmarked
    if (!bookmarks.some(p => p.id === project.id)) {
      const updatedBookmarks = [...bookmarks, { ...project, is_bookmarked: true }];
      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updatedBookmarks));
    }
  } catch (error) {
    console.error('Error adding bookmarked project:', error);
  }
}

/**
 * Remove a project from bookmarks
 */
export function removeBookmarkedProject(projectId: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    const bookmarks = getBookmarkedProjects();
    const updatedBookmarks = bookmarks.filter(p => p.id !== projectId);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(updatedBookmarks));
  } catch (error) {
    console.error('Error removing bookmarked project:', error);
  }
}

/**
 * Check if a project is bookmarked
 */
export function isProjectBookmarked(projectId: number): boolean {
  if (typeof window === 'undefined') return false;
  
  const bookmarks = getBookmarkedProjects();
  return bookmarks.some(p => p.id === projectId);
}

/**
 * Get favorite languages from local storage
 */
export function getFavoriteLanguages(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const languagesJson = localStorage.getItem(LANGUAGE_PREFS_KEY);
    if (!languagesJson) return [];
    
    return JSON.parse(languagesJson);
  } catch (error) {
    console.error('Error loading favorite languages:', error);
    return [];
  }
}

/**
 * Add a language to favorites
 */
export function addFavoriteLanguage(language: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const languages = getFavoriteLanguages();
    
    if (!languages.includes(language)) {
      const updatedLanguages = [...languages, language];
      localStorage.setItem(LANGUAGE_PREFS_KEY, JSON.stringify(updatedLanguages));
    }
  } catch (error) {
    console.error('Error adding favorite language:', error);
  }
}

/**
 * Remove a language from favorites
 */
export function removeFavoriteLanguage(language: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const languages = getFavoriteLanguages();
    const updatedLanguages = languages.filter(l => l !== language);
    localStorage.setItem(LANGUAGE_PREFS_KEY, JSON.stringify(updatedLanguages));
  } catch (error) {
    console.error('Error removing favorite language:', error);
  }
}

/**
 * Get favorite topics from local storage
 */
export function getFavoriteTopics(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const topicsJson = localStorage.getItem(TOPIC_PREFS_KEY);
    if (!topicsJson) return [];
    
    return JSON.parse(topicsJson);
  } catch (error) {
    console.error('Error loading favorite topics:', error);
    return [];
  }
}

/**
 * Add a topic to favorites
 */
export function addFavoriteTopic(topic: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const topics = getFavoriteTopics();
    
    if (!topics.includes(topic)) {
      const updatedTopics = [...topics, topic];
      localStorage.setItem(TOPIC_PREFS_KEY, JSON.stringify(updatedTopics));
    }
  } catch (error) {
    console.error('Error adding favorite topic:', error);
  }
}

/**
 * Remove a topic from favorites
 */
export function removeFavoriteTopic(topic: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const topics = getFavoriteTopics();
    const updatedTopics = topics.filter(t => t !== topic);
    localStorage.setItem(TOPIC_PREFS_KEY, JSON.stringify(updatedTopics));
  } catch (error) {
    console.error('Error removing favorite topic:', error);
  }
}

/**
 * Add a repo to view history
 */
export function addToViewHistory(fullName: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getViewHistory();
    
    // Add to front, remove duplicates, limit to 20 items
    const updatedHistory = [fullName, ...history.filter(item => item !== fullName)].slice(0, 20);
    localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error updating view history:', error);
  }
}

/**
 * Get view history from local storage
 */
export function getViewHistory(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const historyJson = localStorage.getItem(VIEW_HISTORY_KEY);
    if (!historyJson) return [];
    
    return JSON.parse(historyJson);
  } catch (error) {
    console.error('Error loading view history:', error);
    return [];
  }
}

/**
 * Clear view history
 */
export function clearViewHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(VIEW_HISTORY_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing view history:', error);
  }
}

/**
 * Get all user preferences as a single object
 */
export function getUserPreferences(): UserPreferences {
  return {
    favoriteLanguages: getFavoriteLanguages(),
    favoriteTopics: getFavoriteTopics(),
    bookmarkedProjects: getBookmarkedProjects(),
    viewHistory: getViewHistory()
  };
}

/**
 * Get URL parameters for GitHub API based on filter selection
 */
export function getGitHubApiParams(
  filter: ProjectFilter, 
  language?: string, 
  timeFilter?: ProjectTimeFilter,
  topic?: string
): { [key: string]: string } {
  const params: { [key: string]: string } = { count: '6' };
  
  if (filter === 'trending') {
    params.filter = 'trending';
    if (timeFilter) params.since = timeFilter;
  } else if (filter === 'beginner-friendly') {
    params.filter = 'beginner-friendly';
  } else if (filter === 'recently-updated') {
    params.filter = 'recently-updated';
  }
  
  if (language) params.language = language;
  if (topic) params.topic = topic;
  
  return params;
}

// GitHub utility functions

// Categories for filtering
const projectCategories = [
  { id: 'web', name: 'Web Development', topics: ['react', 'vue', 'angular', 'nextjs', 'javascript', 'typescript'] },
  { id: 'mobile', name: 'Mobile Development', topics: ['react-native', 'flutter', 'swift', 'kotlin', 'ios', 'android'] },
  { id: 'backend', name: 'Backend', topics: ['node', 'express', 'django', 'laravel', 'spring', 'rails'] },
  { id: 'ai-ml', name: 'AI & Machine Learning', topics: ['ai', 'machine-learning', 'deep-learning', 'tensorflow', 'pytorch'] },
  { id: 'devops', name: 'DevOps & Cloud', topics: ['kubernetes', 'docker', 'aws', 'azure', 'gcp', 'terraform'] },
  { id: 'game-dev', name: 'Game Development', topics: ['game', 'unity', 'unreal', 'gamedev', 'godot'] }
];

// Languages for filtering
const popularLanguages = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin'
];

export const getProjectCategories = () => projectCategories;
export const getPopularLanguages = () => popularLanguages; 