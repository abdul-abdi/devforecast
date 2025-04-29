import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { GitHubProjectData, GitHubTrendingParams } from '@/types/github';

// Cache for trending repos and specific repo data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const repoCache: Record<string, CacheEntry<GitHubProjectData>> = {};
const trendingCache: Record<string, CacheEntry<GitHubProjectData[]>> = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Fallback curated repos if GitHub trending API fails
const curatedRepos = [
  'facebook/react', 'vercel/next.js', 'tailwindlabs/tailwindcss', 'shadcn-ui/ui',
  'microsoft/typescript', 'sveltejs/svelte', 'golang/go', 'rust-lang/rust',
  'denoland/deno', 'flutter/flutter', 'vuejs/vue', 'angular/angular',
  'torvalds/linux', 'microsoft/vscode', 'freeCodeCamp/freeCodeCamp',
  'openai/openai-cookbook', 'huggingface/transformers', 'tensorflow/tensorflow',
  'kubernetes/kubernetes', 'docker/compose', 'django/django', 'laravel/laravel',
  'dotnet/runtime', 'NixOS/nixpkgs', 'godotengine/godot', 'Shopify/hydrogen',
  'JetBrains/kotlin', 'symfony/symfony', 'spring-projects/spring-boot'
];

interface GitHubTrendingItem {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  owner: { avatar_url: string | null };
  topics: string[];
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  forks_count: number;
  license: { name: string; url: string } | null;
}

interface GitHubIssueLabel {
  name: string;
  color: string;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  html_url: string;
  labels: GitHubIssueLabel[];
  created_at: string;
}

/**
 * Helper function to fetch trending repositories from GitHub
 */
async function fetchTrendingRepos(params: GitHubTrendingParams = {}, headers: Record<string, string>) {
  // If trending API is not available, use the GitHub Search API to simulate trending
  const baseUrl = process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL || 'https://api.github.com';
  
  // Default time period if not specified
  const since = params.since || 'daily';
  
  // Determine date range based on 'since' parameter
  const today = new Date();
  let daysBack = 1;
  if (since === 'weekly') daysBack = 7;
  if (since === 'monthly') daysBack = 30;
  
  const date = new Date(today);
  date.setDate(date.getDate() - daysBack);
  const dateStr = date.toISOString().split('T')[0];

  // Build the search query
  let query = `created:>${dateStr}`;
  
  // Add language filter if specified
  if (params.language) {
    query += ` language:${params.language}`;
  }
  
  // Add topic filter if specified
  if (params.topic) {
    query += ` topic:${params.topic}`;
  }

  // Fetch trending repos using GitHub search
  const searchUrl = `${baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=20`;
  
  try {
    const response = await axios.get(searchUrl, { headers });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch trending repositories: ${response.status}`);
    }
    
    // Extract relevant data from response
    return response.data.items.map((item: GitHubTrendingItem) => ({
      id: item.id,
      name: item.name,
      full_name: item.full_name,
      description: item.description || '',
      html_url: item.html_url,
      stargazers_count: item.stargazers_count,
      language: item.language || '',
      avatar_url: item.owner?.avatar_url || '',
      topics: item.topics || [],
      open_issues_count: item.open_issues_count,
      created_at: item.created_at,
      updated_at: item.updated_at,
      homepage: item.homepage,
      forks_count: item.forks_count,
      license: item.license ? { name: item.license.name, url: item.license.url } : undefined
    }));
  } catch (error) {
    console.error('Error fetching trending repos:', error);
    // Return null to indicate failure
    return null;
  }
}

/**
 * Helper function to get additional details for a repository
 */
async function getRepoDetails(repoFullName: string, headers: Record<string, string>) {
  // Check cache first
  const cacheKey = `repo_${repoFullName}`;
  const now = Date.now();
  if (repoCache[cacheKey] && (now - repoCache[cacheKey].timestamp) < CACHE_DURATION) {
    return repoCache[cacheKey].data;
  }

  const baseUrl = process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL || 'https://api.github.com';
  const repoUrl = `${baseUrl}/repos/${repoFullName}`;
  
  try {
    const response = await axios.get(repoUrl, { headers });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch repo details: ${response.status}`);
    }
    
    const data = response.data;
    const repoData: GitHubProjectData = {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      description: data.description || '',
      html_url: data.html_url,
      stargazers_count: data.stargazers_count,
      language: data.language || '',
      avatar_url: data.owner?.avatar_url || '',
      topics: data.topics || [],
      open_issues_count: data.open_issues_count,
      created_at: data.created_at,
      updated_at: data.updated_at,
      homepage: data.homepage,
      forks_count: data.forks_count,
      license: data.license ? { name: data.license.name, url: data.license.url } : undefined
    };
    
    // Cache the result
    repoCache[cacheKey] = {
      data: repoData,
      timestamp: now
    };
    
    return repoData;
  } catch (error) {
    console.error(`Error fetching details for ${repoFullName}:`, error);
    return null;
  }
}

/**
 * Helper function to get beginner-friendly issues for a repository
 */
async function getBeginnerFriendlyIssues(repoFullName: string, headers: Record<string, string>) {
  const baseUrl = process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL || 'https://api.github.com';
  const issuesUrl = `${baseUrl}/repos/${repoFullName}/issues?labels=good-first-issue,help-wanted,beginner-friendly&state=open&per_page=5`;
  
  try {
    const response = await axios.get(issuesUrl, { headers });
    
    if (response.status !== 200) {
      return [];
    }
    
    return response.data.map((item: GitHubIssue) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      html_url: item.html_url,
      labels: item.labels.map((label: GitHubIssueLabel) => ({
        name: label.name,
        color: label.color
      })),
      created_at: item.created_at
    }));
  } catch (error) {
    console.error(`Error fetching issues for ${repoFullName}:`, error);
    return [];
  }
}

/**
 * Main API route handler for GitHub projects
 */
export async function GET(request: NextRequest) {
  try {
    const apiToken = process.env.GITHUB_API_TOKEN;
    
    // Parse query parameters
    const url = new URL(request.url);
    const countParam = url.searchParams.get('count');
    let count = parseInt(countParam || '6', 10);
    if (isNaN(count) || count < 1) count = 6;
    
    const filter = url.searchParams.get('filter') || 'all';
    const language = url.searchParams.get('language') || undefined;
    const since = (url.searchParams.get('timeFilter') || url.searchParams.get('since') || 'daily') as 'daily' | 'weekly' | 'monthly';
    const topic = url.searchParams.get('topic') || undefined;
    const repoFullName = url.searchParams.get('repo') || undefined;
    
    // Log the received parameters for debugging
    console.log(`GitHub API Request: filter=${filter}, language=${language}, since=${since}, topic=${topic}`);
    
    // Set up common headers
    const baseHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (apiToken && apiToken !== 'your_github_api_token') {
      baseHeaders['Authorization'] = `Bearer ${apiToken}`;
    } else {
      console.log('Using GitHub API without authentication (limited rate)');
    }
    
    // If requesting a specific repo, get details and issues
    if (repoFullName) {
      const repoData = await getRepoDetails(repoFullName, baseHeaders);
      
      if (!repoData) {
        return NextResponse.json(
          { error: 'Repository not found', details: `Could not find repository: ${repoFullName}` },
          { status: 404 }
        );
      }
      
      // Get beginner-friendly issues
      const issues = await getBeginnerFriendlyIssues(repoFullName, baseHeaders);
      
      // Return detailed repo data with issues
      return NextResponse.json({
        ...repoData,
        beginner_issues: issues
      });
    }
    
    // Handle trending projects
    if (filter === 'trending') {
      // Create cache key based on parameters
      const cacheKey = `trending_${language || 'all'}_${since}_${topic || 'all'}`;
      const now = Date.now();
      
      // Check cache first
      if (trendingCache[cacheKey] && (now - trendingCache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`Using cached trending data for ${cacheKey}`);
        return NextResponse.json(trendingCache[cacheKey].data.slice(0, count));
      }
      
      // Fetch trending repos
      const trendingParams: GitHubTrendingParams = { since };
      if (language) trendingParams.language = language;
      if (topic) trendingParams.topic = topic;
      
      const trendingRepos = await fetchTrendingRepos(trendingParams, baseHeaders);
      
      if (trendingRepos && trendingRepos.length > 0) {
        // Filter by topic if needed
        let filteredRepos = trendingRepos;
        if (topic && trendingParams.topic !== topic) { // Double-check in case the API didn't filter correctly
          filteredRepos = trendingRepos.filter((repo: GitHubProjectData) => 
            repo.topics && repo.topics.includes(topic)
          );
        }
        
        // Cache the results
        trendingCache[cacheKey] = {
          data: filteredRepos,
          timestamp: now
        };
        
        return NextResponse.json(filteredRepos.slice(0, count));
      }
      
      // Fallback to curated list if trending fetch fails
      console.log('Trending fetch failed, using curated repos');
    }
    
    // Fallback to curated repos or filter by language/topic
    const repoList = [...curatedRepos];
    
    // If both language and topic filters are specified
    if (language && topic) {
      const filteredRepos = [];
      const shuffledRepos = shuffleArray([...repoList]);
      
      // Try to get repos matching both criteria
      for (const repoName of shuffledRepos) {
        if (filteredRepos.length >= count) break;
        
        const repoData = await getRepoDetails(repoName, baseHeaders);
        
        if (repoData && 
            repoData.language === language && 
            repoData.topics && 
            repoData.topics.includes(topic)) {
          filteredRepos.push(repoData);
        }
      }
      
      if (filteredRepos.length > 0) {
        return NextResponse.json(filteredRepos);
      }
    }
    // If language filter is specified, prioritize repos with that language
    else if (language) {
      // We'll fetch actual language data for filtered repos
      const languageFilteredRepos = [];
      const shuffledRepos = shuffleArray([...repoList]);
      
      // Try to get up to 'count' repos with the specified language
      for (const repoName of shuffledRepos) {
        if (languageFilteredRepos.length >= count) break;
        
        const repoData = await getRepoDetails(repoName, baseHeaders);
        
        if (repoData && repoData.language === language) {
          languageFilteredRepos.push(repoData);
        }
      }
      
      if (languageFilteredRepos.length > 0) {
        return NextResponse.json(languageFilteredRepos);
      }
    }
    // If topic filter is specified
    else if (topic) {
      const topicFilteredRepos = [];
      const shuffledRepos = shuffleArray([...repoList]);
      
      // Try to get repos with the specified topic
      for (const repoName of shuffledRepos) {
        if (topicFilteredRepos.length >= count) break;
        
        const repoData = await getRepoDetails(repoName, baseHeaders);
        
        if (repoData && repoData.topics && repoData.topics.includes(topic)) {
          topicFilteredRepos.push(repoData);
        }
      }
      
      if (topicFilteredRepos.length > 0) {
        return NextResponse.json(topicFilteredRepos);
      }
    }
    
    // Default: return random selection from curated list
    const shuffledRepos = shuffleArray([...repoList]);
    const selectedRepos = shuffledRepos.slice(0, count);
    
    // Fetch data for selected repos
    const fetchPromises = selectedRepos.map(async (repoName) => {
      return await getRepoDetails(repoName, baseHeaders);
    });
    
    const results = await Promise.all(fetchPromises);
    const validResults = results.filter(result => result !== null) as GitHubProjectData[];
    
    if (validResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch GitHub project data', details: 'Could not retrieve data for any repositories.' },
        { status: 500 }
      );
    }
    
    // Return the array of projects
    return NextResponse.json(validResults);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in GitHub route';
    console.error('GitHub API route error:', errorMessage);
    
    return NextResponse.json(
      {
        error: 'Internal server error fetching GitHub data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
