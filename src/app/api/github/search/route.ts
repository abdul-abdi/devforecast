import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { GitHubProjectData } from '@/types/github';

// Cache for search results to minimize GitHub API calls
const searchCache: Record<string, { data: GitHubProjectData[], timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Helper function to search GitHub repositories
 */
async function searchRepositories(query: string, headers: Record<string, string>) {
  if (!query) return [];
  
  // Check cache first
  const cacheKey = `search_${query}`;
  const now = Date.now();
  if (searchCache[cacheKey] && (now - searchCache[cacheKey].timestamp) < CACHE_DURATION) {
    return searchCache[cacheKey].data;
  }

  const baseUrl = process.env.NEXT_PUBLIC_GITHUB_API_BASE_URL || 'https://api.github.com';
  const searchUrl = `${baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`;
  
  try {
    const response = await axios.get(searchUrl, { headers });
    
    if (response.status !== 200) {
      throw new Error(`Failed to search repositories: ${response.status}`);
    }
    
    // Extract relevant data from response
    const repositories = response.data.items.map((item: { 
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      html_url: string;
      stargazers_count: number;
      language: string | null;
      owner: { avatar_url: string };
      topics: string[];
      open_issues_count: number;
      created_at: string;
      updated_at: string;
      homepage: string | null;
      forks_count: number;
      license: { name: string; url: string } | null;
    }) => ({
      id: item.id,
      name: item.name,
      full_name: item.full_name,
      description: item.description || '',
      html_url: item.html_url,
      stargazers_count: item.stargazers_count,
      language: item.language || '',
      avatar_url: item.owner.avatar_url,
      topics: item.topics || [],
      open_issues_count: item.open_issues_count,
      created_at: item.created_at,
      updated_at: item.updated_at,
      homepage: item.homepage || '',
      forks_count: item.forks_count,
      license: item.license ? { name: item.license.name, url: item.license.url } : undefined
    }));
    
    // Cache the result
    searchCache[cacheKey] = {
      data: repositories,
      timestamp: now
    };
    
    return repositories;
  } catch (error) {
    console.error('Error searching repositories:', error);
    return [];
  }
}

/**
 * API route handler for GitHub repository search
 */
export async function GET(request: NextRequest) {
  try {
    const apiToken = process.env.GITHUB_API_TOKEN;
    
    // Parse query parameters
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Missing search query', details: 'Please provide a search query with q parameter' },
        { status: 400 }
      );
    }
    
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
    
    // Search repositories
    const repositories = await searchRepositories(query, baseHeaders);
    
    // Return the search results
    return NextResponse.json({ repositories });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in GitHub search route';
    console.error('GitHub search API route error:', errorMessage);
    
    return NextResponse.json(
      {
        error: 'Internal server error searching GitHub repositories',
        details: errorMessage
      },
      { status: 500 }
    );
  }
} 